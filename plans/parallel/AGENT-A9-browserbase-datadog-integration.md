# Agent A9: Browserbase & Datadog Integration

**Branch:** `feat/browserbase-datadog-integration`
**Agent:** Claude Code Max (Complex architecture, Production-grade integration)
**Priority:** P0 (Production Readiness - Critical for Startup Success)
**Estimated:** 5-7 days
**Dependencies:** Agent A1 (MongoDB Core) ✅ Complete

---

## Mission

Transform FlowGuard AI from a local development tool into a production-ready, cloud-native UX testing platform by integrating:

1. **Browserbase** - Cloud browser automation with session recording, stealth mode, and global edge deployment
2. **Datadog** - Enterprise observability with APM, custom metrics, error tracking, and log correlation
3. **Dual Observability** - Maintain OpenTelemetry/Phoenix for AI experiment tracking while adding Datadog for infrastructure monitoring
4. **Production Lifecycle** - Implement proper dev/staging/prod separation with secrets management and cost controls

This integration positions FlowGuard as a technically impressive, scalable platform that pushes current technology boundaries while delivering strong customer value through reliability, debugging capabilities, and global test execution.

---

## Executive Summary

### Current State (After Agent A1)
- ✅ Local Playwright execution with browser pooling
- ✅ MongoDB storage for test results and vision cache
- ✅ OpenTelemetry tracing to Arize Phoenix for AI observability
- ✅ Claude Vision API integration with caching
- ❌ No cloud browser execution
- ❌ No production-grade observability
- ❌ No session recording for debugging
- ❌ No proper environment lifecycle management

### Target State (After Agent A9)
- ✅ Dual execution modes: Local Playwright (dev) and Browserbase (CI/prod)
- ✅ Browserbase session recording with HAR export for debugging
- ✅ Datadog APM tracing with distributed trace correlation
- ✅ DogStatsD custom metrics for flow execution, vision cache, costs
- ✅ Dual observability: Phoenix (AI experiments) + Datadog (infrastructure)
- ✅ Proper dev/staging/prod environment separation
- ✅ AWS Secrets Manager integration for production
- ✅ Auto-scaling browser session pooling
- ✅ Comprehensive error tracking and alerting

### Customer Value Delivered
1. **Global Test Execution**: Run tests from edge locations worldwide
2. **Visual Debugging**: Session recordings show exactly what happened
3. **Production Reliability**: 99.9% uptime with Datadog monitoring
4. **Cost Optimization**: Smart browser pooling reduces cloud costs by 50%+
5. **Enterprise Security**: Secrets management, audit logs, multi-tenant isolation

---

## Technical Specification

### 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FlowGuard AI                             │
│                  (Agent A9 Integration Layer)                    │
└─────────────────────────────────────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────────┐ ┌──────────────┐ ┌─────────────────┐
│   Browserbase   │ │   Datadog    │ │  OpenTelemetry  │
│  Cloud Browsers │ │  APM + Logs  │ │  (Phoenix)      │
└─────────────────┘ └──────────────┘ └─────────────────┘
         │                  │                  │
         └──────────────────┼──────────────────┘
                            ▼
                    ┌──────────────┐
                    │   MongoDB    │
                    │  (Agent A1)  │
                    └──────────────┘
```

### 2. Module Structure

**New Directories:**
```
src/
├── browserbase/
│   ├── client.ts              # Browserbase API client
│   ├── pool.ts                # Session pooling manager
│   ├── types.ts               # TypeScript interfaces
│   ├── config.ts              # Configuration helpers
│   ├── __tests__/
│   │   ├── client.test.ts
│   │   ├── pool.test.ts
│   │   └── integration.test.ts
│   └── README.md
│
├── datadog/
│   ├── tracer.ts              # dd-trace initialization (MUST BE FIRST IMPORT)
│   ├── metrics.ts             # DogStatsD client wrapper
│   ├── logger.ts              # Structured logging with trace correlation
│   ├── types.ts               # TypeScript interfaces
│   ├── monitors.ts            # Monitor/alert definitions
│   ├── __tests__/
│   │   ├── tracer.test.ts
│   │   ├── metrics.test.ts
│   │   └── logger.test.ts
│   └── README.md
│
├── observability/
│   ├── dual-tracer.ts         # Unified Phoenix + Datadog tracing
│   ├── correlation.ts         # Trace ID correlation
│   ├── sampling.ts            # Sampling strategy
│   ├── __tests__/
│   │   └── dual-tracer.test.ts
│   └── README.md
│
└── secrets/
    ├── manager.ts             # AWS Secrets Manager client
    ├── cache.ts               # In-memory secret caching
    ├── __tests__/
    │   └── manager.test.ts
    └── README.md
```

**Modified Files:**
```
src/
├── runner.ts                  # Add Browserbase execution mode
├── vision.ts                  # Enhanced cost tracking for Datadog
├── db/schemas.ts              # New fields for Browserbase/Datadog metadata
├── cli.ts                     # New environment validation
└── tracing.ts                 # Dual export to Phoenix + Datadog
```

---

## Phase 1: Browserbase Integration

### 1.1 Browserbase Client

**File:** `src/browserbase/client.ts`

```typescript
import { chromium, Browser, BrowserContext, Page } from 'playwright-core';

export interface BrowserbaseConfig {
  apiKey: string;
  projectId: string;
  baseUrl?: string;
  region?: 'us-east' | 'us-west' | 'eu-west' | 'ap-southeast';
  enableStealth?: boolean;
  proxyConfig?: ProxyConfig;
}

export interface ProxyConfig {
  type: 'residential' | 'datacenter' | 'mobile';
  country?: string;
}

export interface BrowserbaseSession {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  connectUrl: string;
  recordingUrl?: string;
  createdAt: Date;
  expiresAt: Date;
  metadata?: Record<string, unknown>;
}

