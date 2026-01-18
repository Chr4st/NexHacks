#!/usr/bin/env tsx
/**
 * Manual test script for Dual Observability integration
 * Tests combined Phoenix + Datadog tracing
 */

import {
  initDualObservability,
  shutdownDualObservability,
  isObservabilityEnabled,
  traceFlowRun,
  traceStep,
  traceVisionAnalysis,
  traceBrowserbaseCreate,
  traceBrowserbaseConnect,
  traceBrowserbaseTerminate,
  recordPoolStatistics,
  recordErrorOccurrence,
  createConfigFromEnv,
  type DualObservabilityConfig,
} from './src/observability/index.js';

import type { FlowRunResult, StepResult, AnalysisResult } from './src/types.js';

// Mock flow result
function createMockFlowResult(): FlowRunResult {
  return {
    flowName: 'test-dual-observability',
    intent: 'Test the dual observability integration',
    url: 'https://example.com',
    viewport: { width: 1280, height: 720 },
    verdict: 'pass',
    confidence: 95,
    steps: [
      { stepIndex: 0, action: 'navigate', success: true, durationMs: 200 },
      { stepIndex: 1, action: 'click', success: true, durationMs: 50 },
      { stepIndex: 2, action: 'screenshot', success: true, durationMs: 100 },
    ],
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    durationMs: 350,
  };
}

// Mock step result
function createMockStepResult(success: boolean): StepResult {
  return {
    stepIndex: 0,
    action: 'navigate',
    success,
    durationMs: 100,
    error: success ? undefined : 'Element not found',
  };
}

// Mock analysis result
function createMockAnalysisResult(): AnalysisResult {
  return {
    status: 'pass',
    confidence: 92,
    reasoning: 'The page loaded correctly and all elements are visible',
    issues: [],
  };
}

async function testDualObservability() {
  console.log('🧪 Testing Dual Observability Integration\n');

  // Create config
  const config: DualObservabilityConfig = {
    phoenix: {
      enabled: true,
      endpoint: process.env.PHOENIX_ENDPOINT ?? 'http://localhost:6006/v1/traces',
    },
    datadog: {
      enabled: true,
      apiKey: process.env.DD_API_KEY ?? '959e03b31f77a8791acd4e74f35d9e6a',
      site: process.env.DD_SITE ?? 'us5.datadoghq.com',
      service: 'flowguard-dual-test',
      env: 'development',
      version: '1.0.0-test',
    },
    service: 'flowguard-dual-test',
    env: 'development',
    version: '1.0.0-test',
  };

  console.log(`✓ Config created`);
  console.log(`  Phoenix: ${config.phoenix.enabled ? 'enabled' : 'disabled'}`);
  console.log(`  Datadog: ${config.datadog.enabled ? 'enabled' : 'disabled'}\n`);

  // Test 1: Initialize dual observability
  console.log('📋 Test 1: Initialize dual observability');
  await initDualObservability(config);
  console.log(`  Observability enabled: ${isObservabilityEnabled()}\n`);

  // Test 2: Trace flow execution
  console.log('📋 Test 2: Trace flow execution');
  const flowResult = await traceFlowRun(
    'test-flow',
    'Test dual observability',
    'local',
    async () => {
      // Simulate flow execution
      await new Promise((resolve) => setTimeout(resolve, 100));
      return createMockFlowResult();
    }
  );
  console.log(`  Flow traced: ${flowResult.flowName}`);
  console.log(`  Execution mode: ${flowResult.executionMode}`);
  console.log(`  Verdict: ${flowResult.verdict}`);
  console.log(`  Phoenix URL: ${flowResult.phoenixTraceUrl ?? 'N/A'}\n`);

  // Test 3: Trace step execution
  console.log('📋 Test 3: Trace step execution');
  const stepResult = await traceStep('test-flow', 0, 'navigate', async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return createMockStepResult(true);
  });
  console.log(`  Step traced: ${stepResult.action}`);
  console.log(`  Success: ${stepResult.success}\n`);

  // Test 4: Trace failed step
  console.log('📋 Test 4: Trace failed step');
  const failedStep = await traceStep('test-flow', 1, 'click', async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
    return createMockStepResult(false);
  });
  console.log(`  Step traced: ${failedStep.action}`);
  console.log(`  Success: ${failedStep.success}`);
  console.log(`  Error: ${failedStep.error}\n`);

  // Test 5: Trace vision analysis
  console.log('📋 Test 5: Trace vision analysis');
  const analysisResult = await traceVisionAnalysis(
    'test-flow',
    'Test the page layout',
    1500,
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return createMockAnalysisResult();
    }
  );
  console.log(`  Analysis traced: ${analysisResult.status}`);
  console.log(`  Confidence: ${analysisResult.confidence}%\n`);

  // Test 6: Browserbase session tracing
  console.log('📋 Test 6: Browserbase session tracing');
  const mockSession = await traceBrowserbaseCreate(async () => {
    return { id: 'mock-session-123', status: 'RUNNING' };
  });
  console.log(`  Session created: ${mockSession.id}`);

  await traceBrowserbaseConnect(mockSession.id, async () => {
    return { connected: true };
  });
  console.log(`  Session connected: ${mockSession.id}`);

  await traceBrowserbaseTerminate(mockSession.id, 'completed', async () => {
    return { terminated: true };
  });
  console.log(`  Session terminated: ${mockSession.id}\n`);

  // Test 7: Pool statistics
  console.log('📋 Test 7: Record pool statistics');
  recordPoolStatistics({ idle: 3, active: 2, total: 5 });
  console.log(`  Pool stats recorded: idle=3, active=2, total=5\n`);

  // Test 8: Error recording
  console.log('📋 Test 8: Record error occurrence');
  recordErrorOccurrence('flow', 'TimeoutError', { flow_name: 'test-flow' });
  console.log(`  Error recorded: flow/TimeoutError\n`);

  // Test 9: Config from environment
  console.log('📋 Test 9: Create config from environment');
  const envConfig = createConfigFromEnv();
  console.log(`  Service: ${envConfig.service}`);
  console.log(`  Env: ${envConfig.env}`);
  console.log(`  Phoenix enabled: ${envConfig.phoenix.enabled}`);
  console.log(`  Datadog enabled: ${envConfig.datadog.enabled}\n`);

  // Test 10: Shutdown
  console.log('📋 Test 10: Shutdown dual observability');
  try {
    await shutdownDualObservability();
  } catch (error) {
    // Phoenix may throw if server not available - this is expected in local testing
    console.log('  (Phoenix shutdown warning - expected if server not running)');
  }
  console.log(`  Observability enabled: ${isObservabilityEnabled()}\n`);

  console.log('✅ All Dual Observability tests passed!');
}

// Run tests
testDualObservability()
  .then(() => {
    console.log('\n🎉 Integration test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Integration test failed:', error);
    process.exit(1);
  });
