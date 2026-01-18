import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FlowGuardRepository } from '../repository.js';

describe('Tenant-Scoped Repository Methods', () => {
  let mockDb: any;
  let mockCollection: any;
  let repo: FlowGuardRepository;

  beforeEach(() => {
    mockCollection = {
      find: vi.fn().mockReturnThis(),
      findOne: vi.fn(),
      insertOne: vi.fn().mockResolvedValue({ insertedId: 'mock-id' }),
      updateOne: vi.fn().mockResolvedValue({ matchedCount: 1 }),
      deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
      countDocuments: vi.fn().mockResolvedValue(5),
      aggregate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([])
    };

    mockDb = {
      collection: vi.fn().mockReturnValue(mockCollection)
    };

    repo = new FlowGuardRepository(mockDb);
  });

  describe('validateTenantId', () => {
    it('should reject empty tenant ID', async () => {
      await expect(repo.getFlowsByTenant('')).rejects.toThrow('tenantId is required');
    });

    it('should reject short tenant ID', async () => {
      await expect(repo.getFlowsByTenant('ab')).rejects.toThrow('Invalid tenantId length');
    });

    it('should reject tenant ID with invalid characters', async () => {
      await expect(repo.getFlowsByTenant('tenant@123')).rejects.toThrow('Invalid tenantId format');
    });

    it('should accept valid tenant ID format', async () => {
      await repo.getFlowsByTenant('gh-12345678');
      expect(mockCollection.find).toHaveBeenCalledWith({ tenantId: 'gh-12345678' });
    });
  });

  describe('getRecentResultsByTenant', () => {
    it('should filter by tenant ID', async () => {
      await repo.getRecentResultsByTenant('gh-123');

      expect(mockCollection.find).toHaveBeenCalledWith({
        'metadata.tenantId': 'gh-123'
      });
    });

    it('should filter by tenant ID and flow name', async () => {
      await repo.getRecentResultsByTenant('gh-123', 'checkout-flow');

      expect(mockCollection.find).toHaveBeenCalledWith({
        'metadata.tenantId': 'gh-123',
        'metadata.flowName': 'checkout-flow'
      });
    });

    it('should respect limit parameter', async () => {
      await repo.getRecentResultsByTenant('gh-123', undefined, 25);

      expect(mockCollection.limit).toHaveBeenCalledWith(25);
    });
  });

  describe('getFlowsByTenant', () => {
    it('should only return flows for the specified tenant', async () => {
      await repo.getFlowsByTenant('gh-456');

      expect(mockCollection.find).toHaveBeenCalledWith({ tenantId: 'gh-456' });
      expect(mockCollection.sort).toHaveBeenCalledWith({ updatedAt: -1 });
    });
  });

  describe('getFlowByTenant', () => {
    it('should filter by tenant and flow name', async () => {
      await repo.getFlowByTenant('gh-123', 'login-flow');

      expect(mockCollection.findOne).toHaveBeenCalledWith({
        tenantId: 'gh-123',
        name: 'login-flow'
      });
    });
  });

  describe('saveFlowForTenant', () => {
    it('should include tenant ID in saved flow', async () => {
      const flow = {
        name: 'new-flow',
        intent: 'Test the checkout',
        url: 'https://example.com',
        steps: [],
        tags: [],
        critical: false
      };

      await repo.saveFlowForTenant('gh-789', flow);

      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'gh-789',
          name: 'new-flow'
        })
      );
    });
  });

  describe('updateFlowForTenant', () => {
    it('should only update flow if tenant matches', async () => {
      await repo.updateFlowForTenant('gh-123', 'my-flow', { intent: 'Updated intent' });

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { tenantId: 'gh-123', name: 'my-flow' },
        expect.objectContaining({
          $set: expect.objectContaining({ intent: 'Updated intent' })
        })
      );
    });

    it('should return true if flow was found and updated', async () => {
      mockCollection.updateOne.mockResolvedValue({ matchedCount: 1 });

      const result = await repo.updateFlowForTenant('gh-123', 'my-flow', { intent: 'New' });

      expect(result).toBe(true);
    });

    it('should return false if flow was not found', async () => {
      mockCollection.updateOne.mockResolvedValue({ matchedCount: 0 });

      const result = await repo.updateFlowForTenant('gh-123', 'nonexistent', { intent: 'New' });

      expect(result).toBe(false);
    });
  });

  describe('deleteFlowForTenant', () => {
    it('should only delete flow if tenant matches', async () => {
      await repo.deleteFlowForTenant('gh-123', 'old-flow');

      expect(mockCollection.deleteOne).toHaveBeenCalledWith({
        tenantId: 'gh-123',
        name: 'old-flow'
      });
    });

    it('should return true if flow was deleted', async () => {
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await repo.deleteFlowForTenant('gh-123', 'old-flow');

      expect(result).toBe(true);
    });

    it('should return false if flow was not found', async () => {
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

      const result = await repo.deleteFlowForTenant('gh-123', 'nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('searchFlowsByTenant', () => {
    it('should search within tenant scope', async () => {
      await repo.searchFlowsByTenant('gh-123', 'checkout');

      expect(mockCollection.find).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'gh-123',
          $or: expect.any(Array)
        })
      );
    });
  });

  describe('getCostByTenant', () => {
    it('should aggregate costs for tenant only', async () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      await repo.getCostByTenant('gh-123', startDate, endDate);

      expect(mockCollection.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: expect.objectContaining({
              tenantId: 'gh-123'
            })
          })
        ])
      );
    });
  });

  describe('getTenantUsageSummary', () => {
    it('should return usage stats for billing', async () => {
      mockCollection.aggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([{
          totalRuns: 100,
          totalCost: 5.50,
          totalTokens: 50000
        }])
      });
      mockCollection.countDocuments.mockResolvedValue(10);

      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      const summary = await repo.getTenantUsageSummary('gh-123', startDate, endDate);

      expect(summary).toEqual({
        totalRuns: 100,
        totalCost: 5.50,
        totalTokens: 50000,
        flowCount: 10
      });
    });

    it('should return zeros when no data exists', async () => {
      mockCollection.aggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([])
      });
      mockCollection.countDocuments.mockResolvedValue(0);

      const summary = await repo.getTenantUsageSummary('gh-123', new Date(), new Date());

      expect(summary).toEqual({
        totalRuns: 0,
        totalCost: 0,
        totalTokens: 0,
        flowCount: 0
      });
    });
  });

  describe('getDashboardFlows', () => {
    it('should return flows with last run status', async () => {
      const mockFlows = [
        { name: 'flow-1', tenantId: 'gh-123' },
        { name: 'flow-2', tenantId: 'gh-123' }
      ];

      mockCollection.find.mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue(mockFlows)
      });

      mockCollection.findOne.mockResolvedValue({
        measurements: { passed: true, duration: 5000 },
        timestamp: new Date('2026-01-18')
      });

      mockCollection.countDocuments.mockResolvedValue(10);

      const dashboard = await repo.getDashboardFlows('gh-123');

      expect(dashboard).toHaveLength(2);
      expect(dashboard[0].flow.name).toBe('flow-1');
      expect(dashboard[0].lastRun?.passed).toBe(true);
      expect(dashboard[0].runCount).toBe(10);
    });
  });

  describe('Cross-tenant isolation', () => {
    it('should never return data from other tenants', async () => {
      await repo.getFlowByTenant('tenant-a', 'shared-name');

      expect(mockCollection.findOne).toHaveBeenCalledWith({
        tenantId: 'tenant-a',
        name: 'shared-name'
      });
    });

    it('should prevent tenant ID injection via flow name', async () => {
      await expect(
        repo.getFlowByTenant('tenant-a', '"; tenantId: "tenant-b')
      ).rejects.toThrow();
    });
  });
});
