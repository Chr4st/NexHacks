# FlowGuard AI — Technical Specification

**Version:** 1.0
**Date:** January 2026
**Target:** NexHacks 2026 Hackathon MVP

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FlowGuard AI                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │   CLI    │───▶│  Flow Engine │───▶│  Playwright Runner   │  │
│  └──────────┘    └──────────────┘    └──────────────────────┘  │
│       │                │                        │               │
│       │                │                        ▼               │
│       │                │              ┌──────────────────────┐  │
│       │                │              │  Screenshot Capture  │  │
│       │                │              └──────────────────────┘  │
│       │                │                        │               │
│       │                ▼                        ▼               │
│       │         ┌──────────────┐    ┌──────────────────────┐  │
│       │         │ Flow Parser  │    │   Vision Analyzer    │  │
│       │         │   (YAML)     │    │  (Claude/GPT-4V)     │  │
│       │         └──────────────┘    └──────────────────────┘  │
│       │                                        │               │
│       │                                        ▼               │
│       │                             ┌──────────────────────┐  │
│       │                             │   Arize Phoenix      │  │
│       │                             │   (Tracing)          │  │
│       │                             └──────────────────────┘  │
│       │                                        │               │
│       ▼                                        ▼               │
│  ┌──────────┐                      ┌──────────────────────┐   │
│  │Dashboard │◀─────────────────────│   Insight Engine     │   │
│  │(Next.js) │                      │ (Pass/Fail + Report) │   │
│  └──────────┘                      └──────────────────────┘   │
│       │                                        │               │
│       │                                        ▼               │
│       │                             ┌──────────────────────┐  │
│       └────────────────────────────▶│   Wood Wide AI       │  │
│                                     │   (Metrics Analysis) │  │
│                                     └──────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Core Runtime
| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Language** | TypeScript | Type safety, modern tooling |
| **Runtime** | Node.js 20+ | Playwright compatibility |
| **Package Manager** | pnpm | Fast, efficient monorepo support |

### CLI & Core
| Component | Technology | Rationale |
|-----------|------------|-----------|
| **CLI Framework** | Commander.js | Simple, well-documented |
| **Config Parser** | js-yaml | YAML flow definitions |
| **Browser Automation** | Playwright | Cross-browser, fast, reliable |
| **Vision API** | Anthropic Claude 3.5 Sonnet | Best vision + reasoning |

### Frontend
| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Framework** | Next.js 14 (App Router) | Full-stack, Vercel deploy |
| **Styling** | Tailwind CSS | Rapid development |
| **Components** | shadcn/ui | Beautiful, accessible |
| **Charts** | Recharts | Simple, React-native |

### Backend & Data
| Component | Technology | Rationale |
|-----------|------------|-----------|
| **API** | Next.js API Routes | Unified deployment |
| **Database** | SQLite (dev) / Turso (prod) | Simple, edge-ready |
| **ORM** | Drizzle | Type-safe, lightweight |
| **File Storage** | Local (dev) / S3 (prod) | Screenshots storage |

### Observability & Sponsors
| Component | Technology | Rationale |
|-----------|------------|-----------|
| **AI Tracing** | Arize Phoenix | Sponsor requirement |
| **Numeric Reasoning** | Wood Wide AI API | Sponsor requirement |
| **Metrics Source** | CrUX API | Real user data |

---

## Project Structure

