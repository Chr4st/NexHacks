/**
 * Datadog Metrics Module (DogStatsD)
 *
 * Provides custom metrics for FlowGuard flow executions,
 * browser sessions, and performance monitoring.
 */

import { StatsD } from 'hot-shots';
import type { DatadogConfig, MetricTags, FlowMetrics, StepMetrics } from './types.js';

let client: StatsD | null = null;
let initialized = false;

// Metric name prefixes
const METRIC_PREFIX = 'flowguard';

/**
 * Initialize the DogStatsD metrics client
 */
export function initMetrics(datadogConfig: DatadogConfig): void {
  if (initialized) {
    console.warn('[Datadog] Metrics client already initialized');
    return;
  }

  if (!datadogConfig.metricsEnabled) {
    console.log('[Datadog] Metrics disabled');
    initialized = true;
    return;
  }

  try {
    client = new StatsD({
      host: datadogConfig.statsdHost ?? 'localhost',
      port: datadogConfig.statsdPort ?? 8125,
      prefix: `${METRIC_PREFIX}.`,
      globalTags: {
        service: datadogConfig.service,
        env: datadogConfig.env,
        ...(datadogConfig.version && { version: datadogConfig.version }),
      },
      errorHandler: (error) => {
        console.error('[Datadog] StatsD error:', error.message);
      },
    });

    console.log(`[Datadog] Metrics client initialized (${datadogConfig.statsdHost ?? 'localhost'}:${datadogConfig.statsdPort ?? 8125})`);
    initialized = true;
  } catch (error) {
    console.error('[Datadog] Failed to initialize metrics client:', error);
    initialized = true;
  }
}

/**
 * Get the metrics client instance
 */
export function getMetricsClient(): StatsD | null {
  return client;
}

/**
 * Check if metrics client is active
 */
export function isMetricsActive(): boolean {
  return initialized && client !== null;
}

/**
 * Format tags for DogStatsD
 */
function formatTags(tags?: MetricTags): string[] {
  if (!tags) return [];
  return Object.entries(tags).map(([key, value]) => `${key}:${value}`);
}

// ============================================
// Flow Execution Metrics
// ============================================

/**
 * Record flow execution duration
 */
export function recordFlowDuration(flowName: string, durationMs: number, tags?: MetricTags): void {
  if (!client) return;

  client.histogram('flow.duration', durationMs, formatTags({
    flow_name: flowName,
    ...tags,
  }));
}

/**
 * Record flow execution result
 */
export function recordFlowResult(
  flowName: string,
  verdict: 'pass' | 'fail' | 'error',
  executionMode: 'local' | 'cloud',
  tags?: MetricTags
): void {
  if (!client) return;

  // Increment counter for flow executions
  client.increment('flow.executed', 1, formatTags({
    flow_name: flowName,
    verdict,
    execution_mode: executionMode,
    ...tags,
  }));

  // Specific counters for each verdict
  client.increment(`flow.${verdict}`, 1, formatTags({
    flow_name: flowName,
    execution_mode: executionMode,
    ...tags,
  }));
}

/**
 * Record comprehensive flow metrics
 */
export function recordFlowMetrics(flowName: string, metrics: FlowMetrics, tags?: MetricTags): void {
  if (!client) return;

  const baseTags = formatTags({
    flow_name: flowName,
    execution_mode: metrics.executionMode,
    verdict: metrics.verdict,
    ...tags,
  });

  // Duration histogram
  client.histogram('flow.duration', metrics.durationMs, baseTags);

  // Step counts
  client.gauge('flow.steps.executed', metrics.stepsExecuted, baseTags);
  client.gauge('flow.steps.passed', metrics.stepsPassed, baseTags);
  client.gauge('flow.steps.failed', metrics.stepsFailed, baseTags);

  // Success rate (calculated)
  if (metrics.stepsExecuted > 0) {
    const successRate = (metrics.stepsPassed / metrics.stepsExecuted) * 100;
    client.gauge('flow.steps.success_rate', successRate, baseTags);
  }

  // Confidence score (if available)
  if (metrics.confidence !== undefined) {
    client.gauge('flow.confidence', metrics.confidence, baseTags);
  }

  // Increment execution counter
  client.increment('flow.executed', 1, baseTags);
}

// ============================================
// Step Execution Metrics
// ============================================

/**
 * Record step execution metrics
 */
