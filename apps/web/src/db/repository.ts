import { Db, Collection } from 'mongodb';
import {
  TestResult,
  VisionCache,
  FlowDefinition,
  UsageEvent,
  Experiment,
  SuccessRateTrendPoint,
  FlowCostSummary,
  UXRisk,
  FlowExecutionDataDocument,
  FlowExecutionData
} from './schemas';
import { validateString, validateNumber, validateSearchQuery, escapeRegex } from './validators';

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

export class FlowGuardRepository {
  private testResults: Collection<TestResult>;
  private visionCache: Collection<VisionCache>;
  private flowDefinitions: Collection<FlowDefinition>;
  private usageEvents: Collection<UsageEvent>;
  private experiments: Collection<Experiment>;
  private uxRisks: Collection<UXRisk>;
  private flowExecutions: Collection<FlowExecutionDataDocument>;

  constructor(db: Db) {
    this.testResults = db.collection('test_results');
    this.visionCache = db.collection('vision_cache');
    this.flowDefinitions = db.collection('flow_definitions');
    this.usageEvents = db.collection('usage_events');
    this.experiments = db.collection('experiments');
    this.uxRisks = db.collection('ux_risks');
    this.flowExecutions = db.collection('flow_executions');
  }

  // ==================== Test Results ====================

  async saveTestResult(result: TestResult): Promise<void> {
    await this.testResults.insertOne(result);
  }

  async getRecentResults(flowName: string, limit: number = 10): Promise<TestResult[]> {
    const validFlowName = validateString(flowName, 'flowName');
    const validLimit = validateNumber(limit, 'limit', 1, 100);

    return await this.testResults
      .find({ 'metadata.flowName': validFlowName })
      .sort({ timestamp: -1 })
      .limit(validLimit)
      .toArray();
  }

  async getSuccessRateTrend(flowName: string, daysBack: number = 7): Promise<SuccessRateTrendPoint[]> {
    const validFlowName = validateString(flowName, 'flowName');
    const validDaysBack = validateNumber(daysBack, 'daysBack', 1, 365);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - validDaysBack);

