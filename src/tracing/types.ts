import { z } from 'zod';

// ============================================================================
// Benchmark Dataset Types
// ============================================================================

export const BenchmarkExampleSchema = z.object({
  id: z.string(),
  screenshot_path: z.string(),
  assertion: z.string(),
  ground_truth: z.object({
    verdict: z.boolean(),
    expected_issues: z.array(z.string())
  }),
  metadata: z.object({
    category: z.enum(['accessibility', 'layout', 'responsiveness', 'ux-dark-patterns', 'security']),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    created_at: z.string()
  })
});

export type BenchmarkExample = z.infer<typeof BenchmarkExampleSchema>;

export const BenchmarkDatasetSchema = z.object({
  version: z.string(),
  created_at: z.string(),
  total_examples: z.number(),
  examples: z.array(BenchmarkExampleSchema)
});

export type BenchmarkDataset = z.infer<typeof BenchmarkDatasetSchema>;

// ============================================================================
// Prompt Templates
// ============================================================================

export interface PromptTemplate {
  version: string;
  systemPrompt: string;
  userPromptTemplate: (screenshot: string, assertion: string) => string;
}

// ============================================================================
// Experiment Configuration
// ============================================================================

export interface ExperimentConfig {
  name: string;
  description: string;
  promptVersions: {
    control: PromptTemplate;
    variant: PromptTemplate;
  };
  dataset: BenchmarkExample[];
  model: 'claude-3-5-sonnet-20241022';
  traceProject: string;
}

// ============================================================================
// Experiment Results
// ============================================================================

export interface PromptMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  avgTokens: number;
  avgCost: number;
  avgLatency: number;
  phoenixTraceIds: string[];
}

export interface ExperimentResult {
  experimentId: string;
  runAt: Date;
  control: PromptMetrics;
  variant: PromptMetrics;
  winner: 'control' | 'variant' | 'tie';
  statisticalSignificance: {
    pValue: number;
    significant: boolean;
  };
}

// ============================================================================
// Re-export ABExperiment from A1's schemas (Agent A1 integration)
// ============================================================================

export type { ABExperiment } from '../db/schemas.js';

// ============================================================================
// Phoenix Trace Types
// ============================================================================

export interface PhoenixTrace {
  traceId: string;
  spanId: string;
  name: string;
  kind: 'LLM' | 'CHAIN' | 'TOOL' | 'RETRIEVER';
  startTime: Date;
  endTime: Date;
  attributes: Record<string, any>;
  events: Array<{ name: string; timestamp: Date; attributes: Record<string, any> }>;
  project: string;
}

// ============================================================================
// Evaluation Results
// ============================================================================

export interface EvaluationResult {
  predicted: boolean;
  actual: boolean;
  tokens: number;
  cost: number;
  latency: number;
  traceId: string;
}

// ============================================================================
// Execution Data Capture Types (Phase 1: Agent-Driven Testing)
// ============================================================================

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
  computedStyles?: Record<string, any>;
  accessibilityTree?: any;
}

export interface NetworkRequest {
  requestId: string;
  stepIndex: number;
  url: string;
  method: string;
  statusCode: number;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
  timing: {
    startTime: number;
    endTime: number;
    durationMs: number;
  };
  resourceType: 'document' | 'script' | 'stylesheet' | 'image' | 'xhr' | 'fetch' | string;
}

export interface ConsoleLog {
  timestamp: Date;
  stepIndex: number;
  type: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  args: any[];
  stackTrace?: string;
}

export interface PerformanceMetrics {
  lcp: number;
  fid: number;
  cls: number;
  domContentLoaded: number;
  loadComplete: number;
  firstPaint: number;
  firstContentfulPaint: number;
  totalResourceSize: number;
  totalResourceCount: number;
  scriptExecutionTime: number;
  jsHeapSize: number;
  usedJsHeapSize: number;
}

export interface StepExecutionData {
  stepIndex: number;
  action: 'navigate' | 'click' | 'type' | 'scroll' | 'screenshot' | 'wait';
  target?: string;
  value?: string;
  success: boolean;
  durationMs: number;
  domSnapshotId: string;
  error?: string;
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

// ============================================================================
// AI Analysis Types
// ============================================================================

export interface AnalysisIssue {
  type: 'accessibility' | 'layout' | 'performance' | 'security' | 'console';
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface UXAnalysisResult {
  issues: AnalysisIssue[];
  summary: string;
}

export interface PerformanceAnalysisResult {
  issues: AnalysisIssue[];
  recommendations: string[];
  summary: string;
}

export interface ErrorAnalysisResult {
  issues: AnalysisIssue[];
  summary: string;
}

export interface FlowAnalysisResult {
  flowId: string;
  flowName: string;
  verdict: 'pass' | 'fail' | 'error';
  summary: string;
  uxIssues: AnalysisIssue[];
  performanceIssues: AnalysisIssue[];
  consoleErrors: AnalysisIssue[];
  recommendations: string[];
  executionTime: number;
}
