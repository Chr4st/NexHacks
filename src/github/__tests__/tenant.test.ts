import { describe, it, expect } from 'vitest';
import {
  extractTenantFromPayload,
  tenantFilter,
  tenantFilterFlat,
  assertTenantOwnership,
  withTenantContext,
  PLAN_LIMITS
} from '../tenant.js';

describe('Multi-Tenant Support', () => {
  describe('extractTenantFromPayload', () => {
    it('should extract tenant context from webhook payload', () => {
      const payload = {
        installation: { id: 12345678 },
        repository: {
          full_name: 'acme-corp/webapp',
          owner: { login: 'acme-corp' }
        }
      };

      const context = extractTenantFromPayload(payload);

      expect(context.tenantId).toBe('gh-12345678');
      expect(context.installationId).toBe(12345678);
      expect(context.organizationName).toBe('acme-corp');
      expect(context.repositoryFullName).toBe('acme-corp/webapp');
    });

    it('should generate unique tenant IDs per installation', () => {
      const payload1 = {
        installation: { id: 111 },
        repository: { full_name: 'org1/repo', owner: { login: 'org1' } }
      };
      const payload2 = {
        installation: { id: 222 },
        repository: { full_name: 'org2/repo', owner: { login: 'org2' } }
      };

      const context1 = extractTenantFromPayload(payload1);
      const context2 = extractTenantFromPayload(payload2);

      expect(context1.tenantId).not.toBe(context2.tenantId);
    });
  });

  describe('tenantFilter', () => {
    it('should create metadata-scoped filter', () => {
      const filter = tenantFilter('gh-12345');

      expect(filter).toEqual({ 'metadata.tenantId': 'gh-12345' });
    });

    it('should reject empty tenant ID', () => {
      expect(() => tenantFilter('')).toThrow('Invalid tenantId');
    });

    it('should reject short tenant ID', () => {
      expect(() => tenantFilter('ab')).toThrow('Invalid tenantId');
    });
  });

  describe('tenantFilterFlat', () => {
    it('should create flat filter for non-nested collections', () => {
      const filter = tenantFilterFlat('gh-12345');

      expect(filter).toEqual({ tenantId: 'gh-12345' });
    });

    it('should reject invalid tenant ID', () => {
      expect(() => tenantFilterFlat('')).toThrow('Invalid tenantId');
    });
  });

  describe('assertTenantOwnership', () => {
    it('should return resource if tenant matches', () => {
      const resource = { id: '1', tenantId: 'gh-123', name: 'test' };

      const result = assertTenantOwnership(resource, 'gh-123');

      expect(result).toBe(resource);
    });

    it('should throw if tenant does not match', () => {
      const resource = { id: '1', tenantId: 'gh-123', name: 'test' };

      expect(() => assertTenantOwnership(resource, 'gh-999'))
        .toThrow('Access denied: resource belongs to different tenant');
    });

    it('should throw if resource is null', () => {
      expect(() => assertTenantOwnership(null, 'gh-123'))
        .toThrow('Resource not found');
    });

    it('should throw if resource has no tenantId', () => {
      const resource = { id: '1', name: 'test' };

      expect(() => assertTenantOwnership(resource, 'gh-123'))
        .toThrow('Access denied');
    });
  });

  describe('withTenantContext', () => {
    it('should add tenant to metadata', () => {
      const data = {
        metadata: {
          flowName: 'checkout',
          environment: 'ci'
        }
      };

      const result = withTenantContext(data, 'gh-12345');

      expect(result.metadata.tenantId).toBe('gh-12345');
      expect(result.metadata.flowName).toBe('checkout');
    });

    it('should create metadata if not exists', () => {
      const data = { name: 'test' };

      const result = withTenantContext(data as any, 'gh-12345');

      expect(result.metadata.tenantId).toBe('gh-12345');
    });

    it('should not mutate original object', () => {
      const original = { metadata: { flowName: 'test' } };

      const result = withTenantContext(original, 'gh-12345');

      expect(original.metadata).not.toHaveProperty('tenantId');
      expect(result).not.toBe(original);
    });
  });

  describe('PLAN_LIMITS', () => {
    it('should have free tier limits', () => {
      expect(PLAN_LIMITS.free.flowsPerMonth).toBe(100);
      expect(PLAN_LIMITS.free.maxFlows).toBe(5);
    });

    it('should have pro tier limits', () => {
      expect(PLAN_LIMITS.pro.flowsPerMonth).toBe(1000);
      expect(PLAN_LIMITS.pro.retentionDays).toBe(30);
    });

    it('should have unlimited enterprise tier', () => {
      expect(PLAN_LIMITS.enterprise.flowsPerMonth).toBe(-1);
      expect(PLAN_LIMITS.enterprise.maxFlows).toBe(-1);
    });
  });
});