export class BrowserbaseClient {
  private apiKey: string;
  private projectId: string;
  private baseUrl: string;

  constructor(config: BrowserbaseConfig) {
    this.apiKey = config.apiKey;
    this.projectId = config.projectId;
    this.baseUrl = config.baseUrl || 'https://www.browserbase.com';
  }

  /**
   * Create a new Browserbase session
   */
  async createSession(options: {
    contextId?: string;
    proxies?: ProxyConfig;
    fingerprint?: 'randomized' | 'persistent';
    timeout?: number;
  } = {}): Promise<BrowserbaseSession> {
    const response = await fetch(`${this.baseUrl}/v1/sessions`, {
      method: 'POST',
      headers: {
        'x-bb-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId: this.projectId,
        ...options,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BrowserbaseError(
        `Failed to create session: ${response.status} ${error}`,
        response.status
      );
    }

    const data = await response.json();
    return {
      id: data.id,
      status: data.status,
      connectUrl: data.connectUrl,
      createdAt: new Date(data.createdAt),
      expiresAt: new Date(data.expiresAt),
    };
  }

  /**
   * Get session status and recording URL
   */
  async getSession(sessionId: string): Promise<BrowserbaseSession> {
    const response = await fetch(`${this.baseUrl}/v1/sessions/${sessionId}`, {
      headers: {
        'x-bb-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new BrowserbaseError(
        `Failed to get session: ${response.status}`,
        response.status
      );
    }

    const data = await response.json();
    return {
      id: data.id,
      status: data.status,
      connectUrl: data.connectUrl,
      recordingUrl: data.recordingUrl,
      createdAt: new Date(data.createdAt),
      expiresAt: new Date(data.expiresAt),
    };
  }

  /**
   * Connect Playwright to Browserbase session via CDP
   */
  async connectPlaywright(sessionId: string): Promise<{ browser: Browser; context: BrowserContext }> {
    const session = await this.getSession(sessionId);

    const browser = await chromium.connectOverCDP(session.connectUrl);

    // Use the default context provided by Browserbase (has fingerprinting configured)
    const contexts = browser.contexts();
    if (contexts.length === 0) {
      throw new BrowserbaseError('No browser context available', 500);
    }

    const context = contexts[0];
    return { browser, context };
  }

  /**
   * Terminate session and retrieve recording
   */
  async terminateSession(sessionId: string): Promise<{ recordingUrl?: string }> {
    const response = await fetch(`${this.baseUrl}/v1/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'x-bb-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new BrowserbaseError(
        `Failed to terminate session: ${response.status}`,
        response.status
      );
    }

    const data = await response.json();
    return { recordingUrl: data.recordingUrl };
  }

  /**
   * Download session recording HAR file
   */
  async downloadHAR(sessionId: string, outputPath: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/v1/sessions/${sessionId}/har`, {
      headers: {
        'x-bb-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new BrowserbaseError(
        `Failed to download HAR: ${response.status}`,
        response.status
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    await fs.writeFile(outputPath, Buffer.from(arrayBuffer));
  }
}

export class BrowserbaseError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = 'BrowserbaseError';
  }

  isRetryable(): boolean {
    // Retry on 503 Service Unavailable, 429 Too Many Requests
    return this.statusCode === 503 || this.statusCode === 429;
  }
}
```

### 1.2 Session Pooling Manager

**File:** `src/browserbase/pool.ts`

```typescript
import { BrowserbaseClient, BrowserbaseSession } from './client.js';
import { structuredLog, logError } from '../datadog/logger.js';
import { trackBrowserSession } from '../datadog/metrics.js';

export interface SessionPoolConfig {
  minSessions: number;
  maxSessions: number;
  sessionLifetime: number; // milliseconds
  idleTimeout: number; // milliseconds
  region?: string;
}

interface PooledSession {
  session: BrowserbaseSession;
  createdAt: number;
  lastUsedAt: number;
  useCount: number;
}

export class BrowserbaseSessionPool {
  private client: BrowserbaseClient;
  private config: SessionPoolConfig;
  private idle: Map<string, PooledSession> = new Map();
  private active: Set<string> = new Set();
  private cleanupInterval: NodeJS.Timeout;

  constructor(client: BrowserbaseClient, config: SessionPoolConfig) {
    this.client = client;
    this.config = config;

    // Start cleanup loop
    this.cleanupInterval = setInterval(() => {
      this.cleanupStale();
    }, 30000); // Every 30 seconds

    // Warm the pool
    this.warmPool();
  }

  /**
   * Pre-create minimum sessions
   */
  private async warmPool(): Promise<void> {
    structuredLog({
      level: 'info',
      message: 'Warming Browserbase session pool',
      min_sessions: this.config.minSessions,
    });

    const promises = [];
    for (let i = 0; i < this.config.minSessions; i++) {
      promises.push(this.createPooledSession());
    }

    await Promise.allSettled(promises);
  }

  /**
   * Create and add session to pool
   */
  private async createPooledSession(): Promise<PooledSession> {
    const session = await this.client.createSession({
      fingerprint: 'randomized',
    });

    const pooled: PooledSession = {
      session,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      useCount: 0,
    };

    this.idle.set(session.id, pooled);

    trackBrowserSession('created', true);

    structuredLog({
      level: 'info',
      message: 'Created pooled Browserbase session',
      session_id: session.id,
      pool_size: this.idle.size + this.active.size,
    });

    return pooled;
  }

  /**
   * Acquire session from pool or create new
   */
  async acquire(): Promise<string> {
    // Try to get idle session
    const idleSession = this.getIdleSession();
    if (idleSession) {
      this.idle.delete(idleSession.session.id);
      this.active.add(idleSession.session.id);
      idleSession.lastUsedAt = Date.now();
      idleSession.useCount++;

      trackBrowserSession('acquired_from_pool', true);

      return idleSession.session.id;
    }

    // Create new if under max
    if (this.active.size + this.idle.size < this.config.maxSessions) {
      const pooled = await this.createPooledSession();
      this.idle.delete(pooled.session.id);
      this.active.add(pooled.session.id);
      pooled.lastUsedAt = Date.now();
      pooled.useCount++;

      return pooled.session.id;
    }

    // Wait for available session (up to 60 seconds)
    return await this.waitForSession(60000);
  }

  /**
   * Release session back to pool or destroy if expired
   */
  async release(sessionId: string): Promise<void> {
    this.active.delete(sessionId);

    const pooled = this.idle.get(sessionId) || this.findSession(sessionId);
    if (!pooled) {
      structuredLog({
        level: 'warn',
        message: 'Attempted to release unknown session',
        session_id: sessionId,
      });
      return;
    }

    const age = Date.now() - pooled.createdAt;

    // Destroy if expired or overused
    if (age > this.config.sessionLifetime || pooled.useCount > 50) {
      await this.destroySession(sessionId);
      trackBrowserSession('destroyed_expired', true);
      return;
    }

    // Return to pool
    this.idle.set(sessionId, pooled);
    trackBrowserSession('released_to_pool', true);
  }

  /**
   * Get best idle session (newest with fewest uses)
   */
  private getIdleSession(): PooledSession | null {
    const now = Date.now();
    let best: PooledSession | null = null;

    for (const [sessionId, pooled] of this.idle.entries()) {
      const idleTime = now - pooled.lastUsedAt;

      // Skip if too old
      if (idleTime > this.config.idleTimeout) {
        continue;
      }

      // Pick session with fewest uses (fresher)
      if (!best || pooled.useCount < best.useCount) {
        best = pooled;
      }
    }

    return best;
  }

  /**
   * Wait for session to become available
   */
  private async waitForSession(timeoutMs: number): Promise<string> {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      // Check if any session freed up
      const idleSession = this.getIdleSession();
      if (idleSession) {
        return idleSession.session.id;
      }

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Timeout waiting for available Browserbase session');
  }

  /**
   * Cleanup stale idle sessions
   */
  private async cleanupStale(): Promise<void> {
    const now = Date.now();
    const toDestroy: string[] = [];

    for (const [sessionId, pooled] of this.idle.entries()) {
      const idleTime = now - pooled.lastUsedAt;
      const age = now - pooled.createdAt;

      if (idleTime > this.config.idleTimeout || age > this.config.sessionLifetime) {
        toDestroy.push(sessionId);
      }
    }

    if (toDestroy.length > 0) {
      structuredLog({
        level: 'info',
        message: 'Cleaning up stale Browserbase sessions',
        session_count: toDestroy.length,
      });

      await Promise.all(toDestroy.map(id => this.destroySession(id)));
    }
  }

  /**
   * Destroy session
   */
  private async destroySession(sessionId: string): Promise<void> {
    this.idle.delete(sessionId);
    this.active.delete(sessionId);

    try {
      await this.client.terminateSession(sessionId);
      trackBrowserSession('destroyed', true);
    } catch (error) {
      logError(error as Error, { session_id: sessionId });
      trackBrowserSession('destroyed', false);
    }
  }

  /**
   * Find session across idle and active sets
   */
  private findSession(sessionId: string): PooledSession | undefined {
    return this.idle.get(sessionId);
  }

  /**
   * Shutdown pool
   */
  async shutdown(): Promise<void> {
    clearInterval(this.cleanupInterval);

    const allSessions = [
      ...Array.from(this.idle.keys()),
      ...Array.from(this.active.keys()),
    ];

    structuredLog({
      level: 'info',
      message: 'Shutting down Browserbase session pool',
      session_count: allSessions.length,
    });

    await Promise.all(allSessions.map(id => this.destroySession(id)));
  }

  /**
   * Get pool statistics
   */
  getStats(): { idle: number; active: number; total: number } {
    return {
      idle: this.idle.size,
      active: this.active.size,
      total: this.idle.size + this.active.size,
    };
  }
}
```

### 1.3 Runner Integration

**File Modification:** `src/runner.ts`

Add execution mode selection:

```typescript
import { BrowserbaseClient } from './browserbase/client.js';
import { BrowserbaseSessionPool } from './browserbase/pool.js';

// Determine execution mode from environment
export type ExecutionMode = 'local' | 'cloud';

function getExecutionMode(flow: Flow): ExecutionMode {
  // Environment variable override
  const envMode = process.env.EXECUTION_MODE as ExecutionMode;
  if (envMode === 'cloud') return 'cloud';
  if (envMode === 'local') return 'local';

  // Flow-level configuration (critical flows use cloud in CI)
  if (flow.critical && process.env.CI === 'true') {
    return 'cloud';
  }

  // Default to local
  return 'local';
}

// Initialize Browserbase pool if API key available
let browserbasePool: BrowserbaseSessionPool | null = null;

if (process.env.BROWSERBASE_API_KEY) {
  const client = new BrowserbaseClient({
    apiKey: process.env.BROWSERBASE_API_KEY,
    projectId: process.env.BROWSERBASE_PROJECT_ID!,
    region: (process.env.BROWSERBASE_REGION as any) || 'us-east',
  });

  browserbasePool = new BrowserbaseSessionPool(client, {
    minSessions: parseInt(process.env.BB_MIN_SESSIONS || '2', 10),
    maxSessions: parseInt(process.env.BB_MAX_SESSIONS || '10', 10),
    sessionLifetime: 30 * 60 * 1000, // 30 minutes
    idleTimeout: 5 * 60 * 1000, // 5 minutes
  });
}

export async function executeFlow(flow: Flow): Promise<FlowRunResult> {
  const mode = getExecutionMode(flow);

  if (mode === 'cloud' && browserbasePool) {
    return await executeFlowOnBrowserbase(flow, browserbasePool);
  } else {
    return await executeFlowLocally(flow);
  }
}

async function executeFlowOnBrowserbase(
  flow: Flow,
  pool: BrowserbaseSessionPool
): Promise<FlowRunResult> {
  const sessionId = await pool.acquire();

  try {
    const client = new BrowserbaseClient({
      apiKey: process.env.BROWSERBASE_API_KEY!,
      projectId: process.env.BROWSERBASE_PROJECT_ID!,
    });

    const { browser, context } = await client.connectPlaywright(sessionId);
    const page = await context.newPage();

    // Execute flow steps (existing logic)
    const result = await runFlowSteps(flow, page);

    // Get session recording URL
    const session = await client.getSession(sessionId);

    return {
      ...result,
      metadata: {
        ...result.metadata,
        executionMode: 'cloud',
        browserbaseSessionId: sessionId,
        browserbaseRecordingUrl: session.recordingUrl,
      },
    };
  } finally {
    await pool.release(sessionId);
  }
}

async function executeFlowLocally(flow: Flow): Promise<FlowRunResult> {
  // Existing Playwright logic
  const context = await getBrowserContext();
  const page = await context.newPage();

  const result = await runFlowSteps(flow, page);

  return {
    ...result,
    metadata: {
      ...result.metadata,
      executionMode: 'local',
    },
  };
}
```

---

## Phase 2: Datadog Integration

### 2.1 Datadog Tracer (CRITICAL: Must be First Import)

**File:** `src/datadog/tracer.ts`

```typescript
// CRITICAL: This module MUST be imported before any other modules
// See: https://docs.datadoghq.com/tracing/trace_collection/dd_libraries/nodejs/

import tracer from 'dd-trace';

const DD_ENV = process.env.DD_ENV || 'development';
const DD_SERVICE = process.env.DD_SERVICE || 'flowguard-ai';
const DD_VERSION = process.env.DD_VERSION || process.env.npm_package_version || '0.1.0';

// Initialize tracer
tracer.init({
  service: DD_SERVICE,
  env: DD_ENV,
  version: DD_VERSION,

  // Agent configuration
  hostname: process.env.DD_AGENT_HOST || 'localhost',
  port: parseInt(process.env.DD_TRACE_AGENT_PORT || '8126', 10),

  // Sampling configuration
  sampleRate: DD_ENV === 'production' ? 0.1 : 1.0,
  samplingRules: [
    // Always trace flow executions
    { service: DD_SERVICE, name: 'flow.execute', sampleRate: 1.0 },
    // Skip health checks
    { service: DD_SERVICE, name: 'health.check', sampleRate: 0.0 },
  ],

  // Performance
  runtimeMetrics: true,
  profiling: DD_ENV === 'production',
  logInjection: true, // Correlate logs with traces

  // Security
  appsec: { enabled: DD_ENV === 'production' },

  // Propagation (W3C Trace Context + Datadog)
  tracePropagationStyle: {
    inject: ['datadog', 'tracecontext'],
    extract: ['datadog', 'tracecontext'],
  },

  // Tags
  tags: {
    team: 'platform',
    component: 'ux-testing',
    env: DD_ENV,
  },
});

console.log(`✅ Datadog APM initialized: ${DD_SERVICE} (${DD_ENV})`);

export { tracer };
export const dogstatsd = tracer.dogstatsd;
```

### 2.2 Metrics Client

**File:** `src/datadog/metrics.ts`

```typescript
import { dogstatsd } from './tracer.js';

/**
 * Track flow execution metrics
 */
export function trackFlowExecution(
  flowName: string,
  duration: number,
  verdict: 'pass' | 'fail' | 'error'
): void {
  dogstatsd.increment('flowguard.flow.executed', 1, {
    flow_name: flowName,
    verdict,
  });

  dogstatsd.timing('flowguard.flow.duration', duration, {
    flow_name: flowName,
  });
}

/**
 * Track vision analysis metrics
 */
export function trackVisionAnalysis(
  confidence: number,
  latencyMs: number,
  cached: boolean
): void {
  dogstatsd.histogram('flowguard.vision.confidence', confidence * 100);
  dogstatsd.timing('flowguard.vision.latency', latencyMs);

  if (cached) {
    dogstatsd.increment('flowguard.vision.cache_hit', 1);
  } else {
    dogstatsd.increment('flowguard.vision.cache_miss', 1);
  }
}

/**
 * Track browser session actions
 */
export function trackBrowserSession(action: string, success: boolean): void {
  dogstatsd.increment('flowguard.browser.actions', 1, {
    action,
    status: success ? 'success' : 'failure',
  });
}

/**
 * Report flow queue size
 */
export function reportFlowQueueSize(size: number): void {
  dogstatsd.gauge('flowguard.queue.size', size);
}

/**
 * Track Browserbase session pool stats
 */
export function reportBrowserbasePoolStats(stats: {
  idle: number;
  active: number;
  total: number;
}): void {
  dogstatsd.gauge('flowguard.browserbase.idle_sessions', stats.idle);
  dogstatsd.gauge('flowguard.browserbase.active_sessions', stats.active);
  dogstatsd.gauge('flowguard.browserbase.total_sessions', stats.total);
}

/**
 * Track cost metrics
 */
export function trackCost(costUsd: number, service: 'vision' | 'browserbase'): void {
  dogstatsd.histogram('flowguard.cost.usd', costUsd, { service });
}
```

### 2.3 Structured Logger with Trace Correlation

**File:** `src/datadog/logger.ts`

```typescript
import { tracer } from './tracer.js';
import { context, trace } from '@opentelemetry/api';

interface LogData {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  [key: string]: unknown;
}

export function structuredLog(data: LogData): void {
  const span = trace.getSpan(context.active());
  const traceId = span?.spanContext().traceId;
  const spanId = span?.spanContext().spanId;

  const logEntry = {
    timestamp: new Date().toISOString(),
    service: process.env.DD_SERVICE || 'flowguard-ai',
    env: process.env.DD_ENV || 'development',
    ...data,
    // Datadog log-trace correlation
    dd: {
      trace_id: traceId,
      span_id: spanId,
    },
  };

  // Log as JSON for Datadog ingestion
  console.log(JSON.stringify(logEntry));
}

export function logError(error: Error, context: Record<string, unknown> = {}): void {
  structuredLog({
    level: 'error',
    message: error.message,
    error: {
      kind: error.constructor.name,
      message: error.message,
      stack: error.stack,
    },
    ...context,
  });
}
```

---

## Phase 3: Dual Observability (Phoenix + Datadog)

### 3.1 Unified Tracing Module

**File:** `src/observability/dual-tracer.ts`

```typescript
import { tracer as datadogTracer } from '../datadog/tracer.js';
import { traceFlowRun as phoenixTrace } from '../tracing.js';
import { context, trace, SpanKind } from '@opentelemetry/api';

/**
 * Trace flow execution to BOTH Phoenix and Datadog
 */
export async function traceDualFlow<T>(
  flowName: string,
  intent: string,
  fn: () => Promise<T>
): Promise<T> {
  // Start Datadog trace
  return await datadogTracer.trace(
    `flow.execute.${flowName}`,
    {
      resource: flowName,
      type: 'web',
      tags: {
        'flow.name': flowName,
        'flow.intent': intent,
      },
    },
    async (span) => {
      // Capture Datadog trace ID
      const ddTraceId = span.context().toTraceId();

      // Start Phoenix trace (existing OpenTelemetry logic)
      const result = await phoenixTrace(flowName, intent, fn);

      // Add Datadog trace ID to result metadata
      span.setTag('result.verdict', (result as any).verdict);
      span.setTag('result.confidence', (result as any).confidence);

      return result;
    }
  );
}

/**
 * Trace vision analysis to BOTH systems
 */
export async function traceDualVision<T>(
  assertion: string,
  fn: () => Promise<T>
): Promise<T> {
  return await datadogTracer.trace(
    'vision.analyze',
    {
      resource: assertion,
      type: 'llm',
      tags: {
        'llm.model': 'claude-3-5-sonnet-20241022',
        'llm.assertion': assertion,
      },
    },
    fn
  );
}
```

---

## Phase 4: MongoDB Schema Updates

### 4.1 Updated Schemas

**File Modification:** `src/db/schemas.ts`

Add new fields to `TestResult`:

```typescript
export interface TestResult {
  timestamp: Date;
  metadata: {
    tenantId?: string;
    flowName: string;
    environment: 'local' | 'ci' | 'production';
    viewport: string;
    browser: string;
    userId?: string;
    branch?: string;
    commitSha?: string;

    // NEW: Execution mode tracking
    executionMode: 'local' | 'cloud';

    // NEW: Browserbase metadata
    browserbaseSessionId?: string;
    browserbaseRecordingUrl?: string;
    browserbaseRegion?: string;

    // NEW: Datadog correlation
    datadogTraceId?: string;
    datadogSpanId?: string;
  };
  measurements: {
    passed: boolean;
    totalSteps: number;
    failedSteps: number;
    duration: number;
    avgConfidence: number;
    totalTokens: number;
    totalCost: number;

    // NEW: Separate cost tracking
    browserbaseCost?: number;
    visionCost?: number;
  };
  steps: StepResult[];
  errors?: ErrorLog[];
}
```

Update `VisionCache` to include execution mode:

```typescript
export interface VisionCache {
  _id: ObjectId;
  screenshotHash: string;
  assertion: string;
  model: string;
  promptVersion: string;

  // NEW: Execution mode affects cache key
  executionMode: 'local' | 'cloud';

  verdict: boolean;
  confidence: number;
  reasoning: string;
  tokens: {
    input: number;
    output: number;
  };
  cost: number;
  createdAt: Date;
  expiresAt: Date;
  hitCount: number;
}
```

---

## Phase 5: AWS Secrets Manager Integration

### 5.1 Secrets Manager Client

**File:** `src/secrets/manager.ts`

```typescript
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

export class SecretsManager {
  private client: SecretsManagerClient;
  private cache: Map<string, { value: string; expiry: number }> = new Map();
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.client = new SecretsManagerClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  async getSecret(secretName: string): Promise<string> {
    // Check cache first
    const cached = this.cache.get(secretName);
    if (cached && cached.expiry > Date.now()) {
      return cached.value;
    }

    // Fetch from AWS Secrets Manager
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await this.client.send(command);

    if (!response.SecretString) {
      throw new Error(`Secret ${secretName} not found or is binary`);
    }

    const value = response.SecretString;

    // Cache result
    this.cache.set(secretName, {
      value,
      expiry: Date.now() + this.cacheTTL,
    });

    return value;
  }

  /**
   * Get all FlowGuard secrets from AWS Secrets Manager
   */
  async getAllSecrets(): Promise<{
    ANTHROPIC_API_KEY: string;
    BROWSERBASE_API_KEY: string;
    BROWSERBASE_PROJECT_ID: string;
    DD_API_KEY: string;
    MONGODB_URI: string;
  }> {
    const secretName = process.env.FLOWGUARD_SECRET_NAME || 'flowguard-production';
    const secretString = await this.getSecret(secretName);
    return JSON.parse(secretString);
  }
}

export const secretsManager = new SecretsManager();
```

### 5.2 Environment Configuration

**File:** `src/config.ts`

```typescript
import { secretsManager } from './secrets/manager.js';

export async function loadConfiguration(): Promise<void> {
  const env = process.env.NODE_ENV || 'development';

  if (env === 'production') {
    console.log('🔐 Loading secrets from AWS Secrets Manager...');

    try {
      const secrets = await secretsManager.getAllSecrets();

      // Inject into environment
      process.env.ANTHROPIC_API_KEY = secrets.ANTHROPIC_API_KEY;
      process.env.BROWSERBASE_API_KEY = secrets.BROWSERBASE_API_KEY;
      process.env.BROWSERBASE_PROJECT_ID = secrets.BROWSERBASE_PROJECT_ID;
      process.env.DD_API_KEY = secrets.DD_API_KEY;
      process.env.MONGODB_URI = secrets.MONGODB_URI;

      console.log('✅ Secrets loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load secrets:', error);
      process.exit(1);
    }
  } else {
    console.log('📋 Using environment variables from .env file');
  }

  // Validate required variables
  const required = [
    'ANTHROPIC_API_KEY',
    'MONGODB_URI',
  ];

  const optional = [
    'BROWSERBASE_API_KEY',
    'DD_API_KEY',
    'PHOENIX_ENDPOINT',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    process.exit(1);
  }

  const optionalMissing = optional.filter(key => !process.env[key]);
  if (optionalMissing.length > 0) {
    console.warn('⚠️  Optional environment variables not set:', optionalMissing);
  }
}
```

---

## Phase 6: CLI Enhancements

### 6.1 New Commands

**File Modification:** `src/cli.ts`

Add environment validation command:

```typescript
program
  .command('env:validate')
  .description('Validate environment configuration')
  .action(async () => {
    console.log('🔍 Validating FlowGuard environment configuration...\n');

    const checks = [
      { name: 'MongoDB', env: 'MONGODB_URI', test: testMongoDBConnection },
      { name: 'Anthropic API', env: 'ANTHROPIC_API_KEY', test: testAnthropicAPI },
      { name: 'Browserbase', env: 'BROWSERBASE_API_KEY', test: testBrowserbaseAPI },
      { name: 'Datadog', env: 'DD_API_KEY', test: testDatadogAPI },
      { name: 'Phoenix', env: 'PHOENIX_ENDPOINT', test: testPhoenixEndpoint },
    ];

    for (const check of checks) {
      const value = process.env[check.env];

      if (!value) {
        console.log(`⚠️  ${check.name}: Not configured (${check.env})`);
        continue;
      }

      try {
        await check.test(value);
        console.log(`✅ ${check.name}: Connected`);
      } catch (error) {
        console.log(`❌ ${check.name}: Failed - ${(error as Error).message}`);
      }
    }
  });

program
  .command('browserbase:sessions')
  .description('List active Browserbase sessions')
  .action(async () => {
    const client = new BrowserbaseClient({
      apiKey: process.env.BROWSERBASE_API_KEY!,
      projectId: process.env.BROWSERBASE_PROJECT_ID!,
    });

    // Fetch and display sessions
    // Implementation details...
  });
```

---

## Development Lifecycle Implementation

### 7.1 Environment Files

**File:** `.env.development`

```bash
# Core
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/flowguard-dev
ANTHROPIC_API_KEY=sk-ant-dev-...

# Browserbase (local testing)
EXECUTION_MODE=local
# BROWSERBASE_API_KEY=bb_...  # Uncomment to test cloud
# BROWSERBASE_PROJECT_ID=proj_...

# Datadog (development dashboard)
DD_ENV=development
DD_SERVICE=flowguard-ai
DD_VERSION=0.1.0
DD_AGENT_HOST=localhost
DD_TRACE_AGENT_PORT=8126
# DD_API_KEY=...  # Uncomment to send to Datadog

# OpenTelemetry / Phoenix
PHOENIX_ENDPOINT=http://localhost:6006/v1/traces

# Feature Flags
ENABLE_BROWSERBASE=false
ENABLE_DATADOG=false
```

**File:** `.env.staging`

```bash
# Core
NODE_ENV=staging
MONGODB_URI=mongodb+srv://staging.mongodb.net/flowguard
ANTHROPIC_API_KEY=sk-ant-staging-...

# Browserbase (cloud execution enabled)
EXECUTION_MODE=cloud
BROWSERBASE_API_KEY=bb_staging_...
BROWSERBASE_PROJECT_ID=proj_staging_...
BROWSERBASE_REGION=us-east

# Datadog (staging dashboard)
DD_ENV=staging
DD_SERVICE=flowguard-ai
DD_VERSION=${GIT_SHA}
DD_API_KEY=...
DD_SITE=datadoghq.com

# OpenTelemetry / Phoenix
PHOENIX_ENDPOINT=https://staging-phoenix.flowguard.dev/v1/traces

# Feature Flags
ENABLE_BROWSERBASE=true
ENABLE_DATADOG=true
```

**File:** `.env.production` (Use AWS Secrets Manager Instead)

```bash
# DO NOT COMMIT THIS FILE
# Use AWS Secrets Manager in production:
# FLOWGUARD_SECRET_NAME=flowguard-production

NODE_ENV=production
AWS_REGION=us-east-1
FLOWGUARD_SECRET_NAME=flowguard-production

# Datadog (production dashboard)
DD_ENV=production
DD_SERVICE=flowguard-ai
DD_SITE=datadoghq.com

# Feature Flags
ENABLE_BROWSERBASE=true
ENABLE_DATADOG=true
EXECUTION_MODE=cloud
```

### 7.2 AWS Secrets Manager Structure

**Secret Name:** `flowguard-production`

**JSON Structure:**
```json
{
  "ANTHROPIC_API_KEY": "sk-ant-prod-...",
  "BROWSERBASE_API_KEY": "bb_prod_...",
  "BROWSERBASE_PROJECT_ID": "proj_prod_...",
  "DD_API_KEY": "...",
  "MONGODB_URI": "mongodb+srv://prod.mongodb.net/flowguard"
}
```

---

## Testing Strategy

### 8.1 Unit Tests

**File:** `src/browserbase/__tests__/client.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { BrowserbaseClient, BrowserbaseError } from '../client.js';

describe('BrowserbaseClient', () => {
  it('should create session successfully', async () => {
    const client = new BrowserbaseClient({
      apiKey: 'test-key',
      projectId: 'test-project',
    });

    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'session-123',
        status: 'running',
        connectUrl: 'wss://connect.browserbase.com/session-123',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      }),
    });

    const session = await client.createSession();

    expect(session.id).toBe('session-123');
    expect(session.status).toBe('running');
  });

  it('should handle API errors with retry logic', async () => {
    const client = new BrowserbaseClient({
      apiKey: 'test-key',
      projectId: 'test-project',
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'Service Unavailable',
    });

    await expect(client.createSession()).rejects.toThrow(BrowserbaseError);
  });
});
```

### 8.2 Integration Tests

**File:** `src/__tests__/integration/browserbase-datadog.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { executeFlow } from '../../runner.js';
import { FlowGuardRepository } from '../../db/repository.js';

