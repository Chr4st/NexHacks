import { Db, Collection } from 'mongodb';
import { TestResult, VisionCache, FlowDefinition, UsageEvent, Experiment, SuccessRateTrendPoint, FlowCostSummary } from './schemas.js';
import { validateString, validateNumber, validateSearchQuery, escapeRegex } from './validators.js';

export class FlowGuardRepository {
  private testResults: Collection<TestResult>;
  private visionCache: Collection<VisionCache>;
  private flowDefinitions: Collection<FlowDefinition>;
  private usageEvents: Collection<UsageEvent>;
  private experiments: Collection<Experiment>;

  constructor(db: Db) {
    this.testResults = db.collection('test_results');
    this.visionCache = db.collection('vision_cache');
    this.flowDefinitions = db.collection('flow_definitions');
    this.usageEvents = db.collection('usage_events');
    this.experiments = db.collection('experiments');
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
}
