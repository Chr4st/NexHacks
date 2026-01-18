# Agent B1: Vision Cache Integration — Detailed Specification

**AI Tool:** Claude Code Max
**Branch:** `feat/vision-cache-integration`
**Priority:** P0 (Core Feature - Cost Optimization)
**Developer:** Team B (Developer 2)
**Dependencies:** MongoDB Core (Agent A1) - Must wait for A1 to merge
**Estimated Effort:** 2-3 days

---

## Mission

Implement **intelligent vision caching** to reduce AI costs by 80%+ through:

1. **SHA-256 screenshot hashing** for deterministic cache keys
2. **Prompt version awareness** to invalidate cache on prompt updates
3. **MongoDB TTL indexes** for automatic cache expiration (7 days)
4. **Cache hit/miss metrics** tracked in Phoenix
5. **Cost savings analytics** with before/after comparison

This module is CRITICAL for making FlowGuard economically viable at scale - without caching, every test run costs $0.05-0.10 in vision API calls. With 80%+ cache hit rate, costs drop to $0.01-0.02.

---

## Cache Strategy

### Cache Key Generation
```
cache_key = SHA256(screenshot_bytes + assertion_text + prompt_version + model_name)
```

### Cache Hit Logic
1. Hash screenshot + assertion + prompt version + model
2. Query MongoDB `vision_cache` collection
3. If found and not expired → return cached result (0 cost)
4. If not found → call vision API, cache result, return

### Cache Invalidation
- **TTL:** 7 days (balances freshness vs hit rate)
- **Prompt version change:** Old cache entries ignored (different hash)
- **Manual purge:** CLI command `flowguard cache clear`

---

## File Structure

```
src/
├── vision/
│   ├── cache.ts                 # Cache logic and utilities
│   ├── hash.ts                  # SHA-256 hashing
│   ├── analyzer.ts              # Vision analysis with cache (MODIFY)
│   ├── types.ts                 # TypeScript interfaces
│   ├── index.ts                 # Public exports
│   └── __tests__/
│       ├── cache.test.ts
│       ├── hash.test.ts
│       └── integration.test.ts
│
src/vision.ts                    # MODIFY existing file
src/security.ts                  # MODIFY for screenshot hashing
```

---

## Core Deliverables

### 1. Screenshot Hashing

**File:** `src/vision/hash.ts`

**Objective:** Generate deterministic SHA-256 hashes for screenshots

```typescript
import crypto from 'crypto';
import fs from 'fs/promises';

export class ScreenshotHasher {
  /**
   * Generate SHA-256 hash from screenshot file.
   */
  async hashFile(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    return this.hashBuffer(buffer);
  }

  /**
   * Generate SHA-256 hash from screenshot buffer.
   */
  hashBuffer(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Generate SHA-256 hash from base64 screenshot.
   */
  hashBase64(base64: string): string {
    const buffer = Buffer.from(base64, 'base64');
    return this.hashBuffer(buffer);
  }

  /**
   * Generate composite cache key including assertion and prompt version.
   */
  generateCacheKey(
    screenshotHash: string,
    assertion: string,
    promptVersion: string,
    model: string
  ): string {
    const compositeInput = `${screenshotHash}:${assertion}:${promptVersion}:${model}`;
    return crypto.createHash('sha256').update(compositeInput).digest('hex');
  }
}
```

---

### 2. Cache Layer

**File:** `src/vision/cache.ts`

**Objective:** MongoDB-backed vision result caching

