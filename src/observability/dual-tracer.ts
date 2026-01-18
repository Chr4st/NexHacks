/**
 * Dual Observability Tracer
 *
 * Unified tracing that sends to both Phoenix (AI experiments) and Datadog (infrastructure).
 * Phoenix captures LLM/vision analysis details for AI iteration.
 * Datadog captures flow execution for production monitoring.
 */

import type { FlowRunResult, StepResult, AnalysisResult } from '../types.js';
import type { DualObservabilityConfig, TraceContext, EnhancedFlowRunResult } from './types.js';

// Phoenix/OpenTelemetry tracing (existing)
import {
  initTracing as initPhoenixTracing,
  shutdownTracing as shutdownPhoenixTracing,
  traceFlowRun as phoenixTraceFlowRun,
  traceStep as phoenixTraceStep,
  traceVisionAnalysis as phoenixTraceVisionAnalysis,
  isTracingEnabled as isPhoenixEnabled,
} from '../tracing.js';

// Datadog tracing (new)
import {
  initDatadog,
  shutdownDatadog,
  traceFlowExecution as datadogTraceFlowExecution,
  traceStepExecution as datadogTraceStepExecution,
  traceVisionAnalysis as datadogTraceVisionAnalysis,
  traceBrowserbaseOperation,
  getTraceContext as getDatadogTraceContext,
  isTracerActive as isDatadogActive,
  // Metrics
  recordFlowMetrics as datadogRecordFlowMetrics,
  recordStepMetrics as datadogRecordStepMetrics,
  recordVisionAnalysis as datadogRecordVisionAnalysis,
  recordSessionCreated,
  recordSessionTerminated,
  recordPoolStats,
  recordError,
  // Logger
  logFlowStart,
  logFlowComplete,
  logStepExecution as logStep,
  logBrowserbaseEvent,
  logVisionAnalysis as logVision,
} from '../datadog/index.js';

let config: DualObservabilityConfig | null = null;
let initialized = false;

/**
 * Initialize dual observability (Phoenix + Datadog)
 */
export async function initDualObservability(dualConfig: DualObservabilityConfig): Promise<void> {
  if (initialized) {
    console.warn('[Observability] Already initialized');
    return;
  }

  config = dualConfig;

  console.log('[Observability] Initializing dual observability...');

  // Initialize Phoenix/OpenTelemetry if enabled
  if (dualConfig.phoenix.enabled) {
    initPhoenixTracing(dualConfig.phoenix.endpoint);
    console.log('[Observability] Phoenix tracing enabled');
  }

  // Initialize Datadog if enabled
  if (dualConfig.datadog.enabled) {
    await initDatadog({
      apiKey: dualConfig.datadog.apiKey ?? '',
      site: dualConfig.datadog.site ?? 'datadoghq.com',
      service: dualConfig.datadog.service ?? dualConfig.service,
      env: dualConfig.datadog.env ?? dualConfig.env,
      version: dualConfig.datadog.version ?? dualConfig.version,
      apmEnabled: true,
      metricsEnabled: true,
      logsEnabled: true,
    });
    console.log('[Observability] Datadog observability enabled');
  }

  initialized = true;
  console.log('[Observability] Dual observability initialized');
}

/**
 * Shutdown dual observability
 */
export async function shutdownDualObservability(): Promise<void> {
  if (!initialized) return;

  console.log('[Observability] Shutting down dual observability...');

  if (config?.phoenix.enabled) {
    await shutdownPhoenixTracing();
  }

  if (config?.datadog.enabled) {
    await shutdownDatadog();
  }

  initialized = false;
  config = null;
  console.log('[Observability] Dual observability shutdown complete');
}

/**
 * Check if observability is initialized
 */
export function isObservabilityEnabled(): boolean {
  return initialized;
}

/**
 * Get current trace context from both systems
 */
export function getTraceContext(): TraceContext {
  const datadogCtx = isDatadogActive() ? getDatadogTraceContext() : {};

  return {
    datadogTraceId: datadogCtx.traceId,
    // Phoenix trace ID is captured during span creation
  };
}

// ============================================
// Flow Tracing
// ============================================

/**
 * Trace a flow execution with both Phoenix and Datadog
 */
export async function traceFlowRun<T extends FlowRunResult>(
  flowName: string,
  intent: string,
  executionMode: 'local' | 'cloud',
  fn: () => Promise<T>
): Promise<EnhancedFlowRunResult> {
  // Log flow start
  if (config?.datadog.enabled) {
    logFlowStart(flowName, executionMode);
  }

  const startTime = Date.now();

  // Create the execution function that will be traced
  const executeFlow = async (): Promise<T> => {
    // If Datadog is enabled, wrap with Datadog tracing
    if (config?.datadog.enabled && isDatadogActive()) {
      return await datadogTraceFlowExecution(flowName, executionMode, async () => {
        return await fn();
      });
    }
    return await fn();
  };

  let result: T;
  let phoenixTraceUrl: string | undefined;

  // If Phoenix is enabled, wrap with Phoenix tracing
  if (config?.phoenix.enabled && isPhoenixEnabled()) {
    result = await phoenixTraceFlowRun(flowName, intent, executeFlow);
    phoenixTraceUrl = result.phoenixTraceUrl;
  } else {
    result = await executeFlow();
  }

  const durationMs = Date.now() - startTime;

  // Record metrics in Datadog
  if (config?.datadog.enabled) {
    datadogRecordFlowMetrics(flowName, {
      durationMs,
      stepsExecuted: result.steps.length,
      stepsPassed: result.steps.filter((s) => s.success).length,
      stepsFailed: result.steps.filter((s) => !s.success).length,
      executionMode,
      verdict: result.verdict,
      confidence: result.confidence,
    });

    logFlowComplete(flowName, result.verdict, durationMs, { executionMode });
  }

  // Return enhanced result
  const enhancedResult: EnhancedFlowRunResult = {
    ...result,
    executionMode,
    phoenixTraceUrl,
  };

  return enhancedResult;
}

