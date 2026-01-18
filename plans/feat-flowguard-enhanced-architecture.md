# FlowGuard AI — Enhanced Architecture & Sponsor Integration Plan

**Type:** Feature Enhancement
**Priority:** P0 (NexHacks 2026 Critical)
**Created:** 2026-01-17
**Target:** Complete integration of sponsor tracks for maximum prize potential

---

## Executive Summary

**Transform FlowGuard from local MVP to cloud-native platform with HEAVY sponsor integration**

### Core Mandates
1. ✅ **MongoDB Atlas = PRIMARY storage** (delete all JSON file writes)
2. ✅ **Cloud-first execution** (DigitalOcean/Browserbase defaults, not local)
3. ✅ **Phoenix HEAVY** (trace everything, run experiments continuously, show accuracy gains)
4. ✅ **CrUX + Wood Wide CORE** (every report includes RUM + statistical analysis)
5. ✅ **Agent-native design** (all commands → JSON, MCP-ready, self-improving)

### Prize Strategy
- **Arize Phoenix ($1,000):** Experiments show 72% → 91% accuracy improvement
- **MongoDB Atlas ($750):** Time-series + cache = $450/month API savings
- **DigitalOcean ($500):** 100% cloud execution, 5000+ tests/week
- **Browserbase ($500):** All CI tests with session recordings
- **Wood Wide AI ($750):** Statistical validation of all UX claims

**Target:** $3,500+ in prizes through DEEP integration, not checkbox features

---

## Overview

Enhance FlowGuard AI with comprehensive sponsor track integrations, production-ready architecture patterns, and advanced observability features. This plan transforms the current MVP into a complete developer tool platform that maximizes NexHacks 2026 prize potential across multiple sponsor tracks.

**Current State:** Basic CLI with vision analysis, Phoenix tracing, and static reports (JSON storage, local-only)
**Target State:** Cloud-native UX reliability platform with MongoDB as primary storage, DigitalOcean/Browserbase execution, and deep Phoenix/CrUX/Wood Wide AI integration for sponsor track excellence

---

## Problem Statement

The current FlowGuard MVP is functional but missing critical integrations for sponsor tracks and production readiness:

### Missing Capabilities
1. **No database** - Results in JSON files; no queries, trends, or analytics
2. **Local-only execution** - No cloud runners, CI/CD, or scale
3. **Underutilized sponsors** - Phoenix has basic tracing only; CrUX/Wood Wide barely used
4. **No automation** - Manual CLI execution; no GitHub PR integration
5. **No cost optimization** - Every screenshot = new API call; no caching
6. **No production readiness** - No multi-tenancy, auth, or monitoring

### Prize Track Requirements Not Met

| Track | Prize | Current Gap | Target State |
|-------|-------|-------------|--------------|
| Arize Phoenix | $1,000 | Basic tracing only | Experiments, evaluation loops, A/B testing, accuracy dashboards |
| MongoDB Atlas | $750 | Not integrated | Primary storage, time-series, caching, Atlas Search, trends |
| DigitalOcean | $500 | Not deployed | Default cloud execution, Functions, Spaces, App Platform |
| Browserbase | $500 | Not integrated | Cloud browser execution, session recordings, CI/CD |
| Wood Wide AI | $750 | Barely functional | Core insight engine, statistical analysis, anomaly detection |

**Total Unclaimed Prize Money:** $3,500+

---

## Proposed Solution

Transform FlowGuard into a complete UX reliability platform with six core enhancements:

### 1. MongoDB Atlas as Primary Storage (Priority 1)
**Replace JSON files entirely with MongoDB**
- Time-series collections for ALL test results and metrics
- Vision cache to reduce API costs by 80%+
- Flow definitions with Atlas Search for discovery
- Historical trend analysis and anomaly detection
- Cost tracking and usage analytics per tenant/flow

### 2. Arize Phoenix Heavy Integration (Priority 1)
**Make Phoenix central to UX reliability, not just logging**
- Experiment tracking for continuous prompt optimization
- Evaluation loops to improve accuracy from 72% → 90%+
- A/B testing infrastructure for all AI decisions
- Confidence calibration based on production feedback
- Trace every vision call, decision, and outcome

### 3. DigitalOcean Cloud-First Infrastructure (Priority 1)
**Default to cloud execution, not local**
- Functions as default webhook/analysis handlers
- Spaces as primary screenshot/report storage (not local files)
- App Platform for production dashboard deployment
- Droplets for scheduled and CI test execution
- All environments (dev/staging/prod) run on DO

### 4. Browserbase Cloud Testing (Priority 2)
**Real browsers in cloud, not local Chrome**
- Cloud browser execution for all CI/CD tests
- Session recordings for every test run (debugging)
- Cross-device/browser matrix testing
- Replace local Playwright in production

### 5. GitHub App Integration
- Webhook handling for PR events
- Automated UX testing on pull requests
- Check runs with rich feedback
- PR comments with FlowGuard insights

### 6. CrUX & Wood Wide as Core Insight Engine (Priority 1)
**Not optional integrations - core to value prop**
- CrUX real user metrics for every flow URL
- Wood Wide for ALL statistical claims ("UX improved by X%")
- Trend detection with statistical significance testing
- Anomaly alerts powered by Wood Wide analysis
- Every report includes CrUX baseline + Wood Wide insights

---

## Key Architecture Decisions

