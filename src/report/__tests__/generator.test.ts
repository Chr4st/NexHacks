import { describe, it, expect } from 'vitest';
import { ReportGenerator, generateModernReport } from '../generator.js';
import type { FlowRunResult, CruxMetrics, WoodWideResult } from '../../types.js';

function createMockFlowRun(): FlowRunResult {
  return {
    flowName: 'test-checkout-flow',
    intent: 'User can successfully complete checkout process',
    url: 'https://example.com/checkout',
    viewport: { width: 1920, height: 1080 },
    verdict: 'pass',
    confidence: 92,
    steps: [
      {
        stepIndex: 0,
        action: 'navigate',
        success: true,
        screenshotBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        analysis: {
          status: 'pass',
          confidence: 95,
          reasoning: 'Page loaded successfully',
        },
        durationMs: 1200,
      },
      {
        stepIndex: 1,
        action: 'click',
        success: true,
        screenshotBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        analysis: {
          status: 'pass',
          confidence: 90,
          reasoning: 'Button clicked successfully',
        },
        durationMs: 500,
      },
    ],
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    durationMs: 1700,
  };
}

describe('ReportGenerator', () => {
  it('should generate a complete HTML report', () => {
    const mockFlowRun = createMockFlowRun();
    const generator = new ReportGenerator();
    const html = generator.generateReport({ flowRun: mockFlowRun });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('FlowGuard Report');
    expect(html).toContain(mockFlowRun.flowName);
    expect(html).toContain(mockFlowRun.intent);
  });

  it('should include CrUX metrics when provided', () => {
    const mockFlowRun = createMockFlowRun();
    const cruxMetrics: CruxMetrics = {
      lcp: { p75: 1200, rating: 'good' },
      cls: { p75: 0.05, rating: 'good' },
      inp: { p75: 150, rating: 'good' },
    };

    const html = generateModernReport(mockFlowRun, { cruxMetrics });

    expect(html).toContain('Chrome User Experience');
    expect(html).toContain('LCP');
    expect(html).toContain('CLS');
    expect(html).toContain('INP');
  });

  it('should include Wood Wide insights when provided', () => {
    const mockFlowRun = createMockFlowRun();
    const woodWideInsights: WoodWideResult = {
      significant: true,
      confidence: 0.95,
      interpretation: 'The observed changes are statistically significant with 95% confidence.',
    };

    const html = generateModernReport(mockFlowRun, { woodWideInsights });

    expect(html).toContain('Wood Wide AI');
    expect(html).toContain('Statistical Significance');
  });

  it('should be under 100KB', () => {
    const mockFlowRun = createMockFlowRun();
    const html = generateModernReport(mockFlowRun);

    const sizeKB = Buffer.byteLength(html, 'utf-8') / 1024;
    expect(sizeKB).toBeLessThan(100);
  });

  it('should include all required sections', () => {
    const mockFlowRun = createMockFlowRun();
    const html = generateModernReport(mockFlowRun);

    expect(html).toContain('report-header');
    expect(html).toContain('summary-grid');
    expect(html).toContain('steps-section');
    expect(html).toContain('report-footer');
  });

  it('should handle historical data for trends', () => {
    const mockFlowRun = createMockFlowRun();
    const historicalData: FlowRunResult[] = [
      { ...mockFlowRun, completedAt: new Date(Date.now() - 86400000).toISOString() },
      { ...mockFlowRun, completedAt: new Date(Date.now() - 172800000).toISOString() },
      mockFlowRun,
    ];

    const html = generateModernReport(mockFlowRun, { historicalData });

    expect(html).toContain('trends-section');
    expect(html).toContain('Historical Success Rate Trend');
  });
});

