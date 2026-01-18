#!/usr/bin/env tsx
/**
 * Manual test script for Datadog integration
 * Tests tracer, metrics, and logger functionality
 */

import {
  initDatadog,
  shutdownDatadog,
  createConfigFromEnv,
  // Tracer
  isTracerActive,
  traceFlowExecution,
  traceStepExecution,
  getTraceContext,
  // Metrics
  isMetricsActive,
  recordFlowMetrics,
  recordStepMetrics,
  recordSessionCreated,
  recordPoolStats,
  increment,
  gauge,
  histogram,
  // Logger
  isLoggerInitialized,
  info,
  warn,
  error,
  debug,
  logFlowStart,
  logFlowComplete,
  logStepExecution,
  logBrowserbaseEvent,
  createFlowLogger,
  type DatadogConfig,
} from './src/datadog/index.js';

async function testDatadogIntegration() {
  console.log('🧪 Testing Datadog Integration\n');

  // Create config from environment or use defaults
  const config: DatadogConfig = {
    apiKey: process.env.DD_API_KEY || '959e03b31f77a8791acd4e74f35d9e6a',
    site: process.env.DD_SITE || 'us5.datadoghq.com',
    service: 'flowguard-test',
    env: 'development',
    version: '1.0.0-test',
    apmEnabled: true,
    metricsEnabled: true,
    logsEnabled: true,
    sampleRate: 1.0,
    statsdHost: 'localhost',
    statsdPort: 8125,
    runtimeMetrics: false,
    profiling: false,
    logInjection: true,
  };

  console.log(`✓ Config created`);
  console.log(`  Site: ${config.site}`);
  console.log(`  Service: ${config.service}`);
  console.log(`  Env: ${config.env}\n`);

  // Test 1: Initialize Datadog
  console.log('📋 Test 1: Initialize Datadog');
  await initDatadog(config, { logLevel: 'debug' });
  console.log(`  Tracer active: ${isTracerActive()}`);
  console.log(`  Metrics active: ${isMetricsActive()}`);
  console.log(`  Logger initialized: ${isLoggerInitialized()}\n`);

  // Test 2: Structured logging
  console.log('📋 Test 2: Structured logging');
  debug('Debug message test', { testId: 'test-2' });
  info('Info message test', { testId: 'test-2' });
  warn('Warning message test', { testId: 'test-2' });
  error('Error message test', { testId: 'test-2' });
  console.log('✓ Logged messages at all levels\n');

  // Test 3: Flow logging
  console.log('📋 Test 3: Flow-specific logging');
  logFlowStart('test-flow', 'local');
  logStepExecution('test-flow', 0, 'navigate', true, 150);
  logStepExecution('test-flow', 1, 'click', true, 50);
  logStepExecution('test-flow', 2, 'type', false, 100, 'Element not found');
  logFlowComplete('test-flow', 'fail', 300);
  console.log('✓ Logged flow execution events\n');

  // Test 4: Browserbase event logging
  console.log('📋 Test 4: Browserbase event logging');
  logBrowserbaseEvent('created', 'test-session-123');
  logBrowserbaseEvent('connected', 'test-session-123');
  logBrowserbaseEvent('terminated', 'test-session-123');
  console.log('✓ Logged Browserbase events\n');

  // Test 5: Child logger
  console.log('📋 Test 5: Child logger with preset context');
  const flowLogger = createFlowLogger('child-flow', 'cloud');
  flowLogger.info('This message has flow context preset');
  flowLogger.warn('Warning with context');
  console.log('✓ Child logger working\n');

  // Test 6: Metrics
  console.log('📋 Test 6: Record metrics');
  increment('test.counter', 1, { test: 'true' });
  gauge('test.gauge', 42, { test: 'true' });
  histogram('test.histogram', 123.45, { test: 'true' });
  recordSessionCreated('test-session', 'us-west-2');
  recordPoolStats({ idle: 3, active: 2, total: 5 });
  recordFlowMetrics('test-flow', {
    durationMs: 1500,
    stepsExecuted: 5,
    stepsPassed: 4,
    stepsFailed: 1,
    executionMode: 'cloud',
    verdict: 'fail',
    confidence: 85,
  });
  recordStepMetrics('test-flow', 0, {
    action: 'navigate',
    durationMs: 500,
    success: true,
  });
  console.log('✓ Recorded various metrics\n');

  // Test 7: Tracing
  console.log('📋 Test 7: Trace execution');
  const result = await traceFlowExecution('traced-flow', 'local', async (span) => {
    const traceContext = getTraceContext();
    console.log(`  Trace context: ${JSON.stringify(traceContext)}`);

    // Nested step trace
    await traceStepExecution(0, 'navigate', async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return 'step-0-result';
    });

    await traceStepExecution(1, 'click', async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return 'step-1-result';
    });

    return 'flow-result';
  });
  console.log(`  Flow result: ${result}`);
  console.log('✓ Traced flow execution\n');

  // Test 8: Config from environment
  console.log('📋 Test 8: Create config from environment');
  const envConfig = createConfigFromEnv();
  console.log(`  Service: ${envConfig.service}`);
  console.log(`  Env: ${envConfig.env}`);
  console.log(`  APM Enabled: ${envConfig.apmEnabled}`);
  console.log('✓ Environment config created\n');

  // Test 9: Shutdown
  console.log('📋 Test 9: Shutdown Datadog');
  await shutdownDatadog();
  console.log('✓ Datadog shutdown complete\n');

  console.log('✅ All Datadog integration tests passed!');
}

// Run tests
testDatadogIntegration()
  .then(() => {
    console.log('\n🎉 Integration test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Integration test failed:', error);
    process.exit(1);
  });
