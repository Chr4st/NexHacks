/**
 * API client for FlowGuard Next.js app
 */

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export interface Flow {
  id: string;
  name: string;
  intent: string;
  status: 'passing' | 'failing';
  lastRun: string;
  successRate: number;
  totalRuns: number;
}

export interface Report {
  id: string;
  flowName: string;
  status: 'pass' | 'fail';
  completedAt: string;
  duration: number;
  steps: { total: number; passed: number; failed: number };
}

export interface Stats {
  totalFlows: number;
  successRate: number;
  testsThisMonth: number;
  totalSteps: number;
  costThisMonth: number;
}

export async function getFlows(): Promise<Flow[]> {
  const response = await fetch(`${API_BASE}/api/flows`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  return data.flows || [];
}

export async function getFlow(id: string): Promise<Flow | null> {
  const response = await fetch(`${API_BASE}/api/flows/${id}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  return data.flow || null;
}

export async function getReports(): Promise<Report[]> {
  const response = await fetch(`${API_BASE}/api/reports`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  return data.reports || [];
}

export async function getReport(id: string): Promise<Report | null> {
  const response = await fetch(`${API_BASE}/api/reports/${id}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  return data.report || null;
}

export async function getStats(): Promise<Stats> {
  const response = await fetch(`${API_BASE}/api/analytics`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    return {
      totalFlows: 0,
      successRate: 0,
      testsThisMonth: 0,
      totalSteps: 0,
      costThisMonth: 0,
    };
  }
  const data = await response.json();
  return {
    totalFlows: data.totalFlows || 0,
    successRate: data.successRate || 0,
    testsThisMonth: data.totalRuns || 0,
    totalSteps: data.totalSteps || 0,
    costThisMonth: data.totalCost || 0,
  };
}