```
flowguard/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
│
├── packages/
│   ├── cli/                    # CLI tool
│   │   ├── src/
│   │   │   ├── index.ts        # Entry point
│   │   │   ├── commands/
│   │   │   │   ├── init.ts     # flowguard init
│   │   │   │   ├── run.ts      # flowguard run
│   │   │   │   └── report.ts   # flowguard report
│   │   │   └── utils/
│   │   │       └── config.ts   # Config loading
│   │   └── package.json
│   │
│   ├── core/                   # Core engine
│   │   ├── src/
│   │   │   ├── flow/
│   │   │   │   ├── parser.ts   # YAML → Flow objects
│   │   │   │   ├── types.ts    # Flow type definitions
│   │   │   │   └── validator.ts
│   │   │   ├── runner/
│   │   │   │   ├── executor.ts # Playwright orchestration
│   │   │   │   ├── browser.ts  # Browser management
│   │   │   │   └── screenshot.ts
│   │   │   ├── vision/
│   │   │   │   ├── analyzer.ts # Vision API calls
│   │   │   │   ├── prompts.ts  # Prompt templates
│   │   │   │   └── types.ts
│   │   │   ├── insight/
│   │   │   │   ├── engine.ts   # Pass/fail decisions
│   │   │   │   ├── reporter.ts # Report generation
│   │   │   │   └── types.ts
│   │   │   ├── tracing/
│   │   │   │   ├── phoenix.ts  # Arize Phoenix integration
│   │   │   │   └── spans.ts    # Span definitions
│   │   │   └── metrics/
│   │   │       ├── crux.ts     # CrUX API client
│   │   │       └── woodwide.ts # Wood Wide AI client
│   │   └── package.json
│   │
│   └── db/                     # Database schema
│       ├── src/
│       │   ├── schema.ts       # Drizzle schema
│       │   └── client.ts       # DB client
│       └── package.json
│
├── apps/
│   └── web/                    # Dashboard
│       ├── app/
│       │   ├── page.tsx        # Landing/overview
│       │   ├── runs/
│       │   │   ├── page.tsx    # Run history
│       │   │   └── [id]/
│       │   │       └── page.tsx # Run details
│       │   ├── analytics/
│       │   │   └── page.tsx    # Trends
│       │   └── api/
│       │       ├── runs/
│       │       │   └── route.ts
│       │       └── analyze/
│       │           └── route.ts
│       ├── components/
│       │   ├── ui/             # shadcn components
│       │   ├── run-card.tsx
│       │   ├── screenshot-diff.tsx
│       │   └── verdict-badge.tsx
│       └── package.json
│
├── flows/                      # Example flows
│   └── examples/
│       ├── signup.flow.yaml
│       └── checkout.flow.yaml
│
└── specs/
    ├── STARTUP_SPEC.md
    └── TECHNICAL_SPEC.md
```

---

## Flow Definition Schema

### Flow File Format (YAML)

```yaml
# flows/signup.flow.yaml
name: user-signup
version: 1
description: User registration and confirmation flow

# The core intent - what should happen from user's perspective
intent: |
  User navigates to signup page, fills out the registration form,
  submits it, and clearly sees a success confirmation message.

# Target URL (supports environment variables)
url: ${BASE_URL}/signup

# Optional: Authentication context
auth:
  type: none  # none | cookie | bearer

# Steps in the flow (each step triggers a screenshot + analysis)
steps:
  - name: page-load
    action: navigate
    assert:
      - "Signup form is visible and accessible"
      - "Email and password fields are clearly labeled"

  - name: fill-form
    action: fill
    inputs:
      - selector: "[name='email']"
        value: "test@example.com"
      - selector: "[name='password']"
        value: "SecurePass123!"
    assert:
      - "Form fields show entered values"
      - "Submit button is enabled and prominent"

  - name: submit
    action: click
    target: "button[type='submit']"
    wait: networkidle
    assert:
      - "Success message is clearly visible"
      - "User understands registration is complete"
      - "Next steps or call-to-action is clear"

# Browser matrix for testing
browsers:
  - chromium
  # - firefox  # MVP: Chromium only
  # - webkit

# Viewport configurations
viewports:
  - name: desktop
    width: 1920
    height: 1080
  - name: mobile
    width: 375
    height: 812

# Baseline configuration
baseline:
  auto_update: false  # Require explicit approval
  branch_aware: true  # Separate baselines per branch

# Tags for filtering
tags:
  - critical
  - auth
```

### Flow Type Definitions

