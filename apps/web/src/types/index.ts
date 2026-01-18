/**
 * TypeScript types for FlowGuard Next.js app
 */

export interface Flow {
  id: string;
  name: string;
  intent: string;
  url: string;
  viewport?: {
    width: number;
    height: number;
  };
  status: 'passing' | 'failing';
  lastRun: string;
  successRate: number;
  totalRuns: number;
  steps: FlowStep[];
}

export interface FlowStep {
  id: string;
  action: 'navigate' | 'click' | 'type' | 'screenshot' | 'wait' | 'scroll';
  target?: string;
  value?: string;
  assertion?: string;
  timeout?: number;
}

export interface Report {
  id: string;
  flowName: string;
  status: 'pass' | 'fail' | 'error';
  completedAt: string;
  duration: number;
  steps: ReportStep[];
  metrics?: {
    successRate: number;
    avgConfidence: number;
    totalCost: number;
  };
}

export interface ReportStep {
  index: number;
  action: string;
  target?: string;
  assertion?: string;
  status: 'pass' | 'fail';
  screenshot?: string;
  analysis?: {
    status: 'pass' | 'fail';
    confidence: number;
    reasoning: string;
    issues?: string[];
    suggestions?: string[];
  };
}

export interface Stats {
  totalFlows: number;
  successRate: number;
  testsThisMonth: number;
  totalSteps: number;
  costThisMonth: number;
}

export interface CruxMetrics {
  lcp: { p75: number; rating: 'good' | 'needs-improvement' | 'poor' };
  cls: { p75: number; rating: 'good' | 'needs-improvement' | 'poor' };
  inp: { p75: number; rating: 'good' | 'needs-improvement' | 'poor' };
}

// Re-exported MongoDB types for use in API routes
// These mirror the types from src/db/schemas.ts

export interface TestResultMetadata {
  tenantId?: string;
  flowName: string;
  environment: 'local' | 'ci' | 'production';
  viewport: string;
  browser: string;
  userId?: string;
  branch?: string;
  commitSha?: string;
}

export interface TestResultMeasurements {
  passed: boolean;
  totalSteps: number;
  failedSteps: number;
  duration: number;
  avgConfidence: number;
  totalTokens: number;
  totalCost: number;
}

export interface StepResult {
  stepIndex: number;
  action: string;
  target?: string;
  passed: boolean;
  confidence?: number;
  reasoning?: string;
  screenshotUrl?: string;
  screenshotHash?: string;
  duration: number;
  error?: string;
}

export interface TestResult {
  timestamp: Date;
  metadata: TestResultMetadata;
  measurements: TestResultMeasurements;
  steps: StepResult[];
  errors?: Array<{
    step: number;
    message: string;
    stack?: string;
    timestamp: Date;
  }>;
}

export interface SuccessRateTrendPoint {
  date: string;
  successRate: number;
  avgConfidence: number;
  avgDuration: number;
  totalRuns: number;
}

// Database types for FlowDefinition

export interface DbFlowStep {
  action: 'navigate' | 'click' | 'type' | 'screenshot' | 'wait' | 'scroll';
  target?: string;
  value?: string;
  assert?: string;
  timeout?: number;
}

export interface FlowDefinition {
  _id?: unknown; // ObjectId
  tenantId?: string;
  name: string;
  intent: string;
  url: string;
  viewport?: {
    width: number;
    height: number;
  };
  steps: DbFlowStep[];
  tags: string[];
  critical: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

