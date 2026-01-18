import { chromium, type Page, type Browser, type BrowserContext } from 'playwright';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Flow, Step, StepResult, FlowRunResult, Viewport } from './types.js';
import { validateOutputDirectory, validatePath } from './security.js';
import { BrowserbaseClient, BrowserbaseSessionPool } from './browserbase/index.js';

export const DEFAULT_VIEWPORT: Viewport = {
  width: 1280,
  height: 720,
};

const DEFAULT_TIMEOUT = 30000;

// Browser singleton for pooling - reuse browser instance across flows
let browserInstance: Browser | null = null;

// Execution mode type
export type ExecutionMode = 'local' | 'cloud';

// Browserbase session pool (initialized if API key available)
let browserbasePool: BrowserbaseSessionPool | null = null;

/**
 * Initialize Browserbase session pool if API credentials are available
 */
function initBrowserbasePool(): void {
  if (process.env.BROWSERBASE_API_KEY && process.env.BROWSERBASE_PROJECT_ID && !browserbasePool) {
    const client = new BrowserbaseClient({
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: process.env.BROWSERBASE_PROJECT_ID,
      region: (process.env.BROWSERBASE_REGION as any) || 'us-east',
    });

    browserbasePool = new BrowserbaseSessionPool(client, {
      minSessions: parseInt(process.env.BB_MIN_SESSIONS || '2', 10),
      maxSessions: parseInt(process.env.BB_MAX_SESSIONS || '10', 10),
      sessionLifetime: 30 * 60 * 1000, // 30 minutes
      idleTimeout: 5 * 60 * 1000, // 5 minutes
    });

    console.log('[FlowGuard] Browserbase session pool initialized');
  }
}

/**
 * Determine execution mode based on environment
 */
function getExecutionMode(_flow: Flow): ExecutionMode {
  // Environment variable override
  const envMode = process.env.EXECUTION_MODE as ExecutionMode;
  if (envMode === 'cloud') return 'cloud';
  if (envMode === 'local') return 'local';

  // Default to local
  return 'local';
}

/**
 * Gets or creates a shared browser instance.
 * Uses singleton pattern for browser pooling to avoid O(n) launch overhead.
 */
async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    browserInstance = await chromium.launch({
      headless: true,
    });
  }
  return browserInstance;
}

/**
 * Closes the shared browser instance and Browserbase pool.
 * Should be called on CLI exit for proper cleanup.
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
  if (browserbasePool) {
    await browserbasePool.shutdown();
    browserbasePool = null;
  }
}

/**
 * Executes a single step in a flow.
 *
 * @param page - Playwright page instance
 * @param step - Step to execute
 * @param stepIndex - Index of the step in the flow
 * @param screenshotDir - Directory to save screenshots
 * @returns StepResult with execution details
 */
