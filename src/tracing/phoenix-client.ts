import { trace } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NodeTracerProvider, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import crypto from 'crypto';
import type { PhoenixTrace } from './types.js';

/**
 * Phoenix Client for sending traces to Arize Phoenix using OpenTelemetry
 */
export class PhoenixClient {
  private provider: NodeTracerProvider;
  private tracer: any;

  constructor(endpoint: string) {
    // Create OTLP protobuf exporter pointing to Phoenix
    const exporter = new OTLPTraceExporter({
      url: `${endpoint}/v1/traces`
    });

    // Create tracer provider
    this.provider = new NodeTracerProvider();

    // Add exporter to provider
    this.provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
    this.provider.register();

    this.tracer = trace.getTracer('flowguard-phoenix', '1.0.0');
  }

  /**
   * Log a trace to Phoenix using OpenTelemetry
   */
  async logTrace(phoenixTrace: PhoenixTrace): Promise<string> {
    try {
      const span = this.tracer.startSpan(phoenixTrace.name, {
        startTime: phoenixTrace.startTime
      });

      // Set attributes
      Object.entries(phoenixTrace.attributes).forEach(([key, value]) => {
        span.setAttribute(key, value);
      });

      // Set project name
      span.setAttribute('project.name', phoenixTrace.project);

      // Add events
      phoenixTrace.events.forEach(event => {
        span.addEvent(event.name, event.attributes, event.timestamp);
      });

      // End span at the specified end time
      span.end(phoenixTrace.endTime);

      // Force flush to ensure trace is sent
      await this.provider.forceFlush();

      return phoenixTrace.traceId;
    } catch (error) {
      // Graceful degradation - log error but don't throw
      console.warn('Failed to send trace to Phoenix:', error);
      return phoenixTrace.traceId;
    }
  }

  /**
   * Log experiment results to Phoenix
   */
  async logExperiment(result: any): Promise<void> {
    try {
      const traceId = crypto.randomUUID();

      await this.logTrace({
        traceId,
        spanId: crypto.randomUUID(),
        name: `experiment_${result.experimentId}`,
        kind: 'CHAIN',
        startTime: result.runAt,
        endTime: result.runAt,
        attributes: {
          'experiment.id': result.experimentId,
          'experiment.control.accuracy': result.control.accuracy,
          'experiment.variant.accuracy': result.variant.accuracy,
          'experiment.winner': result.winner,
          'experiment.p_value': result.statisticalSignificance.pValue
        },
        events: [],
        project: 'flowguard-experiments'
      });
    } catch (error) {
      console.warn('Failed to log experiment to Phoenix:', error);
    }
  }

  /**
   * Shutdown the provider
   */
  async shutdown(): Promise<void> {
    await this.provider.shutdown();
  }
}