### 1. MongoDB-First Storage (No JSON Files)
- **Before:** Results in `.flowguard/runs/*.json`, screenshots in `screenshots/`
- **After:** ALL data in MongoDB (time-series collections, vision cache, flow definitions)
- **Why:** Queryable history, trend analysis, cost optimization through caching

### 2. Cloud-First Execution (No Local Default)
- **Before:** Local Playwright, manual CLI execution
- **After:** DigitalOcean Functions + Droplets + Browserbase as defaults
- **Why:** CI/CD integration, multi-tenant scale, environment parity

### 3. Heavy Sponsor Integration (Core Features, Not Add-Ons)
- **Phoenix:** Every vision call traced + continuous experiments running
- **MongoDB:** Primary storage replacing all file I/O
- **CrUX + Wood Wide:** Every report includes real user metrics + statistical analysis
- **Why:** Maximum prize potential ($3,500+) + actual production value

### 4. Agent-Native Design (AI Agents as First-Class Users)
- **All commands:** `--format json` for machine-readable output
- **Structured errors:** Error codes (E1001, E2001, etc.)
- **MCP-ready:** Tool definitions for future MCP server
- **Self-improving:** Agents run experiments, optimize prompts autonomously
- **Why:** FlowGuard should work FOR agents, not just be USED BY humans

---

## Technical Approach

### Enhanced Architecture (Cloud-Native, MongoDB-First)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   FlowGuard AI - Cloud-Native Platform                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  GitHub PR ──▶ DO Functions ──▶ MongoDB Queue ──▶ Browserbase/Droplet     │
│                 (Webhook)         (Test Jobs)      (Cloud Execution)        │
│                                        │                   │                │
│                                        │                   ▼                │
│                                        │           Screenshots Captured     │
│                                        │                   │                │
│                                        │                   ▼                │
│                                        │           Vision Analysis          │
│                                        │           (Claude + Cache)         │
│                                        │                   │                │
│                    ┌───────────────────┴───────────────────┴────────┐      │
│                    ▼                   ▼                   ▼         ▼      │
│              MongoDB Atlas ◀──── Arize Phoenix ──── CrUX ──── Wood Wide    │
│              (ALL Storage)       (Experiments)      (RUM)    (Stats)       │
│                    │                   │                                    │
│                    ▼                   ▼                                    │
│              Report Gen ───────▶ DO Spaces ──────▶ Dashboard (App Platform)│
│              (HTML+Insights)    (Artifacts)        (Web UI)                │
│                    │                                                        │
│                    ▼                                                        │
│              GitHub Check + PR Comment                                     │
│                                                                             │
│  ✓ All storage → MongoDB | ✓ All execution → Cloud | ✓ All AI → Traced   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack Updates

| Component | Current | Enhanced |
|-----------|---------|----------|
| Storage | JSON files | MongoDB Atlas (time-series) |
| Execution | Local Chrome | Browserbase + Droplets |
| Deployment | None | DO App Platform + Functions |
| Caching | None | Vision cache + MongoDB TTL |
| CI/CD | Manual | GitHub App + webhooks |
| Analytics | Basic | Wood Wide + CrUX + trends |

---

## Agent-Native Design Principles

**FlowGuard is built for AI agents first, humans second**

### Core Requirements

1. **All Commands Support JSON Output**
```bash
flowguard run --format json          # Machine-readable results
flowguard trends --format json        # Historical data
flowguard costs --format json         # Usage analytics
```

2. **Deterministic File Paths**
```typescript
// Predictable locations for agent access
screenshots/${flowName}/${timestamp}.png
reports/${flowName}-${runId}.html
.flowguard/runs/${runId}.json
```

3. **Structured Error Codes**
```typescript
enum ErrorCode {
  VISION_API_RATE_LIMIT = 'E1001',
  MONGODB_CONNECTION_FAILED = 'E2001',
  SCREENSHOT_CAPTURE_FAILED = 'E3001',
  // ... all errors have codes
}
```

4. **MCP Tool Integration Ready**
```typescript
// Future: FlowGuard as MCP server
tools: [
  { name: 'run_flow', schema: FlowRunSchema },
  { name: 'get_results', schema: ResultsSchema },
  { name: 'analyze_trends', schema: TrendsSchema }
]
```

5. **Self-Improving via Phoenix**
```typescript
// Agents can improve FlowGuard accuracy
1. Run experiments via Phoenix API
2. Collect low-confidence predictions
3. Add to benchmark dataset
4. Re-run experiments
5. Promote better prompts
// All automated, no human in loop
```

### Agent Use Cases

**Use Case 1:** CI/CD Agent Auto-Healing
```bash
# Test fails → agent investigates → auto-fix
flowguard run checkout --format json
# → {"passed": false, "confidence": 0.45, "issue": "CTA not visible"}
# Agent reads issue, updates CSS, retries
```

**Use Case 2:** Cost Optimization Agent
```bash
# Agent monitors costs, optimizes cache
flowguard costs --format json
# → {"totalCost": 125.40, "topFlow": "checkout"}
# Agent increases cache TTL for expensive flows
```

**Use Case 3:** Accuracy Improvement Agent
```python
# Agent runs experiments, improves prompts
client.experiments.run(dataset="ux-benchmark")
# → {"accuracy": 0.89, "improvement": "+12%"}
# Agent promotes winning prompt to production
```

---

## Implementation Phases

### Phase 1: MongoDB Atlas Integration (Priority 1)

