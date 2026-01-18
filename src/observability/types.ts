/**
 * Dual Observability Types
 *
 * Types for unified Phoenix + Datadog observability.
 */

import type { FlowRunResult, StepResult, AnalysisResult } from '../types.js';

export interface DualObservabilityConfig {
  /** Phoenix/OpenTelemetry configuration */
  phoenix: {
    enabled: boolean;
    endpoint?: string;
  };
  /** Datadog configuration */
  datadog: {
    enabled: boolean;
    apiKey?: string;
    site?: string;
    service?: string;
    env?: string;
    version?: string;
  };
  /** Service identification */
  service: string;
  env: string;
  version?: string;
}

export interface TraceContext {
  /** Phoenix trace ID (OpenTelemetry format) */
  phoenixTraceId?: string;
  /** Datadog trace ID */
  datadogTraceId?: string;
  /** Phoenix UI URL */
  phoenixTraceUrl?: string;
  /** Datadog APM URL */
  datadogTraceUrl?: string;
}

export interface FlowExecutionContext {
  flowName: string;
  intent: string;
  url: string;
  executionMode: 'local' | 'cloud';
  browserbaseSessionId?: string;
  traceContext?: TraceContext;
}

export interface EnhancedFlowRunResult extends FlowRunResult {
  /** Execution mode (local or cloud) */
  executionMode: 'local' | 'cloud';
  /** Browserbase session ID (if cloud execution) */
  browserbaseSessionId?: string;
  /** Browserbase recording URL (if cloud execution) */
  browserbaseRecordingUrl?: string;
  /** Phoenix trace URL */
  phoenixTraceUrl?: string;
  /** Datadog trace URL */
  datadogTraceUrl?: string;
}

export interface ObservabilityMetrics {
  /** Record flow execution metrics */
  recordFlowExecution(
    flowName: string,
    result: FlowRunResult,
    executionMode: 'local' | 'cloud'
  ): void;

  /** Record step execution metrics */
  recordStepExecution(
    flowName: string,
    stepIndex: number,
    result: StepResult
  ): void;

  /** Record vision analysis metrics */
  recordVisionAnalysis(
    flowName: string,
    result: AnalysisResult,
    durationMs: number
  ): void;

  /** Record Browserbase session metrics */
  recordBrowserbaseSession(
    event: 'created' | 'connected' | 'terminated',
    sessionId: string,
    metadata?: Record<string, unknown>
  ): void;
}
