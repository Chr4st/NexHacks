# Agent 1: MongoDB Core Infrastructure

**Branch:** `feat/mongodb-core-infrastructure`
**Agent:** Claude Code Max (Complex architecture, TypeScript expertise)
**Priority:** P0 (Foundation for all other agents)
**Estimated:** 2-3 days
**Dependencies:** None (independent)

---

## Mission

Build the complete MongoDB integration layer that replaces ALL JSON file storage. This is the foundation - all other agents depend on your database schemas and repository patterns.

---

## Scope

### What You Own
- `/src/db/` directory (entire module)
- MongoDB schemas, clients, repositories
- Vision cache implementation
- Database initialization and migrations
- Test suite for all database operations

### What You DON'T Touch
- Any existing CLI code in `/src/cli.ts`
- Any existing runner/vision code
- Report generation
- Cloud infrastructure

---

## Technical Specification

### 1. Database Schema Design

**File:** `src/db/schemas.ts`

```typescript
import { ObjectId } from 'mongodb';

// ==================== Time-Series Collection ====================
// Collection: test_results
export interface TestResult {
  timestamp: Date;              // Time-series timeField
  metadata: {
    tenantId?: string;           // Multi-tenant support
    flowName: string;
    environment: 'local' | 'ci' | 'production';
    viewport: string;            // "1920x1080", "375x667"
    browser: string;             // "chromium", "firefox", "webkit"
    userId?: string;
    branch?: string;
    commitSha?: string;
  };
  measurements: {
    passed: boolean;
    totalSteps: number;
    failedSteps: number;
    duration: number;            // milliseconds
    avgConfidence: number;       // 0-100
    totalTokens: number;
    totalCost: number;           // USD
  };
  steps: StepResult[];
  errors?: ErrorLog[];
}

export interface StepResult {
  stepIndex: number;
  action: string;
  target?: string;
  passed: boolean;
  confidence?: number;
  reasoning?: string;
  screenshotUrl?: string;
  screenshotHash?: string;
  duration: number;
  error?: string;
}

export interface ErrorLog {
  step: number;
  message: string;
  stack?: string;
  timestamp: Date;
}

// ==================== Vision Cache ====================
// Collection: vision_cache
export interface VisionCache {
  _id: ObjectId;
  screenshotHash: string;      // SHA-256 hash
  assertion: string;
  model: string;               // "claude-3-5-sonnet-20241022"
  promptVersion: string;       // "v2.1"
  verdict: boolean;
  confidence: number;
  reasoning: string;
  tokens: {
    input: number;
    output: number;
  };
  cost: number;
  createdAt: Date;
  expiresAt: Date;             // TTL index
  hitCount: number;            // Cache analytics
}

// ==================== Flow Definitions ====================
// Collection: flow_definitions
export interface FlowDefinition {
  _id: ObjectId;
  tenantId?: string;
  name: string;
  intent: string;              // Atlas Search indexed
  url: string;
  viewport?: {
    width: number;
    height: number;
  };
  steps: FlowStep[];
  tags: string[];
  critical: boolean;           // Use Browserbase in CI?
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface FlowStep {
  action: 'navigate' | 'click' | 'type' | 'screenshot' | 'wait' | 'scroll';
  target?: string;
  value?: string;
  assert?: string;
  timeout?: number;
}

// ==================== Usage Tracking ====================
// Collection: usage_events
export interface UsageEvent {
  _id: ObjectId;
  tenantId?: string;
  eventType: 'flow_run' | 'vision_call' | 'cache_hit' | 'cache_miss';
  flowName?: string;
  cost?: number;
  tokens?: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// ==================== Experiments (Phoenix Integration) ====================
// Collection: experiments
export interface Experiment {
  _id: ObjectId;
  name: string;
  promptVersion: string;
  datasetName: string;
  accuracy: number;
  avgConfidence: number;
  totalRuns: number;
  startedAt: Date;
  completedAt?: Date;
  phoenixExperimentId?: string;
  results: ExperimentResult[];
}

export interface ExperimentResult {
  example: string;
  expected: boolean;
  predicted: boolean;
  confidence: number;
  correct: boolean;
}
```

### 2. Database Client

**File:** `src/db/client.ts`