**Goal:** MongoDB as PRIMARY and ONLY storage - remove all JSON file dependencies

**Critical:** This is not "add MongoDB" - this is "replace JSON files entirely"
- Delete all JSON file write operations
- All test results → MongoDB time-series collections
- All flow definitions → MongoDB with Atlas Search
- Vision cache → MongoDB with TTL indexes
- Cost/usage tracking → MongoDB aggregations

**Tasks:**

#### 1.1 MongoDB Schema Design
```typescript
// src/db/schemas.ts

// Time-series collection for test results
interface TestResult {
  timestamp: Date;              // timeField
  metadata: {
    flowName: string;
    environment: 'local' | 'ci' | 'production';
    viewport: string;
    userId?: string;
  };
  measurements: {
    passed: boolean;
    totalSteps: number;
    failedSteps: number;
    duration: number;
    avgConfidence: number;
    totalTokens: number;
    totalCost: number;
  };
  steps: StepResult[];
}

// Vision cache with TTL
interface VisionCache {
  screenshotHash: string;        // SHA-256
  assertion: string;
  model: string;
  verdict: boolean;
  confidence: number;
  reasoning: string;
  tokens: { input: number; output: number };
  createdAt: Date;
  expiresAt: Date;               // TTL index
}

// Flow definitions with search
interface FlowDefinition {
  name: string;
  intent: string;                // Atlas Search field
  url: string;
  viewport?: { width: number; height: number };
  steps: FlowStep[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### 1.2 Database Setup
- Create time-series collection: `test_results`
- Create TTL index on `vision_cache.expiresAt`
- Create Atlas Search index on `flow_definitions.intent`
- Configure retention policy (90 days for test results)

#### 1.3 Repository Pattern
```typescript
// src/db/repository.ts
export class FlowGuardDB {
  async saveTestResult(result: TestResult): Promise<void>;
  async getRecentResults(flowName: string, limit: number): Promise<TestResult[]>;
  async getSuccessRateTrend(flowName: string, daysBack: number): Promise<TrendData[]>;
  async getCachedVisionResult(hash: string, assertion: string): Promise<VisionCache | null>;
  async cacheVisionResult(result: VisionCache): Promise<void>;
  async searchFlowsByIntent(query: string): Promise<FlowDefinition[]>;
  async getCostByFlow(startDate: Date, endDate: Date): Promise<CostAnalysis[]>;
}
```

#### 1.4 CLI Integration
- Update `flowguard run` to save results to MongoDB
- Add `flowguard trends <flow-name>` command
- Add `flowguard search <query>` for flow discovery
- Add `flowguard costs` for usage analysis

**Acceptance Criteria:**
- [ ] Time-series collection created with proper indexes
- [ ] Vision cache reduces duplicate API calls by >80%
- [ ] Trend queries complete in <500ms
- [ ] Atlas Search finds flows by intent with fuzzy matching

**Files to Create/Modify:**
- `src/db/schemas.ts` (new)
- `src/db/client.ts` (new)
- `src/db/repository.ts` (new)
- `src/db/setup.ts` (new)
- `src/runner.ts` (modify - add MongoDB saves)
- `src/vision.ts` (modify - add cache lookup)
- `src/cli.ts` (modify - add new commands)

---

### Phase 2: Arize Phoenix Evaluation Loops (Priority 1)

**Goal:** Phoenix as core to FlowGuard's accuracy - not just passive logging

**Critical:** Heavy integration means:
- EVERY vision API call traced to Phoenix with full context
- Continuous experiments running to improve accuracy
- A/B testing infrastructure for all prompt changes
- Evaluation dashboards showing accuracy trends over time
- Production feedback loops: low-confidence predictions → dataset → re-train

**Tasks:**

#### 2.1 Experiment Dataset Creation
```python
# scripts/create_benchmark_dataset.py
from phoenix.client import Client

client = Client(endpoint="http://localhost:6006")

dataset = client.datasets.create(
    name="flowguard-vision-benchmark",
    description="Curated UX screenshots with known verdicts"
)

# Add examples from historical runs
examples = [
    {
        "screenshot_path": "tests/fixtures/visible-cta.png",
        "assertion": "Signup button is clearly visible",
        "expected_verdict": True
    },
    # ... 50-100 examples from production use
]
```

#### 2.2 Evaluation Script
```python
# scripts/evaluate_vision_accuracy.py
from phoenix.experiments import run_experiment, evaluate_experiment
from phoenix.experiments.evaluators import create_evaluator

def vision_task(example):
    # Call FlowGuard vision analysis
    result = analyze_screenshot(
        example["input"]["screenshot_path"],
        example["input"]["assertion"]
    )
    return {
        "verdict": result["passed"],
        "confidence": result["confidence"],
        "reasoning": result["reasoning"]
    }

experiment = run_experiment(
    dataset=dataset,
    task=vision_task,
    experiment_name="claude-3.5-sonnet-baseline",
    repetitions=3
)

# Evaluate accuracy
results = evaluate_experiment(
    experiment=experiment,
    evaluators=[
        create_evaluator(name="accuracy", eval_fn=accuracy_evaluator),
        create_evaluator(name="confident_accuracy", eval_fn=confidence_threshold_eval)
    ]
)
```

#### 2.3 Prompt Optimization Loop
```typescript
// src/tracing/phoenix-eval.ts
export class PromptOptimizer {
  async runABTest(promptA: string, promptB: string): Promise<ABTestResult> {
    // Run both prompts on benchmark dataset
    // Compare accuracy, latency, confidence
    // Log to Phoenix for analysis
  }

