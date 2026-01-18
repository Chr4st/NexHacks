import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubAppClient } from '../app.js';
import type { GitHubAppConfig } from '../types.js';

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    issues: {
      listComments: vi.fn(),
      createComment: vi.fn(),
      updateComment: vi.fn()
    },
    checks: {
      create: vi.fn(),
      update: vi.fn()
    },
    pulls: {
      listFiles: vi.fn()
    }
  }))
}));

vi.mock('@octokit/auth-app', () => ({
  createAppAuth: vi.fn().mockReturnValue(vi.fn().mockResolvedValue({ token: 'mock-token' }))
}));

describe('GitHubAppClient', () => {
  const mockConfig: GitHubAppConfig = {
    appId: '12345',
    privateKey: '-----BEGIN RSA PRIVATE KEY-----\nmock-key\n-----END RSA PRIVATE KEY-----',
    webhookSecret: 'test-secret'
  };

  let client: GitHubAppClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new GitHubAppClient(mockConfig);
  });

  describe('constructor', () => {
    it('should create client with valid config', () => {
      expect(client).toBeDefined();
    });

    it('should throw on missing appId', () => {
      expect(() => new GitHubAppClient({ ...mockConfig, appId: '' }))
        .toThrow('appId is required');
    });

    it('should throw on missing privateKey', () => {
      expect(() => new GitHubAppClient({ ...mockConfig, privateKey: '' }))
        .toThrow('privateKey is required');
    });
  });

  describe('getInstallationOctokit', () => {
    it('should return authenticated Octokit instance', async () => {
      const octokit = await client.getInstallationOctokit(123456);
      expect(octokit).toBeDefined();
    });
  });

  describe('postPRComment', () => {
    it('should create new comment when none exists', async () => {
      const mockOctokit = await client.getInstallationOctokit(123);
      vi.mocked(mockOctokit.issues.listComments).mockResolvedValue({
        data: []
      } as any);
      vi.mocked(mockOctokit.issues.createComment).mockResolvedValue({
        data: { id: 999 }
      } as any);

      const commentId = await client.postPRComment({
        owner: 'testorg',
        repo: 'testrepo',
        prNumber: 42,
        body: 'Test comment',
        installationId: 123
      });

      expect(mockOctokit.issues.createComment).toHaveBeenCalledWith({
        owner: 'testorg',
        repo: 'testrepo',
        issue_number: 42,
        body: 'Test comment'
      });
      expect(commentId).toBe(999);
    });

    it('should update existing flowguard comment', async () => {
      const mockOctokit = await client.getInstallationOctokit(123);
      vi.mocked(mockOctokit.issues.listComments).mockResolvedValue({
        data: [
          { id: 888, body: '<!-- flowguard-report -->\nOld comment' }
        ]
      } as any);
      vi.mocked(mockOctokit.issues.updateComment).mockResolvedValue({
        data: { id: 888 }
      } as any);

      const commentId = await client.postPRComment({
        owner: 'testorg',
        repo: 'testrepo',
        prNumber: 42,
        body: '<!-- flowguard-report -->\nNew comment',
        installationId: 123
      });

      expect(mockOctokit.issues.updateComment).toHaveBeenCalledWith({
        owner: 'testorg',
        repo: 'testrepo',
        comment_id: 888,
        body: '<!-- flowguard-report -->\nNew comment'
      });
      expect(commentId).toBe(888);
    });
  });

  describe('createCheckRun', () => {
    it('should create check run in queued status', async () => {
      const mockOctokit = await client.getInstallationOctokit(123);
      vi.mocked(mockOctokit.checks.create).mockResolvedValue({
        data: { id: 777 }
      } as any);

      const checkRunId = await client.createCheckRun({
        owner: 'testorg',
        repo: 'testrepo',
        headSha: 'abc123',
        name: 'FlowGuard Tests',
        installationId: 123
      });

      expect(mockOctokit.checks.create).toHaveBeenCalledWith({
        owner: 'testorg',
        repo: 'testrepo',
        name: 'FlowGuard Tests',
        head_sha: 'abc123',
        status: 'queued'
      });
      expect(checkRunId).toBe(777);
    });
  });

  describe('updateCheckRun', () => {
    it('should update check run with success conclusion', async () => {
      const mockOctokit = await client.getInstallationOctokit(123);
      vi.mocked(mockOctokit.checks.update).mockResolvedValue({} as any);

      await client.updateCheckRun({
        owner: 'testorg',
        repo: 'testrepo',
        checkRunId: 777,
        status: 'completed',
        conclusion: 'success',
        summary: 'All tests passed',
        installationId: 123
      });

      expect(mockOctokit.checks.update).toHaveBeenCalledWith({
        owner: 'testorg',
        repo: 'testrepo',
        check_run_id: 777,
        status: 'completed',
        conclusion: 'success',
        output: {
          title: 'FlowGuard Test Results',
          summary: 'All tests passed'
        }
      });
    });

    it('should update check run with failure conclusion', async () => {
      const mockOctokit = await client.getInstallationOctokit(123);
      vi.mocked(mockOctokit.checks.update).mockResolvedValue({} as any);

      await client.updateCheckRun({
        owner: 'testorg',
        repo: 'testrepo',
        checkRunId: 777,
        status: 'completed',
        conclusion: 'failure',
        summary: '2 tests failed',
        installationId: 123
      });

      expect(mockOctokit.checks.update).toHaveBeenCalledWith(
        expect.objectContaining({
          conclusion: 'failure'
        })
      );
    });
  });

  describe('getPRFiles', () => {
    it('should return list of changed files', async () => {
      const mockOctokit = await client.getInstallationOctokit(123);
      vi.mocked(mockOctokit.pulls.listFiles).mockResolvedValue({
        data: [
          { filename: 'src/index.ts' },
          { filename: 'flows/checkout.yaml' },
          { filename: 'package.json' }
        ]
      } as any);

      const files = await client.getPRFiles({
        owner: 'testorg',
        repo: 'testrepo',
        prNumber: 42,
        installationId: 123
      });

      expect(files).toEqual(['src/index.ts', 'flows/checkout.yaml', 'package.json']);
    });
  });
});
