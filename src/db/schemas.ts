import { ObjectId } from 'mongodb';

// ==================== Time-Series Collection ====================
// Collection: test_results
export interface TestResult {
  timestamp: Date;              // Time-series timeField
  metadata: {
    tenantId?: string;           // Multi-tenant support
    flowName: string;
    environment: 'local' | 'ci' | 'production';
    viewport: string;            // "1920x1080", "375x667"
    browser: string;             // "chromium", "firefox", "webkit"
    userId?: string;
    branch?: string;
    commitSha?: string;
  };
  measurements: {
    passed: boolean;
    totalSteps: number;
    failedSteps: number;
    duration: number;            // milliseconds
    avgConfidence: number;       // 0-100
    totalTokens: number;
    totalCost: number;           // USD
  };
  steps: StepResult[];
  errors?: ErrorLog[];
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

export interface ErrorLog {
  step: number;
  message: string;
  stack?: string;
  timestamp: Date;
}

// ==================== Vision Cache ====================
// Collection: vision_cache
export interface VisionCache {
  _id: ObjectId;
  screenshotHash: string;      // SHA-256 hash
  assertion: string;
  model: string;               // "claude-3-5-sonnet-20241022"
  promptVersion: string;       // "v2.1"
  verdict: boolean;
  confidence: number;
  reasoning: string;
  tokens: {
    input: number;
    output: number;
  };
  cost: number;
  createdAt: Date;
  expiresAt: Date;             // TTL index
  hitCount: number;            // Cache analytics
}

// ==================== Flow Definitions ====================
// Collection: flow_definitions
export interface FlowDefinition {
  _id: ObjectId;
  tenantId?: string;
  name: string;
  intent: string;              // Atlas Search indexed
  url: string;
  viewport?: {
    width: number;
    height: number;
  };
  steps: FlowStep[];
  tags: string[];
  critical: boolean;           // Use Browserbase in CI?
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface FlowStep {
  action: 'navigate' | 'click' | 'type' | 'screenshot' | 'wait' | 'scroll';
  target?: string;
  value?: string;
  assert?: string;
  timeout?: number;
}

// ==================== Usage Tracking ====================
// Collection: usage_events
export interface UsageEvent {
  _id: ObjectId;
  tenantId?: string;
  eventType: 'flow_run' | 'vision_call' | 'cache_hit' | 'cache_miss';
  flowName?: string;
  cost?: number;
  tokens?: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// ==================== Experiments (Phoenix Integration) ====================
// Collection: experiments
export interface Experiment {
  _id: ObjectId;
  name: string;
  promptVersion: string;
  datasetName: string;
  accuracy: number;
  avgConfidence: number;
  totalRuns: number;
  startedAt: Date;
  completedAt?: Date;
  phoenixExperimentId?: string;
  results: ExperimentResult[];
}

export interface ExperimentResult {
  example: string;
  expected: boolean;
  predicted: boolean;
  confidence: number;
  correct: boolean;
}