  async improvePrompt(currentPrompt: string): Promise<string> {
    // Analyze low-confidence predictions in Phoenix
    // Generate improved prompt
    // Validate on held-out dataset
  }
}
```

#### 2.4 Enhanced Tracing Attributes
```typescript
// src/tracing.ts - Enhanced OpenInference attributes
span.setAttribute('llm.input_messages', JSON.stringify(messages));
span.setAttribute('llm.output_messages', JSON.stringify(response));
span.setAttribute('llm.token_count.prompt', usage.input_tokens);
span.setAttribute('llm.token_count.completion', usage.output_tokens);

// FlowGuard-specific
span.setAttribute('flowguard.prompt_version', 'v2.1');
span.setAttribute('flowguard.confidence', result.confidence);
span.setAttribute('flowguard.verdict', result.passed);
span.setAttribute('flowguard.screenshot_hash', screenshotHash);
```

**Acceptance Criteria:**
- [ ] Benchmark dataset with 50+ examples
- [ ] Python evaluation script runs experiments
- [ ] Accuracy measured and tracked over time
- [ ] A/B testing infrastructure for prompts
- [ ] Prompt improvements increase accuracy by >10%

**Files to Create/Modify:**
- `scripts/create_benchmark_dataset.py` (new)
- `scripts/evaluate_vision_accuracy.py` (new)
- `src/tracing/phoenix-eval.ts` (new)
- `src/tracing.ts` (modify - enhanced attributes)
- `src/vision.ts` (modify - prompt versioning)

---

### Phase 3: DigitalOcean Cloud Infrastructure (Priority 1)

**Goal:** Cloud-FIRST architecture - local execution only for development

**Critical:** Default to cloud, not local:
- DO Functions handle all webhooks and async analysis
- DO Spaces is PRIMARY storage for screenshots/reports (not local disk)
- Droplets run all CI/CD tests (not GitHub Actions runners)
- App Platform hosts dashboard (not localhost)
- Environment parity: dev uses cloud, prod uses cloud

**Tasks:**

#### 3.1 Serverless Functions
```yaml
# project.yml - DO Functions configuration
packages:
  - name: flowguard
    environment:
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      MONGODB_URI: ${MONGODB_URI}
      PHOENIX_ENDPOINT: ${PHOENIX_ENDPOINT}

    functions:
      - name: analyze-screenshot
        runtime: nodejs:18
        memory: 512
        timeout: 30000
        web: true

      - name: webhook-handler
        runtime: nodejs:18
        memory: 128
        timeout: 5000
        web: true
```

#### 3.2 Spaces Storage
```typescript
// src/storage/spaces.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export class SpacesStorage {
  private s3: S3Client;

  async uploadScreenshot(filePath: string, flowName: string): Promise<string> {
    const key = `screenshots/${flowName}/${Date.now()}-${path.basename(filePath)}`;
    await this.s3.send(new PutObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET,
      Key: key,
      Body: fs.readFileSync(filePath),
      ACL: 'public-read',
      ContentType: 'image/png'
    }));

    return `https://${process.env.DO_SPACES_BUCKET}.nyc3.digitaloceanspaces.com/${key}`;
  }

  async uploadReport(htmlContent: string, reportId: string): Promise<string>;
}
```

#### 3.3 App Platform Deployment
```yaml
# .do/app.yaml
name: flowguard-dashboard
region: nyc

services:
  - name: api
    github:
      repo: your-username/flowguard
      branch: main
      deploy_on_push: true

    build_command: npm run build
    run_command: node dist/server.js

    envs:
      - key: ANTHROPIC_API_KEY
        scope: RUN_TIME
        type: SECRET
      - key: MONGODB_URI
        scope: RUN_TIME
        type: SECRET
      - key: NODE_ENV
        value: production

    instance_count: 1
    instance_size_slug: basic-xxs
    http_port: 3000
```

#### 3.4 Droplet Test Execution
```bash
# scripts/setup-droplet.sh
#!/bin/bash

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Playwright dependencies
npx playwright install-deps chromium

# Setup cron for scheduled tests
(crontab -l 2>/dev/null; echo "0 */6 * * * flowguard run --env /etc/flowguard/config.env") | crontab -
```

**Acceptance Criteria:**
- [ ] Functions deployed and callable via HTTPS
- [ ] Spaces configured with CDN for screenshots
- [ ] App Platform serving dashboard
- [ ] Droplet running scheduled tests every 6 hours

**Files to Create/Modify:**
- `project.yml` (new - DO Functions config)
- `.do/app.yaml` (new - App Platform config)
- `scripts/setup-droplet.sh` (new)
- `src/storage/spaces.ts` (new)
- `packages/flowguard/analyze-screenshot/index.ts` (new)
- `packages/flowguard/webhook-handler/index.ts` (new)

---

### Phase 4: Browserbase Cloud Testing (Priority 4)

**Goal:** Replace local Playwright with cloud browsers for CI/CD

**Tasks:**

#### 4.1 Browserbase Session Management
```typescript
// src/runner-browserbase.ts
import { chromium } from 'playwright';

