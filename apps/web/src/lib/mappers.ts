import type {
  FlowDefinition,
  TestResult,
  DbFlowStep,
  Flow,
  FlowStep,
  Report,
  ReportStep
} from '../types';
import type { CreateFlowInput, UpdateFlowInput } from './validation';

/**
 * Map a MongoDB FlowDefinition to the API Flow type.
 * Requires additional data (lastRun, successRate, totalRuns) from test results.
 */
export function mapFlowDefinitionToFlow(
  flowDef: FlowDefinition,
  stats: {
    lastRun?: Date;
    successRate: number;
    totalRuns: number;
  }
): Flow {
  return {
    // Use flow name as the ID (unique per tenant)
    id: flowDef.name,
    name: flowDef.name,
    intent: flowDef.intent,
    url: flowDef.url,
    viewport: flowDef.viewport,
    status: stats.successRate >= 80 ? 'passing' : 'failing',
    lastRun: stats.lastRun?.toISOString() ?? new Date().toISOString(),
    successRate: Math.round(stats.successRate),
    totalRuns: stats.totalRuns,
    steps: flowDef.steps.map(mapDbStepToFlowStep)
  };
}

/**
 * Map a database FlowStep to the API FlowStep type
 */
function mapDbStepToFlowStep(step: DbFlowStep, index: number): FlowStep {
  return {
    id: `step-${index}`,
    action: step.action,
    target: step.target,
    value: step.value,
    assertion: step.assert,
    timeout: step.timeout
  };
}

/**
 * Map a MongoDB TestResult to the API Report type
 */
export function mapTestResultToReport(result: TestResult & { _id?: { toString(): string } }): Report {
  const passedSteps = result.steps.filter(s => s.passed).length;
  const failedSteps = result.measurements.failedSteps;

  return {
    // Use MongoDB _id if available, otherwise generate from timestamp
    id: result._id?.toString() ?? `report-${result.timestamp.getTime()}`,
    flowName: result.metadata.flowName,
    status: result.measurements.passed ? 'pass' : 'fail',
    completedAt: result.timestamp.toISOString(),
    duration: result.measurements.duration,
    steps: result.steps.map(mapStepResultToReportStep),
    metrics: {
      successRate: result.measurements.totalSteps > 0
        ? Math.round((passedSteps / result.measurements.totalSteps) * 100)
        : 0,
      avgConfidence: Math.round(result.measurements.avgConfidence),
      totalCost: result.measurements.totalCost
    }
  };
}

/**
 * Map a database StepResult to the API ReportStep type
 */
function mapStepResultToReportStep(
  step: TestResult['steps'][number]
): ReportStep {
  return {
    index: step.stepIndex,
    action: step.action,
    target: step.target,
    assertion: undefined, // Assertion is on the flow definition, not the result
    status: step.passed ? 'pass' : 'fail',
    screenshot: step.screenshotUrl,
    analysis: step.confidence !== undefined ? {
      status: step.passed ? 'pass' : 'fail',
      confidence: Math.round(step.confidence),
      reasoning: step.reasoning ?? '',
      issues: step.error ? [step.error] : undefined,
      suggestions: undefined
    } : undefined
  };
}

/**
 * Map API CreateFlowInput to the MongoDB FlowDefinition format (partial)
 */
export function mapCreateFlowToDefinition(
  input: CreateFlowInput
): Omit<FlowDefinition, '_id' | 'tenantId' | 'createdAt' | 'updatedAt'> {
  return {
    name: input.name,
    intent: input.intent,
    url: input.url,
    viewport: input.viewport,
    steps: input.steps.map(mapFlowStepToDbStep),
    tags: input.tags ?? [],
    critical: input.critical ?? false
  };
}

/**
 * Map API UpdateFlowInput to partial FlowDefinition for updates
 */
export function mapUpdateFlowToDefinition(
  input: UpdateFlowInput
): Partial<Pick<FlowDefinition, 'intent' | 'url' | 'viewport' | 'steps' | 'tags' | 'critical'>> {
  const updates: Partial<Pick<FlowDefinition, 'intent' | 'url' | 'viewport' | 'steps' | 'tags' | 'critical'>> = {};

  if (input.intent !== undefined) updates.intent = input.intent;
  if (input.url !== undefined) updates.url = input.url;
  if (input.viewport !== undefined) updates.viewport = input.viewport;
  if (input.steps !== undefined) updates.steps = input.steps.map(mapFlowStepToDbStep);
  if (input.tags !== undefined) updates.tags = input.tags;
  if (input.critical !== undefined) updates.critical = input.critical;

  return updates;
}

/**
 * Map an API FlowStep input to the database FlowStep format
 */
function mapFlowStepToDbStep(step: CreateFlowInput['steps'][number]): DbFlowStep {
  return {
    action: step.action,
    target: step.target,
    value: step.value,
    assert: step.assert,
    timeout: step.timeout
  };
}

/**
 * Simplified flow type for list views (without full steps)
 */
export interface FlowListItem {
  id: string;
  name: string;
  intent: string;
  status: 'passing' | 'failing';
  lastRun: string;
  successRate: number;
  totalRuns: number;
}

/**
 * Map a FlowDefinition to a list item (without steps)
 */
export function mapFlowDefinitionToListItem(
  flowDef: FlowDefinition,
  stats: {
    lastRun?: Date;
    successRate: number;
    totalRuns: number;
  }
): FlowListItem {
  return {
    id: flowDef.name,
    name: flowDef.name,
    intent: flowDef.intent,
    status: stats.successRate >= 80 ? 'passing' : 'failing',
    lastRun: stats.lastRun?.toISOString() ?? new Date().toISOString(),
    successRate: Math.round(stats.successRate),
    totalRuns: stats.totalRuns
  };
}

/**
 * Simplified report type for list views
 */
export interface ReportListItem {
  id: string;
  flowName: string;
  status: 'pass' | 'fail' | 'error';
  completedAt: string;
  duration: number;
  steps: {
    total: number;
    passed: number;
    failed: number;
  };
}

/**
 * Map a TestResult to a list item (without full step details)
 */
export function mapTestResultToListItem(
  result: TestResult & { _id?: { toString(): string } }
): ReportListItem {
  return {
    id: result._id?.toString() ?? `report-${result.timestamp.getTime()}`,
    flowName: result.metadata.flowName,
    status: result.measurements.passed ? 'pass' : 'fail',
    completedAt: result.timestamp.toISOString(),
    duration: result.measurements.duration,
    steps: {
      total: result.measurements.totalSteps,
      passed: result.measurements.totalSteps - result.measurements.failedSteps,
      failed: result.measurements.failedSteps
    }
  };
}
