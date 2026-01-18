/**
 * Multi-Tenant Support for B2B SaaS
 * 
 * Provides tenant context and isolation for GitHub App integrations.
 * Each GitHub App installation maps to a tenant (organization/team).
 */

export interface TenantContext {
  tenantId: string;
  installationId: number;
  organizationName?: string;
  repositoryFullName?: string;
}

export interface TenantMapping {
  installationId: number;
  tenantId: string;
  organizationName: string;
  createdAt: Date;
  plan?: 'free' | 'pro' | 'enterprise';
  limits?: {
    flowsPerMonth: number;
    retentionDays: number;
  };
}

/**
 * Extract tenant context from GitHub webhook payload.
 * Maps GitHub installation ID to tenant ID.
 */
export function extractTenantFromPayload(payload: {
  installation: { id: number };
  repository: { full_name: string; owner: { login: string } };
}): TenantContext {
  return {
    tenantId: `gh-${payload.installation.id}`,
    installationId: payload.installation.id,
    organizationName: payload.repository.owner.login,
    repositoryFullName: payload.repository.full_name
  };
}

/**
 * Create a tenant-scoped query filter.
 * MUST be applied to all database queries for data isolation.
 */
export function tenantFilter(tenantId: string): Record<string, unknown> {
  if (!tenantId || tenantId.length < 3) {
    throw new Error('Invalid tenantId');
  }
  return { 'metadata.tenantId': tenantId };
}

/**
 * Create a tenant-scoped filter for collections without nested metadata.
 */
export function tenantFilterFlat(tenantId: string): Record<string, unknown> {
  if (!tenantId || tenantId.length < 3) {
    throw new Error('Invalid tenantId');
  }
  return { tenantId };
}

/**
 * Validate that a resource belongs to the specified tenant.
 * Use for authorization checks before returning data.
 */
export function assertTenantOwnership<T extends { tenantId?: string }>(
  resource: T | null,
  expectedTenantId: string
): T {
  if (!resource) {
    throw new Error('Resource not found');
  }
  if (resource.tenantId !== expectedTenantId) {
    throw new Error('Access denied: resource belongs to different tenant');
  }
  return resource;
}

/**
 * Add tenant context to test result metadata.
 */
export function withTenantContext<T extends { metadata?: Record<string, unknown> }>(
  data: T,
  tenantId: string
): T {
  return {
    ...data,
    metadata: {
      ...data.metadata,
      tenantId
    }
  };
}

/**
 * Default plan limits for B2B tiers.
 */
export const PLAN_LIMITS = {
  free: {
    flowsPerMonth: 100,
    retentionDays: 7,
    maxFlows: 5,
    maxConcurrentRuns: 1
  },
  pro: {
    flowsPerMonth: 1000,
    retentionDays: 30,
    maxFlows: 50,
    maxConcurrentRuns: 5
  },
  enterprise: {
    flowsPerMonth: -1, // unlimited
    retentionDays: 90,
    maxFlows: -1, // unlimited
    maxConcurrentRuns: 20
  }
} as const;
