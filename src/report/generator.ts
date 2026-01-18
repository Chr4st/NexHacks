import { generateBaseTemplate } from './templates/base.js';
import { generateHeader } from './templates/header.js';
import { generateSummary } from './templates/summary.js';
import { generateSteps } from './templates/steps.js';
import { generateTrends } from './templates/trends.js';
import { generateCruxMetrics } from './templates/crux.js';
import { generateWoodWideInsights } from './templates/woodwide.js';
import { generateFooter } from './templates/footer.js';
import type { FlowRunResult, CruxMetrics, WoodWideResult } from '../types.js';
import type { ReportOptions, SummaryData, TrendDataPoint, ReportMetadata } from './types.js';

/**
 * Calculate success rate from historical data
 */
function calculateSuccessRate(history: FlowRunResult[]): number {
  if (history.length === 0) return 0;
  const passed = history.filter(r => r.verdict === 'pass').length;
  return (passed / history.length) * 100;
}

/**
 * Convert historical flow runs to trend data points
 */
function convertToTrendData(history: FlowRunResult[]): TrendDataPoint[] {
  return history.map(run => {
    const passedSteps = run.steps.filter(s => s.success).length;
    // Calculate success rate, ensuring it's a valid number
    let successRate = 0;
    if (run.steps.length > 0) {
      successRate = (passedSteps / run.steps.length) * 100;
      // Clamp to valid range and handle NaN/Infinity
      if (isNaN(successRate) || !isFinite(successRate)) {
        successRate = 0;
      } else {
        successRate = Math.max(0, Math.min(100, successRate));
      }
    }

    return {
      date: new Date(run.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      successRate,
    };
  });
}

/**
 * Generate summary data from flow run
 */
function extractSummaryData(run: FlowRunResult, historicalSuccessRate?: number): SummaryData {
  const passedSteps = run.steps.filter(s => s.success).length;
  const failedSteps = run.steps.length - passedSteps;

  // Calculate average confidence from step analyses
  // Filter to only pass/fail results which have confidence property
  const confidenceValues: number[] = [];
  for (const step of run.steps) {
    const a = step.analysis;
    if (a && (a.status === 'pass' || a.status === 'fail')) {
      confidenceValues.push(a.confidence);
    }
  }

  const avgConfidence = confidenceValues.length > 0
    ? confidenceValues.reduce((sum, c) => sum + c, 0) / confidenceValues.length
    : run.confidence;

  // Extract cost if available (from measurements or direct property)
  const cost = (run as any).totalCost ?? (run as any).measurements?.totalCost;

  return {
    totalSteps: run.steps.length,
    passedSteps,
    failedSteps,
    duration: run.durationMs,
    cost,
    avgConfidence,
    historicalSuccessRate,
  };
}

/**
 * Report generator class
 */
export class ReportGenerator {
  /**
   * Generate a complete HTML report
   */
  generateReport(options: ReportOptions): string {
    const { flowRun, historicalData, cruxMetrics, woodWideInsights } = options;

    // Build report sections
    const sections: string[] = [];

    // Header
    sections.push(generateHeader(flowRun));

    // Summary cards
    const historicalSuccessRate = historicalData && historicalData.length > 0
      ? calculateSuccessRate(historicalData)
      : undefined;

    const summaryData = extractSummaryData(flowRun, historicalSuccessRate);
    sections.push(generateSummary(summaryData));

    // Step-by-step results
    sections.push(generateSteps(flowRun.steps));

    // Historical trends (if data available)
    if (historicalData && historicalData.length > 1) {
      const trendData = convertToTrendData(historicalData);
      sections.push(generateTrends(trendData));
    }

    // CrUX metrics (if available)
    if (cruxMetrics) {
      sections.push(generateCruxMetrics(cruxMetrics));
    }

    // Wood Wide insights (if available)
    if (woodWideInsights) {
      sections.push(generateWoodWideInsights(woodWideInsights));
    }

    // Footer
    sections.push(generateFooter(flowRun));

    // Combine into full HTML
    const content = sections.join('\n');
    const metadata: ReportMetadata = {
      flowName: flowRun.flowName,
      timestamp: flowRun.completedAt,
      passed: flowRun.verdict === 'pass',
    };

    const html = generateBaseTemplate(content, metadata);

    return html;
  }
}

/**
 * Convenience function to generate a report
 */
export function generateModernReport(
  run: FlowRunResult,
  options?: {
    historicalData?: FlowRunResult[];
    cruxMetrics?: CruxMetrics;
    woodWideInsights?: WoodWideResult;
  }
): string {
  const generator = new ReportGenerator();
  return generator.generateReport({
    flowRun: run,
    historicalData: options?.historicalData,
    cruxMetrics: options?.cruxMetrics,
    woodWideInsights: options?.woodWideInsights,
  });
}
