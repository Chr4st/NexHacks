# Quick Start: Browserbase & Datadog Integration

This quick-start guide provides ready-to-use code templates for integrating Browserbase and Datadog into FlowGuard.

## Prerequisites

```bash
# Install dependencies
npm install @browserbasehq/sdk dd-trace playwright-core

# Set environment variables
export BROWSERBASE_API_KEY="your_api_key"
export BROWSERBASE_PROJECT_ID="your_project_id"
export DD_SERVICE="flowguard"
export DD_ENV="development"
export DD_VERSION="0.1.0"
```

---

## Step 1: Initialize Datadog Tracer (FIRST!)

Create `/Users/jibril/.devswarm/repos/0/f7139dd1/browserbase-integration/src/dd-tracer.ts`:

```typescript
// dd-tracer.ts
// IMPORTANT: This file must be imported FIRST in your application
import tracer from 'dd-trace';

tracer.init({
  service: process.env.DD_SERVICE || 'flowguard',
  env: process.env.DD_ENV || 'development',
  version: process.env.DD_VERSION || '0.1.0',

  // Agent connection
  hostname: process.env.DD_AGENT_HOST || 'localhost',
  port: parseInt(process.env.DD_TRACE_AGENT_PORT || '8126'),

  // Enable features
  runtimeMetrics: true,
  profiling: process.env.NODE_ENV === 'production',
  logInjection: true,

  // Tags
  tags: {
    'team': 'engineering',
    'product': 'flowguard'
  }
});

// Configure MongoDB instrumentation
tracer.use('mongodb-core', {
  service: 'mongodb-flowguard',
  hooks: {
    query: (span, command) => {
      span.setTag('mongodb.collection', command.collection);
      span.setTag('mongodb.operation', command.type);
    }
  }
});

// Configure HTTP client
tracer.use('http', {
  service: 'http-client',
  splitByDomain: true
});

console.log('[Datadog] Tracer initialized');

export default tracer;
```

---

## Step 2: Update Main Entry Point

Update `/Users/jibril/.devswarm/repos/0/f7139dd1/browserbase-integration/src/index.ts`:

```typescript
// index.ts
import './dd-tracer.js'; // MUST BE FIRST - before any other imports

// Now import everything else
export { runFlow } from './runner.js';
export { parseFlow } from './parser.js';
export { analyzeScreenshot } from './vision.js';
export type { Flow, FlowRunResult, StepResult } from './types.js';
```

Update `/Users/jibril/.devswarm/repos/0/f7139dd1/browserbase-integration/src/cli.ts`:

```typescript
// cli.ts
import './dd-tracer.js'; // MUST BE FIRST

import { program } from 'commander';
import { runFlow } from './runner.js';
// ... rest of your CLI code
```

---

## Step 3: Update Tracing Module (Dual Export)

Update `/Users/jibril/.devswarm/repos/0/f7139dd1/browserbase-integration/src/tracing.ts`:

