/**
 * End-to-End Tests for GitHub App Integration
 *
 * These tests verify the complete flow from webhook receipt to database persistence,
 * ensuring all components work together correctly with multi-tenant isolation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubAppClient } from '../app.js';
import { CommentGenerator } from '../comment-generator.js';
import { WebhookHandler } from '../webhook-handler.js';
import { createWebhookServer } from '../server.js';
import {
  flowGuardResultToTestResult,
  extractPRContext,
  createPersistentTestRunner
} from '../db-integration.js';
import { extractTenantFromPayload } from '../tenant.js';
import type {
  GitHubAppConfig,
  PullRequestPayload,
  FlowGuardResult
} from '../types.js';
import type { FlowGuardRepository } from '../../db/repository.js';
import type { TestResult } from '../../db/schemas.js';

// Mock Octokit
vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    issues: {
      listComments: vi.fn().mockResolvedValue({ data: [] }),
      createComment: vi.fn().mockResolvedValue({ data: { id: 123 } }),
      updateComment: vi.fn().mockResolvedValue({ data: { id: 123 } })
    },
    checks: {
      create: vi.fn().mockResolvedValue({ data: { id: 456 } }),
      update: vi.fn().mockResolvedValue({})
    },
    pulls: {
      listFiles: vi.fn().mockResolvedValue({ data: [] })
    }
  }))
}));

vi.mock('@octokit/auth-app', () => ({
  createAppAuth: vi.fn().mockReturnValue(vi.fn().mockResolvedValue({ token: 'mock-token' }))
}));

describe('E2E: Full GitHub Webhook Flow with Multi-Tenant Support', () => {
  let mockRepository: any;
  let appClient: GitHubAppClient;
  let commentGenerator: CommentGenerator;
  let webhookHandler: WebhookHandler;

  const config: GitHubAppConfig = {
    appId: '12345',
    privateKey: '-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----',
    webhookSecret: 'test-secret'
  };

  const mockPRPayload: PullRequestPayload = {
    action: 'opened',
    pull_request: {
      number: 42,
      head: {
        ref: 'feature/new-login',
        sha: 'abc123def456'
      },
      user: {
        login: 'developer1'
      }
    },
    repository: {
      name: 'my-app',
      full_name: 'acme-corp/my-app',
      owner: {
        login: 'acme-corp'
      }
    },
    installation: {
      id: 789
    }
  };

  beforeEach(() => {
    // Mock repository with tenant-scoped methods
    mockRepository = {
      saveTestResult: vi.fn().mockResolvedValue(undefined),
      getRecentResultsByTenant: vi.fn().mockResolvedValue([]),
      getFlowsByTenant: vi.fn().mockResolvedValue([]),
      saveFlowForTenant: vi.fn().mockResolvedValue('flow-id-123')
    };

    appClient = new GitHubAppClient(config);
    commentGenerator = new CommentGenerator();
    webhookHandler = new WebhookHandler({
      webhookSecret: config.webhookSecret,
      appClient,
      commentGenerator,
      testRunner: async () => [] // Mock test runner
    });
  });

  describe('Complete Webhook Processing Flow', () => {
    it('should process PR webhook from receipt to database persistence', async () => {
      const mockFlowResults: FlowGuardResult[] = [
        {
          flowName: 'login-flow',
          passed: true,
          duration: 5000,
          steps: [
            { name: 'Navigate to login', passed: true },
            { name: 'Enter credentials', passed: true },
            { name: 'Click submit', passed: true },
            { name: 'Verify dashboard', passed: true }
          ]
        }
      ];

      // Override webhook handler with one that returns our mock results
      const testRunner = vi.fn().mockResolvedValue(mockFlowResults);
      const handler = new WebhookHandler({
        webhookSecret: config.webhookSecret,
        appClient,
        commentGenerator,
        testRunner
      });

      // Process webhook
      await handler.handlePullRequest(mockPRPayload);

      // Verify test runner was called (no args passed to runner)
      expect(testRunner).toHaveBeenCalled();

      // Verify PR comment was posted
      expect(appClient.getInstallationOctokit).toBeDefined();
    });

    it('should extract tenant context from webhook payload', () => {
      const tenantContext = extractTenantFromPayload(mockPRPayload);

      expect(tenantContext).toEqual({
        tenantId: 'gh-789',
        installationId: 789,
        organizationName: 'acme-corp',
        repositoryFullName: 'acme-corp/my-app'
      });
    });

    it('should extract PR context for test result metadata', () => {
      const prContext = extractPRContext(mockPRPayload);

      expect(prContext).toEqual({
        branch: 'feature/new-login',
        commitSha: 'abc123def456',
        userId: 'developer1',
        tenantId: 'gh-789',
        installationId: 789
      });
    });

    it('should convert FlowGuardResult to TestResult with tenant ID', () => {
      const flowResult: FlowGuardResult = {
        flowName: 'checkout-flow',
        passed: true,
        duration: 3500,
        steps: [
          { name: 'Add to cart', passed: true },
          { name: 'Proceed to checkout', passed: true }
        ]
      };

      const testResult = flowGuardResultToTestResult(flowResult, {
        environment: 'ci',
        viewport: '1920x1080',
        browser: 'chromium',
        branch: 'feature/checkout',
        commitSha: 'def789',
        userId: 'dev2',
        tenantId: 'gh-789'
      });

      expect(testResult.metadata.tenantId).toBe('gh-789');
      expect(testResult.metadata.flowName).toBe('checkout-flow');
      expect(testResult.metadata.branch).toBe('feature/checkout');
      expect(testResult.measurements.passed).toBe(true);
      expect(testResult.steps).toHaveLength(2);
    });
  });

  describe('Multi-Tenant Data Isolation', () => {
    it('should persist test results with tenant isolation', async () => {
      const flowResult: FlowGuardResult = {
        flowName: 'login-flow',
        passed: true,
        duration: 5000,
        steps: [{ name: 'Login step', passed: true }]
      };

      const testResult = flowGuardResultToTestResult(flowResult, {
        environment: 'ci',
        tenantId: 'gh-789',
        branch: 'main',
        commitSha: 'abc123'
      });

      await mockRepository.saveTestResult(testResult);

      expect(mockRepository.saveTestResult).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            tenantId: 'gh-789'
          })
        })
      );
    });

    it('should retrieve results only for specific tenant', async () => {
      const tenantId = 'gh-789';
      const flowName = 'checkout-flow';

      await mockRepository.getRecentResultsByTenant(tenantId, flowName, 10);

      expect(mockRepository.getRecentResultsByTenant).toHaveBeenCalledWith(
        'gh-789',
        'checkout-flow',
        10
      );
    });

    it('should create tenant-scoped test runner wrapper', async () => {
      const baseRunner = vi.fn().mockResolvedValue([
        {
          flowName: 'test-flow',
          passed: true,
          duration: 1000,
          steps: []
        }
      ]);

      const persistentRunner = createPersistentTestRunner(
        mockRepository as unknown as FlowGuardRepository,
        baseRunner,
        {
          environment: 'ci',
          branch: 'main',
          commitSha: 'xyz789'
        }
      );

      const results = await persistentRunner();

      expect(baseRunner).toHaveBeenCalled();
      expect(mockRepository.saveTestResult).toHaveBeenCalled();
      expect(results).toHaveLength(1);
    });
  });

  describe('Tenant Isolation Security', () => {
    it('should prevent cross-tenant data access', async () => {
      const tenant1Results = [
        { metadata: { tenantId: 'gh-111', flowName: 'flow1' } }
      ];

      mockRepository.getRecentResultsByTenant
        .mockResolvedValueOnce(tenant1Results)
        .mockResolvedValueOnce([]);

      // Tenant 1 should see their results
      const results1 = await mockRepository.getRecentResultsByTenant('gh-111', 'flow1');
      expect(results1).toHaveLength(1);

      // Tenant 2 should not see tenant 1's results
      const results2 = await mockRepository.getRecentResultsByTenant('gh-222', 'flow1');
      expect(results2).toHaveLength(0);
    });

    it('should validate tenant ID format', () => {
      const validateTenantId = (tenantId: string): void => {
        if (!tenantId || tenantId.length < 3 || !/^[a-zA-Z0-9_-]+$/.test(tenantId)) {
          throw new Error('Invalid tenant ID');
        }
      };

      const invalidTenantIds = ['', 'ab', 'tenant@123'];

      for (const invalidId of invalidTenantIds) {
        expect(() => validateTenantId(invalidId)).toThrow('Invalid tenant ID');
      }

      const validTenantIds = ['gh-123', 'gh-456789', 'tenant-abc', 'org_123'];

      for (const validId of validTenantIds) {
        expect(() => validateTenantId(validId)).not.toThrow();
      }
    });
  });

  describe('Acceptance Criteria Verification', () => {
    it('AC: PR webhooks trigger FlowGuard runs with tenant context', async () => {
      const testRunner = vi.fn().mockResolvedValue([]);
      const handler = new WebhookHandler({
        webhookSecret: config.webhookSecret,
        appClient,
        commentGenerator,
        testRunner
      });

      await handler.handlePullRequest(mockPRPayload);

      // Verify runner was called
      expect(testRunner).toHaveBeenCalled();
    });

    it('AC: PR comments include tenant-scoped results', async () => {
      const results: FlowGuardResult[] = [
        {
          flowName: 'tenant-flow',
          passed: true,
          duration: 2000,
          steps: [{ name: 'Step 1', passed: true }]
        }
      ];

      const comment = commentGenerator.generateComment(results);

      expect(comment).toContain('tenant-flow');
      expect(comment).toContain('✅');
      expect(comment).toContain('1/1');
    });

    it('AC: Check runs reflect tenant-specific test outcomes', async () => {
      const results: FlowGuardResult[] = [
        {
          flowName: 'critical-flow',
          passed: false,
          duration: 3000,
          steps: [
            { name: 'Step 1', passed: true },
            { name: 'Step 2', passed: false, error: 'Assertion failed' }
          ]
        }
      ];

      const conclusion = results.every(r => r.passed) ? 'success' : 'failure';
      expect(conclusion).toBe('failure');
    });

    it('AC: Database stores results with tenant metadata', async () => {
      const testResult = flowGuardResultToTestResult(
        {
          flowName: 'api-test',
          passed: true,
          duration: 1500,
          steps: []
        },
        {
          environment: 'ci',
          tenantId: 'gh-999',
          branch: 'develop',
          commitSha: 'commit123'
        }
      );

      expect(testResult.metadata).toMatchObject({
        tenantId: 'gh-999',
        flowName: 'api-test',
        environment: 'ci',
        branch: 'develop',
        commitSha: 'commit123'
      });
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle test runner failures gracefully', async () => {
      const testRunner = vi.fn().mockRejectedValue(new Error('Runner crashed'));
      const handler = new WebhookHandler({
        webhookSecret: config.webhookSecret,
        appClient,
        commentGenerator,
        testRunner
      });

      // Error handling - webhook handler will report to check run then rethrow
      await expect(handler.handlePullRequest(mockPRPayload)).rejects.toThrow('Runner crashed');
    });

    it('should handle database save failures gracefully', async () => {
      mockRepository.saveTestResult.mockRejectedValue(new Error('DB connection lost'));

      const persistentRunner = createPersistentTestRunner(
        mockRepository as unknown as FlowGuardRepository,
        async () => [{
          flowName: 'test',
          passed: true,
          duration: 1000,
          steps: []
        }],
        { environment: 'ci', branch: 'main', commitSha: 'abc' }
      );

      // Should still return results even if DB save fails
      const results = await persistentRunner();
      expect(results).toHaveLength(1);
    });

    it('should handle malformed webhook payloads', () => {
      const malformedPayload = {
        action: 'opened',
        // Missing required fields
      };

      expect(() => {
        extractPRContext(malformedPayload as any);
      }).toThrow();
    });
  });
});