```typescript
import { FlowGuardRepository } from '../db/repository.js';
import { ScreenshotHasher } from './hash.js';
import type { VisionCache, VisionResult } from './types.js';
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('flowguard-vision-cache');

export class VisionCacheManager {
  private hasher: ScreenshotHasher;

  constructor(private repository: FlowGuardRepository) {
    this.hasher = new ScreenshotHasher();
  }

  /**
   * Attempt to retrieve cached vision result.
   * Returns null if cache miss.
   */
  async get(
    screenshotPath: string,
    assertion: string,
    promptVersion: string,
    model: string
  ): Promise<VisionCache | null> {
    return await tracer.startActiveSpan('vision.cache.get', async (span) => {
      try {
        // Hash screenshot
        const screenshotHash = await this.hasher.hashFile(screenshotPath);
        span.setAttribute('screenshot.hash', screenshotHash);

        // Generate cache key
        const cacheKey = this.hasher.generateCacheKey(
          screenshotHash,
          assertion,
          promptVersion,
          model
        );
        span.setAttribute('cache.key', cacheKey);

        // Query MongoDB
        const cached = await this.repository.getCachedVisionResult(
          screenshotHash,
          assertion,
          model,
          promptVersion
        );

        if (cached) {
          // Increment hit count
          await this.repository.incrementCacheHitCount(cached._id);

          span.setAttribute('cache.hit', true);
          span.setAttribute('cache.age_days', this.getAgeDays(cached.createdAt));
          span.setAttribute('cache.hit_count', cached.hitCount + 1);

          span.end();
          return cached;
        }

        span.setAttribute('cache.hit', false);
        span.end();
        return null;
      } catch (error) {
        span.recordException(error as Error);
        span.end();
        throw error;
      }
    });
  }

  /**
   * Store vision result in cache.
   */
  async set(
    screenshotPath: string,
    assertion: string,
    promptVersion: string,
    model: string,
    result: VisionResult
  ): Promise<void> {
    return await tracer.startActiveSpan('vision.cache.set', async (span) => {
      try {
        // Hash screenshot
        const screenshotHash = await this.hasher.hashFile(screenshotPath);
        span.setAttribute('screenshot.hash', screenshotHash);

        // Create cache entry
        const cacheEntry: Omit<VisionCache, '_id'> = {
          screenshotHash,
          assertion,
          model,
          promptVersion,
          verdict: result.verdict,
          confidence: result.confidence,
          reasoning: result.reasoning,
          tokens: result.tokens,
          cost: result.cost,
          createdAt: new Date(),
          expiresAt: this.getExpirationDate(),
          hitCount: 0
        };

        await this.repository.cacheVisionResult(cacheEntry);

        span.setAttribute('cache.ttl_days', 7);
        span.end();
      } catch (error) {
        span.recordException(error as Error);
        span.end();
        throw error;
      }
    });
  }

  /**
   * Clear all cache entries (for testing or manual purge).
   */
  async clearAll(): Promise<number> {
    return await this.repository.clearVisionCache();
  }

  /**
   * Clear cache entries older than specified days.
   */
  async clearOlderThan(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return await this.repository.clearVisionCacheOlderThan(cutoffDate);
  }

  /**
   * Get cache statistics.
   */
  async getStatistics(): Promise<CacheStatistics> {
    return await this.repository.getCacheStatistics();
  }

  /**
   * Calculate expiration date (7 days from now).
   */
  private getExpirationDate(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return expiresAt;
  }

  /**
   * Calculate age in days.
   */
  private getAgeDays(createdAt: Date): number {
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }
}

export interface CacheStatistics {
  totalEntries: number;
  totalHits: number;
  averageHitCount: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
  totalCostSaved: number;
  cacheHitRate: number;
}
```

---

### 3. Vision Analyzer with Cache

**File:** `src/vision/analyzer.ts`

**Objective:** Integrate caching into vision analysis workflow

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { VisionCacheManager } from './cache.js';
import { PhoenixClient } from '../tracing/phoenix-client.js';
import { trace } from '@opentelemetry/api';
import type { VisionResult, VisionOptions } from './types.js';

const tracer = trace.getTracer('flowguard-vision');

export class VisionAnalyzer {
  private anthropic: Anthropic;
  private cacheManager: VisionCacheManager;
  private phoenix: PhoenixClient;
  private promptVersion: string = 'v2.0'; // From Agent A2

  constructor(
    apiKey: string,
    cacheManager: VisionCacheManager,
    phoenix: PhoenixClient
  ) {
    this.anthropic = new Anthropic({ apiKey });
    this.cacheManager = cacheManager;
    this.phoenix = phoenix;
  }

