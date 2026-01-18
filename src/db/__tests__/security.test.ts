import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { DatabaseClient } from '../client.js';
import { FlowGuardRepository } from '../repository.js';
import { setupDatabase } from '../setup.js';
import { Db } from 'mongodb';

describe('Security Tests', () => {
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

  beforeEach(async () => {
    if (!dbInstance) return;
    await dbInstance.collection('flow_definitions').deleteMany({});
  });

  describe('ReDoS Prevention', () => {
    it('should reject malicious regex patterns causing catastrophic backtracking', async () => {
      if (!process.env.MONGODB_URI) return;

      const maliciousPatterns = [
        '(a+)+$',
        '(.*)*$',
        '(a|a)*',
        '(a|ab)*',
        '([a-zA-Z]+)*'
      ];

      for (const pattern of maliciousPatterns) {
        await expect(repo.searchFlowsByIntent(pattern))
          .rejects.toThrow('Invalid query');
      }
    });

    it('should sanitize regex special characters', async () => {
      if (!process.env.MONGODB_URI) return;

      // Create test flow
      await repo.saveFlow({
        name: 'test-flow-1',
        intent: 'Test with special chars: $100 (premium)',
        url: 'https://example.com',
        steps: [],
        tags: [],
        critical: false
      });

      // Search with regex chars - should be literal match
      const result = await repo.searchFlowsByIntent('$100');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should enforce 100 character limit on search queries', async () => {
      if (!process.env.MONGODB_URI) return;

      const longQuery = 'a'.repeat(101);
      await expect(repo.searchFlowsByIntent(longQuery))
        .rejects.toThrow('Invalid query');
    });

    it('should reject empty queries', async () => {
      if (!process.env.MONGODB_URI) return;

      await expect(repo.searchFlowsByIntent(''))
        .rejects.toThrow('Invalid query');
    });

    it('should accept valid queries', async () => {
      if (!process.env.MONGODB_URI) return;

      const validQuery = 'test search';
      const result = await repo.searchFlowsByIntent(validQuery);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('NoSQL Injection Prevention', () => {
    it('should reject object injection in getFlow', async () => {
      if (!process.env.MONGODB_URI) return;

      const injection = { $ne: null } as any;
      await expect(repo.getFlow(injection))
        .rejects.toThrow('Invalid name');
    });

    it('should reject array injection in getFlow', async () => {
      if (!process.env.MONGODB_URI) return;

      const injection = ['test'] as any;
      await expect(repo.getFlow(injection))
        .rejects.toThrow('Invalid name');
    });

    it('should reject non-string parameters in getRecentResults', async () => {
      if (!process.env.MONGODB_URI) return;

      await expect(repo.getRecentResults(123 as any, 10))
        .rejects.toThrow('Invalid flowName');
    });

    it('should reject invalid limit parameters', async () => {
      if (!process.env.MONGODB_URI) return;

      await expect(repo.getRecentResults('test-flow', -1))
        .rejects.toThrow('limit must be >= 1');

      await expect(repo.getRecentResults('test-flow', 101))
        .rejects.toThrow('limit must be <= 100');

      await expect(repo.getRecentResults('test-flow', 'invalid' as any))
        .rejects.toThrow('Invalid limit');
    });

    it('should accept valid string parameters', async () => {
      if (!process.env.MONGODB_URI) return;

      const flow = await repo.getFlow('valid-flow-name');
      expect(flow === null || typeof flow === 'object').toBe(true);
    });
  });

  describe('Input Validation', () => {
    it('should validate daysBack parameter in getSuccessRateTrend', async () => {
      if (!process.env.MONGODB_URI) return;

      await expect(repo.getSuccessRateTrend('test-flow', 0))
        .rejects.toThrow('daysBack must be >= 1');

      await expect(repo.getSuccessRateTrend('test-flow', 366))
        .rejects.toThrow('daysBack must be <= 365');
    });

    it('should validate flowName is non-empty string', async () => {
      if (!process.env.MONGODB_URI) return;

      await expect(repo.getSuccessRateTrend('', 7))
        .rejects.toThrow('Invalid flowName');
    });
  });
});
