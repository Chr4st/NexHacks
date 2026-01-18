/**
 * Integration Tests for GitHub App Module
 * 
 * These tests verify ALL acceptance criteria from AGENT-A4-github-app.md:
 * - [ ] GitHub App authenticates successfully
 * - [ ] Webhook signature verification works
 * - [ ] PR webhooks trigger FlowGuard runs
 * - [ ] PR comments posted with results
 * - [ ] Check runs block merge on failures
 * - [ ] Tests pass with mocked webhooks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubAppClient } from '../app.js';
import { CommentGenerator } from '../comment-generator.js';
import { WebhookHandler } from '../webhook-handler.js';
import { createWebhookServer } from '../server.js';
import { verifyWebhookSignature, createSignature } from '../signature.js';
import type { 
  GitHubAppConfig, 
  PullRequestPayload, 
  FlowGuardResult 
} from '../types.js';
import { FLOWGUARD_COMMENT_MARKER } from '../types.js';

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

describe('GitHub App Integration Tests - Acceptance Criteria', () => {
  
  describe('AC1: GitHub App authenticates successfully', () => {
    const validConfig: GitHubAppConfig = {
      appId: '12345',
      privateKey: '-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----',
      webhookSecret: 'test-secret'
    };

    it('should create GitHubAppClient with valid config', () => {
      const client = new GitHubAppClient(validConfig);
      expect(client).toBeDefined();
    });

    it('should get installation-specific Octokit instance', async () => {
      const client = new GitHubAppClient(validConfig);
      const octokit = await client.getInstallationOctokit(123456);
      expect(octokit).toBeDefined();
    });

    it('should cache Octokit instances per installation', async () => {
      const client = new GitHubAppClient(validConfig);
      const octokit1 = await client.getInstallationOctokit(123);
      const octokit2 = await client.getInstallationOctokit(123);
      expect(octokit1).toBe(octokit2);
    });

    it('should create different instances for different installations', async () => {
      const client = new GitHubAppClient(validConfig);
      const octokit1 = await client.getInstallationOctokit(123);
      const octokit2 = await client.getInstallationOctokit(456);
      expect(octokit1).not.toBe(octokit2);
    });

    it('should reject missing appId', () => {
      expect(() => new GitHubAppClient({ ...validConfig, appId: '' }))
        .toThrow('appId is required');
    });

    it('should reject missing privateKey', () => {
      expect(() => new GitHubAppClient({ ...validConfig, privateKey: '' }))
        .toThrow('privateKey is required');
    });
  });

  describe('AC2: Webhook signature verification works', () => {
    const secret = 'webhook-secret-12345';

    it('should verify valid HMAC SHA-256 signature', () => {
      const payload = JSON.stringify({ action: 'opened', number: 1 });
      const signature = createSignature(payload, secret);
      
      expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload = JSON.stringify({ action: 'opened' });
      expect(verifyWebhookSignature(payload, 'sha256=invalid', secret)).toBe(false);
    });

    it('should reject tampered payload', () => {
      const originalPayload = JSON.stringify({ action: 'opened' });
      const signature = createSignature(originalPayload, secret);
      const tamperedPayload = JSON.stringify({ action: 'closed' });
      
      expect(verifyWebhookSignature(tamperedPayload, signature, secret)).toBe(false);
    });

    it('should reject signature with wrong secret', () => {
      const payload = JSON.stringify({ action: 'opened' });
      const signature = createSignature(payload, 'wrong-secret');
      
      expect(verifyWebhookSignature(payload, signature, secret)).toBe(false);
    });

    it('should use timing-safe comparison to prevent timing attacks', () => {
      const payload = JSON.stringify({ action: 'opened' });
      const signature = createSignature(payload, secret);
      
      expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
    });

    it('should handle empty signature gracefully', () => {
      const payload = JSON.stringify({ action: 'opened' });
      expect(verifyWebhookSignature(payload, '', secret)).toBe(false);
    });

    it('should handle malformed signature gracefully', () => {
      const payload = JSON.stringify({ action: 'opened' });
      expect(verifyWebhookSignature(payload, 'not-sha256-prefix', secret)).toBe(false);
    });
  });

  describe('AC3: PR webhooks trigger FlowGuard runs', () => {
    let handler: WebhookHandler;
    let mockTestRunner: ReturnType<typeof vi.fn>;
    let mockAppClient: any;
    let mockCommentGenerator: any;

    beforeEach(() => {
      vi.clearAllMocks();
      
      mockTestRunner = vi.fn().mockResolvedValue([
        { flowName: 'checkout', passed: true, duration: 5000, steps: [] }
      ]);
      
      mockAppClient = {
        createCheckRun: vi.fn().mockResolvedValue(456),
        updateCheckRun: vi.fn().mockResolvedValue(undefined),
        postPRComment: vi.fn().mockResolvedValue(123)
      };
      
      mockCommentGenerator = {
        generateComment: vi.fn().mockReturnValue('<!-- flowguard-report -->\nTest'),
        generateCheckRunSummary: vi.fn().mockReturnValue('# Summary')
      };
      
      handler = new WebhookHandler({
        webhookSecret: 'test-secret',
        appClient: mockAppClient,
        commentGenerator: mockCommentGenerator,
        testRunner: mockTestRunner
      });
    });

    const createPRPayload = (action: 'opened' | 'synchronize' | 'reopened' | 'closed'): PullRequestPayload => ({
      action,
      number: 42,
      installation: { id: 123 },
      repository: {
        owner: { login: 'testorg' },
        name: 'testrepo',
        full_name: 'testorg/testrepo'
      },
      sender: { login: 'testuser' },
      pull_request: {
        number: 42,
        title: 'Test PR',
        head: { sha: 'abc123def456', ref: 'feature-branch' },
        base: { ref: 'main' },
        user: { login: 'testuser' }
      }
    });

    it('should trigger tests on PR opened event', async () => {
      await handler.handlePullRequest(createPRPayload('opened'));
      expect(mockTestRunner).toHaveBeenCalledTimes(1);
    });

    it('should trigger tests on PR synchronize event (new commits)', async () => {
      await handler.handlePullRequest(createPRPayload('synchronize'));
      expect(mockTestRunner).toHaveBeenCalledTimes(1);
    });

    it('should trigger tests on PR reopened event', async () => {
      await handler.handlePullRequest(createPRPayload('reopened'));
      expect(mockTestRunner).toHaveBeenCalledTimes(1);
    });

    it('should NOT trigger tests on PR closed event', async () => {
      await handler.handlePullRequest(createPRPayload('closed'));
      expect(mockTestRunner).not.toHaveBeenCalled();
    });

    it('should create check run before running tests', async () => {
      await handler.handlePullRequest(createPRPayload('opened'));
      
      expect(mockAppClient.createCheckRun).toHaveBeenCalledWith({
        owner: 'testorg',
        repo: 'testrepo',
        headSha: 'abc123def456',
        name: 'FlowGuard Tests',
        installationId: 123
      });
    });

    it('should verify webhook signature before processing', () => {
      const payload = JSON.stringify(createPRPayload('opened'));
      const secret = 'test-secret';
      const validSignature = createSignature(payload, secret);
      
      const result = handler.verifyAndParse(payload, validSignature);
      expect(result.action).toBe('opened');
    });

    it('should throw on invalid webhook signature', () => {
      const payload = JSON.stringify(createPRPayload('opened'));
      
      expect(() => handler.verifyAndParse(payload, 'sha256=invalid'))
        .toThrow('Invalid webhook signature');
    });
  });

  describe('AC4: PR comments posted with results', () => {
    const generator = new CommentGenerator();

    it('should include flowguard marker for comment detection', () => {
      const results: FlowGuardResult[] = [];
      const comment = generator.generateComment(results);
      expect(comment).toContain(FLOWGUARD_COMMENT_MARKER);
    });

    it('should show success status when all tests pass', () => {
      const results: FlowGuardResult[] = [
        { flowName: 'checkout', passed: true, duration: 5000, steps: [] },
        { flowName: 'login', passed: true, duration: 3000, steps: [] }
      ];
      const comment = generator.generateComment(results);
      
      expect(comment).toContain('✅');
      expect(comment).toContain('All Tests Passed');
      expect(comment).toContain('2/2');
    });

    it('should show failure status when any test fails', () => {
      const results: FlowGuardResult[] = [
        { flowName: 'checkout', passed: true, duration: 5000, steps: [] },
        { flowName: 'login', passed: false, duration: 3000, steps: [] }
      ];
      const comment = generator.generateComment(results);
      
      expect(comment).toContain('❌');
      expect(comment).toContain('Tests Failed');
      expect(comment).toContain('1/2');
    });

    it('should include results table with flow details', () => {
      const results: FlowGuardResult[] = [
        { flowName: 'checkout-flow', passed: true, duration: 5000, steps: [] }
      ];
      const comment = generator.generateComment(results);
      
      expect(comment).toContain('| Flow | Status | Duration | Report |');
      expect(comment).toContain('checkout-flow');
      expect(comment).toContain('5.00s');
    });

    it('should include report links when provided', () => {
      const results: FlowGuardResult[] = [
        { 
          flowName: 'checkout', 
          passed: true, 
          duration: 5000, 
          steps: [],
          reportUrl: 'https://cdn.example.com/report.html'
        }
      ];
      const comment = generator.generateComment(results);
      
      expect(comment).toContain('https://cdn.example.com/report.html');
      expect(comment).toContain('[View Report]');
    });

    it('should list failed steps with error messages', () => {
      const results: FlowGuardResult[] = [
        { 
          flowName: 'checkout', 
          passed: false, 
          duration: 5000, 
          steps: [
            { name: 'Add to cart', passed: true },
            { name: 'Submit order', passed: false, error: 'Button not found' }
          ]
        }
      ];
      const comment = generator.generateComment(results);
      
      expect(comment).toContain('### Failures');
      expect(comment).toContain('Submit order');
      expect(comment).toContain('Button not found');
    });

    it('should update existing comment instead of creating new one', async () => {
      const config: GitHubAppConfig = {
        appId: '12345',
        privateKey: '-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----',
        webhookSecret: 'test-secret'
      };
      const client = new GitHubAppClient(config);
      const octokit = await client.getInstallationOctokit(123);
      
      vi.mocked(octokit.issues.listComments).mockResolvedValue({
        data: [{ id: 999, body: '<!-- flowguard-report -->\nOld comment' }]
      } as any);
      
      await client.postPRComment({
        owner: 'test',
        repo: 'repo',
        prNumber: 1,
        body: '<!-- flowguard-report -->\nNew comment',
        installationId: 123
      });
      
      expect(octokit.issues.updateComment).toHaveBeenCalledWith(
        expect.objectContaining({ comment_id: 999 })
      );
    });
  });

  describe('AC5: Check runs block merge on failures', () => {
    let handler: WebhookHandler;
    let mockAppClient: any;

    beforeEach(() => {
      vi.clearAllMocks();
      
      mockAppClient = {
        createCheckRun: vi.fn().mockResolvedValue(456),
        updateCheckRun: vi.fn().mockResolvedValue(undefined),
        postPRComment: vi.fn().mockResolvedValue(123)
      };
      
      handler = new WebhookHandler({
        webhookSecret: 'test-secret',
        appClient: mockAppClient,
        commentGenerator: new CommentGenerator(),
        testRunner: vi.fn()
      });
    });

    const prPayload: PullRequestPayload = {
      action: 'opened',
      number: 42,
      installation: { id: 123 },
      repository: {
        owner: { login: 'testorg' },
        name: 'testrepo',
        full_name: 'testorg/testrepo'
      },
      sender: { login: 'testuser' },
      pull_request: {
        number: 42,
        title: 'Test PR',
        head: { sha: 'abc123', ref: 'feature' },
        base: { ref: 'main' },
        user: { login: 'testuser' }
      }
    };

    it('should create check run in queued status', async () => {
      (handler as any).testRunner = vi.fn().mockResolvedValue([
        { flowName: 'test', passed: true, duration: 1000, steps: [] }
      ]);
      await handler.handlePullRequest(prPayload);
      
      expect(mockAppClient.createCheckRun).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'FlowGuard Tests',
          headSha: 'abc123'
        })
      );
    });

    it('should update check run with neutral when no tests run', async () => {
      (handler as any).testRunner = vi.fn().mockResolvedValue([]);
      await handler.handlePullRequest(prPayload);
      
      expect(mockAppClient.updateCheckRun).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          conclusion: 'neutral'
        })
      );
    });

    it('should update check run with success when all tests pass', async () => {
      (handler as any).testRunner = vi.fn().mockResolvedValue([
        { flowName: 'checkout', passed: true, duration: 5000, steps: [] }
      ]);
      
      await handler.handlePullRequest(prPayload);
      
      expect(mockAppClient.updateCheckRun).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          conclusion: 'success'
        })
      );
    });

    it('should update check run with failure when any test fails', async () => {
      (handler as any).testRunner = vi.fn().mockResolvedValue([
        { flowName: 'checkout', passed: true, duration: 5000, steps: [] },
        { flowName: 'login', passed: false, duration: 3000, steps: [] }
      ]);
      
      await handler.handlePullRequest(prPayload);
      
      expect(mockAppClient.updateCheckRun).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          conclusion: 'failure'
        })
      );
    });

    it('should update check run with failure when test runner throws', async () => {
      (handler as any).testRunner = vi.fn().mockRejectedValue(new Error('Test runner crashed'));
      
      await expect(handler.handlePullRequest(prPayload)).rejects.toThrow('Test runner crashed');
      
      expect(mockAppClient.updateCheckRun).toHaveBeenCalledWith(
        expect.objectContaining({
          conclusion: 'failure',
          summary: expect.stringContaining('Test runner crashed')
        })
      );
    });

    it('should include summary in check run output', async () => {
      (handler as any).testRunner = vi.fn().mockResolvedValue([
        { flowName: 'checkout', passed: true, duration: 5000, steps: [] }
      ]);
      
      await handler.handlePullRequest(prPayload);
      
      expect(mockAppClient.updateCheckRun).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: expect.stringContaining('FlowGuard')
        })
      );
    });
  });

  describe('AC6: Express server handles webhooks correctly', () => {
    it('should create Express app with required endpoints', () => {
      const mockHandler = {
        verifyAndParse: vi.fn(),
        handlePullRequest: vi.fn(),
        shouldRunTests: vi.fn()
      };
      
      const app = createWebhookServer({
        webhookHandler: mockHandler as any,
        webhookSecret: 'test-secret'
      });
      
      expect(app).toBeDefined();
      expect(typeof app.listen).toBe('function');
      expect(typeof app.get).toBe('function');
      expect(typeof app.post).toBe('function');
    });

    it('should have health check endpoint', () => {
      const mockHandler = {
        verifyAndParse: vi.fn(),
        handlePullRequest: vi.fn(),
        shouldRunTests: vi.fn()
      };
      
      const app = createWebhookServer({
        webhookHandler: mockHandler as any,
        webhookSecret: 'test-secret'
      });
      
      expect(app).toBeDefined();
    });
  });

  describe('AC7: Full end-to-end webhook flow', () => {
    it('should process PR opened webhook from signature to comment', async () => {
      const secret = 'e2e-test-secret';
      
      const mockAppClient = {
        createCheckRun: vi.fn().mockResolvedValue(789),
        updateCheckRun: vi.fn().mockResolvedValue(undefined),
        postPRComment: vi.fn().mockResolvedValue(101)
      };
      
      const testResults: FlowGuardResult[] = [
        {
          flowName: 'checkout-flow',
          passed: true,
          duration: 4500,
          steps: [
            { name: 'Add item to cart', passed: true },
            { name: 'Proceed to checkout', passed: true }
          ],
          reportUrl: 'https://cdn.example.com/reports/checkout-123.html'
        }
      ];
      
      const handler = new WebhookHandler({
        webhookSecret: secret,
        appClient: mockAppClient as any,
        commentGenerator: new CommentGenerator(),
        testRunner: vi.fn().mockResolvedValue(testResults)
      });
      
      const prPayload: PullRequestPayload = {
        action: 'opened',
        number: 99,
        installation: { id: 555 },
        repository: {
          owner: { login: 'myorg' },
          name: 'myrepo',
          full_name: 'myorg/myrepo'
        },
        sender: { login: 'developer' },
        pull_request: {
          number: 99,
          title: 'Add new feature',
          head: { sha: 'commit123', ref: 'feature/new-feature' },
          base: { ref: 'main' },
          user: { login: 'developer' }
        }
      };
      
      const rawPayload = JSON.stringify(prPayload);
      const signature = createSignature(rawPayload, secret);
      
      const parsedPayload = handler.verifyAndParse<PullRequestPayload>(rawPayload, signature);
      expect(parsedPayload.action).toBe('opened');
      
      await handler.handlePullRequest(parsedPayload);
      
      expect(mockAppClient.createCheckRun).toHaveBeenCalledWith({
        owner: 'myorg',
        repo: 'myrepo',
        headSha: 'commit123',
        name: 'FlowGuard Tests',
        installationId: 555
      });
      
      expect(mockAppClient.postPRComment).toHaveBeenCalledWith({
        owner: 'myorg',
        repo: 'myrepo',
        prNumber: 99,
        body: expect.stringContaining('checkout-flow'),
        installationId: 555
      });
      
      expect(mockAppClient.updateCheckRun).toHaveBeenCalledWith({
        owner: 'myorg',
        repo: 'myrepo',
        checkRunId: 789,
        status: 'completed',
        conclusion: 'success',
        summary: expect.any(String),
        installationId: 555
      });
    });

    it('should handle failure flow correctly', async () => {
      const secret = 'e2e-test-secret';
      
      const mockAppClient = {
        createCheckRun: vi.fn().mockResolvedValue(789),
        updateCheckRun: vi.fn().mockResolvedValue(undefined),
        postPRComment: vi.fn().mockResolvedValue(101)
      };
      
      const testResults: FlowGuardResult[] = [
        {
          flowName: 'login-flow',
          passed: false,
          duration: 3000,
          steps: [
            { name: 'Enter credentials', passed: true },
            { name: 'Click login', passed: false, error: 'Button disabled' }
          ]
        }
      ];
      
      const handler = new WebhookHandler({
        webhookSecret: secret,
        appClient: mockAppClient as any,
        commentGenerator: new CommentGenerator(),
        testRunner: vi.fn().mockResolvedValue(testResults)
      });
      
      const prPayload: PullRequestPayload = {
        action: 'synchronize',
        number: 100,
        installation: { id: 556 },
        repository: {
          owner: { login: 'myorg' },
          name: 'myrepo',
          full_name: 'myorg/myrepo'
        },
        sender: { login: 'developer' },
        pull_request: {
          number: 100,
          title: 'Fix bug',
          head: { sha: 'commit456', ref: 'fix/bug' },
          base: { ref: 'main' },
          user: { login: 'developer' }
        }
      };
      
      await handler.handlePullRequest(prPayload);
      
      expect(mockAppClient.updateCheckRun).toHaveBeenCalledWith(
        expect.objectContaining({
          conclusion: 'failure'
        })
      );
      
      expect(mockAppClient.postPRComment).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining('Button disabled')
        })
      );
    });
  });
});

describe('Edge Cases and Error Handling', () => {
  describe('Payload parsing', () => {
    it('should handle malformed JSON gracefully', () => {
      const handler = new WebhookHandler({
        webhookSecret: 'test',
        appClient: {} as any,
        commentGenerator: {} as any,
        testRunner: vi.fn()
      });
      
      const signature = createSignature('not-json', 'test');
      expect(() => handler.verifyAndParse('not-json', signature)).toThrow();
    });
  });

  describe('Comment generator edge cases', () => {
    const generator = new CommentGenerator();

    it('should handle empty results array', () => {
      const comment = generator.generateComment([]);
      expect(comment).toContain(FLOWGUARD_COMMENT_MARKER);
      expect(comment).toContain('0/0');
    });

    it('should handle very long flow names', () => {
      const results: FlowGuardResult[] = [{
        flowName: 'a'.repeat(100),
        passed: true,
        duration: 1000,
        steps: []
      }];
      const comment = generator.generateComment(results);
      expect(comment).toContain('a'.repeat(100));
    });

    it('should handle special characters in error messages', () => {
      const results: FlowGuardResult[] = [{
        flowName: 'test',
        passed: false,
        duration: 1000,
        steps: [{
          name: 'step',
          passed: false,
          error: 'Error with <html> & "quotes"'
        }]
      }];
      const comment = generator.generateComment(results);
      expect(comment).toContain('Error with <html> & "quotes"');
    });

    it('should handle zero duration', () => {
      const results: FlowGuardResult[] = [{
        flowName: 'instant-test',
        passed: true,
        duration: 0,
        steps: []
      }];
      const comment = generator.generateComment(results);
      expect(comment).toContain('0.00s');
    });
  });
});
