import { trace, SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { NodeTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import type { FlowRunResult, StepResult, AnalysisResult } from './types.js';

const TRACER_NAME = 'flowguard.core';

let provider: NodeTracerProvider | null = null;
let isInitialized = false;

/**
 * Initialize OpenTelemetry tracing for Arize Phoenix.
 *
 * @param phoenixEndpoint - Phoenix OTLP endpoint (default: http://localhost:6006/v1/traces)
 */
export function initTracing(phoenixEndpoint?: string): void {
  if (isInitialized) {
    return;
  }

  const endpoint = phoenixEndpoint ?? process.env.PHOENIX_ENDPOINT;
  const localTesting = process.env.LOCAL_TESTING === 'true';

  // Skip tracing if Phoenix is disabled or endpoint not provided
  if (!endpoint || localTesting) {
    console.log('[FlowGuard] Tracing disabled (Phoenix endpoint not configured or local testing mode)');
    isInitialized = true; // Mark as initialized to prevent retries
    return;
  }

  try {
    provider = new NodeTracerProvider();

    const exporter = new OTLPTraceExporter({
      url: endpoint,
      headers: {},
    });

    provider.addSpanProcessor(new BatchSpanProcessor(exporter));
    provider.register();

    isInitialized = true;
    console.log(`[FlowGuard] Tracing initialized, sending to ${endpoint}`);
  } catch (error) {
    console.warn(`[FlowGuard] Failed to initialize tracing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    isInitialized = true; // Mark as initialized to prevent retries
  }
}

/**
 * Shutdown tracing and flush any pending spans.
 */
export async function shutdownTracing(): Promise<void> {
  if (provider) {
    await provider.shutdown();
    provider = null;
    isInitialized = false;
  }
}

/**
 * Get the tracer instance.
 */
function getTracer() {
  return trace.getTracer(TRACER_NAME);
}

/**
 * Trace a flow run with all its steps.
 *
 * @param flowName - Name of the flow
 * @param fn - Function that executes the flow
 * @returns Flow result with trace ID
 */
export async function traceFlowRun<T extends FlowRunResult>(
  flowName: string,
  intent: string,
  fn: () => Promise<T>
): Promise<T> {
  const tracer = getTracer();

  return tracer.startActiveSpan(
    `flow.run.${flowName}`,
    {
      kind: SpanKind.INTERNAL,
      attributes: {
        'flowguard.flow_name': flowName,
        'flowguard.intent': intent,
        'openinference.span.kind': 'CHAIN',
      },
    },
    async (span) => {
      try {
        const result = await fn();

        // Add result attributes
        span.setAttributes({
          'flowguard.verdict': result.verdict,
          'flowguard.confidence': result.confidence,
          'flowguard.duration_ms': result.durationMs,
          'flowguard.step_count': result.steps.length,
        });

        // Set status based on verdict
        if (result.verdict === 'error') {
          span.setStatus({ code: SpanStatusCode.ERROR, message: 'Flow execution error' });
        } else {
          span.setStatus({ code: SpanStatusCode.OK });
        }

        // Add trace ID to result
        const traceId = span.spanContext().traceId;
        result.traceId = traceId;
        result.phoenixTraceUrl = `http://localhost:6006/tracing/traces/${traceId}`;

        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      } finally {
        span.end();
      }
    }
  );
}

/**
 * Trace a step execution.
 *
 * @param stepIndex - Index of the step
 * @param action - Step action type
 * @param fn - Function that executes the step
 * @returns Step result
 */
export async function traceStep<T extends StepResult>(
  stepIndex: number,
  action: string,
  fn: () => Promise<T>
): Promise<T> {
  const tracer = getTracer();

  return tracer.startActiveSpan(
    `step.${action}`,
    {
      kind: SpanKind.INTERNAL,
      attributes: {
        'flowguard.step_index': stepIndex,
        'flowguard.step_action': action,
        'openinference.span.kind': 'TOOL',
      },
    },
    async (span) => {
      try {
        const result = await fn();

        span.setAttributes({
          'flowguard.step_success': result.success,
          'flowguard.step_duration_ms': result.durationMs,
        });

        if (result.screenshotPath) {
          span.setAttribute('flowguard.screenshot_path', result.screenshotPath);
        }

        if (!result.success) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: result.error ?? 'Step failed',
          });
        } else {
          span.setStatus({ code: SpanStatusCode.OK });
        }

        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      } finally {
        span.end();
      }
    }
  );
}

/**
 * Trace a vision analysis call.
 *
 * @param intent - User intent being analyzed
 * @param fn - Function that performs the analysis
 * @returns Analysis result
 */
export async function traceVisionAnalysis<T extends AnalysisResult>(
  intent: string,
  promptTokens: number,
  fn: () => Promise<T>
): Promise<T> {
  const tracer = getTracer();

  return tracer.startActiveSpan(
    'vision.analyze',
    {
      kind: SpanKind.CLIENT,
      attributes: {
        'openinference.span.kind': 'LLM',
        'llm.model_name': 'claude-3-5-sonnet-20241022',
        'llm.provider': 'anthropic',
        'flowguard.intent': intent,
        'llm.token_count.prompt': promptTokens,
      },
    },
    async (span) => {
      const startTime = Date.now();

      try {
        const result = await fn();

        const latencyMs = Date.now() - startTime;

        span.setAttributes({
          'flowguard.analysis_status': result.status,
          'flowguard.latency_ms': latencyMs,
        });

        if (result.status === 'pass' || result.status === 'fail') {
          span.setAttributes({
            'flowguard.confidence': result.confidence,
            'flowguard.reasoning': result.reasoning,
          });
        }

        if (result.status === 'fail') {
          span.setAttribute('flowguard.issues_count', result.issues.length);
        }

        if (result.status === 'error') {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: result.error,
          });
        } else {
          span.setStatus({ code: SpanStatusCode.OK });
        }

        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      } finally {
        span.end();
      }
    }
  );
}

/**
 * Check if tracing is currently initialized.
 */
export function isTracingEnabled(): boolean {
  return isInitialized;
}