  /**
   * Analyze screenshot with intelligent caching.
   */
  async analyzeWithCache(
    screenshotPath: string,
    assertion: string,
    options: VisionOptions = {}
  ): Promise<VisionResult & { cached: boolean; costSaved: number }> {
    return await tracer.startActiveSpan('vision.analyze', async (span) => {
      const model = options.model || 'claude-3-5-sonnet-20241022';
      const promptVersion = options.promptVersion || this.promptVersion;

      span.setAttribute('assertion', assertion);
      span.setAttribute('model', model);
      span.setAttribute('prompt.version', promptVersion);

      // Attempt cache lookup
      const cached = await this.cacheManager.get(
        screenshotPath,
        assertion,
        promptVersion,
        model
      );

      if (cached) {
        // Cache hit! Return immediately with 0 cost
        span.setAttribute('cache.hit', true);
        span.setAttribute('cost.saved', cached.cost);
        span.end();

        // Log to Phoenix
        await this.phoenix.logTrace({
          traceId: crypto.randomUUID(),
          spanId: crypto.randomUUID(),
          name: 'vision_analysis_cached',
          kind: 'LLM',
          startTime: new Date(),
          endTime: new Date(),
          attributes: {
            'cache.hit': true,
            'cache.age_days': Math.floor((Date.now() - cached.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
            'cost.saved': cached.cost,
            'llm.model': model
          },
          events: [],
          project: 'flowguard-production'
        });

        return {
          verdict: cached.verdict,
          confidence: cached.confidence,
          reasoning: cached.reasoning,
          tokens: cached.tokens,
          cost: 0, // Cache hit = 0 cost
          cached: true,
          costSaved: cached.cost
        };
      }

      // Cache miss - call vision API
      span.setAttribute('cache.hit', false);

      const startTime = Date.now();

      // Read screenshot
      const screenshotBase64 = await fs.readFile(screenshotPath, { encoding: 'base64' });

      // Call Claude
      const response = await this.anthropic.messages.create({
        model,
        max_tokens: 1000,
        system: this.getSystemPrompt(promptVersion),
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: screenshotBase64
              }
            },
            {
              type: 'text',
              text: `Assertion: ${assertion}\n\nAnalyze the screenshot and verify this assertion.`
            }
          ]
        }]
      });

      const latency = Date.now() - startTime;

      // Parse response
      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const parsed = this.parseVisionResponse(text);

      // Calculate cost
      const inputTokens = response.usage.input_tokens;
      const outputTokens = response.usage.output_tokens;
      const cost = this.calculateCost(inputTokens, outputTokens, model);

      const result: VisionResult = {
        verdict: parsed.verdict,
        confidence: parsed.confidence,
        reasoning: parsed.reasoning,
        tokens: { input: inputTokens, output: outputTokens },
        cost
      };

      // Cache the result
      await this.cacheManager.set(
        screenshotPath,
        assertion,
        promptVersion,
        model,
        result
      );

      // Log to Phoenix
      await this.phoenix.logTrace({
        traceId: crypto.randomUUID(),
        spanId: crypto.randomUUID(),
        name: 'vision_analysis',
        kind: 'LLM',
        startTime: new Date(startTime),
        endTime: new Date(startTime + latency),
        attributes: {
          'cache.hit': false,
          'llm.model': model,
          'llm.prompt.version': promptVersion,
          'llm.token_count.prompt': inputTokens,
          'llm.token_count.completion': outputTokens,
          'llm.cost': cost,
          'vision.verdict': parsed.verdict,
          'vision.confidence': parsed.confidence
        },
        events: [],
        project: 'flowguard-production'
      });

      span.setAttribute('tokens.input', inputTokens);
      span.setAttribute('tokens.output', outputTokens);
      span.setAttribute('cost', cost);
      span.end();