```typescript
// packages/core/src/flow/types.ts

export interface Flow {
  name: string;
  version: number;
  description?: string;
  intent: string;
  url: string;
  auth?: AuthConfig;
  steps: FlowStep[];
  browsers: Browser[];
  viewports: Viewport[];
  baseline: BaselineConfig;
  tags: string[];
}

export interface FlowStep {
  name: string;
  action: 'navigate' | 'click' | 'fill' | 'scroll' | 'wait';
  target?: string;
  inputs?: InputConfig[];
  wait?: 'networkidle' | 'domcontentloaded' | number;
  assert: string[];  // Natural language assertions
}

export interface AuthConfig {
  type: 'none' | 'cookie' | 'bearer' | 'basic';
  credentials?: string;  // Environment variable name
}

export interface Viewport {
  name: string;
  width: number;
  height: number;
}

export interface BaselineConfig {
  auto_update: boolean;
  branch_aware: boolean;
}

export type Browser = 'chromium' | 'firefox' | 'webkit';
```

---

## Vision Analysis System

### Prompt Architecture

```typescript
// packages/core/src/vision/prompts.ts

export const SYSTEM_PROMPT = `You are FlowGuard, an expert UX analyst.
Your job is to evaluate screenshots of web applications and determine
if they satisfy user intent and UX best practices.

You analyze from a USER'S perspective, not a developer's. Focus on:
- Can the user clearly see what to do next?
- Is feedback clear and unambiguous?
- Are interactive elements visually prominent?
- Is the layout appropriate for the viewport?

Be strict but fair. A minor visual imperfection is fine if the core
intent is satisfied. A broken layout or hidden CTA is a failure.`;

export const ANALYSIS_PROMPT = `Analyze this screenshot for UX compliance.

**Flow Intent:**
{intent}

**Current Step:**
{stepName}

**Assertions to Verify:**
{assertions}

**Browser:** {browser}
**Viewport:** {viewport}

Provide your analysis in the following JSON format:
{
  "verdict": "pass" | "fail" | "warning",
  "confidence": 0.0-1.0,
  "assertions": [
    {
      "text": "assertion text",
      "satisfied": true/false,
      "evidence": "what you observed"
    }
  ],
  "issues": [
    {
      "severity": "critical" | "major" | "minor",
      "description": "issue description",
      "location": "where on screen",
      "recommendation": "how to fix"
    }
  ],
  "summary": "One sentence summary for developers"
}`;
```

### Vision Analyzer Implementation

```typescript
// packages/core/src/vision/analyzer.ts

import Anthropic from '@anthropic-ai/sdk';
import { trace, SpanKind } from '@opentelemetry/api';
import { SYSTEM_PROMPT, ANALYSIS_PROMPT } from './prompts';
import type { FlowStep, AnalysisResult } from './types';

const tracer = trace.getTracer('flowguard.vision');

export class VisionAnalyzer {
  private client: Anthropic;
  private promptVersion: string = 'v1.0';

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async analyze(
    screenshot: Buffer,
    step: FlowStep,
    intent: string,
    browser: string,
    viewport: string
  ): Promise<AnalysisResult> {
    return tracer.startActiveSpan(
      'vision_analysis',
      { kind: SpanKind.CLIENT },
      async (span) => {
        try {
          // Set span attributes for Phoenix
          span.setAttribute('flowguard.step', step.name);
          span.setAttribute('flowguard.browser', browser);
          span.setAttribute('flowguard.viewport', viewport);
          span.setAttribute('flowguard.prompt_version', this.promptVersion);

          const prompt = ANALYSIS_PROMPT
            .replace('{intent}', intent)
            .replace('{stepName}', step.name)
            .replace('{assertions}', step.assert.join('\n'))
            .replace('{browser}', browser)
            .replace('{viewport}', viewport);

          const response = await this.client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'image',
                    source: {
                      type: 'base64',
                      media_type: 'image/png',
                      data: screenshot.toString('base64'),
                    },
                  },
                  { type: 'text', text: prompt },
                ],
              },
            ],
          });

          const content = response.content[0];
          if (content.type !== 'text') {
            throw new Error('Unexpected response type');
          }

          const result = JSON.parse(content.text) as AnalysisResult;

          // Record result in span
          span.setAttribute('flowguard.verdict', result.verdict);
          span.setAttribute('flowguard.confidence', result.confidence);
          span.setAttribute('flowguard.issues_count', result.issues.length);

          return result;
        } catch (error) {
          span.recordException(error as Error);
          throw error;
        } finally {
          span.end();
        }
      }
    );
  }
}
```

