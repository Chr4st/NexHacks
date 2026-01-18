import { ObjectId } from 'mongodb';
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
// MongoDB Experiment Schema
// ============================================================================

export interface Experiment {
  _id?: ObjectId;
  experimentId: string;
  name: string;
  description: string;
  runAt: Date;
  promptVersions: {
    control: { version: string; systemPrompt: string };
    variant: { version: string; systemPrompt: string };
  };
  control: PromptMetrics;
  variant: PromptMetrics;
  winner: 'control' | 'variant' | 'tie';
  statisticalSignificance: {
    pValue: number;
    significant: boolean;
  };
}

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
