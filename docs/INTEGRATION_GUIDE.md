# Browserbase & Datadog Integration Guide

This comprehensive guide covers integrating Browserbase and Datadog into the FlowGuard project, focusing on browser automation, APM monitoring, and MongoDB observability.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Browserbase Integration](#browserbase-integration)
3. [Datadog APM Integration](#datadog-apm-integration)
4. [MongoDB Monitoring with Datadog](#mongodb-monitoring-with-datadog)
5. [OpenTelemetry & Datadog Interoperability](#opentelemetry--datadog-interoperability)
6. [Implementation Examples](#implementation-examples)
7. [Best Practices](#best-practices)

---

## Project Overview

**FlowGuard** is an AI-native UX testing platform that validates user flows with vision analysis. Current tech stack:

- **Runtime**: Node.js 18+ (ESNext modules)
- **Language**: TypeScript 5.7+
- **Browser Automation**: Playwright 1.49.0
- **Database**: MongoDB 7.0.0
- **AI/Vision**: Anthropic Claude SDK 0.32.0
- **Current Tracing**: OpenTelemetry → Arize Phoenix
- **Testing**: Vitest 2.1.8

### Current Architecture

```
CLI → Flow Parser → Playwright Runner → Vision Analyzer → Report Generator
                                              ↓
                                        Arize Phoenix (Traces)
```

---

## Browserbase Integration

Browserbase provides managed headless browser infrastructure, offering session management, recording, and scalable browser automation.

### 1. Installation

```bash
npm install @browserbasehq/sdk playwright-core
```

**Note**: Use `playwright-core` instead of full `playwright` to reduce bundle size when using Browserbase's remote browsers.

### 2. SDK Setup

```typescript
import { chromium } from "playwright-core";
import Browserbase from "@browserbasehq/sdk";

// Initialize Browserbase client
const bb = new Browserbase({
  apiKey: process.env.BROWSERBASE_API_KEY as string,
});
```

### 3. Basic Session Management

```typescript
// Create a new browser session
const session = await bb.sessions.create({
  projectId: process.env.BROWSERBASE_PROJECT_ID as string,
});

// Connect to the session via CDP (Chrome DevTools Protocol)
const browser = await chromium.connectOverCDP(session.connectUrl);

// Get the default context (required for session recording)
const defaultContext = browser.contexts()[0];
const page = defaultContext?.pages()[0];

// Use the page
await page?.goto("https://example.com");
await page?.screenshot({ path: "screenshot.png" });

// Clean up
await page?.close();
await browser.close();

console.log(`Session replay: https://browserbase.com/sessions/${session.id}`);
```

### 4. Advanced Session Configuration

```typescript
const session = await bb.sessions.create({
  projectId: process.env.BROWSERBASE_PROJECT_ID!,

  // Browser settings
  browserSettings: {
    // Persistent context for authentication
    context: {
      id: "my-context-id", // Reuse cookies/local storage
      persist: true
    },

    // Viewport configuration
    viewport: {
      width: 1920,
      height: 1080
    },

    // Anti-detection features
    advancedStealth: true,
    blockAds: true,

    // Session recording
    recordSession: true,
    logSession: true,

    // Captcha handling
    solveCaptchas: true,
    captchaImageSelector: "img.captcha",
    captchaInputSelector: "input#captcha-answer",

    // Fingerprinting customization
    fingerprint: {
      httpVersion: "2",
      browsers: ["chrome"],
      devices: ["desktop"],
      locales: ["en-US"],
      operatingSystems: ["windows"],
      screen: {
        minWidth: 1920,
        maxWidth: 3840,
        minHeight: 1080,
        maxHeight: 2160
      }
    },

    // OS simulation
    os: "windows"
  },

  // Proxy configuration
  proxies: [
    {
      type: "browserbase",
      geolocation: {
        city: "New York",
        state: "NY",
        country: "US"
      }
    }
  ],

  // Session management
  timeout: 300, // seconds
  keepAlive: true,
  region: "us-west-2",

  // Custom metadata for tracking
  userMetadata: {
    flowName: "checkout-flow",
    testRun: "regression-001"
  }
});
```

### 5. Custom Proxy Configuration

```typescript
// External proxy with authentication
const session = await bb.sessions.create({
  projectId: process.env.BROWSERBASE_PROJECT_ID!,
  proxies: [
    {
      type: "external",
      server: "http://proxy.example.com:8080",
      username: "proxy-user",
      password: "proxy-pass"
    }
  ]
});

// Domain-based proxy routing
const session = await bb.sessions.create({
  projectId: process.env.BROWSERBASE_PROJECT_ID!,
  proxies: [
    // Use external proxy for Wikipedia
    {
      type: "external",
      server: "http://proxy1.example.com:8080",
      username: "user",
      password: "pass",
      domainPattern: "wikipedia\\.org"
    },
    // Use external proxy for .gov domains
    {
      type: "external",
      server: "http://proxy2.example.com:8080",
      username: "user",
      password: "pass",
      domainPattern: ".*\\.gov"
    },
    // Use Browserbase proxies for all other domains
    {
      type: "browserbase"
    }
  ]
});
```

### 6. Session Recording & Debugging

Browserbase provides comprehensive session recording with DOM history reconstruction:

```typescript
const session = await bb.sessions.create({
  projectId: process.env.BROWSERBASE_PROJECT_ID!,
  browserSettings: {
    recordSession: true,
    logSession: true
  }
});

const browser = await chromium.connectOverCDP(session.connectUrl);
const defaultContext = browser.contexts()[0];

// Enable tracing with screenshots
await defaultContext.tracing.start({
  screenshots: true,
  snapshots: true,
  sources: true
});

// Perform automation
const page = defaultContext.pages()[0];
await page.goto("https://example.com");

// Stop tracing and save HAR file
await defaultContext.tracing.stop({ path: "trace.zip" });

await browser.close();

// Session replay URL (includes DOM history, network logs, console logs)
console.log(`View session: https://browserbase.com/sessions/${session.id}`);
```

**Key Features**:
- Session replays are NOT videos - they use DOM history for lightweight playback
- HAR (HTTP Archive) files capture detailed network activity
- Multi-tab workflows supported with Live View
- Screenshots can be captured and stitched into videos/GIFs

### 7. Environment Variables

```bash
# Required
BROWSERBASE_API_KEY=your_api_key_here
BROWSERBASE_PROJECT_ID=your_project_id_here

# Optional
BROWSERBASE_REGION=us-west-2  # or us-east-1, eu-west-1
```

---

## Datadog APM Integration

Datadog APM provides comprehensive application performance monitoring with automatic instrumentation for Node.js applications.

### 1. Installation

```bash
npm install dd-trace --save
```

### 2. Basic Initialization

**CRITICAL**: `dd-trace` must be imported and initialized **before any other modules** to ensure automatic instrumentation works.

```typescript
// tracer.ts - Import this file first in your application
import tracer from 'dd-trace';

tracer.init({
  service: 'flowguard',
  env: process.env.NODE_ENV || 'development',
  version: '0.1.0',

  // Agent configuration
  hostname: process.env.DD_AGENT_HOST || 'localhost',
  port: parseInt(process.env.DD_TRACE_AGENT_PORT || '8126'),

  // Enable features
  runtimeMetrics: true,      // CPU, memory metrics
  profiling: true,           // Continuous profiler
  logInjection: true,        // Correlate logs with traces

  // APM features
  appsec: { enabled: true }, // Application Security

  // Tags
  tags: {
    'team': 'engineering',
    'product': 'flowguard'
  }
});

export default tracer;
```

```typescript
// index.ts - Your application entry point
import './tracer.js'; // MUST be first
import express from 'express';
// ... other imports
```

### 3. Environment Variables

```bash
# Service identification
DD_SERVICE=flowguard
DD_ENV=production
DD_VERSION=0.1.0

# Agent connection
DD_AGENT_HOST=localhost
DD_TRACE_AGENT_PORT=8126

# DogStatsD for metrics
DD_DOGSTATSD_PORT=8125

# Sampling
DD_TRACE_SAMPLE_RATE=1.0  # 100% sampling (adjust for production)

# Features
DD_RUNTIME_METRICS_ENABLED=true
DD_PROFILING_ENABLED=true
DD_LOGS_INJECTION=true

# Optional: Custom tags
DD_TAGS=datacenter:us-east-1,team:platform
```

### 4. Custom Instrumentation

#### Manual Spans with `tracer.trace()`

```typescript
import tracer from 'dd-trace';

// Synchronous operation
function calculateTax(amount: number): number {
  return tracer.trace('tax.calculate', (span) => {
    span.setTag('tax.amount', amount);
    const tax = amount * 0.08;
    span.setTag('tax.result', tax);
    return tax;
  });
}

// Async/await operation
async function fetchUserData(userId: string) {
  return tracer.trace('user.fetch', async (span) => {
    span.setTag('user.id', userId);

    const user = await database.query('SELECT * FROM users WHERE id = ?', [userId]);

    span.setTag('user.email', user.email);
    span.setTag('user.plan', user.subscriptionPlan);

    return user;
  });
}

// With custom options
async function processReport(reportId: string) {
  return tracer.trace('report.generate', {
    resource: `/reports/${reportId}`,
    service: 'report-generator',
    type: 'worker',
    tags: {
      'report.id': reportId,
      'report.type': 'monthly'
    }
  }, async (span) => {
    const data = await gatherData(reportId);
    const report = await generatePDF(data);

    span.setTag('report.pages', report.pageCount);
    span.setTag('report.size_bytes', report.size);

    return report;
  });
}
```

#### Manual Span Creation with `startSpan()`

```typescript
import tracer from 'dd-trace';

function processPayment(userId: string, amount: number) {
  const span = tracer.startSpan('payment.process', {
    tags: {
      'user.id': userId,
      'payment.amount': amount,
      'payment.currency': 'USD'
    }
  });

  try {
    const result = chargeCustomer(userId, amount);

    span.setTag('payment.transaction_id', result.transactionId);
    span.setTag('payment.status', 'success');

    return result;
  } catch (error) {
    span.setTag('error', true);
    span.setTag('error.message', error.message);
    span.setTag('error.type', error.name);
    span.setTag('error.stack', error.stack);
    throw error;
  } finally {
    span.finish();
  }
}

// Nested spans with parent-child relationships
function handleOrder(orderId: string) {
  const parentSpan = tracer.startSpan('order.handle');

  try {
    const inventorySpan = tracer.startSpan('inventory.check', {
      childOf: parentSpan.context()
    });
    checkInventory(orderId);
    inventorySpan.finish();

    const paymentSpan = tracer.startSpan('payment.charge', {
      childOf: parentSpan.context(),
      tags: { 'order.id': orderId }
    });
    processPayment(orderId);
    paymentSpan.finish();

    parentSpan.setTag('order.status', 'completed');
  } catch (error) {
    parentSpan.setTag('error', true);
    throw error;
  } finally {
    parentSpan.finish();
  }
}
```

### 5. Custom Metrics with DogStatsD

```typescript
import tracer from 'dd-trace';

const dogstatsd = tracer.dogstatsd;

// Increment counter
function trackUserSignup(userId: string, plan: string) {
  dogstatsd.increment('user.signup', 1, {
    'plan': plan,
    'source': 'web'
  });
}

// Record gauge (current value)
function reportQueueSize(queueName: string, size: number) {
  dogstatsd.gauge('queue.size', size, {
    'queue.name': queueName
  });
}

// Track timing/duration
async function trackOperationDuration() {
  const start = Date.now();

  try {
    await performOperation();
    const duration = Date.now() - start;

    dogstatsd.timing('operation.duration', duration, {
      'operation': 'process_data',
      'status': 'success'
    });
  } catch (error) {
    const duration = Date.now() - start;

    dogstatsd.timing('operation.duration', duration, {
      'operation': 'process_data',
      'status': 'error'
    });
  }
}

// Record histogram (statistical distribution)
function trackResponseSize(sizeBytes: number, endpoint: string) {
  dogstatsd.histogram('http.response.size', sizeBytes, {
    'endpoint': endpoint
  });
}

// Distribution metric (better for percentiles)
function trackPaymentAmount(amount: number, currency: string) {
  dogstatsd.distribution('payment.amount', amount, {
    'currency': currency,
    'payment.method': 'credit_card'
  });
}

// Track unique values with sets
function trackActiveUsers(userId: string) {
  dogstatsd.set('users.active', userId, {
    'platform': 'web'
  });
}

// Service check
function reportServiceHealth(serviceName: string, status: number) {
  dogstatsd.check(`service.${serviceName}.health`, status, {
    message: status === 0 ? 'OK' : 'Failed health check'
  });
}

// Event tracking
function reportDeployment(version: string) {
  dogstatsd.event('Application Deployed', `Deployed version ${version}`, {
    alert_type: 'info',
    tags: ['deployment', `version:${version}`]
  });
}
```

### 6. Library-Specific Configuration

```typescript
import tracer from 'dd-trace';

// Configure Express
tracer.use('express', {
  service: 'flowguard-api',
  middleware: true,
  hooks: {
    request: (span, req) => {
      span.setTag('http.useragent', req.headers['user-agent']);
      span.setTag('http.client_ip', req.ip);
    }
  }
});

// Configure HTTP client
tracer.use('http', {
  service: 'external-api',
  splitByDomain: true,
  hooks: {
    request: (span, req) => {
      span.setTag('http.url', req.url);
      span.setTag('http.method', req.method);
    },
    response: (span, res) => {
      span.setTag('http.status_code', res.statusCode);
    }
  }
});

// Configure MongoDB (see MongoDB section for details)
tracer.use('mongodb-core', {
  service: 'mongodb-flowguard',
  hooks: {
    query: (span, command) => {
      span.setTag('mongodb.collection', command.collection);
      span.setTag('mongodb.operation', command.type);
    }
  }
});

// Disable specific plugin if needed
tracer.use('dns', false);
```

---

## MongoDB Monitoring with Datadog

Datadog provides automatic MongoDB instrumentation with detailed query tracking and performance metrics.

### 1. Automatic Instrumentation

The MongoDB Node.js driver is automatically instrumented by `dd-trace`. No code changes required:

```typescript
import './tracer.js'; // Initialize dd-trace first
import { MongoClient } from 'mongodb';

// Your existing MongoDB code works as-is
const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db('flowguard');
const collection = db.collection('flows');

// This query is automatically traced
const result = await collection.findOne({ _id: flowId });
```

### 2. MongoDB-Specific Configuration

```typescript
import tracer from 'dd-trace';

tracer.use('mongodb-core', {
  service: 'mongodb-flowguard',
  hooks: {
    query: (span, command) => {
      span.setTag('mongodb.collection', command.collection);
      span.setTag('mongodb.operation', command.type);

      // Add custom tags
      if (command.query) {
        span.setTag('mongodb.query_size', JSON.stringify(command.query).length);
      }
    }
  }
});
```

### 3. MongoDB APM Events (Alternative Approach)

The MongoDB driver provides native APM events for custom monitoring:

```typescript
import { MongoClient, instrument } from 'mongodb';

// Initialize MongoDB APM listener
const listener = instrument({
  operationIdGenerator: {
    operationId: 1,
    next: function() {
      return this.operationId++;
    }
  },
  timestampGenerator: {
    current: function() {
      return Date.now();
    },
    duration: function(start, end) {
      return end - start;
    }
  }
}, (err, instrumentations) => {
  if (err) {
    console.error('MongoDB instrumentation failed:', err);
  }
});

// Listen to command events
listener.on('started', (event) => {
  console.log('MongoDB command started:', {
    requestId: event.requestId,
    command: event.commandName,
    database: event.databaseName
  });
});

listener.on('succeeded', (event) => {
  console.log('MongoDB command succeeded:', {
    requestId: event.requestId,
    duration: event.duration,
    reply: event.reply
  });
});

listener.on('failed', (event) => {
  console.error('MongoDB command failed:', {
    requestId: event.requestId,
    duration: event.duration,
    failure: event.failure
  });
});
```

### 4. Database Monitoring (DBM) Features

For enhanced MongoDB monitoring, enable Datadog Database Monitoring:

- **Live Query Snapshots**: See currently executing queries
- **Historical Query Analysis**: Analyze slow queries over time
- **Database Load Metrics**: CPU, memory, I/O usage
- **Operation Execution Plans**: Understand query performance
- **Collection Insights**: Document counts, index usage

Configure in your MongoDB client:

```typescript
tracer.use('mongodb-core', {
  service: 'mongodb-flowguard',
  dbmPropagationMode: 'full', // Enable DBM integration
  hooks: {
    query: (span, query) => {
      span.setTag('db.row_count', query.rowCount);
      span.setTag('db.query_plan', JSON.stringify(query.plan));
    }
  }
});
```

### 5. Connection Pool Monitoring

Monitor MongoDB connection pool health:

```typescript
import { MongoClient } from 'mongodb';
import tracer from 'dd-trace';

const dogstatsd = tracer.dogstatsd;

const client = new MongoClient(uri, {
  maxPoolSize: 50,
  minPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
});

// Monitor pool metrics
client.on('connectionPoolCreated', (event) => {
  dogstatsd.gauge('mongodb.pool.size', event.options.maxPoolSize, {
    'pool.type': 'max'
  });
});

client.on('connectionCheckedOut', (event) => {
  dogstatsd.increment('mongodb.pool.checkout', 1);
});

client.on('connectionCheckedIn', (event) => {
  dogstatsd.increment('mongodb.pool.checkin', 1);
});

client.on('commandStarted', (event) => {
  dogstatsd.increment('mongodb.command.started', 1, {
    'command.name': event.commandName,
    'db.name': event.databaseName
  });
});

client.on('commandSucceeded', (event) => {
  dogstatsd.timing('mongodb.command.duration', event.duration, {
    'command.name': event.commandName
  });
});

client.on('commandFailed', (event) => {
  dogstatsd.increment('mongodb.command.failed', 1, {
    'command.name': event.commandName,
    'error': event.failure.message
  });
});
```

---

## OpenTelemetry & Datadog Interoperability

FlowGuard currently uses OpenTelemetry for Arize Phoenix. Datadog provides full OpenTelemetry interoperability.

### 1. Integration Approaches

**Option A: Dual Exporters (Recommended)**
- Keep existing OpenTelemetry → Phoenix integration
- Add Datadog as secondary exporter
- Minimal code changes

**Option B: Replace with dd-trace**
- Use dd-trace's OpenTelemetry-compatible TracerProvider
- Export to Datadog only
- More Datadog-specific features

**Option C: Full OpenTelemetry SDK**
- Use pure OpenTelemetry SDK
- Export to both Phoenix and Datadog via OTLP
- Maximum vendor neutrality

### 2. Option A: Dual Exporters (Keeping Current Setup)

```typescript
// tracing.ts - Updated to support both Phoenix and Datadog
import { trace, SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { NodeTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import tracer from 'dd-trace';

// Initialize Datadog tracer (for automatic instrumentation)
tracer.init({
  service: 'flowguard',
  env: process.env.NODE_ENV || 'development',
  version: '0.1.0'
});

// Get dd-trace's OpenTelemetry-compatible TracerProvider
const ddTracerProvider = tracer.TracerProvider;

// Initialize OpenTelemetry for Phoenix
const otelProvider = new NodeTracerProvider();

// Export to Phoenix
const phoenixExporter = new OTLPTraceExporter({
  url: process.env.PHOENIX_ENDPOINT ?? 'http://localhost:6006/v1/traces',
  headers: {},
});
otelProvider.addSpanProcessor(new BatchSpanProcessor(phoenixExporter));

// Register OpenTelemetry provider
otelProvider.register();

// Optional: Register dd-trace provider as well for OTel API compatibility
ddTracerProvider.register();

export function getTracer(name: string) {
  return trace.getTracer(name);
}

// Your existing trace functions work with both systems
export async function traceFlowRun<T extends FlowRunResult>(
  flowName: string,
  intent: string,
  fn: () => Promise<T>
): Promise<T> {
  const otelTracer = getTracer('flowguard.core');

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
    async (span) => {
      try {
        const result = await fn();

        span.setAttributes({
          'flowguard.verdict': result.verdict,
          'flowguard.confidence': result.confidence,
          'flowguard.duration_ms': result.durationMs,
          'flowguard.step_count': result.steps.length,
        });

        if (result.verdict === 'error') {
          span.setStatus({ code: SpanStatusCode.ERROR, message: 'Flow execution error' });
        } else {
          span.setStatus({ code: SpanStatusCode.OK });
        }

        // Add both Phoenix and Datadog trace IDs
        const traceId = span.spanContext().traceId;
        result.traceId = traceId;
        result.phoenixTraceUrl = `http://localhost:6006/tracing/traces/${traceId}`;
        result.datadogTraceUrl = `https://app.datadoghq.com/apm/trace/${traceId}`;

        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      } finally {
        span.end();
      }
    }
  );
}
```

### 3. Option B: Replace with dd-trace OpenTelemetry API

```typescript
// tracer.ts
import tracer from 'dd-trace';
import { trace } from '@opentelemetry/api';

// Initialize dd-trace
tracer.init({
  service: 'flowguard',
  env: process.env.NODE_ENV || 'development',
  version: '0.1.0'
});

// Get dd-trace's OpenTelemetry-compatible TracerProvider
const provider = tracer.TracerProvider;
provider.register();

// Now use OpenTelemetry API - spans go to Datadog
const otelTracer = trace.getTracer('flowguard.core', '1.0.0');

export async function traceOperation() {
  const span = otelTracer.startSpan('otel.operation');

  span.setAttribute('custom.attribute', 'value');
  span.setAttribute('user.id', '12345');

  try {
    await doWork();
    span.setStatus({ code: 1 }); // OK
  } catch (error) {
    span.setStatus({ code: 2, message: error.message }); // ERROR
    span.recordException(error);
  } finally {
    span.end();
  }
}
```

### 4. Mixing OpenTelemetry and dd-trace APIs

```typescript
import tracer from 'dd-trace';
import { trace } from '@opentelemetry/api';

const provider = tracer.TracerProvider;
provider.register();

const otelTracer = trace.getTracer('my-service', '1.0.0');

// Create OTel span
async function hybridTracing() {
  const otelSpan = otelTracer.startSpan('otel.parent');

  // dd-trace automatically recognizes OTel span as parent
  await tracer.trace('dd.child', async (ddSpan) => {
    ddSpan.setTag('mixed.apis', true);
    await performWork();
  });

  otelSpan.end();
}

// Context propagation between APIs
function contextInterop() {
  const otelSpan = otelTracer.startSpan('otel.span');
  const ctx = trace.setSpan(trace.context(), otelSpan);

  trace.context().with(ctx, () => {
    // dd-trace operations here inherit OTel context
    tracer.trace('dd.operation', () => {
      const activeSpan = tracer.scope().active();
      console.log('Both APIs share context');
    });
  });

  otelSpan.end();
}
```

### 5. Context Propagation Between Services

Enable distributed tracing across services:

```typescript
import tracer from 'dd-trace';

tracer.init({
  service: 'flowguard',

  // Configure trace propagation
  tracePropagationStyle: {
    // What formats to inject into outgoing requests
    inject: ['datadog', 'tracecontext', 'b3'],

    // What formats to extract from incoming requests
    extract: ['datadog', 'tracecontext', 'b3']
  }
});
```

---

## Implementation Examples

### Example 1: FlowGuard with Browserbase + Datadog

```typescript
// runner.ts - Updated with Browserbase and Datadog
import tracer from './tracer.js'; // Initialize dd-trace first
import { chromium } from 'playwright-core';
import Browserbase from '@browserbasehq/sdk';
import { Flow, FlowRunResult } from './types.js';
import { traceFlowRun, traceStep } from './tracing.js';

const bb = new Browserbase({
  apiKey: process.env.BROWSERBASE_API_KEY!,
});

export async function runFlow(flow: Flow): Promise<FlowRunResult> {
  const startTime = Date.now();

  return tracer.trace('flow.run', {
    resource: flow.name,
    service: 'flowguard-runner',
    tags: {
      'flow.name': flow.name,
      'flow.url': flow.url,
      'flow.viewport.width': flow.viewport?.width,
      'flow.viewport.height': flow.viewport?.height
    }
  }, async (span) => {
    let session;
    let browser;

    try {
      // Create Browserbase session
      session = await bb.sessions.create({
        projectId: process.env.BROWSERBASE_PROJECT_ID!,
        browserSettings: {
          viewport: flow.viewport,
          recordSession: true,
          logSession: true,
          advancedStealth: true,
          blockAds: true
        },
        timeout: 300,
        userMetadata: {
          flowName: flow.name,
          intent: flow.intent
        }
      });

      span.setTag('browserbase.session_id', session.id);
      span.setTag('browserbase.session_url', `https://browserbase.com/sessions/${session.id}`);

      // Connect via CDP
      browser = await chromium.connectOverCDP(session.connectUrl);
      const defaultContext = browser.contexts()[0];
      const page = defaultContext?.pages()[0];

      if (!page) {
        throw new Error('No page available in Browserbase session');
      }

      // Navigate to starting URL
      await page.goto(flow.url);

      // Run steps
      const steps = [];
      for (let i = 0; i < flow.steps.length; i++) {
        const step = flow.steps[i];

        const stepResult = await tracer.trace('flow.step', {
          resource: `${step.action}:${step.target}`,
          tags: {
            'step.index': i,
            'step.action': step.action,
            'step.target': step.target
          }
        }, async (stepSpan) => {
          const stepStartTime = Date.now();

          try {
            // Execute step
            await executeStep(page, step);

            // Capture screenshot
            const screenshotPath = `./screenshots/${flow.name}-step-${i}.png`;
            await page.screenshot({ path: screenshotPath });

            stepSpan.setTag('step.screenshot_path', screenshotPath);
            stepSpan.setTag('step.success', true);

            return {
              stepIndex: i,
              action: step.action,
              success: true,
              durationMs: Date.now() - stepStartTime,
              screenshotPath
            };
          } catch (error) {
            stepSpan.setTag('error', true);
            stepSpan.setTag('error.message', error.message);

            return {
              stepIndex: i,
              action: step.action,
              success: false,
              durationMs: Date.now() - stepStartTime,
              error: error.message
            };
          }
        });

        steps.push(stepResult);
      }

      // Clean up
      await page.close();
      await browser.close();

      const durationMs = Date.now() - startTime;

      span.setTag('flow.duration_ms', durationMs);
      span.setTag('flow.steps_count', steps.length);
      span.setTag('flow.success', true);

      return {
        flowName: flow.name,
        verdict: 'pass',
        confidence: 0.95,
        durationMs,
        steps,
        sessionReplayUrl: `https://browserbase.com/sessions/${session.id}`,
        datadogTraceUrl: `https://app.datadoghq.com/apm/trace/${span.context().toTraceId()}`
      };

    } catch (error) {
      span.setTag('error', true);
      span.setTag('error.message', error.message);
      span.setTag('error.stack', error.stack);

      // Log error to Datadog
      tracer.dogstatsd.increment('flow.error', 1, {
        'flow.name': flow.name,
        'error.type': error.name
      });

      throw error;
    }
  });
}

async function executeStep(page: any, step: any) {
  switch (step.action) {
    case 'navigate':
      await page.goto(step.target);
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
}
```

### Example 2: MongoDB with Datadog Monitoring

```typescript
// db/client.ts - Updated with Datadog monitoring
import './tracer.js'; // Initialize dd-trace first
import { MongoClient, Db } from 'mongodb';
import tracer from 'dd-trace';

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
          socketTimeoutMS: 45000
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
            'db.name': event.databaseName
          });
        });

        this.client.on('commandSucceeded', (event) => {
          dogstatsd.timing('mongodb.command.duration', event.duration, {
            'command.name': event.commandName
          });
        });

        this.client.on('commandFailed', (event) => {
          dogstatsd.increment('mongodb.command.failed', 1, {
            'command.name': event.commandName,
            'error': event.failure.message
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

### Example 3: Vision Analysis with Datadog Tracing

```typescript
// vision.ts - Updated with Datadog
import tracer from './tracer.js';
import Anthropic from '@anthropic-ai/sdk';
import { AnalysisResult } from './types.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function analyzeScreenshot(
  screenshotBase64: string,
  intent: string
): Promise<AnalysisResult> {
  return tracer.trace('vision.analyze', {
    service: 'flowguard-vision',
    resource: 'claude-3.5-sonnet',
    tags: {
      'llm.model': 'claude-3-5-sonnet-20241022',
      'llm.provider': 'anthropic',
      'flowguard.intent': intent
    }
  }, async (span) => {
    const startTime = Date.now();

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: screenshotBase64,
                },
              },
              {
                type: 'text',
                text: `Analyze this screenshot for the following intent: "${intent}". Does the UI clearly support this intent?`,
              },
            ],
          },
        ],
      });

      const latencyMs = Date.now() - startTime;

      // Log LLM metrics
      span.setTag('llm.token_count.prompt', response.usage.input_tokens);
      span.setTag('llm.token_count.completion', response.usage.output_tokens);
      span.setTag('llm.latency_ms', latencyMs);

      tracer.dogstatsd.timing('vision.latency', latencyMs, {
        'model': 'claude-3.5-sonnet'
      });

      tracer.dogstatsd.increment('vision.token_usage', response.usage.input_tokens + response.usage.output_tokens, {
        'model': 'claude-3.5-sonnet',
        'type': 'total'
      });

      // Parse response
      const content = response.content[0];
      const analysis = content.type === 'text' ? content.text : '';

      const result: AnalysisResult = {
        status: 'pass',
        confidence: 0.85,
        reasoning: analysis,
        issues: []
      };

      span.setTag('vision.status', result.status);
      span.setTag('vision.confidence', result.confidence);

      return result;

    } catch (error) {
      span.setTag('error', true);
      span.setTag('error.message', error.message);

      tracer.dogstatsd.increment('vision.error', 1, {
        'error.type': error.name
      });

      return {
        status: 'error',
        error: error.message,
        issues: []
      };
    }
  });
}
```

---

## Best Practices

### Browserbase Best Practices

1. **Session Management**
   - Use `keepAlive: true` for long-running sessions
   - Set appropriate `timeout` values (default 300s)
   - Always close browsers to free resources: `await browser.close()`

2. **Context Persistence**
   - Reuse context IDs for authenticated sessions
   - Set `persist: true` to save cookies/localStorage
   - Use unique context IDs per user/test scenario

3. **Proxy Configuration**
   - Use Browserbase proxies for general use (`type: "browserbase"`)
   - Configure geolocation for region-specific testing
   - Use domain patterns for selective proxy routing
   - Validate external proxy connections before session creation

4. **Session Recording**
   - Enable `recordSession: true` for debugging
   - Enable `logSession: true` to capture console logs
   - Use tracing with screenshots for detailed debugging
   - View replays at `https://browserbase.com/sessions/{sessionId}`

5. **Performance**
   - Use `playwright-core` instead of full `playwright`
   - Enable `blockAds: true` to speed up page loads
   - Set appropriate viewport sizes for your use case
   - Use `advancedStealth: true` only when necessary

6. **Error Handling**
   - Implement proper try/catch/finally blocks
   - Always close browsers even on errors
   - Log session IDs for debugging
   - Handle session creation failures gracefully

### Datadog Best Practices

1. **Initialization**
   - Import `dd-trace` **before any other modules**
   - Use environment variables for configuration
   - Enable runtime metrics and profiling in production
   - Use unified service tagging (DD_ENV, DD_SERVICE, DD_VERSION)

2. **Sampling**
   - Use 100% sampling in development/staging
   - Adjust sampling rate for production: `DD_TRACE_SAMPLE_RATE=0.1`
   - Use sampling rules for critical paths: `samplingRules: [...]`
   - Let Datadog Agent handle rate limiting by default

3. **Custom Instrumentation**
   - Use `tracer.trace()` for automatic span lifecycle
   - Use `tracer.startSpan()` for manual control
   - Always call `span.finish()` in finally blocks
   - Set meaningful resource names and tags

4. **Metrics**
   - Use counters for events (signups, errors)
   - Use gauges for current values (queue size, active users)
   - Use histograms for distributions (response sizes, durations)
   - Use distributions for percentile calculations
   - Always tag metrics for better filtering

5. **Error Tracking**
   - Set `error: true` tag on spans
   - Include error.message, error.type, error.stack
   - Log errors to Datadog via log injection
   - Use service checks for health monitoring

6. **MongoDB Monitoring**
   - Enable Database Monitoring (DBM) for deep insights
   - Monitor connection pool metrics
   - Track slow queries with custom thresholds
   - Use command monitoring for detailed analysis

7. **OpenTelemetry Interoperability**
   - Register dd-trace's TracerProvider for OTel compatibility
   - Use consistent trace context propagation
   - Tag spans with both Datadog and OTel conventions
   - Test cross-service tracing thoroughly

8. **Performance**
   - Use batching for span processors
   - Configure appropriate buffer sizes
   - Enable agent-based rate limiting
   - Monitor tracer overhead metrics

### Security Best Practices

1. **API Keys**
   - Store keys in environment variables, never in code
   - Use different keys for dev/staging/production
   - Rotate keys regularly
   - Use secrets management (AWS Secrets Manager, HashiCorp Vault)

2. **MongoDB**
   - Always use TLS in production: `tls: true`
   - Validate MongoDB URIs before connecting
   - Use authentication with strong passwords
   - Limit connection pool sizes appropriately

3. **Datadog**
   - Avoid logging sensitive data in spans/metrics
   - Use tag filtering to exclude PII
   - Enable APM data scrubbing for sensitive fields
   - Review trace retention policies

4. **Browserbase**
   - Don't log proxy credentials
   - Use secure context IDs (UUIDs)
   - Clear session metadata after tests
   - Implement session timeout limits

---

## Environment Variables Summary

```bash
# Browserbase
BROWSERBASE_API_KEY=your_browserbase_api_key
BROWSERBASE_PROJECT_ID=your_project_id
BROWSERBASE_REGION=us-west-2

# Datadog
DD_SERVICE=flowguard
DD_ENV=production
DD_VERSION=0.1.0
DD_AGENT_HOST=localhost
DD_TRACE_AGENT_PORT=8126
DD_DOGSTATSD_PORT=8125
DD_TRACE_SAMPLE_RATE=1.0
DD_RUNTIME_METRICS_ENABLED=true
DD_PROFILING_ENABLED=true
DD_LOGS_INJECTION=true
DD_TAGS=team:engineering,product:flowguard

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net
MONGODB_DATABASE=flowguard

# Anthropic (existing)
ANTHROPIC_API_KEY=your_anthropic_key

# Phoenix (existing)
PHOENIX_ENDPOINT=http://localhost:6006/v1/traces

# Application
NODE_ENV=production
```

---

## Additional Resources

### Browserbase Documentation
- [Node.js SDK Reference](https://docs.browserbase.com/reference/sdk/nodejs)
- [Playwright Integration](https://docs.browserbase.com/introduction/playwright)
- [Session Management](https://docs.browserbase.com/fundamentals/using-browser-session)
- [Session Replay](https://docs.browserbase.com/features/session-replay)
- [Proxy Configuration](https://docs.browserbase.com/features/proxies)
- [API Reference](https://docs.browserbase.com/reference/api/create-a-session)
- [npm Package](https://www.npmjs.com/package/@browserbasehq/sdk)
- [GitHub Repository](https://github.com/browserbase/sdk-node)

### Datadog Documentation
- [dd-trace-js GitHub](https://github.com/DataDog/dd-trace-js)
- [Node.js Tracing](https://docs.datadoghq.com/tracing/trace_collection/dd_libraries/nodejs/)
- [Library Configuration](https://docs.datadoghq.com/tracing/trace_collection/library_config/nodejs/)
- [Custom Instrumentation](https://docs.datadoghq.com/tracing/trace_collection/custom_instrumentation/nodejs/dd-api/)
- [MongoDB Integration](https://docs.datadoghq.com/integrations/mongodb/)
- [OpenTelemetry Support](https://docs.datadoghq.com/opentelemetry/instrument/api_support/nodejs/)
- [Database Monitoring](https://docs.datadoghq.com/database_monitoring/)
- [npm Package](https://www.npmjs.com/package/dd-trace)

### MongoDB Documentation
- [Node.js Driver](https://github.com/mongodb/node-mongodb-native)
- [APM API Reference](https://github.com/mongodb/node-mongodb-native/blob/main/docs/3.7/reference/management/apm/index.html)
- [Command Monitoring Spec](https://github.com/mongodb/specifications/blob/master/source/command-monitoring/command-monitoring.rst)

### OpenTelemetry Documentation
- [OpenTelemetry API](https://opentelemetry.io/docs/instrumentation/js/api/)
- [Datadog OpenTelemetry Guide](https://docs.datadoghq.com/opentelemetry/)
- [Instrumentation Libraries](https://docs.datadoghq.com/opentelemetry/instrument/instrumentation_libraries/)

---

## Next Steps

1. **Install Dependencies**
   ```bash
   npm install @browserbasehq/sdk dd-trace
   ```

2. **Set Environment Variables**
   - Create `.env` file with all required keys
   - Configure Datadog Agent (if running locally)

3. **Update Tracing Configuration**
   - Choose integration approach (Option A, B, or C)
   - Update `src/tracing.ts` with selected approach
   - Test dual export to Phoenix + Datadog

4. **Update Runner**
   - Replace local Playwright with Browserbase
   - Add Datadog custom instrumentation
   - Test session recording and replay

5. **Update Database Client**
   - Add MongoDB monitoring events
   - Configure connection pool metrics
   - Test query tracing

6. **Testing**
   - Run sample flows with Browserbase
   - Verify traces appear in both Phoenix and Datadog
   - Check MongoDB metrics in Datadog
   - Validate session replays in Browserbase

7. **Production Readiness**
   - Configure sampling rates
   - Set up alerts in Datadog
   - Document session replay URLs in reports
   - Implement error tracking and monitoring
