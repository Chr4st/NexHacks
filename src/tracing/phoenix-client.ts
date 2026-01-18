import axios, { type AxiosInstance } from 'axios';
import { SpanStatusCode } from '@opentelemetry/api';
import crypto from 'crypto';
import type { PhoenixTrace } from './types.js';

/**
 * Phoenix Client for sending traces to Arize Phoenix
 */
export class PhoenixClient {
  private client: AxiosInstance;

  constructor(private endpoint: string) {
    this.client = axios.create({
      baseURL: endpoint,
      headers: {
        'Content-Type': 'application/json'
      },
      // Don't throw on 4xx/5xx to allow graceful degradation
      validateStatus: () => true
    });
  }

  /**
   * Log a trace to Phoenix
   */
  async logTrace(trace: PhoenixTrace): Promise<string> {
    try {
      const payload = {
        resourceSpans: [{
          resource: {
            attributes: [
              { key: 'service.name', value: { stringValue: 'flowguard' } },
              { key: 'project.name', value: { stringValue: trace.project } }
            ]
          },
          scopeSpans: [{
            scope: { name: 'flowguard-tracer', version: '1.0.0' },
            spans: [{
              traceId: this.hexToBase64(trace.traceId),
              spanId: this.hexToBase64(trace.spanId),
              name: trace.name,
              kind: this.mapSpanKind(trace.kind),
              startTimeUnixNano: trace.startTime.getTime() * 1_000_000,
              endTimeUnixNano: trace.endTime.getTime() * 1_000_000,
              attributes: this.convertAttributes(trace.attributes),
              events: trace.events.map(e => ({
                name: e.name,
                timeUnixNano: e.timestamp.getTime() * 1_000_000,
                attributes: this.convertAttributes(e.attributes)
              })),
              status: { code: SpanStatusCode.OK }
            }]
          }]
        }]
      };

      const response = await this.client.post('/v1/traces', payload);

      if (response.status >= 400) {
        console.warn(`Phoenix trace failed with status ${response.status}:`, response.data);
      }

      return trace.traceId;
    } catch (error) {
      // Graceful degradation - log error but don't throw
      console.warn('Failed to send trace to Phoenix:', error);
      return trace.traceId;
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
   * Convert UUID hex to base64 for Phoenix
   */
  private hexToBase64(hex: string): string {
    const cleaned = hex.replace(/-/g, '');
    const buffer = Buffer.from(cleaned, 'hex');
    return buffer.toString('base64');
  }

  /**
   * Map span kind string to OTLP number
   */
  private mapSpanKind(kind: string): number {
    const mapping: Record<string, number> = {
      'LLM': 1,
      'CHAIN': 2,
      'TOOL': 3,
      'RETRIEVER': 4
    };
    return mapping[kind] || 0;
  }

  /**
   * Convert attributes to OTLP format
   */
  private convertAttributes(attrs: Record<string, any>): Array<{ key: string; value: any }> {
    return Object.entries(attrs).map(([key, value]) => ({
      key,
      value: this.convertValue(value)
    }));
  }

  /**
   * Convert value to OTLP format
   */
  private convertValue(value: any): any {
    if (typeof value === 'string') return { stringValue: value };
    if (typeof value === 'number') return { doubleValue: value };
    if (typeof value === 'boolean') return { boolValue: value };
    return { stringValue: JSON.stringify(value) };
  }
}