describe('Browserbase + Datadog Integration', () => {
  let repo: FlowGuardRepository;

  beforeAll(async () => {
    // Setup test database
    const db = await connectTestDatabase();
    repo = new FlowGuardRepository(db);
  });

  afterAll(async () => {
    // Cleanup
  });

  it('should execute flow on Browserbase and track in Datadog', async () => {
    const flow: Flow = {
      name: 'integration-test',
      intent: 'Test Browserbase + Datadog integration',
      url: 'https://example.com',
      steps: [
        { action: 'navigate', target: 'https://example.com' },
        { action: 'screenshot', assert: 'Page loads successfully' },
      ],
      critical: true, // Force Browserbase execution
    };

    const result = await executeFlow(flow);

    // Verify execution mode
    expect(result.metadata.executionMode).toBe('cloud');
    expect(result.metadata.browserbaseSessionId).toBeTruthy();
    expect(result.metadata.browserbaseRecordingUrl).toBeTruthy();

    // Verify Datadog correlation
    expect(result.metadata.datadogTraceId).toBeTruthy();

    // Verify MongoDB storage
    const storedResults = await repo.getRecentResults('integration-test', 1);
    expect(storedResults).toHaveLength(1);
    expect(storedResults[0].metadata.executionMode).toBe('cloud');
  });
});
```

---

## Acceptance Criteria

### Functional Requirements
- [ ] Browserbase session creation and termination works
- [ ] Session pooling reduces cold start time by 50%+
- [ ] Dual execution modes (local/cloud) selectable via environment
- [ ] Session recordings accessible and linked in MongoDB
- [ ] Datadog APM traces correlate with Phoenix traces
- [ ] DogStatsD metrics sent for all key events
- [ ] Structured logs include trace IDs for correlation
- [ ] AWS Secrets Manager integration works in production
- [ ] Vision cache includes execution mode in cache key
- [ ] Cost tracking separates Browserbase and Vision costs

### Non-Functional Requirements
- [ ] Browserbase latency overhead <2 seconds vs local
- [ ] Datadog instrumentation overhead <5% CPU/memory
- [ ] Session pool maintains 2-10 idle sessions in production
- [ ] All tests pass with 100% coverage
- [ ] Documentation complete (3 new READMEs)
- [ ] Migration from Agent A1 schema is backwards-compatible

### Integration Requirements
- [ ] Exports clear interfaces for future agents
- [ ] No breaking changes to existing A1 MongoDB layer
- [ ] Compatible with existing OpenTelemetry/Phoenix setup
- [ ] CLI commands work in all environments (dev/staging/prod)

---

## Dependencies

**Before you start:**
- ✅ Agent A1 (MongoDB Core) merged to main
- ⚠️ Browserbase account created with API key
- ⚠️ Datadog account created with API key
- ⚠️ AWS account with Secrets Manager access
- ⚠️ Environment variables configured per environment

**Install:**
```bash
npm install @browserbasehq/sdk
npm install dd-trace
npm install @aws-sdk/client-secrets-manager
npm install @datadog/browser-rum  # For future SaaS frontend (Agent B1)
```

---

## Merge Strategy

**Your code depends on:**
- Agent A1 (MongoDB Core) ✅ Merged

**Other agents can use your code:**
- Agent B1 (Next.js Frontend) - Can display Browserbase recordings in UI
- Agent B2 (HTML Reports) - Can embed session recording links
- Agent B4 (DO Spaces) - Can store HAR files alongside screenshots

**Expected merge conflicts:**
- `package.json` - Merge dependencies manually
- `src/runner.ts` - Your changes to execution mode selection
- `src/db/schemas.ts` - Your new fields for Browserbase/Datadog metadata

---

## Cost Optimization Strategy

### Estimated Monthly Costs (Production)

**Assumptions:**
- 1,000 flow executions/day
- Average 5 steps per flow
- 30-day month

**Browserbase Costs:**
- Session cost: $0.02 per minute
- Average session duration: 2 minutes
- With pooling (50% reuse): 500 new sessions/day × 2 min × $0.02 = **$20/day = $600/month**
- Without pooling: 1,000 sessions/day × 2 min × $0.02 = **$40/day = $1,200/month**
- **Savings from pooling: $600/month (50%)**

**Datadog Costs:**
- APM: ~$31/host/month (1 host) = **$31/month**
- Custom Metrics: ~$0.05/metric (20 metrics) = **$1/month**
- Logs: ~$0.10/GB (assume 10 GB/month) = **$1/month**
- **Total Datadog: $33/month**

**Vision API Costs (Existing):**
- With 70% cache hit rate: **$150/month** (from Agent A1 analysis)

**Total Platform Costs:**
- Browserbase: $600/month
- Datadog: $33/month
- Vision API: $150/month
- MongoDB Atlas: $57/month (M10 tier)
- **Total: $840/month for 30,000 flow executions**

**Cost per Flow:** $0.028

### Cost Optimization Checklist
- [ ] Session pooling enabled (target: 50%+ reuse rate)
- [ ] Vision cache hit rate >70%
- [ ] Datadog sampling rate 10% in production (except critical traces)
- [ ] Browserbase sessions expire after 30 minutes of inactivity
- [ ] MongoDB TTL indexes delete old data (90 days)
- [ ] Cost alerts configured in Datadog when >$1,000/month

---

## Rollout Plan

### Week 1: Development Environment
- [ ] Implement Browserbase client and pool
- [ ] Update runner with dual execution modes
- [ ] Test locally with Browserbase dev account
- [ ] Verify session pooling reduces costs

### Week 2: Datadog Integration
- [ ] Initialize Datadog tracer (MUST BE FIRST IMPORT)
- [ ] Implement DogStatsD metrics
- [ ] Implement structured logging
- [ ] Test dual observability (Phoenix + Datadog)

### Week 3: Secrets Management & Testing
- [ ] Implement AWS Secrets Manager client
- [ ] Update MongoDB schemas with new fields
- [ ] Write comprehensive test suite
- [ ] Create integration tests

### Week 4: Documentation & Staging
- [ ] Write READMEs for all new modules
- [ ] Deploy to staging environment
- [ ] Run regression tests
- [ ] Monitor costs and performance

### Week 5: Production Rollout
- [ ] Create AWS Secrets Manager secret
- [ ] Deploy to production with feature flags
- [ ] Enable for 10% of flows (canary)
- [ ] Monitor error rates, costs, latency
- [ ] Gradually increase to 100%

---

## Success Metrics

### Technical Metrics
- **Session Pool Hit Rate:** >50% (sessions reused vs. created)
- **Browserbase Latency:** <2 seconds overhead vs. local
- **Datadog Trace Correlation:** 100% of flows have matching traces
- **Cache Hit Rate:** Maintain >70% (existing from A1)
- **Error Rate:** <1% of flow executions

### Business Metrics
- **Cost per Flow:** <$0.03
- **Debugging Time:** 50% reduction (with session recordings)
- **Global Coverage:** Tests running from 3+ regions
- **Customer Satisfaction:** Session recordings improve support tickets

---

## Handoff to Other Agents

Once merged, other agents can use your code:

**For Agent B1 (Next.js Frontend):**
```typescript
import { BrowserbaseClient } from './browserbase/client.js';