```typescript
import { trace, SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { NodeTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import tracer from './dd-tracer.js';
import type { FlowRunResult, StepResult, AnalysisResult } from './types.js';

const TRACER_NAME = 'flowguard.core';

let otelProvider: NodeTracerProvider | null = null;
let isInitialized = false;

/**
 * Initialize OpenTelemetry tracing for Arize Phoenix.
 * Datadog tracing is automatically initialized via dd-tracer.ts
 */
export function initTracing(phoenixEndpoint?: string): void {
  if (isInitialized) {
    return;
  }

  const endpoint = phoenixEndpoint ?? process.env.PHOENIX_ENDPOINT ?? 'http://localhost:6006/v1/traces';

  otelProvider = new NodeTracerProvider();

  const exporter = new OTLPTraceExporter({
    url: endpoint,
    headers: {},
  });

  otelProvider.addSpanProcessor(new BatchSpanProcessor(exporter));
  otelProvider.register();

  isInitialized = true;
  console.log(`[FlowGuard] OpenTelemetry initialized → Phoenix: ${endpoint}`);
  console.log(`[FlowGuard] Datadog initialized → Agent: ${process.env.DD_AGENT_HOST || 'localhost'}:${process.env.DD_TRACE_AGENT_PORT || '8126'}`);
}

/**
 * Shutdown tracing and flush any pending spans.
 */
export async function shutdownTracing(): Promise<void> {
  if (otelProvider) {
    await otelProvider.shutdown();
    otelProvider = null;
    isInitialized = false;
  }
}

/**
 * Get the tracer instance.
 */
function getTracer() {
  return trace.getTracer(TRACER_NAME);
}

/**
 * Trace a flow run with all its steps.
 * Sends traces to both Phoenix (OpenTelemetry) and Datadog.
 */
export async function traceFlowRun<T extends FlowRunResult>(
  flowName: string,
  intent: string,
  fn: () => Promise<T>
): Promise<T> {
  // Start OpenTelemetry span (goes to Phoenix)
  const otelTracer = getTracer();

  return otelTracer.startActiveSpan(
    `flow.run.${flowName}`,
    {
      kind: SpanKind.INTERNAL,
      attributes: {
        'flowguard.flow_name': flowName,
        'flowguard.intent': intent,
        'openinference.span.kind': 'CHAIN',
      },
    },
    async (otelSpan) => {
      // Also create Datadog span
      return tracer.trace('flow.run', {
        resource: flowName,
        service: 'flowguard-runner',
        tags: {
          'flow.name': flowName,
          'flow.intent': intent
        }
      }, async (ddSpan) => {
        try {
          const result = await fn();

          // Add attributes to OpenTelemetry span
          otelSpan.setAttributes({
            'flowguard.verdict': result.verdict,
            'flowguard.confidence': result.confidence,
            'flowguard.duration_ms': result.durationMs,
            'flowguard.step_count': result.steps.length,
          });

          // Add tags to Datadog span
          ddSpan.setTag('flow.verdict', result.verdict);
          ddSpan.setTag('flow.confidence', result.confidence);
          ddSpan.setTag('flow.duration_ms', result.durationMs);
          ddSpan.setTag('flow.step_count', result.steps.length);

          // Set status
          if (result.verdict === 'error') {
            otelSpan.setStatus({ code: SpanStatusCode.ERROR, message: 'Flow execution error' });
            ddSpan.setTag('error', true);
          } else {
            otelSpan.setStatus({ code: SpanStatusCode.OK });
          }

          // Add trace IDs
          const traceId = otelSpan.spanContext().traceId;
          const ddTraceId = ddSpan.context().toTraceId();

          result.traceId = traceId;
          result.phoenixTraceUrl = `http://localhost:6006/tracing/traces/${traceId}`;
          result.datadogTraceUrl = `https://app.datadoghq.com/apm/trace/${ddTraceId}`;

          // Log metrics
          tracer.dogstatsd.increment('flow.completed', 1, {
            'flow.name': flowName,
            'verdict': result.verdict
          });

          tracer.dogstatsd.timing('flow.duration', result.durationMs, {
            'flow.name': flowName
          });

          return result;
        } catch (error) {
          otelSpan.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : 'Unknown error',
          });
          ddSpan.setTag('error', true);
          ddSpan.setTag('error.message', error instanceof Error ? error.message : 'Unknown error');

          tracer.dogstatsd.increment('flow.error', 1, {
            'flow.name': flowName,
            'error.type': error instanceof Error ? error.name : 'unknown'
          });

          throw error;
        } finally {
          otelSpan.end();
        }
      });
    }
  );
}

/**
 * Trace a step execution.
 */
export async function traceStep<T extends StepResult>(
  stepIndex: number,
  action: string,
  fn: () => Promise<T>
): Promise<T> {
  const otelTracer = getTracer();

  return otelTracer.startActiveSpan(
    `step.${action}`,
    {
      kind: SpanKind.INTERNAL,
      attributes: {
        'flowguard.step_index': stepIndex,
        'flowguard.step_action': action,
        'openinference.span.kind': 'TOOL',
      },
    },
    async (otelSpan) => {
      return tracer.trace('flow.step', {
        resource: action,
        tags: {
          'step.index': stepIndex,
          'step.action': action
        }
      }, async (ddSpan) => {
        try {
          const result = await fn();

          otelSpan.setAttributes({
            'flowguard.step_success': result.success,
            'flowguard.step_duration_ms': result.durationMs,
          });

          ddSpan.setTag('step.success', result.success);
          ddSpan.setTag('step.duration_ms', result.durationMs);

          if (result.screenshotPath) {
            otelSpan.setAttribute('flowguard.screenshot_path', result.screenshotPath);
            ddSpan.setTag('screenshot.path', result.screenshotPath);
          }

          if (!result.success) {
            otelSpan.setStatus({
              code: SpanStatusCode.ERROR,
              message: result.error ?? 'Step failed',
            });
            ddSpan.setTag('error', true);
            ddSpan.setTag('error.message', result.error ?? 'Step failed');
          } else {
            otelSpan.setStatus({ code: SpanStatusCode.OK });
          }

          return result;
        } catch (error) {
          otelSpan.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : 'Unknown error',
          });
          ddSpan.setTag('error', true);
          ddSpan.setTag('error.message', error instanceof Error ? error.message : 'Unknown error');
          throw error;
        } finally {
          otelSpan.end();
        }
      });
    }
  );
}

