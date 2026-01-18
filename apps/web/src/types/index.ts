/**
 * TypeScript types for FlowGuard Next.js app
 */

export interface Flow {
  id: string;
  name: string;
  intent: string;
  url: string;
  viewport?: {
    width: number;
    height: number;
  };
  status: 'passing' | 'failing';
  lastRun: string;
  successRate: number;
  totalRuns: number;
  steps: FlowStep[];
}

export interface FlowStep {
  id: string;
  action: 'navigate' | 'click' | 'type' | 'screenshot' | 'wait' | 'scroll';
  target?: string;
  value?: string;
  assertion?: string;
  timeout?: number;
}

export interface Report {
  id: string;
  flowName: string;
  status: 'pass' | 'fail' | 'error';
  completedAt: string;
  duration: number;
  steps: ReportStep[];
  metrics?: {
    successRate: number;
    avgConfidence: number;
    totalCost: number;
  };
}

export interface ReportStep {
  index: number;
  action: string;
  target?: string;
  assertion?: string;
  status: 'pass' | 'fail';
  screenshot?: string;
  analysis?: {
    status: 'pass' | 'fail';
    confidence: number;
    reasoning: string;
    issues?: string[];
    suggestions?: string[];
  };
}

export interface Stats {
  totalFlows: number;
  successRate: number;
  testsThisMonth: number;
  totalSteps: number;
  costThisMonth: number;
}

export interface CruxMetrics {
  lcp: { p75: number; rating: 'good' | 'needs-improvement' | 'poor' };
  cls: { p75: number; rating: 'good' | 'needs-improvement' | 'poor' };
  inp: { p75: number; rating: 'good' | 'needs-improvement' | 'poor' };
}

