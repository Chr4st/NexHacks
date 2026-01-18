import { Db, Collection, ObjectId } from 'mongodb';
import type { TestResult, FlowDefinition, SuccessRateTrendPoint } from '../types';

/**
 * Validate tenant ID format to prevent injection.
 */
function validateTenantId(tenantId: string): string {
  if (!tenantId || typeof tenantId !== 'string') {
    throw new Error('tenantId is required');
  }
  if (tenantId.length < 3 || tenantId.length > 100) {
    throw new Error('Invalid tenantId length');
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(tenantId)) {
    throw new Error('Invalid tenantId format');
  }
  return tenantId;
}

/**
 * Validate string input to prevent NoSQL injection
 */
function validateString(value: string, name: string): string {
  if (!value || typeof value !== 'string') {
    throw new Error(`${name} is required`);
  }
  // Check for NoSQL injection patterns
  if (value.includes('$') || value.includes('{') || value.includes('}')) {
    throw new Error(`Invalid ${name} format`);
  }
  return value;
}

/**
 * Validate number input
 */
function validateNumber(value: number, name: string, min: number, max: number): number {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error(`${name} must be a number`);
  }
  if (value < min || value > max) {
    throw new Error(`${name} must be between ${min} and ${max}`);
  }
  return value;
}

/**
 * Escape regex special characters
 */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Extended types for MongoDB documents
interface TestResultDocument extends TestResult {
  _id?: ObjectId;
}

interface FlowDefinitionDocument extends FlowDefinition {
  _id?: ObjectId;
}

interface UsageEvent {
  _id?: ObjectId;
  tenantId?: string;
  eventType: string;
  flowName?: string;
  cost?: number;
  tokens?: number;
  timestamp: Date;
}

interface FlowCostSummary {
  _id: string;
  totalCost: number;
  totalTokens: number;
  totalRuns: number;
}

/**
 * FlowGuard Repository - handles all database operations with tenant isolation
 */
export class FlowGuardRepository {
  private testResults: Collection<TestResultDocument>;
  private flowDefinitions: Collection<FlowDefinitionDocument>;
  private usageEvents: Collection<UsageEvent>;

  constructor(db: Db) {
    this.testResults = db.collection('test_results');
    this.flowDefinitions = db.collection('flow_definitions');
    this.usageEvents = db.collection('usage_events');
  }

  // ==================== TENANT-SCOPED METHODS ====================

  /**
   * Get recent test results for a specific tenant.
   */
  async getRecentResultsByTenant(
    tenantId: string,
    flowName?: string,
    limit: number = 10
  ): Promise<TestResultDocument[]> {
    const validTenantId = validateTenantId(tenantId);
    const validLimit = validateNumber(limit, 'limit', 1, 100);

    const filter: Record<string, unknown> = { 'metadata.tenantId': validTenantId };
    if (flowName) {
      filter['metadata.flowName'] = validateString(flowName, 'flowName');
    }

    return await this.testResults
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(validLimit)
      .toArray();
  }

  /**
   * Get success rate trend for a tenant's flow.
   */
  async getSuccessRateTrendByTenant(
    tenantId: string,
    flowName: string,
    daysBack: number = 7
  ): Promise<SuccessRateTrendPoint[]> {
    const validTenantId = validateTenantId(tenantId);
    const validFlowName = validateString(flowName, 'flowName');
    const validDaysBack = validateNumber(daysBack, 'daysBack', 1, 365);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - validDaysBack);

