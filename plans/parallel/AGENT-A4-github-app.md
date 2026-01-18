# Agent B4: GitHub App + Webhooks — Detailed Specification

**AI Tool:** Amp (Free Tier)
**Branch:** `feat/github-app-webhooks`
**Priority:** P2 (CI/CD Integration)
**Developer:** Team B (Developer 2)
**Dependencies:** None (Independent - Can start Day 1)
**Estimated Effort:** 2 days

---

## Mission

Build **GitHub integration** to run FlowGuard automatically on PRs:

1. **GitHub App** authentication and installation
2. **Webhook server** to receive PR events
3. **PR comments** with test results and reports
4. **Check runs** to block merging on failures
5. **GitHub Actions workflow** for CI/CD

This module enables **"Test on every PR"** automation and makes FlowGuard a real CI/CD tool.

---

## GitHub Features Used

### GitHub App
- **Authentication:** Private key JWT signing
- **Permissions:** Read/write on PRs, checks, contents
- **Events:** `pull_request`, `push`

### Webhooks
- **Signature verification:** HMAC SHA-256
- **Event handling:** PR opened, synchronized, closed
- **Payload parsing:** Extract PR info

### Check Runs API
- **Status:** queued, in_progress, completed
- **Conclusion:** success, failure, neutral
- **Annotations:** Highlight specific failures

### PR Comments API
- **Post results:** Markdown-formatted test reports
- **Update comments:** Edit existing comment on re-run

---

## File Structure

```
src/
├── github/
│   ├── app.ts                   # GitHub App client
│   ├── webhook-handler.ts       # Webhook verification & routing
│   ├── server.ts                # Express webhook server
│   ├── comment-generator.ts     # PR comment formatter
│   ├── check-runs.ts            # Check Runs API client
│   ├── types.ts                 # TypeScript interfaces
│   ├── index.ts                 # Public exports
│   └── __tests__/
│       ├── webhook.test.ts
│       ├── signature.test.ts
│       └── comment.test.ts
│
.github/
└── workflows/
    └── flowguard.yml            # GitHub Actions workflow

docs/
└── GITHUB_APP_SETUP.md          # Installation guide
```

---

## Core Deliverables

### 1. GitHub App Client

**File:** `src/github/app.ts`

**Objective:** Authenticate and interact with GitHub API

```typescript
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import fs from 'fs/promises';

export class GitHubAppClient {
  private octokit: Octokit;
  private appId: string;
  private privateKey: string;

  constructor(appId: string, privateKeyPath: string) {
    this.appId = appId;
    this.loadPrivateKey(privateKeyPath);
  }

  private async loadPrivateKey(path: string) {
    this.privateKey = await fs.readFile(path, 'utf-8');
  }

  /**
   * Get authenticated Octokit instance for installation.
   */
  async getInstallationClient(installationId: number): Promise<Octokit> {
    const auth = createAppAuth({
      appId: this.appId,
      privateKey: this.privateKey,
      installationId
    });

    return new Octokit({ auth });
  }

  /**
   * Post comment on PR.
   */
  async postPRComment(
    owner: string,
    repo: string,
    prNumber: number,
    body: string,
    installationId: number
  ): Promise<number> {
    const octokit = await this.getInstallationClient(installationId);

    // Check if FlowGuard comment already exists
    const { data: comments } = await octokit.issues.listComments({
      owner,
      repo,
      issue_number: prNumber
    });

    const existingComment = comments.find(c =>
      c.body?.includes('<!-- flowguard-report -->')
    );

    if (existingComment) {
      // Update existing comment
      await octokit.issues.updateComment({
        owner,
        repo,
        comment_id: existingComment.id,
        body
      });
      return existingComment.id;
    } else {
      // Create new comment
      const { data: comment } = await octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body
      });
      return comment.id;
    }
  }

  /**
   * Create check run.
   */
  async createCheckRun(
    owner: string,
    repo: string,
    headSha: string,
    name: string,
    installationId: number
  ): Promise<number> {
    const octokit = await this.getInstallationClient(installationId);

    const { data: checkRun } = await octokit.checks.create({
      owner,
      repo,
      name,
      head_sha: headSha,
      status: 'queued'
    });

    return checkRun.id;
  }

  /**
   * Update check run with results.
   */
  async updateCheckRun(
    owner: string,
    repo: string,
    checkRunId: number,
    status: 'completed',
    conclusion: 'success' | 'failure' | 'neutral',
    summary: string,
    installationId: number
  ): Promise<void> {
    const octokit = await this.getInstallationClient(installationId);

    await octokit.checks.update({
      owner,
      repo,
      check_run_id: checkRunId,
      status,
      conclusion,
      output: {
        title: 'FlowGuard Test Results',
        summary,
        text: summary
      }
    });
  }

  /**
   * Get PR files changed.
   */
  async getPRFiles(
    owner: string,
    repo: string,
    prNumber: number,
    installationId: number
  ): Promise<string[]> {
    const octokit = await this.getInstallationClient(installationId);

    const { data: files } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber
    });

    return files.map(f => f.filename);
  }
}
```

