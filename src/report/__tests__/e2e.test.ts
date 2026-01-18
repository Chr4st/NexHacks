import { describe, it, expect } from 'vitest';
import { ReportGenerator, generateModernReport } from '../generator.js';
import type { FlowRunResult, CruxMetrics, WoodWideResult } from '../../types.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Create a comprehensive mock flow run with all features
 */
function createComprehensiveMockFlowRun(): FlowRunResult {
  return {
    flowName: 'checkout-flow-mobile',
    intent: 'User can successfully complete checkout process on mobile device',
    url: 'https://example.com/checkout',
    viewport: { width: 375, height: 667 },
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
          reasoning: 'Page loaded successfully, checkout form is visible and accessible',
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
          reasoning: 'Add to cart button is clearly visible and clickable',
        },
        durationMs: 500,
      },
      {
        stepIndex: 2,
        action: 'screenshot',
        success: false,
        screenshotBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        analysis: {
          status: 'fail',
          confidence: 75,
          reasoning: 'Checkout button is partially obscured by mobile navigation',
          issues: [
            'Button is too close to bottom navigation bar',
            'Text contrast is below WCAG AA standard',
          ],
          suggestions: [
            'Increase bottom padding to 48px',
            'Improve text contrast ratio to at least 4.5:1',
          ],
        },
        durationMs: 300,
      },
      {
        stepIndex: 3,
        action: 'type',
        success: true,
        screenshotBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        analysis: {
          status: 'pass',
          confidence: 88,
          reasoning: 'Form fields are accessible and keyboard navigation works',
        },
        durationMs: 800,
      },
    ],
    startedAt: new Date(Date.now() - 5000).toISOString(),
    completedAt: new Date().toISOString(),
    durationMs: 2800,
    traceId: 'trace-12345',
    phoenixTraceUrl: 'https://phoenix.example.com/traces/trace-12345',
  };
}

/**
 * Create historical data for trend testing
 */
function createHistoricalData(): FlowRunResult[] {
  const base = createComprehensiveMockFlowRun();
  const history: FlowRunResult[] = [];
  
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    history.push({
      ...base,
      flowName: base.flowName,
      completedAt: date.toISOString(),
      verdict: i % 5 === 0 ? 'fail' : 'pass', // 20% failure rate
      confidence: 85 + Math.random() * 10,
      durationMs: 2500 + Math.random() * 1000,
    });
  }
  
  return history.reverse(); // Oldest first
}