      return {
        ...result,
        cached: false,
        costSaved: 0
      };
    });
  }

  private getSystemPrompt(version: string): string {
    // Use improved prompt from Agent A2
    if (version === 'v2.0') {
      return `You are an expert UX tester specializing in accessibility, layout, and user experience analysis.

Analyze the screenshot systematically:
1. Visual hierarchy and layout
2. Color contrast and accessibility (WCAG AA standards)
3. Interactive element states
4. Text readability and overflow
5. Responsive design considerations

Respond in JSON format:
{
  "verdict": true/false,
  "confidence": 0-100,
  "reasoning": "Detailed explanation",
  "issues": ["Specific issues found"]
}`;
    }

    // Default v1.0 prompt
    return `You are a UX testing expert. Verify if the assertion is true based on the screenshot. Respond in JSON format.`;
  }

  private parseVisionResponse(text: string): { verdict: boolean; confidence: number; reasoning: string } {
    try {
      const json = JSON.parse(text);
      return {
        verdict: json.verdict === true,
        confidence: json.confidence || 80,
        reasoning: json.reasoning || json.issues?.join('; ') || 'No details provided'
      };
    } catch {
      // Fallback parsing
      const verdict = text.toLowerCase().includes('true') || !text.toLowerCase().includes('false');
      return {
        verdict,
        confidence: 70,
        reasoning: text.substring(0, 500)
      };
    }
  }

  private calculateCost(inputTokens: number, outputTokens: number, model: string): number {
    // Claude 3.5 Sonnet pricing (January 2026)
    if (model.includes('sonnet')) {
      return (inputTokens * 0.003 + outputTokens * 0.015) / 1000;
    }
    return 0;
  }
}
```

---

### 4. MongoDB Schema Extension

**Add to Agent A1's repository:**

```typescript
// Add to src/db/repository.ts
export class FlowGuardRepository {
  // ... existing methods ...

  async getCachedVisionResult(
    screenshotHash: string,
    assertion: string,
    model: string,
    promptVersion: string
  ): Promise<VisionCache | null> {
    const result = await this.db.collection('vision_cache').findOne({
      screenshotHash,
      assertion,
      model,
      promptVersion,
      expiresAt: { $gt: new Date() } // Not expired
    });

    return result as VisionCache | null;
  }

  async cacheVisionResult(entry: Omit<VisionCache, '_id'>): Promise<void> {
    await this.db.collection('vision_cache').insertOne(entry);
  }

  async incrementCacheHitCount(cacheId: ObjectId): Promise<void> {
    await this.db.collection('vision_cache').updateOne(
      { _id: cacheId },
      { $inc: { hitCount: 1 } }
    );
  }

  async clearVisionCache(): Promise<number> {
    const result = await this.db.collection('vision_cache').deleteMany({});
    return result.deletedCount;
  }

  async clearVisionCacheOlderThan(date: Date): Promise<number> {
    const result = await this.db.collection('vision_cache').deleteMany({
      createdAt: { $lt: date }
    });
    return result.deletedCount;
  }

