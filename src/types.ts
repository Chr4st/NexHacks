import { z } from 'zod';

// Viewport schema for responsive testing
export const ViewportSchema = z.object({
  width: z.number().min(320).max(3840),
  height: z.number().min(480).max(2160),
});

// Step actions
export const StepActionSchema = z.enum([
  'navigate',
  'click',
  'type',
  'screenshot',
  'wait',
  'scroll',
]);

// Individual step in a flow
export const StepSchema = z.object({
  action: StepActionSchema,
  target: z.string().optional(), // CSS selector or description
  value: z.string().optional(), // Text to type
  assert: z.string().optional(), // What to verify in screenshot
  timeout: z.number().min(0).max(60000).optional(),
});

// Complete flow definition
export const FlowSchema = z.object({
  name: z.string().min(1, 'Flow name is required'),
  intent: z.string().min(10, 'Intent must be at least 10 characters'),
  url: z.string().url('URL must be valid'),
  viewport: ViewportSchema.optional(),
  steps: z.array(StepSchema).min(1, 'At least one step is required'),
});

// Infer types from schemas
export type Viewport = z.infer<typeof ViewportSchema>;
export type StepAction = z.infer<typeof StepActionSchema>;
export type Step = z.infer<typeof StepSchema>;
export type Flow = z.infer<typeof FlowSchema>;

// Analysis result - discriminated union
export type AnalysisResult =
  | {
      status: 'pass';
      confidence: number;
      reasoning: string;
    }
  | {
      status: 'fail';
      confidence: number;
      reasoning: string;
      issues: string[];
      suggestions: string[];
    }
  | {
      status: 'error';
      error: string;
    };

// Step execution result
export interface StepResult {
  stepIndex: number;
  action: StepAction;
  success: boolean;
  screenshotPath?: string;
  screenshotBase64?: string;
  analysis?: AnalysisResult;
  durationMs: number;
  error?: string;
}

// Complete flow run result
export interface FlowRunResult {
  flowName: string;
  intent: string;
  url: string;
  viewport: Viewport;
  verdict: 'pass' | 'fail' | 'error';
  confidence: number;
  steps: StepResult[];
  startedAt: string;
  completedAt: string;
  durationMs: number;
  traceId?: string;
  phoenixTraceUrl?: string;
}

// CLI output format
export type OutputFormat = 'text' | 'json';

// Configuration file schema
export const ConfigSchema = z.object({
  version: z.literal(1),
  flowsDir: z.string().default('./flows'),
  reportsDir: z.string().default('./reports'),
  defaultViewport: ViewportSchema.optional(),
  phoenixEndpoint: z.string().url().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

// CrUX metrics
export interface CruxMetrics {
  lcp: { p75: number; rating: 'good' | 'needs-improvement' | 'poor' };
  cls: { p75: number; rating: 'good' | 'needs-improvement' | 'poor' };
  inp: { p75: number; rating: 'good' | 'needs-improvement' | 'poor' };
}

// Wood Wide analysis result
export interface WoodWideResult {
  significant: boolean;
  confidence: number;
  interpretation: string;
}
