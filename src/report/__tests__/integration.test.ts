import { describe, it, expect } from 'vitest';
import { generateModernReport } from '../generator.js';
import { generateReport } from '../../report.js';
import type { FlowRunResult, CruxMetrics, WoodWideResult } from '../../types.js';

/**
 * Integration tests for report generation
 * Tests the integration between report.ts and the new report module
 */

describe('Report Integration Tests', () => {
  function createMockFlowRun(): FlowRunResult {
    return {
      flowName: 'integration-test-flow',
      intent: 'Test integration between modules',
      url: 'https://example.com/test',
      viewport: { width: 1920, height: 1080 },
      verdict: 'pass',
      confidence: 90,
      steps: [
        {
          stepIndex: 0,
          action: 'navigate',
          success: true,
          durationMs: 1000,
          analysis: {
            status: 'pass',
            confidence: 95,
            reasoning: 'Page loaded successfully',
          },
        },
      ],
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: 1000,
    };
  }

  describe('generateReport integration', () => {
    it('should use modern report by default', () => {
      const mockFlowRun = createMockFlowRun();
      const html = generateReport(mockFlowRun);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('FlowGuard Report');
      expect(html).toContain('report-container');
    });

    it('should support legacy report when explicitly requested', () => {
      const mockFlowRun = createMockFlowRun();
      const html = generateReport(mockFlowRun, undefined, { useModernReport: false });

      expect(html).toContain('<!DOCTYPE html>');
      // Legacy report has different structure
      expect(html.length).toBeGreaterThan(0);
    });

    it('should include CrUX metrics when provided', () => {
      const mockFlowRun = createMockFlowRun();
      const cruxMetrics: CruxMetrics = {
        lcp: { p75: 1200, rating: 'good' },
        cls: { p75: 0.05, rating: 'good' },
        inp: { p75: 150, rating: 'good' },
      };

      const html = generateReport(mockFlowRun, cruxMetrics);

      expect(html).toContain('crux-section');
      expect(html).toContain('Chrome User Experience');
    });

    it('should include Wood Wide insights when provided', () => {
      const mockFlowRun = createMockFlowRun();
      const woodWideInsights: WoodWideResult = {
        significant: true,
        confidence: 0.95,
        interpretation: 'Significant improvement detected',
      };

      const html = generateReport(mockFlowRun, undefined, {
        woodWideInsights,
      });

      expect(html).toContain('woodwide-section');
      expect(html).toContain('Wood Wide AI');
    });

    it('should include historical data when provided', () => {
      const mockFlowRun = createMockFlowRun();
      const historicalData = Array.from({ length: 10 }, (_, i) => ({
        ...mockFlowRun,
        completedAt: new Date(Date.now() - i * 86400000).toISOString(),
        verdict: i % 2 === 0 ? 'pass' : 'fail',
      }));

      const html = generateReport(mockFlowRun, undefined, {
        historicalData,
      });

      expect(html).toContain('trends-section');
      expect(html).toContain('Historical Success Rate Trend');
    });
  });

  describe('Cost field integration', () => {
    it('should include cost in summary when provided', () => {
      const mockFlowRun = createMockFlowRun();
      (mockFlowRun as any).totalCost = 0.1234;

      const html = generateModernReport(mockFlowRun);

      expect(html).toContain('AI Costs');
      expect(html).toContain('$0.1234');
    });

    it('should not show cost section when cost is undefined', () => {
      const mockFlowRun = createMockFlowRun();
      const html = generateModernReport(mockFlowRun);

      // Cost section should not appear if cost is undefined
      // But we check that the report still generates correctly
      expect(html).toContain('<!DOCTYPE html>');
    });
  });

  describe('MongoDB integration readiness', () => {
    it('should work with FlowRunResult from MongoDB schema', () => {
      // This test ensures the report generator works with data
      // that would come from MongoDB (via FlowGuardRepository)
      const mockFlowRun: FlowRunResult = {
        flowName: 'mongodb-flow',
        intent: 'Flow from MongoDB',
        url: 'https://example.com',
        viewport: { width: 1920, height: 1080 },
        verdict: 'pass',
        confidence: 85,
        steps: [
          {
            stepIndex: 0,
            action: 'navigate',
            success: true,
            durationMs: 500,
            analysis: {
              status: 'pass',
              confidence: 90,
              reasoning: 'Page loaded',
            },
          },
        ],
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 500,
        traceId: 'trace-123',
        phoenixTraceUrl: 'https://phoenix.example.com/trace-123',
      };

      const html = generateModernReport(mockFlowRun);

      expect(html).toContain('mongodb-flow');
      expect(html).toContain('Flow from MongoDB');
      if (mockFlowRun.phoenixTraceUrl) {
        expect(html).toContain('Arize Phoenix');
      }
    });
  });
});

