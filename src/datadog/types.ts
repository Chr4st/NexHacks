/**
 * Datadog APM and Metrics Configuration Types
 */

export interface DatadogConfig {
  /** Datadog API key */
  apiKey: string;
  /** Datadog site (e.g., us5.datadoghq.com) */
  site: string;
  /** Service name for APM */
  service: string;
  /** Environment (development, staging, production) */
  env: string;
  /** Service version */
  version?: string;
  /** Enable APM tracing */
  apmEnabled?: boolean;
  /** Enable DogStatsD metrics */
  metricsEnabled?: boolean;
  /** Enable structured logging */
  logsEnabled?: boolean;
  /** Sample rate for traces (0.0 - 1.0) */
  sampleRate?: number;
  /** DogStatsD host (default: localhost) */
  statsdHost?: string;
  /** DogStatsD port (default: 8125) */
  statsdPort?: number;
  /** Enable runtime metrics */
  runtimeMetrics?: boolean;
  /** Enable profiling */
  profiling?: boolean;
  /** Log injection for trace correlation */
  logInjection?: boolean;
}

export interface SpanOptions {
  /** Operation name */
  operationName: string;
  /** Resource name (e.g., HTTP endpoint, flow name) */
  resource?: string;
  /** Service name override */
  service?: string;
  /** Span type (web, db, cache, custom) */
  type?: 'web' | 'db' | 'cache' | 'custom';
  /** Additional tags */
  tags?: Record<string, string | number | boolean>;
}

export interface MetricTags {
  [key: string]: string | number | boolean;
}

export interface FlowMetrics {
  /** Flow execution duration in milliseconds */
  durationMs: number;
  /** Number of steps executed */
  stepsExecuted: number;
  /** Number of steps that passed */
  stepsPassed: number;
  /** Number of steps that failed */
  stepsFailed: number;
  /** Execution mode (local or cloud) */
  executionMode: 'local' | 'cloud';
  /** Flow verdict (pass, fail, error) */
  verdict: 'pass' | 'fail' | 'error';
  /** Vision analysis confidence (0-100) */
  confidence?: number;
}

export interface StepMetrics {
  /** Step action type */
  action: string;
  /** Step duration in milliseconds */
  durationMs: number;
  /** Whether step succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

export interface LogContext {
  /** Trace ID for correlation */
  traceId?: string;
  /** Span ID for correlation */
  spanId?: string;
  /** Flow name */
  flowName?: string;
  /** Step index */
  stepIndex?: number;
  /** Execution mode */
  executionMode?: 'local' | 'cloud';
  /** Browserbase session ID */
  browserbaseSessionId?: string;
  /** Additional context */
  [key: string]: unknown;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  env: string;
  version?: string;
  dd?: {
    trace_id?: string;
    span_id?: string;
  };
  context?: LogContext;
}
