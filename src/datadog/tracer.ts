/**
 * Datadog APM Tracer Module
 *
 * Provides distributed tracing for FlowGuard flow executions.
 * Must be initialized early in the application lifecycle.
 */

import type { DatadogConfig, SpanOptions, FlowMetrics, StepMetrics } from './types.js';

// dd-trace types (dynamic import to avoid ESM issues)
type Tracer = {
  init: (options: Record<string, unknown>) => Tracer;
  trace: <T>(name: string, options: Record<string, unknown>, fn: (span: Span) => T) => T;
  wrap: <T extends (...args: unknown[]) => unknown>(name: string, options: Record<string, unknown>, fn: T) => T;
  startSpan: (name: string, options?: Record<string, unknown>) => Span;
  scope: () => {
    active: () => Span | null;
    activate: <T>(span: Span, fn: () => T) => T;
  };
};

type Span = {
  setTag: (key: string, value: unknown) => Span;
  addTags: (tags: Record<string, unknown>) => Span;
  finish: (finishTime?: number) => void;
  context: () => {
    toTraceId: () => string;
    toSpanId: () => string;
  };
};

let tracer: Tracer | null = null;
let initialized = false;
let config: DatadogConfig | null = null;

/**
 * Initialize the Datadog tracer
 * IMPORTANT: Must be called before importing other application modules
 */
export async function initTracer(datadogConfig: DatadogConfig): Promise<void> {
  if (initialized) {
    console.warn('[Datadog] Tracer already initialized');
    return;
  }

  config = datadogConfig;

  if (!datadogConfig.apmEnabled) {
    console.log('[Datadog] APM tracing disabled');
    initialized = true;
    return;
  }

  try {
    // Dynamic import of dd-trace (CommonJS module)
    const ddTrace = await import('dd-trace');
    tracer = ddTrace.default as unknown as Tracer;

    tracer.init({
      service: datadogConfig.service,
      env: datadogConfig.env,
      version: datadogConfig.version,
      sampleRate: datadogConfig.sampleRate ?? 1.0,
      runtimeMetrics: datadogConfig.runtimeMetrics ?? true,
      profiling: datadogConfig.profiling ?? false,
      logInjection: datadogConfig.logInjection ?? true,
      // Datadog site configuration
      hostname: datadogConfig.site,
      // Tags
      tags: {
        'service.name': datadogConfig.service,
        'deployment.environment': datadogConfig.env,
      },
    });

    console.log(`[Datadog] Tracer initialized for service: ${datadogConfig.service}, env: ${datadogConfig.env}`);
    initialized = true;
  } catch (error) {
    console.error('[Datadog] Failed to initialize tracer:', error);
    initialized = true; // Mark as initialized to prevent retries
  }
}

/**
 * Get the current tracer instance
 */
export function getTracer(): Tracer | null {
  return tracer;
}

/**
 * Check if tracer is initialized and active
 */
export function isTracerActive(): boolean {
  return initialized && tracer !== null;
}

/**
 * Create a new span for tracing
 */
export function startSpan(options: SpanOptions): Span | null {
  if (!tracer) return null;

  const span = tracer.startSpan(options.operationName, {
    childOf: tracer.scope().active() ?? undefined,
    tags: {
      'resource.name': options.resource ?? options.operationName,
      'span.type': options.type ?? 'custom',
      'service.name': options.service ?? config?.service,
      ...options.tags,
    },
  });

  return span;
}

/**
 * Get current trace context for log correlation
 */
export function getTraceContext(): { traceId?: string; spanId?: string } {
  if (!tracer) return {};

  const activeSpan = tracer.scope().active();
  if (!activeSpan) return {};

  try {
    const context = activeSpan.context();
    return {
      traceId: context.toTraceId(),
      spanId: context.toSpanId(),
    };
  } catch {
    return {};
  }
}

/**
 * Trace a flow execution
 */