/**
 * Trace a vision analysis call.
 */
export async function traceVisionAnalysis<T extends AnalysisResult>(
  intent: string,
  promptTokens: number,
  fn: () => Promise<T>
): Promise<T> {
  const otelTracer = getTracer();

  return otelTracer.startActiveSpan(
    'vision.analyze',
    {
      kind: SpanKind.CLIENT,
      attributes: {
        'openinference.span.kind': 'LLM',
        'llm.model_name': 'claude-3-5-sonnet-20241022',
        'llm.provider': 'anthropic',
        'flowguard.intent': intent,
        'llm.token_count.prompt': promptTokens,
      },
    },
    async (otelSpan) => {
      return tracer.trace('vision.analyze', {
        service: 'flowguard-vision',
        resource: 'claude-3.5-sonnet',
        tags: {
          'llm.model': 'claude-3-5-sonnet-20241022',
          'llm.provider': 'anthropic',
          'intent': intent,
          'prompt.tokens': promptTokens
        }
      }, async (ddSpan) => {
        const startTime = Date.now();

        try {
          const result = await fn();
          const latencyMs = Date.now() - startTime;

          otelSpan.setAttributes({
            'flowguard.analysis_status': result.status,
            'flowguard.latency_ms': latencyMs,
          });

          ddSpan.setTag('analysis.status', result.status);
          ddSpan.setTag('latency.ms', latencyMs);

          if (result.status === 'pass' || result.status === 'fail') {
            otelSpan.setAttributes({
              'flowguard.confidence': result.confidence,
              'flowguard.reasoning': result.reasoning,
            });
            ddSpan.setTag('confidence', result.confidence);
          }

          if (result.status === 'fail') {
            otelSpan.setAttribute('flowguard.issues_count', result.issues.length);
            ddSpan.setTag('issues.count', result.issues.length);
          }

          if (result.status === 'error') {
            otelSpan.setStatus({
              code: SpanStatusCode.ERROR,
              message: result.error,
            });
            ddSpan.setTag('error', true);
            ddSpan.setTag('error.message', result.error);
          } else {
            otelSpan.setStatus({ code: SpanStatusCode.OK });
          }

          // Log metrics
          tracer.dogstatsd.timing('vision.latency', latencyMs, {
            'model': 'claude-3.5-sonnet'
          });

          tracer.dogstatsd.increment('vision.analysis', 1, {
            'status': result.status
          });

          return result;
        } catch (error) {
          otelSpan.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : 'Unknown error',
          });
          ddSpan.setTag('error', true);
          ddSpan.setTag('error.message', error instanceof Error ? error.message : 'Unknown error');
          throw error;
        } finally {
          otelSpan.end();
        }
      });
    }
  );
}

/**
 * Check if tracing is currently initialized.
 */
export function isTracingEnabled(): boolean {
  return isInitialized;
}
```

---

## Step 4: Create Browserbase Client

Create `/Users/jibril/.devswarm/repos/0/f7139dd1/browserbase-integration/src/browserbase-client.ts`:

```typescript
// browserbase-client.ts
import { chromium, Browser, BrowserContext, Page } from 'playwright-core';
import Browserbase from '@browserbasehq/sdk';
import tracer from './dd-tracer.js';

export interface BrowserbaseSessionOptions {
  projectId?: string;
  viewport?: {
    width: number;
    height: number;
  };
  recordSession?: boolean;
  advancedStealth?: boolean;
  blockAds?: boolean;
  timeout?: number;
  userMetadata?: Record<string, any>;
}

export interface BrowserbaseSession {
  id: string;
  browser: Browser;
  context: BrowserContext;
  page: Page;
  replayUrl: string;
}

export class BrowserbaseClient {
  private bb: Browserbase;

  constructor() {
    const apiKey = process.env.BROWSERBASE_API_KEY;
    if (!apiKey) {
      throw new Error('BROWSERBASE_API_KEY environment variable is required');
    }

    this.bb = new Browserbase({ apiKey });
  }

