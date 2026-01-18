import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { DatabaseClient } from '../client.js';
import { FlowGuardRepository } from '../repository.js';
import { setupDatabase } from '../setup.js';
import { TestResult, VisionCache, FlowDefinition } from '../schemas.js';
import { Db } from 'mongodb';

describe('FlowGuardRepository', () => {
  let dbInstance: Db;
  let repo: FlowGuardRepository;
  let client: DatabaseClient;

  beforeAll(async () => {
    // Skip if no MongoDB URI is set
    if (!process.env.MONGODB_URI) {
      console.log('⚠️  Skipping MongoDB tests - MONGODB_URI not set');
      return;
    }

    client = DatabaseClient.getInstance();
    dbInstance = await client.connect();
    await setupDatabase(dbInstance);
    repo = new FlowGuardRepository(dbInstance);
  });

  afterAll(async () => {
    if (client) {
      await client.disconnect();
    }
  });

  beforeEach(async () => {
    if (!process.env.MONGODB_URI) {
      return;
    }
    // Clean up test data before each test
    await dbInstance.collection('test_results').deleteMany({});
    await dbInstance.collection('vision_cache').deleteMany({});
    await dbInstance.collection('flow_definitions').deleteMany({});
    await dbInstance.collection('usage_events').deleteMany({});
    await dbInstance.collection('experiments').deleteMany({});
  });

  describe('Test Results', () => {
    it('should save and retrieve test results', async () => {
      if (!process.env.MONGODB_URI) {
        console.log('⚠️  Skipping test - MONGODB_URI not set');
        return;
      }

      const result: TestResult = {
        timestamp: new Date(),
        metadata: {
          flowName: 'test-flow',
          environment: 'local',
          viewport: '1920x1080',
          browser: 'chromium'
        },
        measurements: {
          passed: true,
          totalSteps: 5,
          failedSteps: 0,
          duration: 1500,
          avgConfidence: 85,
          totalTokens: 1000,
          totalCost: 0.05
        },
        steps: []
      };

      await repo.saveTestResult(result);

      const recent = await repo.getRecentResults('test-flow', 1);
      expect(recent).toHaveLength(1);
      expect(recent[0].metadata.flowName).toBe('test-flow');
      expect(recent[0].measurements.passed).toBe(true);
    });

    it('should calculate success rate trends', async () => {
      if (!process.env.MONGODB_URI) {
        console.log('⚠️  Skipping test - MONGODB_URI not set');
        return;
      }

      // Insert test data
      const baseResult: TestResult = {
        timestamp: new Date(),
        metadata: {
          flowName: 'trend-test-flow',
          environment: 'local',
          viewport: '1920x1080',
          browser: 'chromium'
        },
        measurements: {
          passed: true,
          totalSteps: 3,
          failedSteps: 0,
          duration: 1000,
          avgConfidence: 90,
          totalTokens: 500,
          totalCost: 0.03
        },
        steps: []
      };

      // Insert multiple results
      await repo.saveTestResult(baseResult);
      await repo.saveTestResult({ ...baseResult, measurements: { ...baseResult.measurements, passed: false } });
      await repo.saveTestResult(baseResult);

      const trend = await repo.getSuccessRateTrend('trend-test-flow', 7);
      expect(Array.isArray(trend)).toBe(true);
    });
  });

  describe('Vision Cache', () => {
    it('should cache and retrieve vision results', async () => {
      if (!process.env.MONGODB_URI) {
        console.log('⚠️  Skipping test - MONGODB_URI not set');
        return;
      }

      const cacheEntry = {
        screenshotHash: 'abc123def456',
        assertion: 'Button is visible and prominent',
        model: 'claude-3-5-sonnet-20241022',
        promptVersion: 'v1.0',
        verdict: true,
        confidence: 90,
        reasoning: 'Button clearly visible in screenshot',
        tokens: { input: 500, output: 50 },
        cost: 0.02
      };

      await repo.cacheVisionResult(cacheEntry);

      const cached = await repo.getCachedVisionResult(
        'abc123def456',
        'Button is visible and prominent',
        'claude-3-5-sonnet-20241022',
        'v1.0'
      );

      expect(cached).not.toBeNull();
      expect(cached!.verdict).toBe(true);
      expect(cached!.confidence).toBe(90);
      expect(cached!.hitCount).toBe(1); // Should be incremented on retrieval
    });

    it('should not return expired cache entries', async () => {
      if (!process.env.MONGODB_URI) {
        console.log('⚠️  Skipping test - MONGODB_URI not set');
        return;
      }

      // Manually insert an expired entry
      const expiredEntry = {
        screenshotHash: 'expired123',
        assertion: 'Old assertion',
        model: 'claude-3-5-sonnet-20241022',
        promptVersion: 'v1.0',
        verdict: true,
        confidence: 85,
        reasoning: 'Expired test',
        tokens: { input: 400, output: 40 },
        cost: 0.015,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Expired 1 day ago
        hitCount: 0
      };

      await dbInstance.collection('vision_cache').insertOne(expiredEntry);

      const cached = await repo.getCachedVisionResult(
        'expired123',
        'Old assertion',
        'claude-3-5-sonnet-20241022',
        'v1.0'
      );

      expect(cached).toBeNull();
    });

    it('should track cache hit count', async () => {
      if (!process.env.MONGODB_URI) {
        console.log('⚠️  Skipping test - MONGODB_URI not set');
        return;
      }

      const cacheEntry = {
        screenshotHash: 'hitcount123',
        assertion: 'Test assertion',
        model: 'claude-3-5-sonnet-20241022',
        promptVersion: 'v1.0',
        verdict: true,
        confidence: 88,
        reasoning: 'Hit count test',
        tokens: { input: 450, output: 45 },
        cost: 0.018
      };

      await repo.cacheVisionResult(cacheEntry);

      // Retrieve multiple times
      await repo.getCachedVisionResult('hitcount123', 'Test assertion', 'claude-3-5-sonnet-20241022', 'v1.0');
      await repo.getCachedVisionResult('hitcount123', 'Test assertion', 'claude-3-5-sonnet-20241022', 'v1.0');
      const cached = await repo.getCachedVisionResult('hitcount123', 'Test assertion', 'claude-3-5-sonnet-20241022', 'v1.0');

      expect(cached!.hitCount).toBe(3);

      const stats = await repo.getCacheStats();
      expect(stats.totalEntries).toBeGreaterThan(0);
    });
  });

  describe('Flow Definitions', () => {
    it('should save and retrieve flow definitions', async () => {
      if (!process.env.MONGODB_URI) {
        console.log('⚠️  Skipping test - MONGODB_URI not set');
        return;
      }

      const flow: Omit<FlowDefinition, '_id' | 'createdAt' | 'updatedAt'> = {
        name: 'signup-flow-test',
        intent: 'User can sign up successfully',
        url: 'https://example.com/signup',
        viewport: { width: 1920, height: 1080 },
        steps: [
          { action: 'navigate', target: 'https://example.com/signup' },
          { action: 'click', target: '[data-testid="signup-button"]' }
        ],
        tags: ['auth', 'signup'],
        critical: true
      };

      const id = await repo.saveFlow(flow);
      expect(id).toBeTruthy();

      const retrieved = await repo.getFlow('signup-flow-test');
      expect(retrieved).not.toBeNull();
      expect(retrieved!.intent).toBe('User can sign up successfully');
      expect(retrieved!.tags).toContain('auth');
    });

    it('should search flows by intent', async () => {
      if (!process.env.MONGODB_URI) {
        console.log('⚠️  Skipping test - MONGODB_URI not set');
        return;
      }

      // Create multiple flows
      await repo.saveFlow({
        name: 'search-flow-1',
        intent: 'User can search for products',
        url: 'https://example.com',
        steps: [],
        tags: ['search'],
        critical: false
      });

      await repo.saveFlow({
        name: 'search-flow-2',
        intent: 'User can filter search results',
        url: 'https://example.com',
        steps: [],
        tags: ['search', 'filter'],
        critical: false
      });

      const results = await repo.searchFlowsByIntent('search');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Usage Tracking', () => {
    it('should track usage events', async () => {
      if (!process.env.MONGODB_URI) {
        console.log('⚠️  Skipping test - MONGODB_URI not set');
        return;
      }

      await repo.trackUsage({
        eventType: 'vision_call',
        flowName: 'test-flow',
        cost: 0.05,
        tokens: 1000
      });

      const events = await dbInstance.collection('usage_events').find({ flowName: 'test-flow' }).toArray();
      expect(events.length).toBe(1);
      expect(events[0].eventType).toBe('vision_call');
    });

    it('should calculate cost by flow', async () => {
      if (!process.env.MONGODB_URI) {
        console.log('⚠️  Skipping test - MONGODB_URI not set');
        return;
      }

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      await repo.trackUsage({
        eventType: 'flow_run',
        flowName: 'expensive-flow',
        cost: 1.5,
        tokens: 5000
      });

      await repo.trackUsage({
        eventType: 'flow_run',
        flowName: 'expensive-flow',
        cost: 2.0,
        tokens: 7000
      });

      const costs = await repo.getCostByFlow(yesterday, new Date(now.getTime() + 1000));
      expect(costs.length).toBeGreaterThan(0);

      const expensiveFlowCost = costs.find(c => c._id === 'expensive-flow');
      expect(expensiveFlowCost).toBeDefined();
      expect(expensiveFlowCost.totalCost).toBe(3.5);
    });
  });

  describe('Experiments', () => {
    it('should save and retrieve experiments', async () => {
      if (!process.env.MONGODB_URI) {
        console.log('⚠️  Skipping test - MONGODB_URI not set');
        return;
      }

      const experiment = {
        name: 'prompt-optimization-v1',
        promptVersion: 'v2.0',
        datasetName: 'ux-assertions-100',
        accuracy: 0.89,
        avgConfidence: 87.5,
        totalRuns: 100,
        startedAt: new Date(),
        results: [
          {
            example: 'Button visibility test',
            expected: true,
            predicted: true,
            confidence: 92,
            correct: true
          }
        ]
      };

      const id = await repo.saveExperiment(experiment);
      expect(id).toBeTruthy();

      const experiments = await repo.getExperiments(5);
      expect(experiments.length).toBeGreaterThan(0);
      expect(experiments[0].name).toBe('prompt-optimization-v1');
    });
  });
});
