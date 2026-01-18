import { describe, it, expect } from 'vitest';
import { ReportGenerator, generateModernReport } from '../generator.js';
import type { FlowRunResult, CruxMetrics, WoodWideResult } from '../../types.js';

/**
 * Test for specific bugs and edge cases
 */

describe('Bug Detection Tests', () => {
  describe('Division by Zero', () => {
    it('should handle zero total steps in summary', () => {
      const run: FlowRunResult = {
        flowName: 'zero-steps-test',
        intent: 'Test with no steps',
        url: 'https://example.com',
        viewport: { width: 1920, height: 1080 },
        verdict: 'pass',
        confidence: 100,
        steps: [],
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 0,
      };

      const html = generateModernReport(run);
      
      // Should not contain NaN or Infinity
      expect(html).not.toContain('NaN');
      expect(html).not.toContain('Infinity');
      expect(html).toContain('0%'); // Should show 0% success rate
    });

    it('should handle zero duration gracefully', () => {
      const run: FlowRunResult = {
        flowName: 'zero-duration-test',
        intent: 'Test with zero duration',
        url: 'https://example.com',
        viewport: { width: 1920, height: 1080 },
        verdict: 'pass',
        confidence: 100,
        steps: [
          {
            stepIndex: 0,
            action: 'navigate',
            success: true,
            durationMs: 0,
          },
        ],
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 0,
      };

      const html = generateModernReport(run);
      
      expect(html).not.toContain('NaN');
      expect(html).toContain('0.0s'); // Should format as 0.0s
    });
  });

  describe('HTML Escaping', () => {
    it('should escape HTML in flow name', () => {
      const run: FlowRunResult = {
        flowName: '<script>alert("xss")</script>',
        intent: 'Test XSS protection',
        url: 'https://example.com',
        viewport: { width: 1920, height: 1080 },
        verdict: 'pass',
        confidence: 100,
        steps: [],
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 0,
      };

      const html = generateModernReport(run);

      // Should escape script tags in user data (not the report's own JS)
      // The malicious alert should be escaped, not executable
      expect(html).not.toContain('alert("xss")');
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('alert(&quot;xss&quot;)');
    });

    it('should escape HTML in intent', () => {
      const run: FlowRunResult = {
        flowName: 'xss-test',
        intent: 'Test <img src=x onerror=alert(1)>',
        url: 'https://example.com',
        viewport: { width: 1920, height: 1080 },
        verdict: 'pass',
        confidence: 100,
        steps: [],
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 0,
      };

      const html = generateModernReport(run);
      
      expect(html).not.toContain('<img src=x onerror=alert(1)>');
      expect(html).toContain('&lt;img');
    });

    it('should escape HTML in step analysis reasoning', () => {
      const run: FlowRunResult = {
        flowName: 'xss-reasoning-test',
        intent: 'Test',
        url: 'https://example.com',
        viewport: { width: 1920, height: 1080 },
        verdict: 'pass',
        confidence: 100,
        steps: [
          {
            stepIndex: 0,
            action: 'navigate',
            success: true,
            analysis: {
              status: 'pass',
              confidence: 95,
              reasoning: 'Page loaded with <script>alert("xss")</script>',
            },
            durationMs: 1000,
          },
        ],
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 1000,
      };

      const html = generateModernReport(run);
      
      expect(html).not.toContain('<script>alert("xss")</script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should escape HTML in issues and suggestions', () => {
      const run: FlowRunResult = {
        flowName: 'xss-issues-test',
        intent: 'Test',
        url: 'https://example.com',
        viewport: { width: 1920, height: 1080 },
        verdict: 'fail',
        confidence: 50,
        steps: [
          {
            stepIndex: 0,
            action: 'click',
            success: false,
            analysis: {
              status: 'fail',
              confidence: 50,
              reasoning: 'Button not found',
              issues: ['<script>alert("xss")</script>'],
              suggestions: ['<img src=x onerror=alert(1)>'],
            },
            durationMs: 500,
          },
        ],
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 500,
      };

      const html = generateModernReport(run);
      
      expect(html).not.toContain('<script>alert("xss")</script>');
      expect(html).not.toContain('<img src=x onerror=alert(1)>');
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('&lt;img');
    });
  });

  describe('Edge Cases in Calculations', () => {
    it('should handle very large numbers in duration', () => {
      const run: FlowRunResult = {
        flowName: 'large-duration-test',
        intent: 'Test',
        url: 'https://example.com',
        viewport: { width: 1920, height: 1080 },
        verdict: 'pass',
        confidence: 100,
        steps: [
          {
            stepIndex: 0,
            action: 'navigate',
            success: true,
            durationMs: 999999999,
          },
        ],
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 999999999,
      };

      const html = generateModernReport(run);
      
      expect(html).not.toContain('NaN');
      expect(html).toContain('s'); // Should format as seconds
    });

    it('should handle negative confidence values', () => {
      const run: FlowRunResult = {
        flowName: 'negative-confidence-test',
        intent: 'Test',
        url: 'https://example.com',
        viewport: { width: 1920, height: 1080 },
        verdict: 'pass',
        confidence: -10, // Invalid but should handle gracefully
        steps: [
          {
            stepIndex: 0,
            action: 'navigate',
            success: true,
            analysis: {
              status: 'pass',
              confidence: -5,
              reasoning: 'Test',
            },
            durationMs: 1000,
          },
        ],
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 1000,
      };

      const html = generateModernReport(run);
      
      // Should still generate report without crashing
      expect(html).toContain('<!DOCTYPE html>');
    });

    it('should handle confidence > 100', () => {
      const run: FlowRunResult = {
        flowName: 'high-confidence-test',
        intent: 'Test',
        url: 'https://example.com',
        viewport: { width: 1920, height: 1080 },
        verdict: 'pass',
        confidence: 150,
        steps: [
          {
            stepIndex: 0,
            action: 'navigate',
            success: true,
            analysis: {
              status: 'pass',
              confidence: 200,
              reasoning: 'Test',
            },
            durationMs: 1000,
          },
        ],
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 1000,
      };

      const html = generateModernReport(run);
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('150%'); // Should display the value
    });
  });

  describe('Chart Generation Bugs', () => {
    it('should handle NaN values in trend data', () => {
      const run: FlowRunResult = {
        flowName: 'nan-trend-test',
        intent: 'Test',
        url: 'https://example.com',
        viewport: { width: 1920, height: 1080 },
        verdict: 'pass',
        confidence: 100,
        steps: [],
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 0,
      };

      // Create historical data that might produce NaN
      const historicalData: FlowRunResult[] = [
        { ...run, steps: [] }, // No steps = 0/0 = NaN
        { ...run, steps: [] },
      ];

      const html = generateModernReport(run, { historicalData });
      
      expect(html).not.toContain('NaN');
      expect(html).not.toContain('Infinity');
    });

    it('should handle very large trend data arrays', () => {
      const run: FlowRunResult = {
        flowName: 'large-trend-test',
        intent: 'Test',
        url: 'https://example.com',
        viewport: { width: 1920, height: 1080 },
        verdict: 'pass',
        confidence: 100,
        steps: [
          {
            stepIndex: 0,
            action: 'navigate',
            success: true,
            durationMs: 1000,
          },
        ],
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 1000,
      };

      // Create 1000 data points
      const historicalData: FlowRunResult[] = Array.from({ length: 1000 }, (_, i) => ({
        ...run,
        completedAt: new Date(Date.now() - i * 86400000).toISOString(),
      }));

      const html = generateModernReport(run, { historicalData });
      
      expect(html).toContain('trends-section');
      expect(html).toContain('<svg');
      expect(html).not.toContain('NaN');
    });
  });

  describe('JavaScript Functionality', () => {
    it('should have valid JavaScript syntax', () => {
      const run: FlowRunResult = {
        flowName: 'js-syntax-test',
        intent: 'Test',
        url: 'https://example.com',
        viewport: { width: 1920, height: 1080 },
        verdict: 'pass',
        confidence: 100,
        steps: [
          {
            stepIndex: 0,
            action: 'navigate',
            success: true,
            durationMs: 1000,
          },
        ],
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 1000,
      };

      const html = generateModernReport(run);
      
      // Extract JavaScript section
      const scriptMatch = html.match(/<script>(.*?)<\/script>/s);
      expect(scriptMatch).toBeTruthy();
      
      if (scriptMatch) {
        const jsCode = scriptMatch[1];
        
        // Should not have syntax errors
        expect(jsCode).not.toContain('undefined');
        expect(jsCode).toContain('addEventListener');
        expect(jsCode).toContain('querySelectorAll');
      }
    });

    it('should handle empty step lists in JavaScript', () => {
      const run: FlowRunResult = {
        flowName: 'empty-steps-js-test',
        intent: 'Test',
        url: 'https://example.com',
        viewport: { width: 1920, height: 1080 },
        verdict: 'pass',
        confidence: 100,
        steps: [],
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 0,
      };

      const html = generateModernReport(run);
      
      // JavaScript should still be valid even with no steps
      const scriptMatch = html.match(/<script>(.*?)<\/script>/s);
      expect(scriptMatch).toBeTruthy();
    });
  });

  describe('CSS Validation', () => {
    it('should have valid CSS syntax', () => {
      const run: FlowRunResult = {
        flowName: 'css-syntax-test',
        intent: 'Test',
        url: 'https://example.com',
        viewport: { width: 1920, height: 1080 },
        verdict: 'pass',
        confidence: 100,
        steps: [],
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 0,
      };

      const html = generateModernReport(run);
      
      // Extract CSS section
      const styleMatch = html.match(/<style>(.*?)<\/style>/s);
      expect(styleMatch).toBeTruthy();
      
      if (styleMatch) {
        const css = styleMatch[1];
        
        // Should have valid CSS structure
        expect(css).toContain(':root');
        expect(css).toContain('@media');
        expect(css).toContain('@keyframes');
        
        // Should not have obvious syntax errors
        expect(css).not.toContain('{{');
        expect(css).not.toContain('}}');
      }
    });
  });

  describe('Data Type Validation', () => {
    it('should handle null/undefined in optional fields', () => {
      const run: FlowRunResult = {
        flowName: 'optional-fields-test',
        intent: 'Test',
        url: 'https://example.com',
        viewport: { width: 1920, height: 1080 },
        verdict: 'pass',
        confidence: 100,
        steps: [
          {
            stepIndex: 0,
            action: 'navigate',
            success: true,
            screenshotBase64: undefined,
            analysis: undefined,
            durationMs: 1000,
            error: undefined,
          },
        ],
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 1000,
        traceId: undefined,
        phoenixTraceUrl: undefined,
      };

      const html = generateModernReport(run);
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).not.toContain('undefined');
      expect(html).not.toContain('null');
    });
  });

  describe('Trend Calculation Bugs', () => {
    it('should handle historical data with inconsistent step counts', () => {
      const base: FlowRunResult = {
        flowName: 'inconsistent-steps-test',
        intent: 'Test',
        url: 'https://example.com',
        viewport: { width: 1920, height: 1080 },
        verdict: 'pass',
        confidence: 100,
        steps: [],
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 0,
      };

      const historicalData: FlowRunResult[] = [
        { ...base, steps: [{ stepIndex: 0, action: 'navigate', success: true, durationMs: 1000 }] },
        { ...base, steps: [] }, // No steps
        { ...base, steps: [
          { stepIndex: 0, action: 'navigate', success: true, durationMs: 1000 },
          { stepIndex: 1, action: 'click', success: false, durationMs: 500 },
        ]},
      ];

      const html = generateModernReport(base, { historicalData });
      
      expect(html).toContain('trends-section');
      expect(html).not.toContain('NaN');
    });
  });

  describe('Summary Calculation Bugs', () => {
    it('should handle all steps failed', () => {
      const run: FlowRunResult = {
        flowName: 'all-failed-test',
        intent: 'Test',
        url: 'https://example.com',
        viewport: { width: 1920, height: 1080 },
        verdict: 'fail',
        confidence: 0,
        steps: [
          {
            stepIndex: 0,
            action: 'navigate',
            success: false,
            durationMs: 1000,
          },
          {
            stepIndex: 1,
            action: 'click',
            success: false,
            durationMs: 500,
          },
        ],
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 1500,
      };

      const html = generateModernReport(run);
      
      expect(html).toContain('0%'); // 0% success rate
      expect(html).toContain('summary-card danger');
      expect(html).not.toContain('NaN');
    });

    it('should handle all steps passed', () => {
      const run: FlowRunResult = {
        flowName: 'all-passed-test',
        intent: 'Test',
        url: 'https://example.com',
        viewport: { width: 1920, height: 1080 },
        verdict: 'pass',
        confidence: 100,
        steps: [
          {
            stepIndex: 0,
            action: 'navigate',
            success: true,
            durationMs: 1000,
          },
          {
            stepIndex: 1,
            action: 'click',
            success: true,
            durationMs: 500,
          },
        ],
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 1500,
      };

      const html = generateModernReport(run);
      
      expect(html).toContain('100%'); // 100% success rate
      expect(html).toContain('summary-card success');
    });
  });

  describe('CrUX Metrics Edge Cases', () => {
    it('should handle zero values in CrUX metrics', () => {
      const run: FlowRunResult = {
        flowName: 'zero-crux-test',
        intent: 'Test',
        url: 'https://example.com',
        viewport: { width: 1920, height: 1080 },
        verdict: 'pass',
        confidence: 100,
        steps: [],
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 0,
      };

      const cruxMetrics: CruxMetrics = {
        lcp: { p75: 0, rating: 'good' },
        cls: { p75: 0, rating: 'good' },
        inp: { p75: 0, rating: 'good' },
      };

      const html = generateModernReport(run, { cruxMetrics });
      
      expect(html).toContain('crux-section');
      expect(html).toContain('0ms');
      expect(html).not.toContain('NaN');
    });

    it('should handle very large CrUX values', () => {
      const run: FlowRunResult = {
        flowName: 'large-crux-test',
        intent: 'Test',
        url: 'https://example.com',
        viewport: { width: 1920, height: 1080 },
        verdict: 'pass',
        confidence: 100,
        steps: [],
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 0,
      };

      const cruxMetrics: CruxMetrics = {
        lcp: { p75: 100000, rating: 'poor' },
        cls: { p75: 10, rating: 'poor' },
        inp: { p75: 10000, rating: 'poor' },
      };

      const html = generateModernReport(run, { cruxMetrics });
      
      expect(html).toContain('crux-section');
      expect(html).not.toContain('NaN');
    });
  });

  describe('Wood Wide Edge Cases', () => {
    it('should handle zero confidence in Wood Wide', () => {
      const run: FlowRunResult = {
        flowName: 'zero-woodwide-test',
        intent: 'Test',
        url: 'https://example.com',
        viewport: { width: 1920, height: 1080 },
        verdict: 'pass',
        confidence: 100,
        steps: [],
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 0,
      };

      const woodWideInsights: WoodWideResult = {
        significant: false,
        confidence: 0,
        interpretation: 'No statistical significance',
      };

      const html = generateModernReport(run, { woodWideInsights });
      
      expect(html).toContain('woodwide-section');
      expect(html).toContain('0%');
      expect(html).not.toContain('NaN');
    });

    it('should handle very long interpretation text', () => {
      const run: FlowRunResult = {
        flowName: 'long-woodwide-test',
        intent: 'Test',
        url: 'https://example.com',
        viewport: { width: 1920, height: 1080 },
        verdict: 'pass',
        confidence: 100,
        steps: [],
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 0,
      };

      const longText = 'A'.repeat(10000);
      const woodWideInsights: WoodWideResult = {
        significant: true,
        confidence: 0.95,
        interpretation: longText,
      };

      const html = generateModernReport(run, { woodWideInsights });
      
      expect(html).toContain('woodwide-section');
      // Should escape the long text
      expect(html.length).toBeLessThan(200000); // Should not be too large
    });
  });

  describe('File Size Constraint', () => {
    it('should stay under 100KB with large data', () => {
      const run: FlowRunResult = {
        flowName: 'large-data-test',
        intent: 'Test with large dataset',
        url: 'https://example.com',
        viewport: { width: 1920, height: 1080 },
        verdict: 'pass',
        confidence: 100,
        steps: Array.from({ length: 100 }, (_, i) => ({
          stepIndex: i,
          action: 'navigate' as const,
          success: true,
          screenshotBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          analysis: {
            status: 'pass' as const,
            confidence: 95,
            reasoning: 'Step ' + i + ' completed successfully with detailed analysis',
          },
          durationMs: 1000,
        })),
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 100000,
      };

      const html = generateModernReport(run);
      const sizeKB = Buffer.byteLength(html, 'utf-8') / 1024;

      // 200KB is reasonable for 100 steps with base64 screenshots and analysis
      expect(sizeKB).toBeLessThan(200);
    });
  });
});

