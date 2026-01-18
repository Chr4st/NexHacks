/**
 * Database Integration for GitHub App Module
 * 
 * Provides converters and utilities to integrate the GitHub App
 * with the MongoDB database (Agent A1's work) and the main runner.
 */

import type { FlowGuardResult } from './types.js';
import type { TestResult, StepResult } from '../db/schemas.js';
import type { FlowGuardRepository } from '../db/repository.js';
import type { PullRequestPayload } from './types.js';
import type { FlowRunResult } from '../types.js';
import { extractTenantFromPayload } from './tenant.js';

/**
 * Convert a MongoDB TestResult to a FlowGuardResult for PR comments.
 */
export function testResultToFlowGuardResult(testResult: TestResult): FlowGuardResult {
  return {
    flowName: testResult.metadata.flowName,
    passed: testResult.measurements.passed,
    duration: testResult.measurements.duration,
    steps: testResult.steps.map(step => ({
      name: step.action + (step.target ? `: ${step.target}` : ''),
      passed: step.passed,
      screenshot: step.screenshotUrl,
      error: step.error
    })),
    reportUrl: undefined
  };
}

/**
 * Convert a FlowGuardResult to a MongoDB TestResult for storage.
 */
export function flowGuardResultToTestResult(
  result: FlowGuardResult,
  context: {
    environment: 'local' | 'ci' | 'production';
    viewport?: string;
    browser?: string;
    branch?: string;
    commitSha?: string;
    userId?: string;
    tenantId?: string;
  }
): TestResult {
  const failedSteps = result.steps.filter(s => !s.passed).length;
  
  return {
    timestamp: new Date(),
    metadata: {
      tenantId: context.tenantId,
      flowName: result.flowName,
      environment: context.environment,
      viewport: context.viewport || '1920x1080',
      browser: context.browser || 'chromium',
      branch: context.branch,
      commitSha: context.commitSha,
      userId: context.userId
    },
    measurements: {
      passed: result.passed,
      totalSteps: result.steps.length,
      failedSteps,
      duration: result.duration,
      avgConfidence: 0,
      totalTokens: 0,
      totalCost: 0
    },
    steps: result.steps.map((step, index): StepResult => ({
      stepIndex: index,
      action: step.name,
      passed: step.passed,
      screenshotUrl: step.screenshot,
      duration: 0,
      error: step.error
    }))
  };
}

/**
 * Extract PR context for test result metadata.
 */
export function extractPRContext(payload: PullRequestPayload): {
  branch: string;
  commitSha: string;
  userId: string;
  tenantId: string;
  installationId: number;
} {
  const tenant = extractTenantFromPayload(payload);
  return {
    branch: payload.pull_request.head.ref,
    commitSha: payload.pull_request.head.sha,
    userId: payload.pull_request.user.login,
    tenantId: tenant.tenantId,
    installationId: tenant.installationId
  };
}

/**
 * Create a test runner that saves results to MongoDB.
 */
export function createPersistentTestRunner(
  repository: FlowGuardRepository,
  baseTestRunner: () => Promise<FlowGuardResult[]>,
  context: {
    environment: 'local' | 'ci' | 'production';
    branch?: string;
    commitSha?: string;
  }
): () => Promise<FlowGuardResult[]> {
  return async () => {
    const results = await baseTestRunner();
    
    for (const result of results) {
      const testResult = flowGuardResultToTestResult(result, {
        environment: context.environment,
        branch: context.branch,
        commitSha: context.commitSha
      });
      
      try {
        await repository.saveTestResult(testResult);
      } catch (error) {
        console.error(`Failed to save test result for ${result.flowName}:`, error);
      }
    }
    
    return results;
  };
}

/**
 * Get historical results for a flow from MongoDB.
 */
export async function getFlowHistory(
  repository: FlowGuardRepository,
  flowName: string,
  limit: number = 10
): Promise<FlowGuardResult[]> {
  const testResults = await repository.getRecentResults(flowName, limit);
  return testResults.map(testResultToFlowGuardResult);
}

/**
 * Convert a FlowRunResult (from main runner) to FlowGuardResult (for GitHub comments).
 * This bridges the main test runner with the GitHub module.
 */
export function flowRunResultToFlowGuardResult(runResult: FlowRunResult): FlowGuardResult {
  return {
    flowName: runResult.flowName,
    passed: runResult.verdict === 'pass',
    duration: runResult.durationMs,
    steps: runResult.steps.map(step => ({
      name: step.action + (step.screenshotPath ? ` (screenshot)` : ''),
      passed: step.success,
      screenshot: step.screenshotPath,
      error: step.error
    })),
    reportUrl: undefined
  };
}

/**
 * Create a test runner that wraps executeFlows and converts results.
 * This is the main integration point between the runner and GitHub module.
 */
export function createFlowGuardTestRunner(
  executeFlowsFn: (flows: any[], outputDir: string) => Promise<FlowRunResult[]>,
  flows: any[],
  outputDir: string
): () => Promise<FlowGuardResult[]> {
  return async () => {
    const runResults = await executeFlowsFn(flows, outputDir);
    return runResults.map(flowRunResultToFlowGuardResult);
  };
}