---

### 2. Webhook Handler

**File:** `src/github/webhook-handler.ts`

**Objective:** Verify and handle GitHub webhooks

```typescript
import crypto from 'crypto';
import { GitHubAppClient } from './app.js';
import { CommentGenerator } from './comment-generator.js';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export class GitHubWebhookHandler {
  constructor(
    private webhookSecret: string,
    private appClient: GitHubAppClient,
    private commentGenerator: CommentGenerator
  ) {}

  /**
   * Verify webhook signature.
   */
  verifySignature(payload: string, signature: string): boolean {
    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Handle pull_request event.
   */
  async handlePullRequest(payload: any): Promise<void> {
    const { action, pull_request, installation, repository } = payload;

    // Only handle opened and synchronize events
    if (!['opened', 'synchronize'].includes(action)) {
      console.log(`Skipping PR action: ${action}`);
      return;
    }

    const owner = repository.owner.login;
    const repo = repository.name;
    const prNumber = pull_request.number;
    const headSha = pull_request.head.sha;
    const installationId = installation.id;

    console.log(`📋 Processing PR #${prNumber} (${action})`);

    // Create check run
    const checkRunId = await this.appClient.createCheckRun(
      owner,
      repo,
      headSha,
      'FlowGuard Tests',
      installationId
    );

    try {
      // Run FlowGuard tests
      const results = await this.runFlowGuardTests(owner, repo, prNumber, headSha);

      // Generate comment
      const comment = this.commentGenerator.generatePRComment(results);

      // Post comment
      await this.appClient.postPRComment(owner, repo, prNumber, comment, installationId);

      // Update check run
      const conclusion = results.passed ? 'success' : 'failure';
      const summary = `${results.totalSteps} steps tested, ${results.passedSteps} passed, ${results.failedSteps} failed`;

      await this.appClient.updateCheckRun(
        owner,
        repo,
        checkRunId,
        'completed',
        conclusion,
        summary,
        installationId
      );

      console.log(`✅ PR #${prNumber} processed successfully (${conclusion})`);
    } catch (error) {
      console.error(`❌ Error processing PR #${prNumber}:`, error);

      // Update check run with failure
      await this.appClient.updateCheckRun(
        owner,
        repo,
        checkRunId,
        'completed',
        'failure',
        `Error running FlowGuard tests: ${error instanceof Error ? error.message : 'Unknown error'}`,
        installationId
      );
    }
  }

  /**
   * Run FlowGuard tests for PR.
   */
  private async runFlowGuardTests(
    owner: string,
    repo: string,
    prNumber: number,
    headSha: string
  ): Promise<TestResults> {
    // Clone repo and checkout PR
    await execAsync(`git clone https://github.com/${owner}/${repo}.git /tmp/${repo}-${prNumber}`);
    await execAsync(`cd /tmp/${repo}-${prNumber} && git checkout ${headSha}`);

    // Run FlowGuard
    const { stdout } = await execAsync(
      `cd /tmp/${repo}-${prNumber} && flowguard run --all --format json`
    );

    const results = JSON.parse(stdout);

    // Cleanup
    await execAsync(`rm -rf /tmp/${repo}-${prNumber}`);

    return {
      passed: results.every((r: any) => r.passed),
      totalSteps: results.reduce((sum: number, r: any) => sum + r.totalSteps, 0),
      passedSteps: results.reduce((sum: number, r: any) => sum + r.passedSteps, 0),
      failedSteps: results.reduce((sum: number, r: any) => sum + r.failedSteps, 0),
      flows: results
    };
  }
}

export interface TestResults {
  passed: boolean;
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  flows: any[];
}
```

---

### 3. Express Webhook Server

**File:** `src/github/server.ts`

**Objective:** HTTP server to receive GitHub webhooks

```typescript
import express from 'express';
import { GitHubWebhookHandler } from './webhook-handler.js';