  async createSession(options: BrowserbaseSessionOptions = {}): Promise<BrowserbaseSession> {
    return tracer.trace('browserbase.create_session', async (span) => {
      const projectId = options.projectId || process.env.BROWSERBASE_PROJECT_ID;
      if (!projectId) {
        throw new Error('BROWSERBASE_PROJECT_ID is required');
      }

      // Create Browserbase session
      const session = await this.bb.sessions.create({
        projectId,
        browserSettings: {
          viewport: options.viewport,
          recordSession: options.recordSession ?? true,
          logSession: true,
          advancedStealth: options.advancedStealth ?? true,
          blockAds: options.blockAds ?? true,
        },
        timeout: options.timeout ?? 300,
        userMetadata: options.userMetadata,
      });

      span.setTag('browserbase.session_id', session.id);
      span.setTag('browserbase.project_id', projectId);

      // Connect to session via CDP
      const browser = await chromium.connectOverCDP(session.connectUrl);
      const context = browser.contexts()[0];
      const page = context?.pages()[0];

      if (!page) {
        throw new Error('No page available in Browserbase session');
      }

      const replayUrl = `https://browserbase.com/sessions/${session.id}`;
      span.setTag('browserbase.replay_url', replayUrl);

      tracer.dogstatsd.increment('browserbase.session.created');

      console.log(`[Browserbase] Session created: ${session.id}`);
      console.log(`[Browserbase] Replay URL: ${replayUrl}`);

      return {
        id: session.id,
        browser,
        context,
        page,
        replayUrl,
      };
    });
  }