  async getCacheStatistics(): Promise<CacheStatistics> {
    const stats = await this.db.collection('vision_cache').aggregate([
      {
        $facet: {
          counts: [
            {
              $group: {
                _id: null,
                totalEntries: { $sum: 1 },
                totalHits: { $sum: '$hitCount' },
                totalCostSaved: { $sum: { $multiply: ['$cost', '$hitCount'] } }
              }
            }
          ],
          dates: [
            {
              $group: {
                _id: null,
                oldestEntry: { $min: '$createdAt' },
                newestEntry: { $max: '$createdAt' }
              }
            }
          ]
        }
      }
    ]).toArray();

    const counts = stats[0].counts[0] || { totalEntries: 0, totalHits: 0, totalCostSaved: 0 };
    const dates = stats[0].dates[0] || { oldestEntry: null, newestEntry: null };

    return {
      totalEntries: counts.totalEntries,
      totalHits: counts.totalHits,
      averageHitCount: counts.totalEntries > 0 ? counts.totalHits / counts.totalEntries : 0,
      oldestEntry: dates.oldestEntry,
      newestEntry: dates.newestEntry,
      totalCostSaved: counts.totalCostSaved,
      cacheHitRate: counts.totalEntries > 0 ? (counts.totalHits / counts.totalEntries) * 100 : 0
    };
  }
}
```

---

### 5. CLI Cache Management

**Add to `src/cli.ts`:**

```typescript
program
  .command('cache')
  .description('Manage vision cache')
  .option('--stats', 'Show cache statistics')
  .option('--clear', 'Clear all cache entries')
  .option('--clear-old <days>', 'Clear entries older than N days')
  .action(async (options) => {
    const repository = new FlowGuardRepository(config.MONGODB_URI);
    await repository.connect();

    const cacheManager = new VisionCacheManager(repository);

    if (options.stats) {
      const stats = await cacheManager.getStatistics();
      console.log(chalk.bold('\n📊 Cache Statistics\n'));
      console.log(`  Total Entries:    ${stats.totalEntries}`);
      console.log(`  Total Hits:       ${stats.totalHits}`);
      console.log(`  Hit Rate:         ${chalk.green(stats.cacheHitRate.toFixed(2) + '%')}`);
      console.log(`  Cost Saved:       ${chalk.green('$' + stats.totalCostSaved.toFixed(4))}`);
      console.log(`  Avg Hits/Entry:   ${stats.averageHitCount.toFixed(2)}`);
      if (stats.oldestEntry) {
        console.log(`  Oldest Entry:     ${stats.oldestEntry.toISOString()}`);
      }
      if (stats.newestEntry) {
        console.log(`  Newest Entry:     ${stats.newestEntry.toISOString()}`);
      }
    } else if (options.clear) {
      const count = await cacheManager.clearAll();
      console.log(chalk.yellow(`\n🗑️  Cleared ${count} cache entries`));
    } else if (options.clearOld) {
      const days = parseInt(options.clearOld);
      const count = await cacheManager.clearOlderThan(days);
      console.log(chalk.yellow(`\n🗑️  Cleared ${count} entries older than ${days} days`));
    } else {
      console.log(chalk.red('Please specify an option: --stats, --clear, or --clear-old <days>'));
    }

    await repository.disconnect();
  });
```

---

## Testing Strategy

**File:** `src/vision/__tests__/cache.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { VisionCacheManager } from '../cache.js';
import { FlowGuardRepository } from '../../db/repository.js';
import fs from 'fs/promises';
import path from 'path';