export async function traceFlowExecution<T>(
  flowName: string,
  executionMode: 'local' | 'cloud',
  fn: (span: Span | null) => Promise<T>
): Promise<T> {
  const span = startSpan({
    operationName: 'flow.execute',
    resource: flowName,
    type: 'custom',
    tags: {
      'flow.name': flowName,
      'flow.execution_mode': executionMode,
    },
  });

  try {
    const result = await fn(span);
    return result;
  } catch (error) {
    if (span) {
      span.setTag('error', true);
      span.setTag('error.message', error instanceof Error ? error.message : 'Unknown error');
      span.setTag('error.type', error instanceof Error ? error.constructor.name : 'Error');
    }
    throw error;
  } finally {
    if (span) {
      span.finish();
    }
  }
}

/**
 * Trace a step execution within a flow
 */
export async function traceStepExecution<T>(
  stepIndex: number,
  action: string,
  fn: (span: Span | null) => Promise<T>
): Promise<T> {
  const span = startSpan({
    operationName: 'step.execute',
    resource: action,
    type: 'custom',
    tags: {
      'step.index': stepIndex,
      'step.action': action,
    },
  });

  try {
    const result = await fn(span);
    return result;
  } catch (error) {
    if (span) {
      span.setTag('error', true);
      span.setTag('error.message', error instanceof Error ? error.message : 'Unknown error');
    }
    throw error;
  } finally {
    if (span) {
      span.finish();
    }
  }
}

/**
 * Record flow metrics on a span
 */
export function recordFlowMetrics(span: Span | null, metrics: FlowMetrics): void {
  if (!span) return;

  span.addTags({
    'flow.duration_ms': metrics.durationMs,
    'flow.steps_executed': metrics.stepsExecuted,
    'flow.steps_passed': metrics.stepsPassed,
    'flow.steps_failed': metrics.stepsFailed,
    'flow.execution_mode': metrics.executionMode,
    'flow.verdict': metrics.verdict,
    ...(metrics.confidence !== undefined && { 'flow.confidence': metrics.confidence }),
  });
}

/**
 * Record step metrics on a span
 */
export function recordStepMetrics(span: Span | null, metrics: StepMetrics): void {
  if (!span) return;

  span.addTags({
    'step.action': metrics.action,
    'step.duration_ms': metrics.durationMs,
    'step.success': metrics.success,
    ...(metrics.error && { 'step.error': metrics.error }),
  });
}

/**
 * Trace a Browserbase session operation
 */
export async function traceBrowserbaseOperation<T>(
  operation: 'create' | 'connect' | 'terminate' | 'acquire' | 'release',
  sessionId: string | undefined,
  fn: () => Promise<T>
): Promise<T> {
  const span = startSpan({
    operationName: `browserbase.${operation}`,
    resource: operation,
    type: 'custom',
    tags: {
      'browserbase.operation': operation,
      ...(sessionId && { 'browserbase.session_id': sessionId }),
    },
  });

  try {
    const result = await fn();

    // Add session ID if it was created
    if (operation === 'create' && typeof result === 'object' && result !== null && 'id' in result) {
      span?.setTag('browserbase.session_id', (result as { id: string }).id);
    }

    return result;
  } catch (error) {
    if (span) {
      span.setTag('error', true);
      span.setTag('error.message', error instanceof Error ? error.message : 'Unknown error');
    }
    throw error;
  } finally {
    if (span) {
      span.finish();
    }
  }
}

/**
 * Trace a vision analysis operation
 */
export async function traceVisionAnalysis<T>(
  flowName: string,
  fn: (span: Span | null) => Promise<T>
): Promise<T> {
  const span = startSpan({
    operationName: 'vision.analyze',
    resource: flowName,
    type: 'custom',
    tags: {
      'vision.flow_name': flowName,
    },
  });

  try {
    const result = await fn(span);
    return result;
  } catch (error) {
    if (span) {
      span.setTag('error', true);
      span.setTag('error.message', error instanceof Error ? error.message : 'Unknown error');
    }
    throw error;
  } finally {
    if (span) {
      span.finish();
    }
  }
}

/**
 * Shutdown the tracer gracefully
 */
export async function shutdownTracer(): Promise<void> {
  if (tracer) {
    // dd-trace doesn't have an explicit shutdown, but we can flush
    console.log('[Datadog] Tracer shutdown');
  }
  tracer = null;
  initialized = false;
  config = null;
}