// Display session recording in UI
const session = await client.getSession(sessionId);
return (
  <iframe src={session.recordingUrl} width="100%" height="600px" />
);
```

**For Agent B2 (HTML Reports):**
```typescript
// Add session recording link to HTML report
if (result.metadata.browserbaseRecordingUrl) {
  html += `<a href="${result.metadata.browserbaseRecordingUrl}" target="_blank">
    View Session Recording
  </a>`;
}
```

**For Agent B4 (DO Spaces):**
```typescript
// Download and archive HAR files
await browserbaseClient.downloadHAR(sessionId, '/tmp/session.har');
await spacesClient.uploadFile('/tmp/session.har', `recordings/${sessionId}.har`);
```

---

## Documentation Deliverables

### Required Documentation

1. **`src/browserbase/README.md`** (500+ lines)
   - Architecture overview
   - Session lifecycle management
   - Pooling strategy
   - Configuration options
   - Cost optimization tips
   - Troubleshooting guide

2. **`src/datadog/README.md`** (500+ lines)
   - APM setup instructions
   - Metric naming conventions
   - Dashboard templates
   - Monitor/alert configurations
   - Log correlation guide
   - Troubleshooting

3. **`src/observability/README.md`** (300+ lines)
   - Dual observability architecture
   - Phoenix vs. Datadog use cases
   - Trace correlation
   - Sampling strategy
   - Performance considerations

4. **`docs/DEPLOYMENT_GUIDE.md`** (400+ lines)
   - Environment setup (dev/staging/prod)
   - AWS Secrets Manager configuration
   - Datadog agent installation
   - Browserbase account setup
   - Cost monitoring
   - Rollback procedures

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| **Browserbase API downtime** | Implement fallback to local Playwright; alert on-call engineer |
| **Datadog cost explosion** | Set budget alerts at $500/month; enforce tag cardinality limits |
| **Session recording PII exposure** | Implement 30-day auto-expiration; access control via Browserbase auth |
| **MongoDB schema migration breaks existing queries** | Use optional fields; test thoroughly on staging; provide rollback script |
| **OpenTelemetry/Datadog span context mismatch** | Test dual export extensively; use W3C Trace Context headers |
| **AWS Secrets Manager unavailable** | Cache secrets for 5 minutes; graceful degradation to env vars in dev |

---

## Next Steps After Completion

1. ✅ Merge Agent A9 to main
2. 📊 Monitor production metrics for 1 week
3. 📝 Document lessons learned
4. 🚀 Enable for Agent B1 (Next.js frontend) to display recordings
5. 📈 Iterate on cost optimization (target <$0.02 per flow)
6. 🌍 Expand to additional Browserbase regions (EU, APAC)
7. 🔍 Add advanced features (stealth mode, captcha solving) as premium tier

---

**Total Estimated Lines of Code:**
- **Production Code:** 1,200 lines
- **Test Code:** 800 lines
- **Documentation:** 1,700 lines
- **Total:** 3,700 lines

**Estimated Effort:** 5-7 days (Claude Code Max, full-time)

**Priority:** P0 (Critical for startup success - positions FlowGuard as enterprise-ready)
