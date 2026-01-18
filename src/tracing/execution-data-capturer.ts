import type { Page, Request, Response, ConsoleMessage } from 'playwright';
import type {
  DOMSnapshot,
  NetworkRequest,
  ConsoleLog,
  PerformanceMetrics
} from './types.js';

/**
 * ExecutionDataCapturer captures comprehensive execution data from Playwright
 * during flow execution, including DOM snapshots, network activity, console logs,
 * and performance metrics.
 */
export class ExecutionDataCapturer {
  private domSnapshots: DOMSnapshot[] = [];
  private networkRequests: NetworkRequest[] = [];
  private consoleLogs: ConsoleLog[] = [];

  constructor(private page: Page) {
    this.setupListeners();
  }

  /**
   * Setup Playwright event listeners to capture all data
   */
  private setupListeners(): void {
    this.page.on('request', (request) => this.captureNetworkRequest(request));
    this.page.on('response', (response) => this.captureNetworkResponse(response));
    this.page.on('console', (msg) => this.captureConsoleLog(msg));
    this.page.on('pageerror', (err) => this.capturePageError(err));

    this.page.addInitScript(() => {
      (window as any).__flowguard_mutations = [];
      const observer = new MutationObserver((mutations) => {
        (window as any).__flowguard_mutations.push({
          timestamp: Date.now(),
          mutations: mutations.map((m: MutationRecord) => ({
            type: m.type,
            target: (m.target as Element).nodeName,
            addedNodes: m.addedNodes.length,
            removedNodes: m.removedNodes.length
          }))
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  /**
   * Capture DOM snapshot after a step
   */
  async captureDOMSnapshot(stepIndex: number): Promise<DOMSnapshot> {
    const html = await this.page.content();
    const snapshotId = `dom_${stepIndex}_${Date.now()}`;

    let accessibilityTree: any = null;
    try {
      accessibilityTree = await (this.page as any).accessibility?.snapshot();
    } catch (e) {
      // Accessibility API might not be available
    }

    const snapshot: DOMSnapshot = {
      snapshotId,
      stepIndex,
      timestamp: new Date(),
      html,
      serializedDOM: await this.page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          elementCount: document.getElementsByTagName('*').length,
          formCount: document.forms.length,
          linkCount: document.links.length,
          imageCount: document.images.length
        };
      }),
      accessibilityTree
    };

    this.domSnapshots.push(snapshot);
    return snapshot;
  }

  /**
   * Capture network request
   */
  private captureNetworkRequest(request: Request): void {
    const networkRequest: NetworkRequest = {
      requestId: `req_${this.networkRequests.length}`,
      stepIndex: this.domSnapshots.length - 1,
      url: request.url(),
      method: request.method(),
      statusCode: 0,
      requestHeaders: request.headers(),
      responseHeaders: {},
      requestBody: request.postData() || undefined,
      resourceType: request.resourceType(),
      timing: {
        startTime: Date.now(),
        endTime: 0,
        durationMs: 0
      }
    };

    this.networkRequests.push(networkRequest);
  }

  /**
   * Capture network response
   */
  private async captureNetworkResponse(response: Response): Promise<void> {
    const request = this.networkRequests.find(r => r.url === response.url());

    if (request) {
      request.statusCode = response.status();
      request.responseHeaders = response.headers();
      request.timing.endTime = Date.now();
      request.timing.durationMs = request.timing.endTime - request.timing.startTime;

      try {
        const body = await response.text();
        if (body.length < 50000) {
          request.responseBody = body;
        }
      } catch (e) {
        // Some responses can't be read
      }
    }
  }

  /**
   * Capture console log
   */
  private captureConsoleLog(msg: ConsoleMessage): void {
    this.consoleLogs.push({
      timestamp: new Date(),
      stepIndex: this.domSnapshots.length - 1,
      type: msg.type() as 'log' | 'info' | 'warn' | 'error' | 'debug',
      message: msg.text(),
      args: msg.args().map(arg => arg.toString())
    });
  }

  /**
   * Capture page error
   */
  private capturePageError(error: Error): void {
    this.consoleLogs.push({
      timestamp: new Date(),
      stepIndex: this.domSnapshots.length - 1,
      type: 'error',
      message: error.message,
      args: [],
      stackTrace: error.stack
    });
  }

  /**
   * Capture performance metrics
   */
  async capturePerformanceMetrics(): Promise<PerformanceMetrics> {
    return await this.page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as any;
      const paintEntries = performance.getEntriesByType('paint');

      return {
        lcp: 0,
        fid: 0,
        cls: 0,
        domContentLoaded: perfData?.domContentLoadedEventEnd - perfData?.domContentLoadedEventStart || 0,
        loadComplete: perfData?.loadEventEnd - perfData?.loadEventStart || 0,
        firstPaint: paintEntries.find((e: any) => e.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paintEntries.find((e: any) => e.name === 'first-contentful-paint')?.startTime || 0,
        totalResourceSize: performance.getEntriesByType('resource').reduce((sum, r: any) => sum + (r.transferSize || 0), 0),
        totalResourceCount: performance.getEntriesByType('resource').length,
        scriptExecutionTime: 0,
        jsHeapSize: (performance as any).memory?.jsHeapSizeLimit || 0,
        usedJsHeapSize: (performance as any).memory?.usedJSHeapSize || 0
      };
    });
  }

  /**
   * Get all captured data
   */
  getData(): {
    domSnapshots: DOMSnapshot[];
    networkRequests: NetworkRequest[];
    consoleLogs: ConsoleLog[];
  } {
    return {
      domSnapshots: this.domSnapshots,
      networkRequests: this.networkRequests,
      consoleLogs: this.consoleLogs
    };
  }

  /**
   * Reset captured data
   */
  reset(): void {
    this.domSnapshots = [];
    this.networkRequests = [];
    this.consoleLogs = [];
  }
}