export async function executeStep(
  page: Page,
  step: Step,
  stepIndex: number,
  screenshotDir: string
): Promise<StepResult> {
  const startTime = Date.now();
  const timeout = step.timeout ?? DEFAULT_TIMEOUT;

  try {
    let screenshotPath: string | undefined;
    let screenshotBase64: string | undefined;

    switch (step.action) {
      case 'navigate':
        if (!step.target) {
          throw new Error('Navigate action requires a target URL');
        }
        await page.goto(step.target, { timeout, waitUntil: 'networkidle' });
        break;

      case 'click':
        if (!step.target) {
          throw new Error('Click action requires a target selector');
        }
        await page.click(step.target, { timeout });
        break;

      case 'type':
        if (!step.target) {
          throw new Error('Type action requires a target selector');
        }
        await page.fill(step.target, step.value ?? '', { timeout });
        break;

      case 'screenshot': {
        // Validate and ensure screenshot directory exists within allowed boundaries
        const validatedScreenshotDir = validateOutputDirectory(screenshotDir);

        const filename = `step-${stepIndex}-${Date.now()}.png`;
        // Validate the full screenshot path as well
        screenshotPath = validatePath(path.join(validatedScreenshotDir, filename), {
          allowNonExistent: true,
        });
        const buffer = await page.screenshot({ fullPage: false });
        fs.writeFileSync(screenshotPath, buffer);
        screenshotBase64 = buffer.toString('base64');
        break;
      }

      case 'wait':
        await page.waitForTimeout(step.timeout ?? 1000);
        break;

      case 'scroll': {
        const scrollAmount = parseInt(step.value ?? '500', 10);
        await page.evaluate((amount) => {
          window.scrollBy(0, amount);
        }, scrollAmount);
        break;
      }

      default:
        throw new Error(`Unknown action: ${step.action}`);
    }

    return {
      stepIndex,
      action: step.action,
      success: true,
      screenshotPath,
      screenshotBase64,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      stepIndex,
      action: step.action,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Executes a complete flow and returns results.
 * Routes to either local Playwright or Browserbase cloud execution based on environment.
 *
 * @param flow - Flow definition to execute
 * @param outputDir - Directory for screenshots and artifacts
 * @param baseDir - Optional base directory for path validation (defaults to cwd)
 * @returns FlowRunResult with all step results
 */
export async function executeFlow(
  flow: Flow,
  outputDir: string,
  baseDir?: string
): Promise<FlowRunResult> {
  // Initialize Browserbase pool if not already done
  initBrowserbasePool();

  const mode = getExecutionMode(flow);

  if (mode === 'cloud' && browserbasePool) {
    return await executeFlowOnBrowserbase(flow, outputDir, baseDir);
  } else {
    return await executeFlowLocally(flow, outputDir, baseDir);
  }
}

/**
 * Execute flow locally using Playwright
 */
async function executeFlowLocally(
  flow: Flow,
  outputDir: string,
  baseDir?: string
): Promise<FlowRunResult> {
  const startedAt = new Date().toISOString();
  const startTime = Date.now();
  const viewport = flow.viewport ?? DEFAULT_VIEWPORT;

  // Validate output directory is within allowed boundaries
  const validatedOutputDir = validateOutputDirectory(outputDir, { baseDir });

  // Create unique directory for this run - sanitize flow name for filesystem
  const safeFlowName = flow.name.replace(/[^a-zA-Z0-9-_]/g, '_');
  const runId = `${safeFlowName}-${Date.now()}`;
  const screenshotDir = path.join(validatedOutputDir, runId);

  let context: BrowserContext | null = null;
  const stepResults: StepResult[] = [];

  try {
    // Get shared browser instance (pooled)
    const browser = await getBrowser();

    // Create new context for isolation between flows
    context = await browser.newContext({
      viewport,
    });

    const page = await context.newPage();

    // Navigate to initial URL
    await page.goto(flow.url, { waitUntil: 'networkidle', timeout: DEFAULT_TIMEOUT });

    // Execute each step
    for (let i = 0; i < flow.steps.length; i++) {
      const step = flow.steps[i];
      if (!step) continue;

      const result = await executeStep(page, step, i, screenshotDir);
      stepResults.push(result);

      // Stop on first failure
      if (!result.success) {
        break;
      }
    }

    await page.close();
  } catch (error) {
    // Add error as a failed step if browser setup failed
    stepResults.push({
      stepIndex: 0,
      action: 'navigate',
      success: false,
      error: error instanceof Error ? error.message : 'Browser launch failed',
      durationMs: Date.now() - startTime,
    });
  } finally {
    // Close context (not browser) - browser is pooled
    if (context) {
      await context.close();
    }
  }

  const completedAt = new Date().toISOString();
  const allPassed = stepResults.every((s) => s.success);
  const hasError = stepResults.some((s) => s.error);

  return {
    flowName: flow.name,
    intent: flow.intent,
    url: flow.url,
    viewport,
    verdict: hasError ? 'error' : allPassed ? 'pass' : 'fail',
    confidence: 0, // Will be set by vision analyzer
    steps: stepResults,
    startedAt,
    completedAt,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Execute flow on Browserbase cloud
 */
async function executeFlowOnBrowserbase(
  flow: Flow,
  outputDir: string,
  baseDir?: string
): Promise<FlowRunResult> {
  const startedAt = new Date().toISOString();
  const startTime = Date.now();
  const viewport = flow.viewport ?? DEFAULT_VIEWPORT;

  // Validate output directory is within allowed boundaries
  const validatedOutputDir = validateOutputDirectory(outputDir, { baseDir });

  // Create unique directory for this run
  const safeFlowName = flow.name.replace(/[^a-zA-Z0-9-_]/g, '_');
  const runId = `${safeFlowName}-${Date.now()}`;
  const screenshotDir = path.join(validatedOutputDir, runId);

  const stepResults: StepResult[] = [];
  let sessionId: string | null = null;

  try {
    // Acquire session from pool
    sessionId = await browserbasePool!.acquire();
    console.log(`[FlowGuard] Using Browserbase session ${sessionId} for flow: ${flow.name}`);

    // Connect Playwright to Browserbase
    const client = new BrowserbaseClient({
      apiKey: process.env.BROWSERBASE_API_KEY!,
      projectId: process.env.BROWSERBASE_PROJECT_ID!,
    });

    const { browser, context } = await client.connectPlaywright(sessionId);
    const page = await context.newPage();

    // Set viewport
    await page.setViewportSize(viewport);

    // Navigate to initial URL
    await page.goto(flow.url, { waitUntil: 'networkidle', timeout: DEFAULT_TIMEOUT });

    // Execute each step
    for (let i = 0; i < flow.steps.length; i++) {
      const step = flow.steps[i];
      if (!step) continue;

      const result = await executeStep(page, step, i, screenshotDir);
      stepResults.push(result);

      // Stop on first failure
      if (!result.success) {
        break;
      }
    }

    await page.close();
    await browser.close();

    // Note: Recording URL will be retrieved and added to result
    // when we update FlowRunResult type in Phase 3

  } catch (error) {
    console.error(`[FlowGuard] Browserbase execution error:`, error);
    // Add error as a failed step if browser setup failed
    stepResults.push({
      stepIndex: 0,
      action: 'navigate',
      success: false,
      error: error instanceof Error ? error.message : 'Browserbase connection failed',
      durationMs: Date.now() - startTime,
    });
  } finally {
    // Release session back to pool
    if (sessionId) {
      await browserbasePool!.release(sessionId);
    }
  }

  const completedAt = new Date().toISOString();
  const allPassed = stepResults.every((s) => s.success);
  const hasError = stepResults.some((s) => s.error);

  return {
    flowName: flow.name,
    intent: flow.intent,
    url: flow.url,
    viewport,
    verdict: hasError ? 'error' : allPassed ? 'pass' : 'fail',
    confidence: 0, // Will be set by vision analyzer
    steps: stepResults,
    startedAt,
    completedAt,
    durationMs: Date.now() - startTime,
    // TODO: Add browserbase metadata when we update FlowRunResult type
  };
}

/**
 * Executes multiple flows in parallel (limited concurrency).
 *
 * @param flows - Array of flows to execute
 * @param outputDir - Directory for artifacts
 * @param concurrency - Maximum parallel executions
 * @returns Array of flow results
 */
export async function executeFlows(
  flows: Flow[],
  outputDir: string,
  concurrency = 3
): Promise<FlowRunResult[]> {
  const results: FlowRunResult[] = [];
  const queue = [...flows];

  const worker = async () => {
    while (queue.length > 0) {
      const flow = queue.shift();
      if (flow) {
        const result = await executeFlow(flow, outputDir);
        results.push(result);
      }
    }
  };

  // Create worker pool
  const workers = Array(Math.min(concurrency, flows.length))
    .fill(null)
    .map(() => worker());

  await Promise.all(workers);

  return results;
}