    return await this.testResults.aggregate<SuccessRateTrendPoint>([
      {
        $match: {
          'metadata.flowName': validFlowName,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          totalRuns: { $sum: 1 },
          successfulRuns: {
            $sum: { $cond: ['$measurements.passed', 1, 0] }
          },
          avgConfidence: { $avg: '$measurements.avgConfidence' },
          avgDuration: { $avg: '$measurements.duration' }
        }
      },
      {
        $project: {
          date: '$_id',
          successRate: {
            $multiply: [{ $divide: ['$successfulRuns', '$totalRuns'] }, 100]
          },
          avgConfidence: 1,
          avgDuration: 1,
          totalRuns: 1
        }
      },
      { $sort: { date: 1 } }
    ]).toArray();
  }

  // ==================== Vision Cache ====================

  async getCachedVisionResult(
    screenshotHash: string,
    assertion: string,
    model: string,
    promptVersion: string
  ): Promise<VisionCache | null> {
    // Single atomic operation to fix race condition
    const cached = await this.visionCache.findOneAndUpdate(
      {
        screenshotHash,
        assertion,
        model,
        promptVersion,
        expiresAt: { $gt: new Date() }
      },
      { $inc: { hitCount: 1 } },
      { returnDocument: 'after' }
    );

    return cached || null;
  }

  async cacheVisionResult(result: Omit<VisionCache, '_id' | 'createdAt' | 'expiresAt' | 'hitCount'>): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.visionCache.insertOne({
      ...result,
      createdAt: now,
      expiresAt,
      hitCount: 0
    } as VisionCache);
  }

  async getCacheStats(): Promise<{ totalEntries: number; avgHitCount: number; oldestEntry: Date | null }> {
    const stats = await this.visionCache.aggregate([
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          avgHitCount: { $avg: '$hitCount' },
          oldestEntry: { $min: '$createdAt' }
        }
      }
    ]).toArray();

    const firstStat = stats[0];
    if (!firstStat) {
      return { totalEntries: 0, avgHitCount: 0, oldestEntry: null };
    }

    return {
      totalEntries: firstStat.totalEntries || 0,
      avgHitCount: firstStat.avgHitCount || 0,
      oldestEntry: firstStat.oldestEntry || null
    };
  }

  // ==================== Flow Definitions ====================

  async saveFlow(flow: Omit<FlowDefinition, '_id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date();
    const result = await this.flowDefinitions.insertOne({
      ...flow,
      createdAt: now,
      updatedAt: now
    } as FlowDefinition);

    return result.insertedId.toString();
  }

  async getFlow(name: string): Promise<FlowDefinition | null> {
    const validName = validateString(name, 'name');
    return await this.flowDefinitions.findOne({ name: validName });
  }

  async searchFlowsByIntent(query: string): Promise<FlowDefinition[]> {
    // Validate and sanitize query to prevent ReDoS attacks
    const validQuery = validateSearchQuery(query);
    const sanitized = escapeRegex(validQuery);

    // Note: Requires Atlas Search index on 'intent' field
    // For now, use simple regex search with sanitized input
    return await this.flowDefinitions
      .find({
        $or: [
          { intent: { $regex: sanitized, $options: 'i' } },
          { name: { $regex: sanitized, $options: 'i' } },
          { tags: { $in: [sanitized] } }
        ]
      })
      .limit(10)
      .toArray();
  }

  // ==================== Usage Tracking ====================

  async trackUsage(event: Omit<UsageEvent, '_id' | 'timestamp'>): Promise<void> {
    await this.usageEvents.insertOne({
      ...event,
      timestamp: new Date()
    } as UsageEvent);
  }

  async getCostByFlow(startDate: Date, endDate: Date): Promise<FlowCostSummary[]> {
    return await this.usageEvents.aggregate<FlowCostSummary>([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          cost: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$flowName',
          totalCost: { $sum: '$cost' },
          totalTokens: { $sum: '$tokens' },
          totalRuns: { $sum: 1 }
        }
      },
      {
        $sort: { totalCost: -1 }
      }
    ]).toArray();
  }

  // ==================== Experiments ====================

  async saveExperiment(experiment: Omit<Experiment, '_id'>): Promise<string> {
    const result = await this.experiments.insertOne(experiment as Experiment);
    return result.insertedId.toString();
  }

  async getExperiments(limit: number = 10): Promise<Experiment[]> {
    return await this.experiments
      .find()
      .sort({ startedAt: -1 })
      .limit(limit)
      .toArray();
  }

  // ==================== TENANT-SCOPED METHODS ====================
  // All methods below enforce tenant isolation for B2B SaaS

  /**
   * Get recent test results for a specific tenant.
   */
  async getRecentResultsByTenant(
    tenantId: string,
    flowName?: string,
    limit: number = 10
  ): Promise<TestResult[]> {
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
   * If flowName is empty or not provided, returns trends for all flows.
   */
  async getSuccessRateTrendByTenant(
    tenantId: string,
    flowName?: string,
    daysBack: number = 7
  ): Promise<SuccessRateTrendPoint[]> {
    const validTenantId = validateTenantId(tenantId);
    const validDaysBack = validateNumber(daysBack, 'daysBack', 1, 365);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - validDaysBack);

    // Build match filter - only add flowName if provided
    const matchFilter: Record<string, unknown> = {
      'metadata.tenantId': validTenantId,
      timestamp: { $gte: startDate }
    };

    if (flowName && flowName.trim()) {
      matchFilter['metadata.flowName'] = validateString(flowName, 'flowName');
    }

    return await this.testResults.aggregate<SuccessRateTrendPoint>([
      { $match: matchFilter },
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
  async getFlowsByTenant(tenantId: string): Promise<FlowDefinition[]> {
    const validTenantId = validateTenantId(tenantId);
    return await this.flowDefinitions
      .find({ tenantId: validTenantId })
      .sort({ updatedAt: -1 })
      .toArray();
  }

  /**
   * Get a specific flow for a tenant (with ownership check).
   */
  async getFlowByTenant(tenantId: string, flowName: string): Promise<FlowDefinition | null> {
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
    } as FlowDefinition);
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
   * Search flows by intent for a tenant.
   */
  async searchFlowsByTenant(tenantId: string, query: string): Promise<FlowDefinition[]> {
    const validTenantId = validateTenantId(tenantId);
    const validQuery = validateSearchQuery(query);
    const sanitized = escapeRegex(validQuery);

    return await this.flowDefinitions
      .find({
        tenantId: validTenantId,
        $or: [
          { intent: { $regex: sanitized, $options: 'i' } },
          { name: { $regex: sanitized, $options: 'i' } },
          { tags: { $in: [sanitized] } }
        ]
      })
      .limit(10)
      .toArray();
  }

  /**
   * Get cost analytics for a tenant.
   */
  async getCostByTenant(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<FlowCostSummary[]> {
    const validTenantId = validateTenantId(tenantId);

    return await this.usageEvents.aggregate<FlowCostSummary>([
      {
        $match: {
          tenantId: validTenantId,
          timestamp: { $gte: startDate, $lte: endDate },
          cost: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$flowName',
          totalCost: { $sum: '$cost' },
          totalTokens: { $sum: '$tokens' },
          totalRuns: { $sum: 1 }
        }
      },
      { $sort: { totalCost: -1 } }
    ]).toArray();
  }

  /**
   * Get daily cost trends for a tenant.
   */
  async getCostTrendByTenant(
    tenantId: string,
    daysBack: number = 7
  ): Promise<Array<{ date: string; cost: number; runs: number }>> {
    const validTenantId = validateTenantId(tenantId);
    const validDaysBack = validateNumber(daysBack, 'daysBack', 1, 365);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - validDaysBack);

    return await this.usageEvents.aggregate<{ date: string; cost: number; runs: number }>([
      {
        $match: {
          tenantId: validTenantId,
          timestamp: { $gte: startDate },
          cost: { $exists: true }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          cost: { $sum: { $ifNull: ['$cost', 0] } },
          runs: { $sum: 1 }
        }
      },
      {
        $project: {
          date: '$_id',
          cost: { $round: ['$cost', 2] },
          runs: 1
        }
      },
      { $sort: { date: 1 } }
    ]).toArray();
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
    flow: FlowDefinition;
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

  // ==================== Flow Execution Data (Phase 1: Agent-Driven Testing) ====================

  async saveFlowExecutionData(data: FlowExecutionData): Promise<string> {
    const doc: Omit<FlowExecutionDataDocument, '_id'> = {
      ...data,
      createdAt: new Date()
    };

    const result = await this.flowExecutions.insertOne(doc as FlowExecutionDataDocument);
    return result.insertedId.toString();
  }

  async getFlowExecutionData(flowId: string): Promise<FlowExecutionData | null> {
    const validFlowId = validateString(flowId, 'flowId');
    return await this.flowExecutions.findOne({ flowId: validFlowId }) as FlowExecutionData | null;
  }

  async queryFlowExecutions(filters: {
    flowName?: string;
    verdict?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<FlowExecutionData[]> {
    const query: any = {};

    if (filters.flowName) {
      query.flowName = validateString(filters.flowName, 'flowName');
    }

    if (filters.verdict) {
      query.verdict = validateString(filters.verdict, 'verdict');
    }

    if (filters.startDate || filters.endDate) {
      query.startTime = {};
      if (filters.startDate) {
        query.startTime.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.startTime.$lte = filters.endDate;
      }
    }

    return await this.flowExecutions.find(query).toArray() as FlowExecutionData[];
  }

  // ==================== UX Risks ====================

  async saveUXRisk(risk: Omit<UXRisk, '_id' | 'timestamp'>): Promise<void> {
    await this.uxRisks.insertOne({
      ...risk,
      timestamp: new Date(),
    } as UXRisk);
  }
}