---

## Arize Phoenix Integration

### Setup and Configuration

```typescript
// packages/core/src/tracing/phoenix.ts

import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

export function initializeTracing() {
  const exporter = new OTLPTraceExporter({
    url: process.env.PHOENIX_COLLECTOR_ENDPOINT || 'http://localhost:6006/v1/traces',
    headers: {
      'api-key': process.env.PHOENIX_API_KEY || '',
    },
  });

  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'flowguard',
      [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    }),
    traceExporter: exporter,
  });

  sdk.start();

  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.log('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });

  return sdk;
}
```

### Span Definitions

```typescript
// packages/core/src/tracing/spans.ts

import { trace, SpanKind, Span, context } from '@opentelemetry/api';

const tracer = trace.getTracer('flowguard');

export interface FlowRunContext {
  flowName: string;
  runId: string;
  browser: string;
  viewport: string;
}

export function startFlowSpan(ctx: FlowRunContext): Span {
  return tracer.startSpan('flow_run', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'flowguard.flow_name': ctx.flowName,
      'flowguard.run_id': ctx.runId,
      'flowguard.browser': ctx.browser,
      'flowguard.viewport': ctx.viewport,
    },
  });
}

export function startStepSpan(stepName: string, parentSpan: Span): Span {
  const ctx = trace.setSpan(context.active(), parentSpan);
  return tracer.startSpan(
    `step_${stepName}`,
    { kind: SpanKind.INTERNAL },
    ctx
  );
}
```

---

## Wood Wide AI Integration

### Metrics Client

```typescript
// packages/core/src/metrics/woodwide.ts

import { trace, SpanKind } from '@opentelemetry/api';

const tracer = trace.getTracer('flowguard.metrics');

export interface CrUXMetrics {
  lcp: { p75: number; p90: number };
  cls: { p75: number; p90: number };
  inp: { p75: number; p90: number };
}

export interface MetricAnalysis {
  metric: string;
  current: number;
  previous: number;
  change_percent: number;
  is_significant: boolean;
  confidence: number;
  trend: 'improving' | 'stable' | 'degrading';
  recommendation?: string;
}

export class WoodWideClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.woodwide.ai/v1';
  }

  async analyzeMetrics(
    current: CrUXMetrics,
    previous: CrUXMetrics
  ): Promise<MetricAnalysis[]> {
    return tracer.startActiveSpan(
      'woodwide_analysis',
      { kind: SpanKind.CLIENT },
      async (span) => {
        try {
          const response = await fetch(`${this.baseUrl}/analyze`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              task: 'metric_comparison',
              data: {
                current: this.flattenMetrics(current),
                previous: this.flattenMetrics(previous),
              },
              options: {
                significance_threshold: 0.05,
                include_trend: true,
                include_recommendations: true,
              },
            }),
          });

          if (!response.ok) {
            throw new Error(`Wood Wide API error: ${response.status}`);
          }

          const result = await response.json();

          span.setAttribute('woodwide.metrics_analyzed', 3);
          span.setAttribute('woodwide.significant_changes',
            result.analyses.filter((a: MetricAnalysis) => a.is_significant).length
          );

          return result.analyses;
        } catch (error) {
          span.recordException(error as Error);
          throw error;
        } finally {
          span.end();
        }
      }
    );
  }

  private flattenMetrics(metrics: CrUXMetrics): Record<string, number> {
    return {
      lcp_p75: metrics.lcp.p75,
      lcp_p90: metrics.lcp.p90,
      cls_p75: metrics.cls.p75,
      cls_p90: metrics.cls.p90,
      inp_p75: metrics.inp.p75,
      inp_p90: metrics.inp.p90,
    };
  }
}
```

