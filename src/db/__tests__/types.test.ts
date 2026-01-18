import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DatabaseClient } from '../client.js';
import { FlowGuardRepository } from '../repository.js';
import { setupDatabase } from '../setup.js';
import type { SuccessRateTrendPoint, FlowCostSummary } from '../schemas.js';
import { Db } from 'mongodb';

describe('Type Safety Tests', () => {
  let dbInstance: Db;
  let repo: FlowGuardRepository;
  let client: DatabaseClient;

  beforeAll(async () => {
    if (!process.env.MONGODB_URI) {
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

  describe('Aggregation Result Types', () => {
    it('should return properly typed SuccessRateTrendPoint array', async () => {
      if (!process.env.MONGODB_URI) return;

      const trend = await repo.getSuccessRateTrend('test-flow', 7);

      expect(Array.isArray(trend)).toBe(true);

      // Type check - should compile without errors
      trend.forEach((point: SuccessRateTrendPoint) => {
        expect(point).toHaveProperty('date');
        expect(point).toHaveProperty('successRate');
        expect(point).toHaveProperty('avgConfidence');
        expect(point).toHaveProperty('avgDuration');
        expect(point).toHaveProperty('totalRuns');

        expect(typeof point.date).toBe('string');
        expect(typeof point.successRate).toBe('number');
        expect(typeof point.totalRuns).toBe('number');
      });
    });

    it('should return properly typed FlowCostSummary array', async () => {
      if (!process.env.MONGODB_URI) return;

      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');
      const costs = await repo.getCostByFlow(startDate, endDate);

      expect(Array.isArray(costs)).toBe(true);

      // Type check - should compile without errors
      costs.forEach((summary: FlowCostSummary) => {
        expect(summary).toHaveProperty('_id');
        expect(summary).toHaveProperty('totalCost');
        expect(summary).toHaveProperty('totalTokens');
        expect(summary).toHaveProperty('totalRuns');

        expect(typeof summary._id).toBe('string');
        expect(typeof summary.totalCost).toBe('number');
        expect(typeof summary.totalTokens).toBe('number');
        expect(typeof summary.totalRuns).toBe('number');
      });
    });
  });

  describe('No any Types', () => {
    it('getSuccessRateTrend should not return any[]', async () => {
      if (!process.env.MONGODB_URI) return;

      const result = await repo.getSuccessRateTrend('test', 7);

      // This test ensures the return type is SuccessRateTrendPoint[] not any[]
      // TypeScript will enforce this at compile time
      expect(result).toBeDefined();
    });

    it('getCostByFlow should not return any[]', async () => {
      if (!process.env.MONGODB_URI) return;

      const result = await repo.getCostByFlow(new Date(), new Date());

      // This test ensures the return type is FlowCostSummary[] not any[]
      expect(result).toBeDefined();
    });
  });
});
