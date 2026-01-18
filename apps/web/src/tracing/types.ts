// Execution Data Types for Flow Testing

export interface StepExecutionData {
  stepIndex: number;
  action: 'navigate' | 'click' | 'type' | 'scroll' | 'screenshot' | 'wait';
  target?: string;
  value?: string;
  success: boolean;
  durationMs: number;
  domSnapshotId?: string;
  error?: string;
}

export interface DOMSnapshot {
  snapshotId: string;
  stepIndex: number;
  timestamp: Date;
  html: string;
  serializedDOM: {
    title: string;
    url: string;
    elementCount: number;
    formCount: number;
    linkCount: number;
    imageCount: number;
  };
  accessibilityTree?: object;
  computedStyles?: Record<string, unknown>;
}

export interface NetworkRequest {
  requestId: string;
  stepIndex?: number;
  url: string;
  method: string;
  statusCode?: number;
  requestHeaders: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
  timing: {
    startTime: number;
    endTime?: number;
    durationMs?: number;
  };
  resourceType: 'document' | 'script' | 'stylesheet' | 'image' | 'xhr' | 'fetch' | 'other';
}

export interface ConsoleLog {
  timestamp: Date;
  stepIndex?: number;
  type: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  args: unknown[];
  stackTrace?: string;
}

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number;
  fid: number;
  cls: number;

  // Page load
  domContentLoaded: number;
  loadComplete: number;
  firstPaint: number;
  firstContentfulPaint: number;

  // Resource timing
  totalResourceSize: number;
  totalResourceCount: number;
  scriptExecutionTime: number;

  // Memory
  jsHeapSize: number;
  usedJsHeapSize: number;
}

export interface FlowExecutionData {
  flowId: string;
  flowName: string;
  intent: string;
  url: string;
  startTime: Date;
  endTime: Date;
  verdict: 'pass' | 'fail' | 'error';
  steps: StepExecutionData[];
  domSnapshots: DOMSnapshot[];
  networkRequests: NetworkRequest[];
  consoleLogs: ConsoleLog[];
  performanceMetrics: PerformanceMetrics;
  phoenixTraceId: string;
}
