import { describe, it, expect, vi } from 'vitest';
import {
  testResultToFlowGuardResult,
  flowGuardResultToTestResult,
  extractPRContext,
  createPersistentTestRunner,
  getFlowHistory,
  flowRunResultToFlowGuardResult,
  createFlowGuardTestRunner
} from '../db-integration.js';
import type { FlowGuardResult, PullRequestPayload } from '../types.js';
import type { TestResult } from '../../db/schemas.js';
import type { FlowRunResult } from '../../types.js';

describe('Database Integration', () => {
  describe('testResultToFlowGuardResult', () => {
    it('should convert TestResult to FlowGuardResult', () => {
      const testResult: TestResult = {
        timestamp: new Date('2026-01-18'),
        metadata: {
          flowName: 'checkout-flow',
          environment: 'ci',
          viewport: '1920x1080',
          browser: 'chromium',
          branch: 'feature/test',
          commitSha: 'abc123'
        },
        measurements: {
          passed: true,
          totalSteps: 3,
          failedSteps: 0,
          duration: 5000,
          avgConfidence: 95,
          totalTokens: 1000,
          totalCost: 0.02
        },
        steps: [
          { stepIndex: 0, action: 'navigate', target: 'https://example.com', passed: true, duration: 1000 },
          { stepIndex: 1, action: 'click', target: '#add-to-cart', passed: true, duration: 500 },
          { stepIndex: 2, action: 'screenshot', passed: true, duration: 200, screenshotUrl: 'https://cdn.example.com/shot.png' }
        ]
      };

      const result = testResultToFlowGuardResult(testResult);

      expect(result.flowName).toBe('checkout-flow');
      expect(result.passed).toBe(true);
      expect(result.duration).toBe(5000);
      expect(result.steps).toHaveLength(3);
      expect(result.steps[0].name).toBe('navigate: https://example.com');
      expect(result.steps[2].screenshot).toBe('https://cdn.example.com/shot.png');
    });

    it('should handle failed steps with errors', () => {
      const testResult: TestResult = {
        timestamp: new Date(),
        metadata: {
          flowName: 'login-flow',
          environment: 'ci',
          viewport: '1920x1080',
          browser: 'chromium'
        },
        measurements: {
          passed: false,
          totalSteps: 2,
          failedSteps: 1,
          duration: 3000,
          avgConfidence: 50,
          totalTokens: 500,
          totalCost: 0.01
        },
        steps: [
          { stepIndex: 0, action: 'type', target: '#email', passed: true, duration: 200 },
          { stepIndex: 1, action: 'click', target: '#submit', passed: false, duration: 100, error: 'Element not found' }
        ]
      };

      const result = testResultToFlowGuardResult(testResult);

      expect(result.passed).toBe(false);
      expect(result.steps[1].passed).toBe(false);
      expect(result.steps[1].error).toBe('Element not found');
    });
  });

  describe('flowGuardResultToTestResult', () => {
    it('should convert FlowGuardResult to TestResult', () => {
      const flowResult: FlowGuardResult = {
        flowName: 'checkout-flow',
        passed: true,
        duration: 5000,
        steps: [
          { name: 'Add to cart', passed: true },
          { name: 'Checkout', passed: true }
        ]
      };

      const context = {
        environment: 'ci' as const,
        branch: 'feature/test',
        commitSha: 'abc123'
      };

      const result = flowGuardResultToTestResult(flowResult, context);

      expect(result.metadata.flowName).toBe('checkout-flow');
      expect(result.metadata.environment).toBe('ci');
      expect(result.metadata.branch).toBe('feature/test');
      expect(result.metadata.commitSha).toBe('abc123');
      expect(result.measurements.passed).toBe(true);
      expect(result.measurements.duration).toBe(5000);
      expect(result.measurements.totalSteps).toBe(2);
      expect(result.measurements.failedSteps).toBe(0);
      expect(result.steps).toHaveLength(2);
    });

    it('should count failed steps correctly', () => {
      const flowResult: FlowGuardResult = {
        flowName: 'test-flow',
        passed: false,
        duration: 3000,
        steps: [
          { name: 'Step 1', passed: true },
          { name: 'Step 2', passed: false, error: 'Failed' },
          { name: 'Step 3', passed: false, error: 'Also failed' }
        ]
      };

      const result = flowGuardResultToTestResult(flowResult, { environment: 'local' });

      expect(result.measurements.failedSteps).toBe(2);
    });

    it('should use default viewport and browser', () => {
      const flowResult: FlowGuardResult = {
        flowName: 'test',
        passed: true,
        duration: 1000,
        steps: []
      };

      const result = flowGuardResultToTestResult(flowResult, { environment: 'production' });

      expect(result.metadata.viewport).toBe('1920x1080');
      expect(result.metadata.browser).toBe('chromium');
    });
  });

  describe('extractPRContext', () => {
    it('should extract context from PR payload', () => {
      const payload: PullRequestPayload = {
        action: 'opened',
        number: 42,
        installation: { id: 123 },
        repository: {
          owner: { login: 'testorg' },
          name: 'testrepo',
          full_name: 'testorg/testrepo'
        },
        sender: { login: 'developer' },
        pull_request: {
          number: 42,
          title: 'Test PR',
          head: { sha: 'abc123def456', ref: 'feature/new-feature' },
          base: { ref: 'main' },
          user: { login: 'author' }
        }
      };

      const context = extractPRContext(payload);

      expect(context.branch).toBe('feature/new-feature');
      expect(context.commitSha).toBe('abc123def456');
      expect(context.userId).toBe('author');
    });
  });

  describe('createPersistentTestRunner', () => {
    it('should run tests and save results to repository', async () => {
      const mockRepository = {
        saveTestResult: vi.fn().mockResolvedValue(undefined)
      };

      const baseResults: FlowGuardResult[] = [
        { flowName: 'flow1', passed: true, duration: 1000, steps: [] },
        { flowName: 'flow2', passed: false, duration: 2000, steps: [] }
      ];

      const baseRunner = vi.fn().mockResolvedValue(baseResults);

      const persistentRunner = createPersistentTestRunner(
        mockRepository as any,
        baseRunner,
        { environment: 'ci', branch: 'main', commitSha: 'xyz789' }
      );

      const results = await persistentRunner();

      expect(baseRunner).toHaveBeenCalledTimes(1);
      expect(mockRepository.saveTestResult).toHaveBeenCalledTimes(2);
      expect(results).toEqual(baseResults);
    });

    it('should continue even if save fails', async () => {
      const mockRepository = {
        saveTestResult: vi.fn().mockRejectedValue(new Error('DB error'))
      };

      const baseResults: FlowGuardResult[] = [
        { flowName: 'flow1', passed: true, duration: 1000, steps: [] }
      ];

      const baseRunner = vi.fn().mockResolvedValue(baseResults);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const persistentRunner = createPersistentTestRunner(
        mockRepository as any,
        baseRunner,
        { environment: 'ci' }
      );

      const results = await persistentRunner();

      expect(results).toEqual(baseResults);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('getFlowHistory', () => {
    it('should fetch and convert historical results', async () => {
      const mockTestResults: TestResult[] = [
        {
          timestamp: new Date(),
          metadata: { flowName: 'test-flow', environment: 'ci', viewport: '1920x1080', browser: 'chromium' },
          measurements: { passed: true, totalSteps: 1, failedSteps: 0, duration: 1000, avgConfidence: 90, totalTokens: 100, totalCost: 0.01 },
          steps: [{ stepIndex: 0, action: 'click', passed: true, duration: 100 }]
        }
      ];

      const mockRepository = {
        getRecentResults: vi.fn().mockResolvedValue(mockTestResults)
      };

      const history = await getFlowHistory(mockRepository as any, 'test-flow', 5);

      expect(mockRepository.getRecentResults).toHaveBeenCalledWith('test-flow', 5);
      expect(history).toHaveLength(1);
      expect(history[0].flowName).toBe('test-flow');
      expect(history[0].passed).toBe(true);
    });
  });

  describe('flowRunResultToFlowGuardResult', () => {
    it('should convert FlowRunResult to FlowGuardResult', () => {
      const runResult: FlowRunResult = {
        flowName: 'checkout-flow',
        intent: 'User completes checkout',
        url: 'https://example.com/checkout',
        viewport: { width: 1920, height: 1080 },
        verdict: 'pass',
        confidence: 95,
        steps: [
          { stepIndex: 0, action: 'navigate', success: true, durationMs: 1000 },
          { stepIndex: 1, action: 'click', success: true, durationMs: 500 },
          { stepIndex: 2, action: 'screenshot', success: true, durationMs: 200, screenshotPath: '/tmp/shot.png' }
        ],
        startedAt: '2026-01-18T00:00:00Z',
        completedAt: '2026-01-18T00:00:02Z',
        durationMs: 1700
      };

      const result = flowRunResultToFlowGuardResult(runResult);

      expect(result.flowName).toBe('checkout-flow');
      expect(result.passed).toBe(true);
      expect(result.duration).toBe(1700);
      expect(result.steps).toHaveLength(3);
      expect(result.steps[2].screenshot).toBe('/tmp/shot.png');
    });

    it('should handle failed verdict', () => {
      const runResult: FlowRunResult = {
        flowName: 'login-flow',
        intent: 'User logs in',
        url: 'https://example.com/login',
        viewport: { width: 1920, height: 1080 },
        verdict: 'fail',
        confidence: 50,
        steps: [
          { stepIndex: 0, action: 'click', success: false, durationMs: 100, error: 'Element not found' }
        ],
        startedAt: '2026-01-18T00:00:00Z',
        completedAt: '2026-01-18T00:00:01Z',
        durationMs: 100
      };

      const result = flowRunResultToFlowGuardResult(runResult);

      expect(result.passed).toBe(false);
      expect(result.steps[0].passed).toBe(false);
      expect(result.steps[0].error).toBe('Element not found');
    });

    it('should handle error verdict', () => {
      const runResult: FlowRunResult = {
        flowName: 'broken-flow',
        intent: 'This will fail',
        url: 'https://example.com',
        viewport: { width: 1920, height: 1080 },
        verdict: 'error',
        confidence: 0,
        steps: [],
        startedAt: '2026-01-18T00:00:00Z',
        completedAt: '2026-01-18T00:00:00Z',
        durationMs: 0
      };

      const result = flowRunResultToFlowGuardResult(runResult);

      expect(result.passed).toBe(false);
    });
  });

  describe('createFlowGuardTestRunner', () => {
    it('should wrap executeFlows and convert results', async () => {
      const mockRunResults: FlowRunResult[] = [
        {
          flowName: 'test-flow',
          intent: 'Test',
          url: 'https://example.com',
          viewport: { width: 1920, height: 1080 },
          verdict: 'pass',
          confidence: 90,
          steps: [{ stepIndex: 0, action: 'navigate', success: true, durationMs: 500 }],
          startedAt: '2026-01-18T00:00:00Z',
          completedAt: '2026-01-18T00:00:01Z',
          durationMs: 500
        }
      ];

      const mockExecuteFlows = vi.fn().mockResolvedValue(mockRunResults);
      const flows = [{ name: 'test-flow' }];
      const outputDir = '/tmp/output';

      const runner = createFlowGuardTestRunner(mockExecuteFlows, flows, outputDir);
      const results = await runner();

      expect(mockExecuteFlows).toHaveBeenCalledWith(flows, outputDir);
      expect(results).toHaveLength(1);
      expect(results[0].flowName).toBe('test-flow');
      expect(results[0].passed).toBe(true);
    });
  });
});
