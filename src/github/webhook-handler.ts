import { verifyWebhookSignature } from './signature.js';
import type { GitHubAppClient } from './app.js';
import type { CommentGenerator } from './comment-generator.js';
import type { PullRequestPayload, FlowGuardResult, WebhookPayload } from './types.js';

export type TestRunner = () => Promise<FlowGuardResult[]>;

export interface WebhookHandlerConfig {
  webhookSecret: string;
  appClient: GitHubAppClient;
  commentGenerator: CommentGenerator;
  testRunner: TestRunner;
}

const TESTABLE_ACTIONS = ['opened', 'synchronize', 'reopened'];

export class WebhookHandler {
  private webhookSecret: string;
  private appClient: GitHubAppClient;
  private commentGenerator: CommentGenerator;
  private testRunner: TestRunner;

  constructor(config: WebhookHandlerConfig) {
    this.webhookSecret = config.webhookSecret;
    this.appClient = config.appClient;
    this.commentGenerator = config.commentGenerator;
    this.testRunner = config.testRunner;
  }

  verifyAndParse<T extends WebhookPayload>(body: string, signature: string): T {
    const isValid = verifyWebhookSignature(body, signature, this.webhookSecret);
    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }
    return JSON.parse(body) as T;
  }

  shouldRunTests(action: string): boolean {
    return TESTABLE_ACTIONS.includes(action);
  }

  async handlePullRequest(payload: PullRequestPayload): Promise<void> {
    const { action, installation, repository, pull_request } = payload;
    const { owner, name: repo } = repository;
    const installationId = installation.id;
    const prNumber = pull_request.number;
    const headSha = pull_request.head.sha;

    if (!this.shouldRunTests(action)) {
      return;
    }

    const checkRunId = await this.appClient.createCheckRun({
      owner: owner.login,
      repo,
      headSha,
      name: 'FlowGuard Tests',
      installationId
    });

    try {
      const results = await this.testRunner();

      const allPassed = results.length > 0 && results.every(r => r.passed);
      const conclusion = allPassed ? 'success' : (results.length === 0 ? 'neutral' : 'failure');

      const comment = this.commentGenerator.generateComment(results);
      await this.appClient.postPRComment({
        owner: owner.login,
        repo,
        prNumber,
        body: comment,
        installationId
      });

      const summary = this.commentGenerator.generateCheckRunSummary(results);
      await this.appClient.updateCheckRun({
        owner: owner.login,
        repo,
        checkRunId,
        status: 'completed',
        conclusion,
        summary,
        installationId
      });
    } catch (error) {
      await this.appClient.updateCheckRun({
        owner: owner.login,
        repo,
        checkRunId,
        status: 'completed',
        conclusion: 'failure',
        summary: `Error running tests: ${error instanceof Error ? error.message : String(error)}`,
        installationId
      });
      throw error;
    }
  }
}