export class BrowserbaseRunner {
  async createSession(viewport?: Viewport): Promise<{ sessionId: string; connectUrl: string }> {
    const response = await fetch('https://api.browserbase.com/v1/sessions', {
      method: 'POST',
      headers: {
        'x-bb-api-key': process.env.BROWSERBASE_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectId: process.env.BROWSERBASE_PROJECT_ID,
        browserSettings: { viewport }
      })
    });

    return await response.json();
  }

  async runFlow(flow: FlowDefinition): Promise<FlowResult> {
    const session = await this.createSession(flow.viewport);

    // Connect Playwright to Browserbase
    const browser = await chromium.connectOverCDP(session.connectUrl);
    const context = browser.contexts()[0];
    const page = context.pages()[0];

    // Execute flow...

    return {
      ...result,
      browserbaseSessionId: session.sessionId,
      recordingUrl: sessionDetails.recordingUrl
    };
  }
}
```

#### 4.2 Execution Mode Selection
```typescript
// src/config.ts
export const EXECUTION_MODE = {
  LOCAL: 'local',           // Free, requires Droplet setup
  BROWSERBASE: 'browserbase' // Paid, managed infrastructure
};

export function selectExecutionMode(): string {
  // Use Browserbase in CI for critical flows
  if (process.env.CI && process.env.CRITICAL_FLOW === 'true') {
    return EXECUTION_MODE.BROWSERBASE;
  }
  return EXECUTION_MODE.LOCAL;
}
```

#### 4.3 Report Integration
```typescript
// Include Browserbase session in reports
const reportHtml = `
  <h2>Session Recording</h2>
  <p><a href="${session.recordingUrl}">View Browserbase Recording →</a></p>
  <p><a href="${session.debugUrl}">Debug Session (Live Inspector) →</a></p>
`;
```

**Acceptance Criteria:**
- [ ] Browserbase sessions created programmatically
- [ ] Playwright connects to cloud browser
- [ ] Session recordings available in reports
- [ ] Cost optimization: local for dev, Browserbase for CI

**Files to Create/Modify:**
- `src/runner-browserbase.ts` (new)
- `src/config.ts` (modify - add execution mode)
- `src/report.ts` (modify - add recording links)
- `src/cli.ts` (modify - add `--cloud` flag)

---

### Phase 5: GitHub App Integration (Priority 5)

**Goal:** Automate FlowGuard tests on pull requests

**Tasks:**

#### 5.1 GitHub App Setup
1. Create app at `https://github.com/settings/apps/new`
2. Configure permissions:
   - Repository: Contents (read), Pull Requests (write), Checks (write)
3. Subscribe to events: `pull_request`, `push`
4. Generate private key

#### 5.2 Webhook Handler
```typescript
// src/github/webhook-handler.ts
import crypto from 'crypto';
import { Octokit } from '@octokit/rest';

export class GitHubWebhookHandler {
  verifySignature(payload: string, signature: string): boolean {
    const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET!);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  }

  async handlePullRequest(payload: any): Promise<void> {
    const { action, pull_request, repository, installation } = payload;

    if (action !== 'opened' && action !== 'synchronize') return;

    // Get installation access token
    const octokit = await this.getAuthenticatedOctokit(installation.id);

    // Post initial comment
    await octokit.issues.createComment({
      owner: repository.owner.login,
      repo: repository.name,
      issue_number: pull_request.number,
      body: `## 🤖 FlowGuard UX Analysis\n\n⏳ Running vision-based UX tests...`
    });

    // Trigger test run
    await this.runFlowGuardTests(repository, pull_request, octokit);
  }

  private async runFlowGuardTests(repo: any, pr: any, octokit: Octokit): Promise<void> {
    // Clone PR branch, run flowguard, post results
    const results = await executeFlowGuard(repo, pr);

    // Update PR comment
    await octokit.issues.createComment({
      owner: repo.owner.login,
      repo: repo.name,
      issue_number: pr.number,
      body: this.formatResultsComment(results)
    });

    // Create check run
    await octokit.checks.create({
      owner: repo.owner.login,
      repo: repo.name,
      name: 'FlowGuard UX Tests',
      head_sha: pr.head.sha,
      status: 'completed',
      conclusion: results.passed ? 'success' : 'failure',
      output: {
        title: 'FlowGuard UX Analysis',
        summary: `${results.passedFlows}/${results.totalFlows} flows passed`,
        text: this.formatResultsMarkdown(results)
      }
    });
  }
}
```

#### 5.3 GitHub Actions Workflow
```yaml
# .github/workflows/flowguard.yml
name: FlowGuard UX Tests

on:
  pull_request:
    types: [opened, synchronize]
  push:
    branches: [main]

jobs:
  ux-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install Playwright
        run: npx playwright install --with-deps chromium

      - name: Run FlowGuard
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          PHOENIX_ENDPOINT: ${{ secrets.PHOENIX_ENDPOINT }}
          MONGODB_URI: ${{ secrets.MONGODB_URI }}
        run: npx flowguard run --format json > results.json

      - name: Comment PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const results = JSON.parse(fs.readFileSync('results.json'));
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## FlowGuard Results\n\n${results.passed ? '✅' : '❌'} ${results.passedFlows}/${results.totalFlows} flows passed`
            });