describe('VisionCacheManager', () => {
  let cacheManager: VisionCacheManager;
  let repository: FlowGuardRepository;
  const testScreenshotPath = path.join(__dirname, 'fixtures', 'test-screenshot.png');

  beforeAll(async () => {
    repository = new FlowGuardRepository(process.env.MONGODB_TEST_URI!);
    await repository.connect();
    cacheManager = new VisionCacheManager(repository);

    // Create test screenshot
    await fs.writeFile(testScreenshotPath, Buffer.from('fake-png-data'));
  });

  afterAll(async () => {
    await cacheManager.clearAll();
    await repository.disconnect();
    await fs.unlink(testScreenshotPath);
  });

  it('should return null on cache miss', async () => {
    const result = await cacheManager.get(
      testScreenshotPath,
      'Button should be visible',
      'v2.0',
      'claude-3-5-sonnet-20241022'
    );

    expect(result).toBeNull();
  });

  it('should cache and retrieve vision results', async () => {
    const visionResult = {
      verdict: true,
      confidence: 95,
      reasoning: 'Button is visible',
      tokens: { input: 1000, output: 100 },
      cost: 0.0045
    };

    // Cache result
    await cacheManager.set(
      testScreenshotPath,
      'Button should be visible',
      'v2.0',
      'claude-3-5-sonnet-20241022',
      visionResult
    );

    // Retrieve from cache
    const cached = await cacheManager.get(
      testScreenshotPath,
      'Button should be visible',
      'v2.0',
      'claude-3-5-sonnet-20241022'
    );

    expect(cached).not.toBeNull();
    expect(cached!.verdict).toBe(true);
    expect(cached!.confidence).toBe(95);
    expect(cached!.cost).toBe(0.0045);
  });

  it('should miss cache on different prompt version', async () => {
    // Should miss because prompt version changed
    const result = await cacheManager.get(
      testScreenshotPath,
      'Button should be visible',
      'v3.0', // Different version!
      'claude-3-5-sonnet-20241022'
    );

    expect(result).toBeNull();
  });

  it('should track hit count', async () => {
    // First retrieval
    const cached1 = await cacheManager.get(
      testScreenshotPath,
      'Button should be visible',
      'v2.0',
      'claude-3-5-sonnet-20241022'
    );

    const initialHitCount = cached1!.hitCount;

    // Second retrieval
    const cached2 = await cacheManager.get(
      testScreenshotPath,
      'Button should be visible',
      'v2.0',
      'claude-3-5-sonnet-20241022'
    );

    expect(cached2!.hitCount).toBe(initialHitCount + 1);
  });

  it('should calculate statistics correctly', async () => {
    const stats = await cacheManager.getStatistics();

    expect(stats.totalEntries).toBeGreaterThan(0);
    expect(stats.cacheHitRate).toBeGreaterThanOrEqual(0);
    expect(stats.cacheHitRate).toBeLessThanOrEqual(100);
    expect(stats.totalCostSaved).toBeGreaterThanOrEqual(0);
  });

  it('should achieve >80% cache hit rate in simulation', async () => {
    // Simulate 100 test runs
    const assertions = [
      'Login button is visible',
      'Checkout form is present',
      'Navigation menu works'
    ];

    let hits = 0;
    let misses = 0;

    for (let i = 0; i < 100; i++) {
      const assertion = assertions[i % assertions.length];

      const cached = await cacheManager.get(
        testScreenshotPath,
        assertion,
        'v2.0',
        'claude-3-5-sonnet-20241022'
      );

      if (cached) {
        hits++;
      } else {
        misses++;

        // Cache miss - simulate storing result
        await cacheManager.set(
          testScreenshotPath,
          assertion,
          'v2.0',
          'claude-3-5-sonnet-20241022',
          {
            verdict: true,
            confidence: 90,
            reasoning: 'Test',
            tokens: { input: 1000, output: 100 },
            cost: 0.0045
          }
        );
      }
    }

    const hitRate = (hits / (hits + misses)) * 100;
    expect(hitRate).toBeGreaterThanOrEqual(80);
  });
});
```

---

## Acceptance Criteria

- [ ] SHA-256 hashing works correctly for screenshots
- [ ] Cache hit returns 0 cost and instant response
- [ ] Cache miss calls vision API and stores result
- [ ] Prompt version changes invalidate cache
- [ ] TTL index automatically expires old entries after 7 days
- [ ] Hit count tracking works
- [ ] `flowguard cache --stats` shows accurate metrics
- [ ] >80% cache hit rate in tests
- [ ] Cost savings tracked in Phoenix
- [ ] 100% test coverage

---

## Dependencies

**Depends on:**
- Agent A1 (MongoDB Core) - MUST merge first

**Integrates with:**
- Agent A2 (Phoenix) - Uses Phoenix tracing
- All vision-based agents - Provides caching layer

---

## Quick Start

```bash
# Create branch (AFTER A1 merges)
git checkout -b feat/vision-cache-integration

# No new dependencies needed!

# Test caching
npm run build
tsx scripts/test-vision-cache.ts

# View stats
./dist/cli.js cache --stats

# Run tests
npm test src/vision
```

---

## Success Metrics

- ✅ >80% cache hit rate in production
- ✅ 80%+ cost reduction verified
- ✅ <10ms cache lookup latency
- ✅ All Phoenix traces include cache.hit attribute
- ✅ CLI stats command works perfectly
- ✅ 100% test coverage

**This module will save thousands of dollars in API costs!** 💰