export function createWebhookServer(
  handler: GitHubWebhookHandler,
  port: number = 3000
): express.Application {
  const app = express();

  // Raw body for signature verification
  app.use(express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf.toString('utf-8');
    }
  }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'flowguard-webhooks' });
  });

  // Webhook endpoint
  app.post('/webhooks/github', async (req, res) => {
    const signature = req.headers['x-hub-signature-256'] as string;
    const event = req.headers['x-github-event'] as string;

    // Verify signature
    if (!handler.verifySignature((req as any).rawBody, signature)) {
      console.error('❌ Invalid webhook signature');
      return res.status(401).send('Invalid signature');
    }

    console.log(`📨 Received webhook: ${event}`);

    // Handle event
    try {
      if (event === 'pull_request') {
        // Process asynchronously
        handler.handlePullRequest(req.body).catch(err => {
          console.error('Error handling PR webhook:', err);
        });

        // Respond immediately
        res.status(202).send('Accepted');
      } else {
        res.status(200).send('Event ignored');
      }
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).send('Internal error');
    }
  });

  return app;
}

export function startWebhookServer(
  handler: GitHubWebhookHandler,
  port: number = 3000
): void {
  const app = createWebhookServer(handler, port);

  app.listen(port, () => {
    console.log(`🚀 FlowGuard webhook server listening on port ${port}`);
    console.log(`   Health: http://localhost:${port}/health`);
    console.log(`   Webhook: http://localhost:${port}/webhooks/github`);
  });
}
```

---

### 4. PR Comment Generator

**File:** `src/github/comment-generator.ts`

**Objective:** Generate beautiful Markdown comments for PRs

```typescript
export class CommentGenerator {
  generatePRComment(results: TestResults): string {
    const { passed, totalSteps, passedSteps, failedSteps, flows } = results;

    const emoji = passed ? '✅' : '❌';
    const status = passed ? 'All tests passed!' : 'Some tests failed';

    let comment = `<!-- flowguard-report -->\n\n`;
    comment += `## ${emoji} FlowGuard Test Results\n\n`;
    comment += `**Status:** ${status}\n\n`;
    comment += `### Summary\n\n`;
    comment += `| Metric | Value |\n`;
    comment += `|--------|-------|\n`;
    comment += `| **Total Steps** | ${totalSteps} |\n`;
    comment += `| **Passed** | ${passedSteps} ${passedSteps === totalSteps ? '✅' : ''} |\n`;
    comment += `| **Failed** | ${failedSteps} ${failedSteps > 0 ? '❌' : ''} |\n\n`;

    // Flow breakdown
    comment += `### Flow Results\n\n`;

    flows.forEach(flow => {
      const flowEmoji = flow.passed ? '✅' : '❌';
      comment += `<details>\n`;
      comment += `<summary>${flowEmoji} <strong>${flow.name}</strong> (${flow.passedSteps}/${flow.totalSteps} passed)</summary>\n\n`;

      flow.steps.forEach((step: any, i: number) => {
        const stepEmoji = step.verdict ? '✅' : '❌';
        comment += `${i + 1}. ${stepEmoji} ${step.action}\n`;

        if (!step.verdict) {
          comment += `   - **Assertion:** ${step.assertion}\n`;
          comment += `   - **Reason:** ${step.reasoning}\n`;
        }
      });

      comment += `\n</details>\n\n`;
    });

    // Footer
    comment += `---\n`;
    comment += `🤖 Generated by [FlowGuard](https://github.com/YOUR_ORG/flowguard) | [View Full Report](#)\n`;

    return comment;
  }
}
```

---

### 5. GitHub Actions Workflow

**File:** `.github/workflows/flowguard.yml`

**Objective:** Run FlowGuard on every PR

```yaml
name: FlowGuard Tests

