import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import type { GitHubAppConfig } from './types.js';
import { FLOWGUARD_COMMENT_MARKER } from './types.js';

export interface PostCommentParams {
  owner: string;
  repo: string;
  prNumber: number;
  body: string;
  installationId: number;
}

export interface CreateCheckRunParams {
  owner: string;
  repo: string;
  headSha: string;
  name: string;
  installationId: number;
}

export interface UpdateCheckRunParams {
  owner: string;
  repo: string;
  checkRunId: number;
  status: 'completed';
  conclusion: 'success' | 'failure' | 'neutral';
  summary: string;
  installationId: number;
}

export interface GetPRFilesParams {
  owner: string;
  repo: string;
  prNumber: number;
  installationId: number;
}

export class GitHubAppClient {
  private appId: string;
  private privateKey: string;
  private installationClients: Map<number, Octokit> = new Map();

  constructor(config: GitHubAppConfig) {
    if (!config.appId) {
      throw new Error('appId is required');
    }
    if (!config.privateKey) {
      throw new Error('privateKey is required');
    }

    this.appId = config.appId;
    this.privateKey = config.privateKey;
  }

  async getInstallationOctokit(installationId: number): Promise<Octokit> {
    if (this.installationClients.has(installationId)) {
      return this.installationClients.get(installationId)!;
    }

    const octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: this.appId,
        privateKey: this.privateKey,
        installationId
      }
    });

    this.installationClients.set(installationId, octokit);
    return octokit;
  }

  async postPRComment(params: PostCommentParams): Promise<number> {
    const { owner, repo, prNumber, body, installationId } = params;
    const octokit = await this.getInstallationOctokit(installationId);

    const { data: comments } = await octokit.issues.listComments({
      owner,
      repo,
      issue_number: prNumber
    });

    const existingComment = comments.find(c =>
      c.body?.includes(FLOWGUARD_COMMENT_MARKER)
    );

    if (existingComment) {
      await octokit.issues.updateComment({
        owner,
        repo,
        comment_id: existingComment.id,
        body
      });
      return existingComment.id;
    } else {
      const { data: comment } = await octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body
      });
      return comment.id;
    }
  }

  async createCheckRun(params: CreateCheckRunParams): Promise<number> {
    const { owner, repo, headSha, name, installationId } = params;
    const octokit = await this.getInstallationOctokit(installationId);

    const { data: checkRun } = await octokit.checks.create({
      owner,
      repo,
      name,
      head_sha: headSha,
      status: 'queued'
    });

    return checkRun.id;
  }

  async updateCheckRun(params: UpdateCheckRunParams): Promise<void> {
    const { owner, repo, checkRunId, status, conclusion, summary, installationId } = params;
    const octokit = await this.getInstallationOctokit(installationId);

    await octokit.checks.update({
      owner,
      repo,
      check_run_id: checkRunId,
      status,
      conclusion,
      output: {
        title: 'FlowGuard Test Results',
        summary
      }
    });
  }

  async getPRFiles(params: GetPRFilesParams): Promise<string[]> {
    const { owner, repo, prNumber, installationId } = params;
    const octokit = await this.getInstallationOctokit(installationId);

    const { data: files } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber
    });

    return files.map(f => f.filename);
  }
}