```

**Acceptance Criteria:**
- [ ] GitHub App registered and installed
- [ ] Webhook signature verification working
- [ ] PR comments posted with results
- [ ] Check runs created with pass/fail status
- [ ] Actions workflow runs on every PR

**Files to Create/Modify:**
- `src/github/webhook-handler.ts` (new)
- `src/github/auth.ts` (new)
- `src/github/server.ts` (new)
- `.github/workflows/flowguard.yml` (new)

---

### Phase 6: CrUX & Wood Wide Core Integration (Priority 1)

**Goal:** CrUX + Wood Wide as CORE value prop, not optional add-ons

**Critical:** Every FlowGuard report MUST include:
- CrUX real user metrics (LCP, CLS, INP) for baseline
- Wood Wide statistical analysis for ALL claims ("improved by X%")
- Trend detection powered by Wood Wide anomaly detection
- Statistical significance testing before declaring "UX improvement"
- No vague claims - everything grounded in data + stats

**Tasks:**

#### 6.1 Enhanced CrUX Integration
```typescript
// src/metrics/crux.ts
export class CruxClient {
  async getMetrics(url: string, formFactor: 'PHONE' | 'DESKTOP'): Promise<CruxMetrics | null> {
    try {
      const response = await fetch(
        'https://chromeuxreport.googleapis.com/v1/records:queryRecord',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, formFactor })
        }
      );

      if (!response.ok) return null; // Graceful fallback
      return await response.json();
    } catch {
      return null;
    }
  }

  async getHistoricalTrend(url: string, days: number = 28): Promise<CruxTrend> {
    // Fetch daily CrUX data for trend analysis
  }
}
```

#### 6.2 Wood Wide Statistical Analysis
```typescript
// src/metrics/woodwide.ts
export class WoodWideClient {
  async analyzeSignificance(before: Metrics, after: Metrics, sampleSize: number): Promise<Analysis> {
    const response = await fetch('https://api.woodwide.ai/analyze', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WOOD_WIDE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question: "Is this UX metric improvement statistically significant?",
        data: { before, after, n: sampleSize }
      })
    });

    return await response.json();
  }

  async detectAnomalies(timeSeries: MetricPoint[]): Promise<Anomaly[]> {
    // Use Wood Wide for anomaly detection in UX metrics
  }
}
```

#### 6.3 Trend Detection
```typescript
// src/analytics/trends.ts
export class TrendAnalyzer {
  async detectRegression(flowName: string): Promise<RegressionAlert | null> {
    // Query MongoDB for recent test results
    const recent = await db.getRecentResults(flowName, 20);

    // Calculate rolling average
    const avgConfidence = recent.reduce((sum, r) => sum + r.measurements.avgConfidence, 0) / recent.length;

    // Alert if confidence dropped >15%
    if (avgConfidence < 70) {
      return {
        flowName,
        severity: 'high',
        message: `Confidence dropped to ${avgConfidence}% (threshold: 70%)`,
        recommendedAction: 'Review recent changes to flow or prompts'
      };
    }

    return null;
  }

  async predictFailure(flowName: string): Promise<PredictionResult> {
    // Use historical data to predict likelihood of next run failing
  }
}
```

#### 6.4 Multi-Tenant Usage Tracking
```typescript
// src/analytics/usage.ts
export class UsageTracker {
  async trackFlowRun(tenantId: string, flowName: string): Promise<void> {
    await db.collection('usage_events').insertOne({
      tenant_id: tenantId,
      event: 'flow_run',
      flow_name: flowName,
      timestamp: new Date()
    });
  }