  async closeSession(session: BrowserbaseSession): Promise<void> {
    return tracer.trace('browserbase.close_session', async (span) => {
      span.setTag('browserbase.session_id', session.id);

      try {
        await session.page.close();
        await session.browser.close();

        tracer.dogstatsd.increment('browserbase.session.closed');

        console.log(`[Browserbase] Session closed: ${session.id}`);
      } catch (error) {
        span.setTag('error', true);
        span.setTag('error.message', error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    });
  }

  async captureScreenshot(
    page: Page,
    path: string
  ): Promise<Buffer> {
    return tracer.trace('browserbase.screenshot', async (span) => {
      span.setTag('screenshot.path', path);

      const buffer = await page.screenshot({ path, fullPage: true });

      tracer.dogstatsd.increment('browserbase.screenshot.captured');

      return buffer;
    });
  }
}

// Export singleton instance
export const browserbaseClient = new BrowserbaseClient();
```

---

## Step 5: Update Runner with Browserbase

Update `/Users/jibril/.devswarm/repos/0/f7139dd1/browserbase-integration/src/runner.ts`:

```typescript
// runner.ts
import './dd-tracer.js';
import { Flow, FlowRunResult, StepResult } from './types.js';
import { traceFlowRun, traceStep } from './tracing.js';
import { browserbaseClient } from './browserbase-client.js';
import tracer from './dd-tracer.js';

export async function runFlow(flow: Flow): Promise<FlowRunResult> {
  const startTime = Date.now();

  return traceFlowRun(flow.name, flow.intent, async () => {
    let session;

    try {
      // Create Browserbase session
      session = await browserbaseClient.createSession({
        viewport: flow.viewport,
        userMetadata: {
          flowName: flow.name,
          intent: flow.intent,
        },
      });

      const { page } = session;

      // Navigate to starting URL
      await page.goto(flow.url, { waitUntil: 'networkidle' });

      // Run steps
      const steps: StepResult[] = [];
      for (let i = 0; i < flow.steps.length; i++) {
        const step = flow.steps[i];

        const stepResult = await traceStep(i, step.action, async () => {
          const stepStartTime = Date.now();

          try {
            // Execute step
            await executeStep(page, step);

            // Capture screenshot
            const screenshotPath = `./screenshots/${flow.name}-step-${i}.png`;
            await browserbaseClient.captureScreenshot(page, screenshotPath);

            return {
              stepIndex: i,
              action: step.action,
              success: true,
              durationMs: Date.now() - stepStartTime,
              screenshotPath,
            };
          } catch (error) {
            return {
              stepIndex: i,
              action: step.action,
              success: false,
              durationMs: Date.now() - stepStartTime,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        });

        steps.push(stepResult);

        // Stop on first failure
        if (!stepResult.success) {
          break;
        }
      }

      // Close session
      await browserbaseClient.closeSession(session);

      const durationMs = Date.now() - startTime;
      const allStepsSucceeded = steps.every((s) => s.success);

      return {
        flowName: flow.name,
        intent: flow.intent,
        verdict: allStepsSucceeded ? 'pass' : 'fail',
        confidence: allStepsSucceeded ? 0.95 : 0.5,
        durationMs,
        steps,
        sessionReplayUrl: session.replayUrl,
      };
    } catch (error) {
      // Close session on error
      if (session) {
        await browserbaseClient.closeSession(session);
      }

      throw error;
    }
  });
}

async function executeStep(page: any, step: any): Promise<void> {
  return tracer.trace('flow.step.execute', {
    resource: step.action,
    tags: {
      'step.action': step.action,
      'step.target': step.target,
    },
  }, async () => {
    switch (step.action) {
      case 'navigate':
        await page.goto(step.target, { waitUntil: 'networkidle' });
        break;
      case 'click':
        await page.click(step.target);
        break;
      case 'type':
        await page.type(step.target, step.value);
        break;
      case 'wait':
        await page.waitForTimeout(parseInt(step.value));
        break;
      case 'screenshot':
        // Screenshot handled by caller
        break;
      default:
        throw new Error(`Unknown action: ${step.action}`);
    }
  });
}
```

---

## Step 6: Update Database Client

Update `/Users/jibril/.devswarm/repos/0/f7139dd1/browserbase-integration/src/db/client.ts`:

```typescript
// db/client.ts
import './dd-tracer.js';
import { MongoClient, Db } from 'mongodb';
import tracer from '../dd-tracer.js';

const dogstatsd = tracer.dogstatsd;

export class DatabaseClient {
  private static instance: DatabaseClient;
  private client: MongoClient | null = null;
  private db: Db | null = null;

  private constructor() {}

  public static getInstance(): DatabaseClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient();
    }
    return DatabaseClient.instance;
  }

  async connect(): Promise<Db> {
    return tracer.trace('mongodb.connect', async (span) => {
      if (!this.db) {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
          throw new Error('MONGODB_URI environment variable is required');
        }

        if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
          throw new Error('Invalid MongoDB URI format');
        }

        const dbName = process.env.MONGODB_DATABASE || 'flowguard';

        span.setTag('db.system', 'mongodb');
        span.setTag('db.name', dbName);

        this.client = new MongoClient(uri, {
          tls: process.env.NODE_ENV === 'production',
          tlsAllowInvalidCertificates: false,
          maxPoolSize: 50,
          minPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });

        // Monitor connection pool events
        this.client.on('connectionPoolCreated', (event) => {
          dogstatsd.gauge('mongodb.pool.max_size', event.options.maxPoolSize);
          dogstatsd.gauge('mongodb.pool.min_size', event.options.minPoolSize);
        });

        this.client.on('connectionCheckedOut', () => {
          dogstatsd.increment('mongodb.pool.checkout');
        });

        this.client.on('connectionCheckedIn', () => {
          dogstatsd.increment('mongodb.pool.checkin');
        });

        this.client.on('commandStarted', (event) => {
          dogstatsd.increment('mongodb.command.started', 1, {
            'command.name': event.commandName,
            'db.name': event.databaseName,
          });
        });

        this.client.on('commandSucceeded', (event) => {
          dogstatsd.timing('mongodb.command.duration', event.duration, {
            'command.name': event.commandName,
          });
        });

        this.client.on('commandFailed', (event) => {
          dogstatsd.increment('mongodb.command.failed', 1, {
            'command.name': event.commandName,
            'error': event.failure.message,
          });
        });

        await this.client.connect();
        this.db = this.client.db(dbName);

        span.setTag('mongodb.connected', true);
        console.log('✅ MongoDB connected successfully');

        dogstatsd.increment('mongodb.connection.success');
      }
      return this.db;
    });
  }

  async disconnect(): Promise<void> {
    return tracer.trace('mongodb.disconnect', async () => {
      if (this.client) {
        await this.client.close();
        this.client = null;
        this.db = null;
        console.log('✅ MongoDB disconnected');

        dogstatsd.increment('mongodb.connection.closed');
      }
    });
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }
}

export const db = DatabaseClient.getInstance();
```

---

## Step 7: Environment Configuration

Create `/Users/jibril/.devswarm/repos/0/f7139dd1/browserbase-integration/.env.example`:

```bash
# Browserbase Configuration
BROWSERBASE_API_KEY=your_browserbase_api_key_here
BROWSERBASE_PROJECT_ID=your_project_id_here
BROWSERBASE_REGION=us-west-2