```typescript
import { MongoClient, Db } from 'mongodb';

export class DatabaseClient {
  private static instance: DatabaseClient;
  private client: MongoClient;
  private db: Db;

  private constructor() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    this.client = new MongoClient(uri);
  }

  public static getInstance(): DatabaseClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient();
    }
    return DatabaseClient.instance;
  }

  async connect(): Promise<Db> {
    if (!this.db) {
      await this.client.connect();
      this.db = this.client.db('flowguard');
      console.log('✅ MongoDB connected successfully');
    }
    return this.db;
  }

  async disconnect(): Promise<void> {
    await this.client.close();
    console.log('✅ MongoDB disconnected');
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }
}

// Export singleton instance
export const db = DatabaseClient.getInstance();
```

### 3. Repository Pattern

**File:** `src/db/repository.ts`

```typescript
import { Db, Collection } from 'mongodb';
import { TestResult, VisionCache, FlowDefinition, UsageEvent, Experiment } from './schemas.js';

export class FlowGuardRepository {
  private testResults: Collection<TestResult>;
  private visionCache: Collection<VisionCache>;
  private flowDefinitions: Collection<FlowDefinition>;
  private usageEvents: Collection<UsageEvent>;
  private experiments: Collection<Experiment>;

  constructor(private db: Db) {
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
    return await this.testResults
      .find({ 'metadata.flowName': flowName })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  async getSuccessRateTrend(flowName: string, daysBack: number = 7): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    return await this.testResults.aggregate([
      {
        $match: {
          'metadata.flowName': flowName,
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
    const cached = await this.visionCache.findOne({
      screenshotHash,
      assertion,
      model,
      promptVersion,
      expiresAt: { $gt: new Date() }
    });

    if (cached) {
      // Increment hit count
      await this.visionCache.updateOne(
        { _id: cached._id },
        { $inc: { hitCount: 1 } }
      );
    }

    return cached;
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

  async getCacheStats(): Promise<{ totalEntries: number; avgHitCount: number; oldestEntry: Date }> {
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

    return stats[0] || { totalEntries: 0, avgHitCount: 0, oldestEntry: new Date() };
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
    return await this.flowDefinitions.findOne({ name });
  }

  async searchFlowsByIntent(query: string): Promise<FlowDefinition[]> {
    // Note: Requires Atlas Search index on 'intent' field
    // For now, use simple regex search
    return await this.flowDefinitions
      .find({
        $or: [
          { intent: { $regex: query, $options: 'i' } },
          { name: { $regex: query, $options: 'i' } },
          { tags: { $in: [query] } }
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

  async getCostByFlow(startDate: Date, endDate: Date): Promise<any[]> {
    return await this.usageEvents.aggregate([
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
```

### 4. Database Initialization

**File:** `src/db/setup.ts`

```typescript
import { Db } from 'mongodb';

export async function setupDatabase(db: Db): Promise<void> {
  console.log('🔧 Setting up database...');

  // Create time-series collection for test results
  try {
    await db.createCollection('test_results', {
      timeseries: {
        timeField: 'timestamp',
        metaField: 'metadata',
        granularity: 'minutes'
      },
      expireAfterSeconds: 7776000 // 90 days retention
    });
    console.log('✅ Created time-series collection: test_results');
  } catch (error: any) {
    if (error.code === 48) {
      console.log('ℹ️  Time-series collection already exists');
    } else {
      throw error;
    }
  }

  // Create indexes
  const indexPromises = [
    // Test results indexes
    db.collection('test_results').createIndex(
      { 'metadata.flowName': 1, timestamp: -1 },
      { name: 'flow_timeline' }
    ),

    // Vision cache indexes
    db.collection('vision_cache').createIndex(
      { screenshotHash: 1, assertion: 1, model: 1, promptVersion: 1 },
      { unique: true, name: 'cache_lookup' }
    ),
    db.collection('vision_cache').createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0, name: 'cache_ttl' }
    ),

    // Flow definitions indexes
    db.collection('flow_definitions').createIndex(
      { name: 1 },
      { unique: true, name: 'flow_name_unique' }
    ),
    db.collection('flow_definitions').createIndex(
      { intent: 'text', name: 'text', tags: 'text' },
      { name: 'flow_search' }
    ),

    // Usage events indexes
    db.collection('usage_events').createIndex(
      { timestamp: -1 },
      { name: 'event_timeline' }
    ),
    db.collection('usage_events').createIndex(
      { flowName: 1, timestamp: -1 },
      { name: 'flow_usage' }
    )
  ];

  await Promise.all(indexPromises);
  console.log('✅ Created all indexes');

  console.log('✅ Database setup complete');
}
```

### 5. Test Suite