// ============================================
// Step Tracing
// ============================================

/**
 * Trace a step execution with both Phoenix and Datadog
 */
export async function traceStep<T extends StepResult>(
  flowName: string,
  stepIndex: number,
  action: string,
  fn: () => Promise<T>
): Promise<T> {
  const executeStep = async (): Promise<T> => {
    if (config?.datadog.enabled && isDatadogActive()) {
      return await datadogTraceStepExecution(stepIndex, action, async () => {
        return await fn();
      });
    }
    return await fn();
  };

  let result: T;

  if (config?.phoenix.enabled && isPhoenixEnabled()) {
    result = await phoenixTraceStep(stepIndex, action, executeStep);
  } else {
    result = await executeStep();
  }

  // Record metrics in Datadog
  if (config?.datadog.enabled) {
    datadogRecordStepMetrics(flowName, stepIndex, {
      action,
      durationMs: result.durationMs,
      success: result.success,
      error: result.error,
    });

    logStep(flowName, stepIndex, action, result.success, result.durationMs, result.error);
  }

  return result;
}

// ============================================
// Vision Analysis Tracing
// ============================================

/**
 * Trace a vision analysis with both Phoenix and Datadog
 */
export async function traceVisionAnalysis<T extends AnalysisResult>(
  flowName: string,
  intent: string,
  promptTokens: number,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  const executeAnalysis = async (): Promise<T> => {
    if (config?.datadog.enabled && isDatadogActive()) {
      return await datadogTraceVisionAnalysis(flowName, async () => {
        return await fn();
      });
    }
    return await fn();
  };

  let result: T;

  if (config?.phoenix.enabled && isPhoenixEnabled()) {
    result = await phoenixTraceVisionAnalysis(intent, promptTokens, executeAnalysis);
  } else {
    result = await executeAnalysis();
  }

  const durationMs = Date.now() - startTime;

  // Record metrics in Datadog
  if (config?.datadog.enabled) {
    const confidence = result.status === 'pass' || result.status === 'fail' ? result.confidence : 0;
    datadogRecordVisionAnalysis(flowName, confidence, durationMs);
    logVision(flowName, confidence, durationMs);
  }

  return result;
}

// ============================================
// Browserbase Tracing
// ============================================

/**
 * Trace Browserbase session creation
 */
export async function traceBrowserbaseCreate<T>(
  fn: () => Promise<T>
): Promise<T> {
  if (config?.datadog.enabled && isDatadogActive()) {
    return await traceBrowserbaseOperation('create', undefined, async () => {
      const result = await fn();

      // Extract session ID if available
      if (result && typeof result === 'object' && 'id' in result) {
        const sessionId = (result as { id: string }).id;
        recordSessionCreated(sessionId);
        logBrowserbaseEvent('created', sessionId);
      }

      return result;
    });
  }
  return await fn();
}

/**
 * Trace Browserbase session connection
 */
export async function traceBrowserbaseConnect<T>(
  sessionId: string,
  fn: () => Promise<T>
): Promise<T> {
  if (config?.datadog.enabled) {
    logBrowserbaseEvent('connected', sessionId);
  }

  if (config?.datadog.enabled && isDatadogActive()) {
    return await traceBrowserbaseOperation('connect', sessionId, fn);
  }
  return await fn();
}

/**
 * Trace Browserbase session termination
 */
export async function traceBrowserbaseTerminate<T>(
  sessionId: string,
  reason: 'completed' | 'expired' | 'error',
  fn: () => Promise<T>
): Promise<T> {
  if (config?.datadog.enabled && isDatadogActive()) {
    return await traceBrowserbaseOperation('terminate', sessionId, async () => {
      const result = await fn();
      recordSessionTerminated(sessionId, reason);
      logBrowserbaseEvent('terminated', sessionId);
      return result;
    });
  }
  return await fn();
}

/**
 * Record session pool statistics
 */
export function recordPoolStatistics(stats: { idle: number; active: number; total: number }): void {
  if (config?.datadog.enabled) {
    recordPoolStats(stats);
  }
}

/**
 * Record an error occurrence
 */
export function recordErrorOccurrence(
  category: 'flow' | 'step' | 'browserbase' | 'vision' | 'system',
  errorType: string,
  tags?: Record<string, string | number | boolean>
): void {
  if (config?.datadog.enabled) {
    recordError(category, errorType, tags);
  }
}

// ============================================
// Configuration Helpers
// ============================================

/**
 * Create dual observability config from environment variables
 */
export function createConfigFromEnv(): DualObservabilityConfig {
  return {
    phoenix: {
      enabled: process.env.PHOENIX_ENABLED !== 'false',
      endpoint: process.env.PHOENIX_ENDPOINT ?? 'http://localhost:6006/v1/traces',
    },
    datadog: {
      enabled: process.env.DD_ENABLED !== 'false' && !!process.env.DD_API_KEY,
      apiKey: process.env.DD_API_KEY,
      site: process.env.DD_SITE ?? 'datadoghq.com',
      service: process.env.DD_SERVICE,
      env: process.env.DD_ENV,
      version: process.env.DD_VERSION,
    },
    service: process.env.SERVICE_NAME ?? 'flowguard',
    env: process.env.NODE_ENV ?? 'development',
    version: process.env.npm_package_version,
  };
}