# Datadog Configuration
DD_SERVICE=flowguard
DD_ENV=development
DD_VERSION=0.1.0
DD_AGENT_HOST=localhost
DD_TRACE_AGENT_PORT=8126
DD_DOGSTATSD_PORT=8125
DD_TRACE_SAMPLE_RATE=1.0
DD_RUNTIME_METRICS_ENABLED=true
DD_PROFILING_ENABLED=false
DD_LOGS_INJECTION=true
DD_TAGS=team:engineering,product:flowguard

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=flowguard

# Anthropic Configuration (existing)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Phoenix Configuration (existing)
PHOENIX_ENDPOINT=http://localhost:6006/v1/traces

# Application Configuration
NODE_ENV=development
```

---

## Step 8: Update Types

Add new fields to `/Users/jibril/.devswarm/repos/0/f7139dd1/browserbase-integration/src/types.ts`:

```typescript
export interface FlowRunResult {
  flowName: string;
  intent: string;
  verdict: 'pass' | 'fail' | 'error';
  confidence: number;
  durationMs: number;
  steps: StepResult[];
  traceId?: string;
  phoenixTraceUrl?: string;
  datadogTraceUrl?: string;
  sessionReplayUrl?: string; // NEW: Browserbase replay URL
}
```

---

## Testing Your Integration

### 1. Start Datadog Agent (if local)

```bash
# Using Docker
docker run -d --name dd-agent \
  -e DD_API_KEY=<your_datadog_api_key> \
  -e DD_SITE="datadoghq.com" \
  -e DD_APM_ENABLED=true \
  -e DD_DOGSTATSD_NON_LOCAL_TRAFFIC=true \
  -p 8126:8126 \
  -p 8125:8125/udp \
  datadog/agent:latest
```

### 2. Run a Test Flow

```bash
npm run build
node dist/cli.js run flows/signup.yaml
```

### 3. Verify Integration

**Check Browserbase**:
- Visit the session replay URL printed in console
- Verify session recording and screenshots

**Check Datadog**:
- Go to https://app.datadoghq.com/apm/traces
- Search for service: `flowguard`
- Verify traces appear with MongoDB spans

**Check Phoenix**:
- Visit http://localhost:6006/tracing
- Verify OpenTelemetry traces still work

---

## Common Issues & Solutions

### Issue: "dd-trace must be imported before other modules"

**Solution**: Ensure `import './dd-tracer.js'` is the FIRST line in:
- `src/index.ts`
- `src/cli.ts`
- Any other entry points

### Issue: Browserbase session fails to connect

**Solution**:
- Verify `BROWSERBASE_API_KEY` is set correctly
- Check `BROWSERBASE_PROJECT_ID` is valid
- Ensure network connectivity to Browserbase

### Issue: Datadog traces not appearing

**Solution**:
- Verify Datadog Agent is running: `docker ps | grep dd-agent`
- Check agent connectivity: `curl http://localhost:8126/info`
- Verify environment variables are set

### Issue: MongoDB queries not traced

**Solution**:
- Ensure `dd-tracer.ts` is imported before MongoDB client
- Verify `mongodb-core` plugin is configured
- Check Datadog Agent logs for errors

---

## Next Steps

1. **Production Configuration**:
   - Set `DD_ENV=production`
   - Adjust `DD_TRACE_SAMPLE_RATE` (e.g., 0.1 for 10% sampling)
   - Enable profiling: `DD_PROFILING_ENABLED=true`

2. **Alerting**:
   - Set up Datadog monitors for error rates
   - Create alerts for slow queries
   - Monitor Browserbase session failures

3. **Dashboards**:
   - Create Datadog dashboard for FlowGuard metrics
   - Track flow success rates
   - Monitor vision analysis latency

4. **Documentation**:
   - Update README with Browserbase/Datadog setup
   - Document environment variables
   - Add troubleshooting guide

---

## Resources

- [Full Integration Guide](/Users/jibril/.devswarm/repos/0/f7139dd1/browserbase-integration/docs/INTEGRATION_GUIDE.md)
- [Browserbase Docs](https://docs.browserbase.com)
- [Datadog APM Docs](https://docs.datadoghq.com/tracing/)
- [dd-trace-js GitHub](https://github.com/DataDog/dd-trace-js)
