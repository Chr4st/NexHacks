import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebhookHandler } from '../webhook-handler.js';
import { createSignature } from '../signature.js';
import type { PullRequestPayload } from '../types.js';

const mockAppClient = {
  postPRComment: vi.fn().mockResolvedValue(123),
  createCheckRun: vi.fn().mockResolvedValue(456),
  updateCheckRun: vi.fn().mockResolvedValue(undefined),
  getPRFiles: vi.fn().mockResolvedValue(['src/index.ts'])
};

const mockCommentGenerator = {
  generateComment: vi.fn().mockReturnValue('<!-- flowguard-report -->\nTest comment'),
  generateCheckRunSummary: vi.fn().mockReturnValue('# Summary')
};

const mockTestRunner = vi.fn().mockResolvedValue([
  { flowName: 'checkout', passed: true, duration: 5000, steps: [] }
]);

describe('WebhookHandler', () => {
  const webhookSecret = 'test-secret';
  let handler: WebhookHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new WebhookHandler({
      webhookSecret,
      appClient: mockAppClient as any,
      commentGenerator: mockCommentGenerator as any,
      testRunner: mockTestRunner
    });
  });

  describe('verifyAndParse', () => {
    it('should verify valid signature and parse payload', () => {
      const payload: PullRequestPayload = {
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
          head: { sha: 'abc123', ref: 'feature-branch' },
          base: { ref: 'main' },
          user: { login: 'testuser' }
        }
      };

      const body = JSON.stringify(payload);
      const signature = createSignature(body, webhookSecret);

      const result = handler.verifyAndParse(body, signature);

      expect(result).toEqual(payload);
    });

    it('should throw on invalid signature', () => {
      const payload = JSON.stringify({ action: 'opened' });
      const invalidSignature = 'sha256=invalid';

      expect(() => handler.verifyAndParse(payload, invalidSignature))
        .toThrow('Invalid webhook signature');
    });

    it('should throw on missing signature', () => {
      const payload = JSON.stringify({ action: 'opened' });

      expect(() => handler.verifyAndParse(payload, ''))
        .toThrow('Invalid webhook signature');
    });
  });

  describe('handlePullRequest', () => {
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
        title: 'Add new feature',
        head: { sha: 'abc123', ref: 'feature-branch' },
        base: { ref: 'main' },
        user: { login: 'testuser' }
      }
    };

    it('should handle PR opened event', async () => {
      await handler.handlePullRequest(prPayload);

      expect(mockAppClient.createCheckRun).toHaveBeenCalledWith({
        owner: 'testorg',
        repo: 'testrepo',
        headSha: 'abc123',
        name: 'FlowGuard Tests',
        installationId: 123
      });
    });

    it('should run tests and post comment', async () => {
      await handler.handlePullRequest(prPayload);

      expect(mockTestRunner).toHaveBeenCalled();
      expect(mockCommentGenerator.generateComment).toHaveBeenCalled();
      expect(mockAppClient.postPRComment).toHaveBeenCalledWith({
        owner: 'testorg',
        repo: 'testrepo',
        prNumber: 42,
        body: expect.stringContaining('flowguard-report'),
        installationId: 123
      });
    });

    it('should update check run with success on passing tests', async () => {
      mockTestRunner.mockResolvedValueOnce([
        { flowName: 'checkout', passed: true, duration: 5000, steps: [] }
      ]);

      await handler.handlePullRequest(prPayload);

      expect(mockAppClient.updateCheckRun).toHaveBeenCalledWith({
        owner: 'testorg',
        repo: 'testrepo',
        checkRunId: 456,
        status: 'completed',
        conclusion: 'success',
        summary: expect.any(String),
        installationId: 123
      });
    });

    it('should update check run with failure on failing tests', async () => {
      mockTestRunner.mockResolvedValueOnce([
        { flowName: 'checkout', passed: false, duration: 5000, steps: [] }
      ]);

      await handler.handlePullRequest(prPayload);

      expect(mockAppClient.updateCheckRun).toHaveBeenCalledWith(
        expect.objectContaining({
          conclusion: 'failure'
        })
      );
    });

    it('should handle synchronize event (PR updated)', async () => {
      const syncPayload = { ...prPayload, action: 'synchronize' as const };

      await handler.handlePullRequest(syncPayload);

      expect(mockTestRunner).toHaveBeenCalled();
    });

    it('should handle reopened event', async () => {
      const reopenedPayload = { ...prPayload, action: 'reopened' as const };

      await handler.handlePullRequest(reopenedPayload);

      expect(mockTestRunner).toHaveBeenCalled();
    });

    it('should skip closed PR event', async () => {
      const closedPayload = { ...prPayload, action: 'closed' as const };

      await handler.handlePullRequest(closedPayload);

      expect(mockTestRunner).not.toHaveBeenCalled();
    });
  });

  describe('shouldRunTests', () => {
    it('should return true for opened action', () => {
      expect(handler.shouldRunTests('opened')).toBe(true);
    });

    it('should return true for synchronize action', () => {
      expect(handler.shouldRunTests('synchronize')).toBe(true);
    });

    it('should return true for reopened action', () => {
      expect(handler.shouldRunTests('reopened')).toBe(true);
    });

    it('should return false for closed action', () => {
      expect(handler.shouldRunTests('closed')).toBe(false);
    });

    it('should return false for unknown action', () => {
      expect(handler.shouldRunTests('labeled' as any)).toBe(false);
    });
  });
});