describe('Report Generator E2E Tests', () => {
  const outputDir = path.join(__dirname, '../../../../tmp/reports');
  
  beforeAll(async () => {
    // Create output directory
    await fs.mkdir(outputDir, { recursive: true });
  });

  describe('Basic Report Generation', () => {
    it('should generate a valid HTML document', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const html = generateModernReport(mockFlowRun);

      // Check HTML structure
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('</html>');
      expect(html).toContain('<head>');
      expect(html).toContain('<body');
      expect(html).toContain('</body>');
    });

    it('should include all required meta tags', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const html = generateModernReport(mockFlowRun);

      expect(html).toContain('<meta charset="UTF-8">');
      expect(html).toContain('<meta name="viewport"');
      expect(html).toContain('<meta name="description"');
      expect(html).toContain('<title>');
    });

    it('should have embedded CSS (no external stylesheets)', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const html = generateModernReport(mockFlowRun);

      expect(html).toContain('<style>');
      expect(html).not.toContain('<link rel="stylesheet"');
      expect(html).not.toMatch(/href=["']https?:\/\//);
    });

    it('should have embedded JavaScript (no external scripts)', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const html = generateModernReport(mockFlowRun);

      expect(html).toContain('<script>');
      expect(html).not.toContain('<script src="http');
      expect(html).not.toMatch(/src=["']https?:\/\//);
    });

    it('should be under 100KB file size', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const html = generateModernReport(mockFlowRun);

      const sizeKB = Buffer.byteLength(html, 'utf-8') / 1024;
      expect(sizeKB).toBeLessThan(100);
      console.log(`Report size: ${sizeKB.toFixed(2)} KB`);
    });
  });

  describe('Report Sections', () => {
    it('should include header section with flow name and metadata', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const html = generateModernReport(mockFlowRun);

      expect(html).toContain('report-header');
      expect(html).toContain(mockFlowRun.flowName);
      expect(html).toContain(mockFlowRun.intent);
      expect(html).toContain('report-title');
      expect(html).toContain('report-subtitle');
      expect(html).toContain('report-meta');
    });

    it('should include summary cards with metrics', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const html = generateModernReport(mockFlowRun);

      expect(html).toContain('summary-grid');
      expect(html).toContain('summary-card');
      expect(html).toContain('summary-card-value');
      expect(html).toContain('summary-card-label');
    });

    it('should include step-by-step results section', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const html = generateModernReport(mockFlowRun);

      expect(html).toContain('steps-section');
      expect(html).toContain('step-item');
      expect(html).toContain('step-header');
      expect(html).toContain('step-details');
      expect(html).toContain('steps-filter');
      expect(html).toContain('filter-btn');
    });

    it('should include footer with metadata', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const html = generateModernReport(mockFlowRun);

      expect(html).toContain('report-footer');
      expect(html).toContain('FlowGuard AI');
      if (mockFlowRun.phoenixTraceUrl) {
        expect(html).toContain('Arize Phoenix');
      }
    });
  });

  describe('Step Rendering', () => {
    it('should render all steps with correct status classes', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const html = generateModernReport(mockFlowRun);

      // Count step items
      const stepItemMatches = html.match(/step-item/g);
      expect(stepItemMatches?.length).toBe(mockFlowRun.steps.length);

      // Check for passed/failed classes
      expect(html).toContain('step-item passed');
      expect(html).toContain('step-item failed');
    });

    it('should include screenshots when available', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const html = generateModernReport(mockFlowRun);

      expect(html).toContain('step-screenshot');
      expect(html).toContain('data:image/png;base64,');
      expect(html).toContain('<img');
    });

    it('should render analysis reasoning for each step', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const html = generateModernReport(mockFlowRun);

      expect(html).toContain('step-reasoning');
      mockFlowRun.steps.forEach(step => {
        if (step.analysis && step.analysis.status !== 'error') {
          expect(html).toContain(step.analysis.reasoning);
        }
      });
    });

    it('should render issues and suggestions for failed steps', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const html = generateModernReport(mockFlowRun);

      const failedStep = mockFlowRun.steps.find(s => !s.success);
      if (failedStep && failedStep.analysis && failedStep.analysis.status === 'fail') {
        expect(html).toContain('issues');
        failedStep.analysis.issues.forEach(issue => {
          expect(html).toContain(issue);
        });
        failedStep.analysis.suggestions.forEach(suggestion => {
          expect(html).toContain(suggestion);
        });
      }
    });

    it('should expand failed steps by default', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const html = generateModernReport(mockFlowRun);

      const failedStepIndex = mockFlowRun.steps.findIndex(s => !s.success);
      if (failedStepIndex >= 0) {
        // Check JavaScript includes expansion logic
        expect(html).toContain('step-item.failed .step-details');
        expect(html).toContain('classList.add(\'expanded\')');
      }
    });
  });

  describe('Interactive Features', () => {
    it('should include filter buttons (all, passed, failed)', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const html = generateModernReport(mockFlowRun);

      expect(html).toContain('data-filter="all"');
      expect(html).toContain('data-filter="passed"');
      expect(html).toContain('data-filter="failed"');
      expect(html).toContain('filter-btn');
    });

    it('should include JavaScript for step expansion', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const html = generateModernReport(mockFlowRun);

      expect(html).toContain('step-header');
      expect(html).toContain('addEventListener');
      expect(html).toContain('classList.contains');
      expect(html).toContain('classList.add');
      expect(html).toContain('classList.remove');
    });

    it('should include JavaScript for filtering', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const html = generateModernReport(mockFlowRun);

      expect(html).toContain('filter-btn');
      expect(html).toContain('dataset.filter');
      expect(html).toContain('style.display');
    });
  });

  describe('CrUX Metrics Integration', () => {
    it('should render CrUX metrics section when provided', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const cruxMetrics: CruxMetrics = {
        lcp: { p75: 1200, rating: 'good' },
        cls: { p75: 0.05, rating: 'good' },
        inp: { p75: 150, rating: 'good' },
      };

      const html = generateModernReport(mockFlowRun, { cruxMetrics });

      expect(html).toContain('crux-section');
      expect(html).toContain('Chrome User Experience');
      expect(html).toContain('LCP');
      expect(html).toContain('CLS');
      expect(html).toContain('INP');
      expect(html).toContain('1200');
      expect(html).toContain('0.05');
      expect(html).toContain('150');
    });

    it('should apply correct rating classes for CrUX metrics', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const cruxMetrics: CruxMetrics = {
        lcp: { p75: 2500, rating: 'poor' },
        cls: { p75: 0.25, rating: 'needs-improvement' },
        inp: { p75: 500, rating: 'poor' },
      };

      const html = generateModernReport(mockFlowRun, { cruxMetrics });

      expect(html).toContain('crux-metric-value poor');
      expect(html).toContain('crux-metric-value needs-improvement');
      expect(html).toContain('crux-metric-rating poor');
      expect(html).toContain('crux-metric-rating needs-improvement');
    });
  });

  describe('Wood Wide AI Integration', () => {
    it('should render Wood Wide insights section when provided', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const woodWideInsights: WoodWideResult = {
        significant: true,
        confidence: 0.95,
        interpretation: 'The observed changes are statistically significant with 95% confidence. This improvement is likely due to better mobile button visibility.',
      };

      const html = generateModernReport(mockFlowRun, { woodWideInsights });

      expect(html).toContain('woodwide-section');
      expect(html).toContain('Wood Wide AI');
      expect(html).toContain('Statistical Significance');
      expect(html).toContain(woodWideInsights.interpretation);
    });

    it('should show significance status correctly', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const woodWideInsights: WoodWideResult = {
        significant: false,
        confidence: 0.60,
        interpretation: 'The observed changes are not statistically significant.',
      };

      const html = generateModernReport(mockFlowRun, { woodWideInsights });

      expect(html).toContain('not statistically significant');
    });
  });

  describe('Historical Trends', () => {
    it('should render trends section when historical data is provided', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const historicalData = createHistoricalData();

      const html = generateModernReport(mockFlowRun, { historicalData });

      expect(html).toContain('trends-section');
      expect(html).toContain('Historical Success Rate Trend');
      expect(html).toContain('chart-container');
    });

    it('should include SVG chart in trends section', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const historicalData = createHistoricalData();

      const html = generateModernReport(mockFlowRun, { historicalData });

      expect(html).toContain('<svg');
      expect(html).toContain('viewBox');
      expect(html).toContain('chart-canvas');
    });

    it('should not render trends section with less than 2 data points', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const historicalData = [mockFlowRun]; // Only 1 data point

      const html = generateModernReport(mockFlowRun, { historicalData });

      expect(html).not.toContain('trends-section');
    });

    it('should handle edge case: empty historical data', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const html = generateModernReport(mockFlowRun, { historicalData: [] });

      // Should still generate report without trends
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).not.toContain('trends-section');
    });
  });

  describe('Summary Cards', () => {
    it('should calculate and display success rate correctly', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const html = generateModernReport(mockFlowRun);

      const passedSteps = mockFlowRun.steps.filter(s => s.success).length;
      const successRate = Math.round((passedSteps / mockFlowRun.steps.length) * 100);
      
      expect(html).toContain(`${successRate}%`);
    });

    it('should show trend comparison when historical data is provided', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const historicalData = createHistoricalData();

      const html = generateModernReport(mockFlowRun, { historicalData });

      expect(html).toContain('summary-card-trend');
      expect(html).toContain('vs 30-day average');
    });

    it('should apply correct card classes based on test result', () => {
      const passingRun = createComprehensiveMockFlowRun();
      passingRun.verdict = 'pass';
      passingRun.steps = passingRun.steps.map(s => ({ ...s, success: true }));

      const html = generateModernReport(passingRun);
      expect(html).toContain('summary-card success');

      const failingRun = createComprehensiveMockFlowRun();
      failingRun.verdict = 'fail';
      const failingHtml = generateModernReport(failingRun);
      expect(failingHtml).toContain('summary-card danger');
    });
  });

  describe('Responsive Design', () => {
    it('should include responsive media queries', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const html = generateModernReport(mockFlowRun);

      expect(html).toContain('@media (max-width: 767px)');
      expect(html).toContain('@media (min-width: 768px) and (max-width: 1023px)');
    });

    it('should include print styles', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const html = generateModernReport(mockFlowRun);

      expect(html).toContain('@media print');
      expect(html).toContain('page-break-inside: avoid');
    });
  });

  describe('Accessibility', () => {
    it('should include proper HTML structure for screen readers', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const html = generateModernReport(mockFlowRun);

      expect(html).toContain('lang="en"');
      expect(html).toContain('<title>');
      expect(html).toContain('alt='); // Screenshot alt text
    });

    it('should use semantic HTML elements', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const html = generateModernReport(mockFlowRun);

      // Check for proper heading hierarchy would be ideal
      expect(html).toContain('<h1');
      expect(html).toContain('<h2');
    });
  });

  describe('File Output', () => {
    it('should save report to file correctly', async () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const html = generateModernReport(mockFlowRun);

      const filepath = path.join(outputDir, `e2e-test-${Date.now()}.html`);
      await fs.writeFile(filepath, html, 'utf-8');

      const saved = await fs.readFile(filepath, 'utf-8');
      expect(saved).toBe(html);
      expect(saved.length).toBeGreaterThan(0);

      // Cleanup
      await fs.unlink(filepath);
    });
  });

  describe('Edge Cases', () => {
    it('should handle flow run with no steps', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      mockFlowRun.steps = [];

      const html = generateModernReport(mockFlowRun);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('steps-section');
    });

    it('should handle flow run with no analysis', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      mockFlowRun.steps = mockFlowRun.steps.map(s => ({
        ...s,
        analysis: undefined,
      }));

      const html = generateModernReport(mockFlowRun);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('step-item');
    });

    it('should handle flow run with error status', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      mockFlowRun.verdict = 'error';
      mockFlowRun.steps[0].analysis = {
        status: 'error',
        error: 'Network timeout occurred',
      };

      const html = generateModernReport(mockFlowRun);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Network timeout occurred');
    });

    it('should handle missing optional fields gracefully', () => {
      const minimalRun: FlowRunResult = {
        flowName: 'minimal-test',
        intent: 'Minimal test flow',
        url: 'https://example.com',
        viewport: { width: 1920, height: 1080 },
        verdict: 'pass',
        confidence: 100,
        steps: [],
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 0,
      };

      const html = generateModernReport(minimalRun);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('minimal-test');
    });
  });

  describe('Chart Generation Edge Cases', () => {
    it('should handle single data point in trends', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const historicalData = [mockFlowRun];

      const html = generateModernReport(mockFlowRun, { historicalData });

      // Should not include trends section with only 1 point
      expect(html).not.toContain('trends-section');
    });

    it('should handle empty trend data gracefully', () => {
      const mockFlowRun = createComprehensiveMockFlowRun();
      const html = generateModernReport(mockFlowRun, { historicalData: [] });

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).not.toContain('trends-section');
    });
  });

  describe('Integration with report.ts', () => {
    it('should work with generateReport function from report.ts', async () => {
      const { generateReport } = await import('../../report.js');
      const mockFlowRun = createComprehensiveMockFlowRun();

      const html = generateReport(mockFlowRun, undefined, { useModernReport: true });

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('FlowGuard Report');
      expect(html).toContain(mockFlowRun.flowName);
    });
  });
});