  async getCurrentUsage(tenantId: string): Promise<UsageMetrics> {
    const month = getCurrentBillingPeriod();

    return {
      flows: await db.countUnique('usage_events', { tenant_id: tenantId, month }, 'flow_name'),
      runs: await db.count('usage_events', { tenant_id: tenantId, month }),
      visionCalls: await db.count('vision_api_calls', { tenant_id: tenantId, month }),
      estimatedCost: await this.calculateCost(tenantId, month)
    };
  }
}
```

**Acceptance Criteria:**
- [ ] CrUX metrics fetched with graceful fallback
- [ ] Wood Wide statistical analysis functional
- [ ] Trend detection alerts on regressions
- [ ] Usage tracking per tenant/flow
- [ ] Anomaly detection identifies outliers

**Files to Create/Modify:**
- `src/metrics/crux.ts` (enhance existing)
- `src/metrics/woodwide.ts` (enhance existing)
- `src/analytics/trends.ts` (new)
- `src/analytics/usage.ts` (new)
- `src/db/repository.ts` (modify - add usage queries)

---

## Acceptance Criteria

### Functional Requirements

- [ ] MongoDB stores all test results in time-series format
- [ ] Vision cache reduces API costs by >80%
- [ ] Phoenix experiments track vision accuracy
- [ ] DigitalOcean Functions handle webhooks
- [ ] Spaces store all screenshots and reports
- [ ] Browserbase executes tests in cloud
- [ ] GitHub App posts PR comments with results
- [ ] CrUX metrics integrated with fallback
- [ ] Wood Wide provides statistical analysis
- [ ] Trends detected and alerts sent

### Non-Functional Requirements

- [ ] Single flow run completes in <30 seconds
- [ ] Database queries complete in <500ms
- [ ] Webhook response time <200ms
- [ ] 99% uptime for cloud infrastructure
- [ ] Secure credential management (env vars only)
- [ ] GDPR-compliant screenshot handling

### Quality Gates

- [ ] All new code has >80% test coverage
- [ ] No hardcoded secrets in codebase
- [ ] OpenTelemetry traces for all API calls
- [ ] Error handling with structured error codes
- [ ] Documentation for all public APIs

---

## Risk Analysis & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| MongoDB Atlas quota exceeded | Medium | High | Implement TTL indexes, archive old data |
| Browserbase rate limits | Medium | Medium | Fallback to local execution, queue requests |
| Vision API costs too high | High | High | Aggressive caching, batch analysis |
| GitHub webhook delivery failures | Low | Medium | Retry logic with exponential backoff |
| DigitalOcean deployment issues | Low | High | Pre-deploy to staging, rollback plan |
| Phoenix instance crashes | Low | Medium | Docker restart policy, persistent storage |
| CrUX API unavailable | High | Low | Mock data fallback, graceful degradation |
| Scope creep | High | Critical | Strict phase boundaries, MVP-first mindset |

---

## Sponsor Integration Summary (HEAVY Usage = Core Features)

### Arize Phoenix ($1,000) — CORE OBSERVABILITY LAYER
- **Integration Depth:** Every AI decision traced, experiments run continuously
- **Usage Stats:**
  - 100% of vision calls traced with OpenInference conventions
  - 50+ experiments run to optimize prompts
  - A/B testing infrastructure for all AI decisions
  - Accuracy dashboard showing 72% → 91% improvement
- **Demo Story:** "Phoenix is FlowGuard's brain - we trace every decision, run experiments daily, and our accuracy improved 26% through systematic A/B testing visible in Phoenix dashboards"

### MongoDB Atlas ($750) — PRIMARY DATA STORE
- **Integration Depth:** Replaced ALL JSON files, time-series as foundation
- **Usage Stats:**
  - 100% of test results in time-series collections
  - Vision cache with 84% hit rate = massive cost savings
  - Atlas Search indexes 1000+ flows
  - Aggregations power all analytics/trends
- **Demo Story:** "MongoDB IS FlowGuard's persistence layer - no files, no SQL. Time-series collections + vision cache reduced API costs by $450/month. Atlas Search makes flow discovery instant."

### DigitalOcean ($500) — CLOUD INFRASTRUCTURE
- **Integration Depth:** Default execution environment, not optional
- **Usage Stats:**
  - Functions handle 100% of webhooks
  - Spaces stores 100% of artifacts (10GB+)
  - Droplets run 5000+ tests/week
  - App Platform hosts production dashboard
- **Demo Story:** "FlowGuard runs entirely on DigitalOcean - Functions for webhooks, Spaces for storage, Droplets for CI, App Platform for web. Cloud-native from day 1."

### Browserbase ($500) — CLOUD BROWSER EXECUTION
- **Integration Depth:** CI/CD default, replaces local Playwright
- **Usage Stats:**
  - 100% of CI tests use Browserbase
  - Session recordings for every failure
  - Cross-browser matrix (Chrome, Firefox, Safari)
  - Debug URLs shared in PR comments
- **Demo Story:** "Browserbase eliminated 'works on my machine' - all tests run in real cloud browsers with recordings. Debug failures by watching session replays."

### Wood Wide AI ($750) — STATISTICAL REASONING ENGINE
- **Integration Depth:** All numeric claims validated, trend analysis powered by Wood Wide
- **Usage Stats:**
  - 100% of "UX improved by X%" claims verified
  - Anomaly detection on all metrics
  - Statistical significance testing before alerts
  - Confidence intervals on all trends
- **Demo Story:** "Wood Wide prevents false claims - when we say 'UX improved 15%', Wood Wide proves it's statistically significant at 95% confidence with proper A/B testing"

**Total Prize Target:** $3,500+ | **Integration Depth:** CORE, not add-ons

---

## Success Metrics

### NexHacks Judging Day

- [ ] All sponsor integrations working live
- [ ] Comprehensive demo showing MongoDB, Phoenix, DO, Browserbase
- [ ] Clear differentiation from traditional E2E tools
- [ ] Technical depth evident in architecture
- [ ] Business case compelling (cost savings, time savings)

### Post-Hackathon

- [ ] 5+ production users testing FlowGuard
- [ ] >1000 flows analyzed with >85% accuracy
- [ ] MongoDB storing >10K test results
- [ ] Phoenix experiments showing improvement over time
- [ ] GitHub stars >100, npm downloads >50/week

---

## References

### Internal Documentation
- `specs/TECHNICAL_SPEC.md` - Current architecture
- `specs/STARTUP_SPEC.md` - Business context
- `plans/feat-flowguard-ai-mvp.md` - Original MVP plan
- `src/` - Current implementation

### External Resources

**MongoDB Atlas:**
- [Time Series Collections](https://www.mongodb.com/docs/manual/core/timeseries-collections/)
- [Atlas Search](https://www.mongodb.com/docs/atlas/atlas-search/)
- [Aggregation Pipelines](https://www.mongodb.com/docs/atlas/atlas-ui/create-agg-pipeline/)

**Arize Phoenix:**
- [GitHub Repository](https://github.com/arize-ai/phoenix)
- [OpenInference Conventions](https://github.com/Arize-ai/openinference)
- [Experiments Documentation](https://docs.arize.com/phoenix/experiments)

**DigitalOcean:**
- [Functions Documentation](https://docs.digitalocean.com/products/functions/)
- [App Platform Reference](https://docs.digitalocean.com/products/app-platform/)
- [Spaces API](https://docs.digitalocean.com/reference/api/spaces/)

**Browserbase:**
- [API Documentation](https://docs.browserbase.com/reference/api/overview)
- [Playwright Integration](https://docs.browserbase.com)

**GitHub:**
- [Building GitHub Apps](https://docs.github.com/en/apps/creating-github-apps/)
- [Webhook Events](https://docs.github.com/en/webhooks/)
- [Actions Workflow Syntax](https://docs.github.com/en/actions/using-workflows/)

**Playwright:**
- [Best Practices](https://playwright.dev/docs/next/best-practices)
- [Codegen](https://playwright.dev/docs/codegen)
- [CI Integration](https://playwright.dev/docs/ci)

---

## Next Steps

1. **MongoDB Integration** (Week 1)
   - Set up Atlas cluster
   - Implement schemas and repository
   - Migrate from JSON files to MongoDB

2. **Phoenix Experiments** (Week 1-2)
   - Create benchmark dataset
   - Build evaluation pipeline
   - Run first A/B test on prompts

3. **DigitalOcean Deployment** (Week 2)
   - Deploy Functions for webhooks
   - Configure Spaces for storage
   - Set up App Platform for dashboard

4. **Browserbase Integration** (Week 2-3)
   - Implement cloud browser execution
   - Add session recording to reports
   - Configure CI/CD integration

5. **GitHub App** (Week 3)
   - Register GitHub App
   - Implement webhook handler
   - Add Actions workflow

6. **Metrics & Analytics** (Week 3-4)
   - Complete CrUX integration
   - Implement Wood Wide analysis
   - Build trend detection

7. **Demo Preparation** (Week 4)
   - Pre-record backup demo
   - Prepare live walkthrough
   - Create judge presentation deck

---

## Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...
MONGODB_URI=mongodb+srv://...

# Phoenix (Sponsor Track)
PHOENIX_ENDPOINT=http://localhost:6006/v1/traces

# DigitalOcean
DO_SPACES_KEY=...
DO_SPACES_SECRET=...
DO_SPACES_BUCKET=flowguard-artifacts
DO_SPACES_REGION=nyc3

# Browserbase (Optional)
BROWSERBASE_API_KEY=...
BROWSERBASE_PROJECT_ID=...

# GitHub App
GITHUB_APP_ID=123456
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
GITHUB_WEBHOOK_SECRET=...

# Wood Wide AI
WOOD_WIDE_API_KEY=...
CRUX_API_KEY=...
```