export function recordStepMetrics(
  flowName: string,
  stepIndex: number,
  metrics: StepMetrics,
  tags?: MetricTags
): void {
  if (!client) return;

  const baseTags = formatTags({
    flow_name: flowName,
    step_index: stepIndex.toString(),
    action: metrics.action,
    success: metrics.success.toString(),
    ...tags,
  });

  // Step duration
  client.histogram('step.duration', metrics.durationMs, baseTags);

  // Step execution counter
  client.increment('step.executed', 1, baseTags);

  // Success/failure counters
  if (metrics.success) {
    client.increment('step.passed', 1, baseTags);
  } else {
    client.increment('step.failed', 1, baseTags);
  }
}

// ============================================
// Browserbase Session Metrics
// ============================================

/**
 * Record Browserbase session creation
 */
export function recordSessionCreated(sessionId: string, region?: string, tags?: MetricTags): void {
  if (!client) return;

  client.increment('browserbase.session.created', 1, formatTags({
    session_id: sessionId,
    ...(region && { region }),
    ...tags,
  }));
}

/**
 * Record Browserbase session termination
 */
export function recordSessionTerminated(sessionId: string, reason: 'completed' | 'expired' | 'error', tags?: MetricTags): void {
  if (!client) return;

  client.increment('browserbase.session.terminated', 1, formatTags({
    session_id: sessionId,
    reason,
    ...tags,
  }));
}

/**
 * Record session pool statistics
 */
export function recordPoolStats(stats: { idle: number; active: number; total: number }, tags?: MetricTags): void {
  if (!client) return;

  const baseTags = formatTags(tags);

  client.gauge('browserbase.pool.idle', stats.idle, baseTags);
  client.gauge('browserbase.pool.active', stats.active, baseTags);
  client.gauge('browserbase.pool.total', stats.total, baseTags);
}

/**
 * Record session acquire latency
 */
export function recordSessionAcquireTime(durationMs: number, fromPool: boolean, tags?: MetricTags): void {
  if (!client) return;

  client.histogram('browserbase.session.acquire_time', durationMs, formatTags({
    from_pool: fromPool.toString(),
    ...tags,
  }));
}

// ============================================
// Vision Analysis Metrics
// ============================================

/**
 * Record vision analysis metrics
 */
export function recordVisionAnalysis(
  flowName: string,
  confidence: number,
  durationMs: number,
  tags?: MetricTags
): void {
  if (!client) return;

  const baseTags = formatTags({
    flow_name: flowName,
    ...tags,
  });

  client.histogram('vision.duration', durationMs, baseTags);
  client.gauge('vision.confidence', confidence, baseTags);
  client.increment('vision.analyzed', 1, baseTags);
}

// ============================================
// Error Metrics
// ============================================

/**
 * Record error occurrence
 */
export function recordError(
  category: 'flow' | 'step' | 'browserbase' | 'vision' | 'system',
  errorType: string,
  tags?: MetricTags
): void {
  if (!client) return;

  client.increment('error', 1, formatTags({
    category,
    error_type: errorType,
    ...tags,
  }));
}

// ============================================
// Custom Metrics
// ============================================

/**
 * Increment a counter
 */
export function increment(metric: string, value = 1, tags?: MetricTags): void {
  if (!client) return;
  client.increment(metric, value, formatTags(tags));
}

/**
 * Decrement a counter
 */
export function decrement(metric: string, value = 1, tags?: MetricTags): void {
  if (!client) return;
  client.decrement(metric, value, formatTags(tags));
}

/**
 * Set a gauge value
 */
export function gauge(metric: string, value: number, tags?: MetricTags): void {
  if (!client) return;
  client.gauge(metric, value, formatTags(tags));
}

/**
 * Record a histogram value
 */
export function histogram(metric: string, value: number, tags?: MetricTags): void {
  if (!client) return;
  client.histogram(metric, value, formatTags(tags));
}

/**
 * Record a distribution value (similar to histogram but with percentile aggregations)
 */
export function distribution(metric: string, value: number, tags?: MetricTags): void {
  if (!client) return;
  client.distribution(metric, value, formatTags(tags));
}

/**
 * Time a function execution and record as histogram
 */
export async function timing<T>(
  metric: string,
  fn: () => Promise<T>,
  tags?: MetricTags
): Promise<T> {
  const start = Date.now();
  try {
    return await fn();
  } finally {
    const duration = Date.now() - start;
    histogram(metric, duration, tags);
  }
}

// ============================================
// Lifecycle
// ============================================

/**
 * Flush pending metrics and close the client
 */
export async function closeMetrics(): Promise<void> {
  if (client) {
    return new Promise((resolve) => {
      client!.close(() => {
        console.log('[Datadog] Metrics client closed');
        client = null;
        initialized = false;
        resolve();
      });
    });
  }
}