    return await this.testResults.aggregate<SuccessRateTrendPoint>([
      {
        $match: {
          'metadata.tenantId': validTenantId,
          'metadata.flowName': validFlowName,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          totalRuns: { $sum: 1 },
          successfulRuns: { $sum: { $cond: ['$measurements.passed', 1, 0] } },
          avgConfidence: { $avg: '$measurements.avgConfidence' },
          avgDuration: { $avg: '$measurements.duration' }
        }
      },
      {
        $project: {
          date: '$_id',
          successRate: { $multiply: [{ $divide: ['$successfulRuns', '$totalRuns'] }, 100] },
          avgConfidence: 1,
          avgDuration: 1,
          totalRuns: 1
        }
      },
      { $sort: { date: 1 } }
    ]).toArray();
  }

  /**
   * Get all flows for a tenant.
   */
  async getFlowsByTenant(tenantId: string): Promise<FlowDefinitionDocument[]> {
    const validTenantId = validateTenantId(tenantId);
    return await this.flowDefinitions
      .find({ tenantId: validTenantId })
      .sort({ updatedAt: -1 })
      .toArray();
  }

  /**
   * Get a specific flow for a tenant (with ownership check).
   */
  async getFlowByTenant(tenantId: string, flowName: string): Promise<FlowDefinitionDocument | null> {
    const validTenantId = validateTenantId(tenantId);
    const validName = validateString(flowName, 'flowName');
    return await this.flowDefinitions.findOne({
      tenantId: validTenantId,
      name: validName
    });
  }

  /**
   * Save a flow for a specific tenant.
   */
  async saveFlowForTenant(
    tenantId: string,
    flow: Omit<FlowDefinition, '_id' | 'tenantId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const validTenantId = validateTenantId(tenantId);
    const now = new Date();
    const result = await this.flowDefinitions.insertOne({
      ...flow,
      tenantId: validTenantId,
      createdAt: now,
      updatedAt: now
    } as FlowDefinitionDocument);
    return result.insertedId.toString();
  }

  /**
   * Update a flow for a tenant (with ownership check).
   */
  async updateFlowForTenant(
    tenantId: string,
    flowName: string,
    updates: Partial<Pick<FlowDefinition, 'intent' | 'url' | 'viewport' | 'steps' | 'tags' | 'critical'>>
  ): Promise<boolean> {
    const validTenantId = validateTenantId(tenantId);
    const validName = validateString(flowName, 'flowName');

    const result = await this.flowDefinitions.updateOne(
      { tenantId: validTenantId, name: validName },
      { $set: { ...updates, updatedAt: new Date() } }
    );
    return result.matchedCount > 0;
  }

  /**
   * Delete a flow for a tenant (with ownership check).
   */
  async deleteFlowForTenant(tenantId: string, flowName: string): Promise<boolean> {
    const validTenantId = validateTenantId(tenantId);
    const validName = validateString(flowName, 'flowName');

    const result = await this.flowDefinitions.deleteOne({
      tenantId: validTenantId,
      name: validName
    });
    return result.deletedCount > 0;
  }

  /**
   * Get usage summary for a tenant (for billing/limits).
   */
  async getTenantUsageSummary(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalRuns: number;
    totalCost: number;
    totalTokens: number;
    flowCount: number;
  }> {
    const validTenantId = validateTenantId(tenantId);

    const [usageStats, flowCount] = await Promise.all([
      this.usageEvents.aggregate([
        {
          $match: {
            tenantId: validTenantId,
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalRuns: { $sum: 1 },
            totalCost: { $sum: { $ifNull: ['$cost', 0] } },
            totalTokens: { $sum: { $ifNull: ['$tokens', 0] } }
          }
        }
      ]).toArray(),
      this.flowDefinitions.countDocuments({ tenantId: validTenantId })
    ]);

    const stats = usageStats[0];
    return {
      totalRuns: stats?.totalRuns || 0,
      totalCost: stats?.totalCost || 0,
      totalTokens: stats?.totalTokens || 0,
      flowCount
    };
  }

  /**
   * List all flows with their latest run status for a tenant dashboard.
   */
  async getDashboardFlows(tenantId: string): Promise<Array<{
    flow: FlowDefinitionDocument;
    lastRun?: { passed: boolean; timestamp: Date; duration: number };
    runCount: number;
  }>> {
    const validTenantId = validateTenantId(tenantId);

    const flows = await this.flowDefinitions
      .find({ tenantId: validTenantId })
      .sort({ updatedAt: -1 })
      .toArray();

    const results = await Promise.all(
      flows.map(async (flow) => {
        const [lastRun, runCount] = await Promise.all([
          this.testResults.findOne(
            { 'metadata.tenantId': validTenantId, 'metadata.flowName': flow.name },
            { sort: { timestamp: -1 } }
          ),
          this.testResults.countDocuments({
            'metadata.tenantId': validTenantId,
            'metadata.flowName': flow.name
          })
        ]);

        return {
          flow,
          lastRun: lastRun ? {
            passed: lastRun.measurements.passed,
            timestamp: lastRun.timestamp,
            duration: lastRun.measurements.duration
          } : undefined,
          runCount
        };
      })
    );

    return results;
  }
}
