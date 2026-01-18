/**
 * Dual Observability Module
 *
 * Unified observability for FlowGuard combining:
 * - Phoenix/OpenTelemetry for AI experiment tracking
 * - Datadog for production infrastructure monitoring
 */

export type {
  DualObservabilityConfig,
  TraceContext,
  FlowExecutionContext,
  EnhancedFlowRunResult,
  ObservabilityMetrics,
} from './types.js';

export {
  initDualObservability,
  shutdownDualObservability,
  isObservabilityEnabled,
  getTraceContext,
  traceFlowRun,
  traceStep,
  traceVisionAnalysis,
  traceBrowserbaseCreate,
  traceBrowserbaseConnect,
  traceBrowserbaseTerminate,
  recordPoolStatistics,
  recordErrorOccurrence,
  createConfigFromEnv,
} from './dual-tracer.js';