on:
  pull_request:
    types: [opened, synchronize, reopened]
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Install FlowGuard
        run: npm install -g flowguard

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run FlowGuard tests
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          MONGODB_URI: ${{ secrets.MONGODB_URI }}
          PHOENIX_ENDPOINT: ${{ secrets.PHOENIX_ENDPOINT }}
          DO_SPACES_KEY: ${{ secrets.DO_SPACES_KEY }}
          DO_SPACES_SECRET: ${{ secrets.DO_SPACES_SECRET }}
          DO_SPACES_BUCKET: ${{ secrets.DO_SPACES_BUCKET }}
          DO_SPACES_REGION: ${{ secrets.DO_SPACES_REGION }}
        run: flowguard run --all

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: flowguard-results
          path: |
            tmp/screenshots/
            tmp/reports/

      - name: Comment PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('tmp/results.json', 'utf8'));

            const passed = results.every(r => r.passed);
            const emoji = passed ? '✅' : '❌';

            const body = `${emoji} **FlowGuard Tests ${passed ? 'Passed' : 'Failed'}**`;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body
            });
```

---

## Testing

**File:** `src/github/__tests__/webhook.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals';
import { GitHubWebhookHandler } from '../webhook-handler.js';
import crypto from 'crypto';

describe('GitHubWebhookHandler', () => {
  const webhookSecret = 'test-secret';
  const handler = new GitHubWebhookHandler(
    webhookSecret,
    {} as any, // Mock app client
    {} as any  // Mock comment generator
  );

  describe('verifySignature', () => {
    it('should verify valid signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const signature = 'sha256=' + crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      expect(handler.verifySignature(payload, signature)).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const signature = 'sha256=invalid';

      expect(handler.verifySignature(payload, signature)).toBe(false);
    });

    it('should reject tampered payload', () => {
      const payload = JSON.stringify({ test: 'data' });
      const signature = 'sha256=' + crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      const tamperedPayload = JSON.stringify({ test: 'tampered' });

      expect(handler.verifySignature(tamperedPayload, signature)).toBe(false);
    });
  });
});
```

---

## Documentation

**File:** `docs/GITHUB_APP_SETUP.md`

```markdown
# GitHub App Setup Guide

## 1. Create GitHub App

1. Go to GitHub → Settings → Developer settings → GitHub Apps
2. Click "New GitHub App"
3. Fill in details:
   - **Name:** FlowGuard (your-org)
   - **Homepage URL:** https://github.com/YOUR_ORG/flowguard
   - **Webhook URL:** https://your-server.com/webhooks/github
   - **Webhook secret:** Generate a random string

4. Set permissions:
   - **Pull requests:** Read & write
   - **Checks:** Read & write
   - **Contents:** Read-only
   - **Issues:** Read & write

5. Subscribe to events:
   - `pull_request`
   - `push`

6. Create app

## 2. Generate Private Key

1. Scroll down to "Private keys"
2. Click "Generate a private key"
3. Save the `.pem` file securely
4. Add to `.env`:
   ```bash
   GITHUB_APP_ID=<app-id>
   GITHUB_PRIVATE_KEY_PATH=./github-app-private-key.pem
   GITHUB_WEBHOOK_SECRET=<webhook-secret>
   ```

## 3. Install App

1. Go to app page → Install App
2. Select your organization/repository
3. Grant access

## 4. Deploy Webhook Server

```bash
# Using DigitalOcean Droplet
doctl apps create --spec webhook-server.yaml

# Or run locally with ngrok
ngrok http 3000
# Update webhook URL in GitHub App settings
```

## 5. Test Webhook

1. Open a PR in your repository
2. Check webhook server logs
3. Verify PR comment appears
4. Verify check run created
```

---

## Acceptance Criteria

- [ ] GitHub App authenticates successfully
- [ ] Webhook signature verification works
- [ ] PR webhooks trigger FlowGuard runs
- [ ] PR comments posted with results
- [ ] Check runs block merge on failures
- [ ] GitHub Actions workflow runs on PRs
- [ ] Tests pass with mocked webhooks
- [ ] Documentation complete

---

## Dependencies

**Depends on:** None (Independent!)

**Integrates with:**
- All agents - Runs all FlowGuard tests on PRs

---

## Quick Start

```bash
# Create branch (Can start Day 1!)
git checkout -b feat/github-app-webhooks

# Install dependencies
npm install @octokit/rest @octokit/auth-app express

# Create GitHub App (see docs/GITHUB_APP_SETUP.md)

# Start webhook server
npm run build
node dist/github/server.js

# Test with ngrok
ngrok http 3000

# Run tests
npm test src/github
```

---

## Success Metrics

- ✅ Webhooks receive events reliably
- ✅ PR comments appear within 30s
- ✅ Check runs block merges correctly
- ✅ GitHub Actions workflow passes
- ✅ Full CI/CD integration works

**This module makes FlowGuard a real CI/CD tool!** 🚀