### CrUX API Client

```typescript
// packages/core/src/metrics/crux.ts

export class CrUXClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getMetrics(url: string): Promise<CrUXMetrics | null> {
    try {
      const response = await fetch(
        `https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url,
            formFactor: 'DESKTOP',
            metrics: [
              'largest_contentful_paint',
              'cumulative_layout_shift',
              'interaction_to_next_paint',
            ],
          }),
        }
      );

      if (!response.ok) {
        // CrUX may not have data for low-traffic sites
        return null;
      }

      const data = await response.json();
      return this.parseResponse(data);
    } catch {
      return null;
    }
  }

  private parseResponse(data: any): CrUXMetrics {
    const metrics = data.record.metrics;
    return {
      lcp: {
        p75: metrics.largest_contentful_paint?.percentiles?.p75 || 0,
        p90: metrics.largest_contentful_paint?.percentiles?.p90 || 0,
      },
      cls: {
        p75: metrics.cumulative_layout_shift?.percentiles?.p75 || 0,
        p90: metrics.cumulative_layout_shift?.percentiles?.p90 || 0,
      },
      inp: {
        p75: metrics.interaction_to_next_paint?.percentiles?.p75 || 0,
        p90: metrics.interaction_to_next_paint?.percentiles?.p90 || 0,
      },
    };
  }
}
```

---

## Database Schema

```typescript
// packages/db/src/schema.ts

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const flows = sqliteTable('flows', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  version: integer('version').notNull(),
  intent: text('intent').notNull(),
  url: text('url').notNull(),
  config: text('config').notNull(), // JSON
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const runs = sqliteTable('runs', {
  id: text('id').primaryKey(),
  flowId: text('flow_id').references(() => flows.id).notNull(),
  status: text('status', { enum: ['pending', 'running', 'passed', 'failed', 'error'] }).notNull(),
  browser: text('browser').notNull(),
  viewport: text('viewport').notNull(),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  duration: integer('duration'), // milliseconds
  gitBranch: text('git_branch'),
  gitCommit: text('git_commit'),
});

export const stepResults = sqliteTable('step_results', {
  id: text('id').primaryKey(),
  runId: text('run_id').references(() => runs.id).notNull(),
  stepName: text('step_name').notNull(),
  stepIndex: integer('step_index').notNull(),
  verdict: text('verdict', { enum: ['pass', 'fail', 'warning'] }).notNull(),
  confidence: real('confidence').notNull(),
  screenshotPath: text('screenshot_path'),
  analysis: text('analysis').notNull(), // JSON
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const metrics = sqliteTable('metrics', {
  id: text('id').primaryKey(),
  runId: text('run_id').references(() => runs.id).notNull(),
  lcpP75: real('lcp_p75'),
  lcpP90: real('lcp_p90'),
  clsP75: real('cls_p75'),
  clsP90: real('cls_p90'),
  inpP75: real('inp_p75'),
  inpP90: real('inp_p90'),
  analysis: text('analysis'), // JSON from Wood Wide
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const baselines = sqliteTable('baselines', {
  id: text('id').primaryKey(),
  flowId: text('flow_id').references(() => flows.id).notNull(),
  stepName: text('step_name').notNull(),
  browser: text('browser').notNull(),
  viewport: text('viewport').notNull(),
  screenshotPath: text('screenshot_path').notNull(),
  analysisSnapshot: text('analysis_snapshot').notNull(), // JSON
  gitBranch: text('git_branch'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

---

## CLI Commands

### flowguard init

```typescript
// packages/cli/src/commands/init.ts

import { Command } from 'commander';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export const initCommand = new Command('init')
  .description('Initialize FlowGuard in current project')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .action(async (options) => {
    console.log('Initializing FlowGuard...\n');

    // Create directories
    await mkdir('flows', { recursive: true });
    await mkdir('.flowguard', { recursive: true });

    // Create config file
    const config = {
      version: 1,
      baseUrl: '${BASE_URL}',
      browsers: ['chromium'],
      viewports: [
        { name: 'desktop', width: 1920, height: 1080 },
        { name: 'mobile', width: 375, height: 812 },
      ],
      outputDir: '.flowguard/results',
      screenshotDir: '.flowguard/screenshots',
    };

    await writeFile(
      'flowguard.config.yaml',
      `# FlowGuard Configuration
version: 1

# Base URL for testing (use environment variable)
baseUrl: \${BASE_URL}

# Browsers to test (MVP: chromium only)
browsers:
  - chromium

# Viewport configurations
viewports:
  - name: desktop
    width: 1920
    height: 1080
  - name: mobile
    width: 375
    height: 812

# Output directories
outputDir: .flowguard/results
screenshotDir: .flowguard/screenshots

# Arize Phoenix (optional)
# phoenix:
#   endpoint: https://app.phoenix.arize.com
#   apiKey: \${PHOENIX_API_KEY}

# Wood Wide AI (optional)
# woodwide:
#   apiKey: \${WOODWIDE_API_KEY}
`
    );

    // Create example flow
    await writeFile(
      'flows/example.flow.yaml',
      `# Example FlowGuard Flow
name: example-flow
version: 1
description: Example user flow

intent: |
  User visits the homepage and can clearly see the main call-to-action.

url: \${BASE_URL}/

steps:
  - name: page-load
    action: navigate
    assert:
      - "Page loads completely"
      - "Main heading is visible"
      - "Primary CTA button is prominent"

browsers:
  - chromium

viewports:
  - name: desktop
    width: 1920
    height: 1080

tags:
  - example
`
    );

    console.log('Created:');
    console.log('  - flowguard.config.yaml');
    console.log('  - flows/example.flow.yaml');
    console.log('  - .flowguard/');
    console.log('\nNext steps:');
    console.log('  1. Set BASE_URL environment variable');
    console.log('  2. Edit flows/example.flow.yaml for your app');
    console.log('  3. Run: flowguard run');
  });
```

### flowguard run

```typescript
// packages/cli/src/commands/run.ts

import { Command } from 'commander';
import { glob } from 'glob';
import { FlowRunner } from '@flowguard/core';
import ora from 'ora';

export const runCommand = new Command('run')
  .description('Run flow tests')
  .option('-f, --flow <name>', 'Run specific flow by name')
  .option('-t, --tag <tag>', 'Run flows with specific tag')
  .option('--headed', 'Run browsers in headed mode')
  .option('--update-baseline', 'Update baselines for passing flows')
  .action(async (options) => {
    const spinner = ora('Loading flows...').start();

    try {
      // Find flow files
      const flowFiles = await glob('flows/**/*.flow.yaml');

      if (flowFiles.length === 0) {
        spinner.fail('No flow files found. Run "flowguard init" first.');
        process.exit(1);
      }

      spinner.text = `Found ${flowFiles.length} flows`;

      // Initialize runner
      const runner = new FlowRunner({
        headed: options.headed,
        updateBaseline: options.updateBaseline,
      });

      // Filter flows if specified
      let flows = await runner.loadFlows(flowFiles);

      if (options.flow) {
        flows = flows.filter(f => f.name === options.flow);
      }
      if (options.tag) {
        flows = flows.filter(f => f.tags.includes(options.tag));
      }

      spinner.succeed(`Running ${flows.length} flows`);
      console.log('');

      // Run flows
      const results = await runner.run(flows, {
        onFlowStart: (flow) => {
          console.log(`\nFlow: ${flow.name}`);
        },
        onStepComplete: (step, result) => {
          const icon = result.verdict === 'pass' ? '✓' : result.verdict === 'fail' ? '✗' : '⚠';
          console.log(`  ${icon} ${step.name} (${result.confidence.toFixed(2)})`);
        },
        onFlowComplete: (flow, result) => {
          const status = result.passed ? 'PASSED' : 'FAILED';
          console.log(`  → ${status}`);
        },
      });

      // Summary
      console.log('\n─────────────────────────────────');
      console.log(`Results: ${results.passed}/${results.total} passed`);

      if (results.failed > 0) {
        console.log(`\nFailed flows:`);
        results.failures.forEach(f => {
          console.log(`  - ${f.flow}: ${f.reason}`);
        });
        process.exit(1);
      }

    } catch (error) {
      spinner.fail('Error running flows');
      console.error(error);
      process.exit(1);
    }
  });
```

---

## Dashboard Components

### Run Card

```tsx
// apps/web/components/run-card.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface RunCardProps {
  run: {
    id: string;
    flowName: string;
    status: 'passed' | 'failed' | 'running';
    browser: string;
    viewport: string;
    duration?: number;
    completedAt?: Date;
  };
}

export function RunCard({ run }: RunCardProps) {
  return (
    <Link href={`/runs/${run.id}`}>
      <Card className="hover:border-primary/50 transition-colors">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{run.flowName}</CardTitle>
            <Badge
              variant={
                run.status === 'passed' ? 'success' :
                run.status === 'failed' ? 'destructive' :
                'secondary'
              }
            >
              {run.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{run.browser}</span>
            <span>{run.viewport}</span>
            {run.duration && <span>{run.duration}ms</span>}
            {run.completedAt && (
              <span>{formatDistanceToNow(run.completedAt)} ago</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

### Verdict Badge

```tsx
// apps/web/components/verdict-badge.tsx

import { Badge } from '@/components/ui/badge';
import { Check, X, AlertTriangle } from 'lucide-react';

interface VerdictBadgeProps {
  verdict: 'pass' | 'fail' | 'warning';
  confidence?: number;
}

export function VerdictBadge({ verdict, confidence }: VerdictBadgeProps) {
  const icons = {
    pass: <Check className="h-3 w-3" />,
    fail: <X className="h-3 w-3" />,
    warning: <AlertTriangle className="h-3 w-3" />,
  };

  const variants = {
    pass: 'success',
    fail: 'destructive',
    warning: 'warning',
  } as const;

  return (
    <Badge variant={variants[verdict]} className="gap-1">
      {icons[verdict]}
      {verdict.toUpperCase()}
      {confidence !== undefined && (
        <span className="ml-1 opacity-70">
          ({Math.round(confidence * 100)}%)
        </span>
      )}
    </Badge>
  );
}
```

---

## Implementation Priority (MVP)

### Phase 1: Core Engine (Critical)
1. [ ] Flow parser (YAML → objects)
2. [ ] Playwright executor (screenshot capture)
3. [ ] Vision analyzer (Claude API integration)
4. [ ] Insight engine (pass/fail decisions)
5. [ ] Basic CLI (init, run)

### Phase 2: Observability (Sponsor)
6. [ ] Arize Phoenix tracing setup
7. [ ] Span instrumentation
8. [ ] Wood Wide AI client
9. [ ] CrUX metrics integration

### Phase 3: Dashboard (Polish)
10. [ ] Next.js app setup
11. [ ] Run history page
12. [ ] Run detail page with screenshots
13. [ ] Basic analytics

### Phase 4: Demo Ready
14. [ ] Example flows for demo
15. [ ] Documentation
16. [ ] Deployment to Vercel

---

## Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...       # Claude API for vision

# Sponsor Integrations
PHOENIX_API_KEY=...                 # Arize Phoenix
PHOENIX_COLLECTOR_ENDPOINT=...      # Phoenix endpoint
WOODWIDE_API_KEY=...                # Wood Wide AI

# Optional
CRUX_API_KEY=...                    # Chrome UX Report
BASE_URL=http://localhost:3000      # Default test URL

# Database (production)
DATABASE_URL=libsql://...           # Turso connection
```

---

## Testing Strategy

### Unit Tests
- Flow parser
- Vision prompt generation
- Insight engine logic

### Integration Tests
- Playwright screenshot capture
- Vision API calls (mocked)
- Database operations

### E2E Tests
- Full flow execution against test app
- CLI commands
- Dashboard interactions

---

*This specification provides the technical foundation for FlowGuard AI. Refer to STARTUP_SPEC.md for business context.*
