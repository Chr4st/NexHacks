import type { FlowRunResult, CruxMetrics, WoodWideResult } from '../types.js';

/**
 * Metadata for report generation
 */
export interface ReportMetadata {
  flowName: string;
  timestamp: string;
  environment?: string;
  viewport?: string;
  browser?: string;
  passed?: boolean;
}

/**
 * Summary data for report cards
 */
export interface SummaryData {
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  duration: number;
  cost?: number;
  avgConfidence: number;
  historicalSuccessRate?: number;
}

/**
 * Options for report generation
 */
export interface ReportOptions {
  flowRun: FlowRunResult;
  historicalData?: FlowRunResult[];
  cruxMetrics?: CruxMetrics;
  woodWideInsights?: WoodWideResult;
}

/**
 * Trend data point for charts
 */
export interface TrendDataPoint {
  date: string;
  successRate: number;
}

