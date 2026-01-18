/**
 * Datadog Integration Module
 *
 * Provides APM tracing, metrics, and structured logging for FlowGuard.
 */

// Re-export types
export type {
  DatadogConfig,
  SpanOptions,
  MetricTags,
  FlowMetrics,
  StepMetrics,
  LogContext,
  LogLevel,
  StructuredLog,
} from './types.js';

// Tracer exports
export {
  initTracer,
  getTracer,
  isTracerActive,
  startSpan,
  getTraceContext,
  traceFlowExecution,
  traceStepExecution,
  traceBrowserbaseOperation,
  traceVisionAnalysis,
  recordFlowMetrics as recordFlowMetricsOnSpan,
  recordStepMetrics as recordStepMetricsOnSpan,
  shutdownTracer,
} from './tracer.js';

// Metrics exports
export {
  initMetrics,
  getMetricsClient,
  isMetricsActive,
  recordFlowDuration,
  recordFlowResult,
  recordFlowMetrics,
  recordStepMetrics,
  recordSessionCreated,
  recordSessionTerminated,
  recordPoolStats,
  recordSessionAcquireTime,
  recordVisionAnalysis,
  recordError,
  increment,
  decrement,
  gauge,
  histogram,
  distribution,
  timing,
  closeMetrics,
} from './metrics.js';

// Logger exports
export {
  initLogger,
  isLoggerInitialized,
  setLogLevel,
  debug,
  info,
  warn,
  error,
  logError,
  logFlowStart,
  logFlowComplete,
  logStepExecution,
  logBrowserbaseEvent,
  logVisionAnalysis,
  logPoolStats,
  createChildLogger,
  createFlowLogger,
  shutdownLogger,
} from './logger.js';

// ============================================
// Convenience initialization
// ============================================

import type { DatadogConfig, LogLevel } from './types.js';
import { initTracer, shutdownTracer } from './tracer.js';
import { initMetrics, closeMetrics } from './metrics.js';
import { initLogger, shutdownLogger } from './logger.js';

/**
 * Initialize all Datadog integrations at once
 */
export async function initDatadog(
  config: DatadogConfig,
  options?: { logLevel?: LogLevel }
): Promise<void> {
  console.log('[Datadog] Initializing all integrations...');

  // Initialize tracer first (must be done early)
  await initTracer(config);

  // Initialize metrics
  initMetrics(config);

  // Initialize logger
  initLogger(config, options?.logLevel ?? 'info');

  console.log('[Datadog] All integrations initialized');
}

/**
 * Shutdown all Datadog integrations
 */
export async function shutdownDatadog(): Promise<void> {
  console.log('[Datadog] Shutting down all integrations...');

  await shutdownTracer();
  await closeMetrics();
  shutdownLogger();

  console.log('[Datadog] All integrations shutdown');
}

/**
 * Create a Datadog config from environment variables
 */
export function createConfigFromEnv(): DatadogConfig {
  return {
    apiKey: process.env.DD_API_KEY ?? '',
    site: process.env.DD_SITE ?? 'datadoghq.com',
    service: process.env.DD_SERVICE ?? 'flowguard',
    env: process.env.DD_ENV ?? process.env.NODE_ENV ?? 'development',
    version: process.env.DD_VERSION ?? process.env.npm_package_version,
    apmEnabled: process.env.DD_APM_ENABLED !== 'false',
    metricsEnabled: process.env.DD_METRICS_ENABLED !== 'false',
    logsEnabled: process.env.DD_LOGS_ENABLED !== 'false',
    sampleRate: parseFloat(process.env.DD_SAMPLE_RATE ?? '1.0'),
    statsdHost: process.env.DD_STATSD_HOST ?? 'localhost',
    statsdPort: parseInt(process.env.DD_STATSD_PORT ?? '8125', 10),
    runtimeMetrics: process.env.DD_RUNTIME_METRICS !== 'false',
    profiling: process.env.DD_PROFILING === 'true',
    logInjection: process.env.DD_LOG_INJECTION !== 'false',
  };
}