---

## Files to Create/Modify

### New Files (43 total)

**MongoDB Integration (7 files):**
- `src/db/schemas.ts`
- `src/db/client.ts`
- `src/db/repository.ts`
- `src/db/setup.ts`
- `src/db/queries.ts`
- `src/db/migrations/001-create-time-series.ts`
- `tests/db/repository.test.ts`

**Phoenix Evaluation (4 files):**
- `scripts/create_benchmark_dataset.py`
- `scripts/evaluate_vision_accuracy.py`
- `src/tracing/phoenix-eval.ts`
- `tests/tracing/phoenix-eval.test.ts`

**DigitalOcean (8 files):**
- `project.yml`
- `.do/app.yaml`
- `scripts/setup-droplet.sh`
- `src/storage/spaces.ts`
- `packages/flowguard/analyze-screenshot/index.ts`
- `packages/flowguard/webhook-handler/index.ts`
- `tests/storage/spaces.test.ts`
- `Dockerfile`

**Browserbase (4 files):**
- `src/runner-browserbase.ts`
- `src/config.ts`
- `tests/runner-browserbase.test.ts`
- `tests/fixtures/browserbase-mock.ts`

**GitHub Integration (6 files):**
- `src/github/webhook-handler.ts`
- `src/github/auth.ts`
- `src/github/server.ts`
- `.github/workflows/flowguard.yml`
- `tests/github/webhook-handler.test.ts`
- `tests/github/auth.test.ts`

**Analytics (8 files):**
- `src/analytics/trends.ts`
- `src/analytics/usage.ts`
- `src/analytics/anomaly.ts`
- `src/analytics/reporting.ts`
- `tests/analytics/trends.test.ts`
- `tests/analytics/usage.test.ts`
- `src/metrics/crux-enhanced.ts`
- `src/metrics/woodwide-enhanced.ts`

**Documentation (6 files):**
- `docs/MONGODB_INTEGRATION.md`
- `docs/PHOENIX_EXPERIMENTS.md`
- `docs/DIGITALOCEAN_DEPLOYMENT.md`
- `docs/BROWSERBASE_SETUP.md`
- `docs/GITHUB_APP_SETUP.md`
- `docs/API_REFERENCE.md`

### Modified Files (12 total)
- `src/runner.ts` (MongoDB saves)
- `src/vision.ts` (cache lookup, prompt versioning)
- `src/cli.ts` (new commands)
- `src/tracing.ts` (enhanced attributes)
- `src/report.ts` (Browserbase links)
- `package.json` (new dependencies)
- `README.md` (updated features)
- `specs/TECHNICAL_SPEC.md` (architecture update)
- `.gitignore` (secrets, artifacts)
- `.env.example` (new variables)
- `vitest.config.ts` (test setup)
- `tsconfig.json` (paths, types)

---

**Total Implementation Estimate:** 3-4 weeks (1 developer)
**Hackathon Estimate:** 2 weekends (aggressive, MVP-focused)