**File:** `src/db/__tests__/repository.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DatabaseClient } from '../client.js';
import { FlowGuardRepository } from '../repository.js';
import { setupDatabase } from '../setup.js';
import { TestResult, VisionCache, FlowDefinition } from '../schemas.js';

describe('FlowGuardRepository', () => {
  let db: any;
  let repo: FlowGuardRepository;

  beforeAll(async () => {
    const client = DatabaseClient.getInstance();
    db = await client.connect();
    await setupDatabase(db);
    repo = new FlowGuardRepository(db);
  });

  afterAll(async () => {
    await DatabaseClient.getInstance().disconnect();
  });

  describe('Test Results', () => {
    it('should save and retrieve test results', async () => {
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
    });

    it('should calculate success rate trends', async () => {
      const trend = await repo.getSuccessRateTrend('test-flow', 7);
      expect(Array.isArray(trend)).toBe(true);
    });
  });

  describe('Vision Cache', () => {
    it('should cache and retrieve vision results', async () => {
      const cacheEntry = {
        screenshotHash: 'abc123',
        assertion: 'Button is visible',
        model: 'claude-3-5-sonnet-20241022',
        promptVersion: 'v1.0',
        verdict: true,
        confidence: 90,
        reasoning: 'Button clearly visible',
        tokens: { input: 500, output: 50 },
        cost: 0.02
      };

      await repo.cacheVisionResult(cacheEntry);

      const cached = await repo.getCachedVisionResult(
        'abc123',
        'Button is visible',
        'claude-3-5-sonnet-20241022',
        'v1.0'
      );

      expect(cached).not.toBeNull();
      expect(cached!.verdict).toBe(true);
      expect(cached!.confidence).toBe(90);
    });

    it('should not return expired cache entries', async () => {
      // Test TTL expiration logic
    });

    it('should track cache hit count', async () => {
      const stats = await repo.getCacheStats();
      expect(stats.totalEntries).toBeGreaterThan(0);
    });
  });

  describe('Flow Definitions', () => {
    it('should save and retrieve flow definitions', async () => {
      const flow: Omit<FlowDefinition, '_id' | 'createdAt' | 'updatedAt'> = {
        name: 'signup-flow',
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

      const retrieved = await repo.getFlow('signup-flow');
      expect(retrieved).not.toBeNull();
      expect(retrieved!.intent).toBe('User can sign up successfully');
    });

    it('should search flows by intent', async () => {
      const results = await repo.searchFlowsByIntent('sign up');
      expect(results.length).toBeGreaterThan(0);
    });
  });
});
```

---

## Acceptance Criteria

### Functional
- [ ] All database schemas defined and exported
- [ ] Database client singleton working
- [ ] Repository implements all CRUD operations
- [ ] Vision cache achieves >80% hit rate in tests
- [ ] Time-series collections created correctly
- [ ] All indexes created successfully
- [ ] Test suite passes with 100% coverage

### Non-Functional
- [ ] Query performance <500ms for all operations
- [ ] Connection pooling implemented
- [ ] Graceful error handling
- [ ] TypeScript strict mode enabled
- [ ] All types exported from `src/db/index.ts`

### Integration Points (for other agents)
- [ ] Export clear interfaces (`FlowGuardRepository`)
- [ ] Document all public methods
- [ ] Provide sample usage examples
- [ ] No dependencies on CLI/runner code

---

## Dependencies

**Before you start:**
- MongoDB Atlas cluster created
- `MONGODB_URI` environment variable set
- `mongodb` npm package installed

**Install:**
```bash
npm install mongodb
```

---

## Testing

```bash
# Run all database tests
npm test src/db

# Run with coverage
npm test src/db --coverage

# Test connection only
npm run test:db-connection
```

---

## Merge Strategy

**Your code merges FIRST** (other agents depend on you)

**Merge order:**
1. Agent 1 (YOU) → `main` ✅
2. Then all other agents can merge

**No conflicts expected with:**
- Agent 2-8 (you own `/src/db/` exclusively)

---

## Handoff to Other Agents

Once merged, other agents can use your code:

```typescript
import { db } from './db/client.js';
import { FlowGuardRepository } from './db/repository.js';

const database = await db.connect();
const repo = new FlowGuardRepository(database);

// Save test results
await repo.saveTestResult({ ... });

// Check vision cache
const cached = await repo.getCachedVisionResult(...);
```

**Documentation file:** Create `src/db/README.md` with usage examples for all other agents.
