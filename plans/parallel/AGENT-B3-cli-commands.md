# Agent A3: CLI Commands Enhancement — Detailed Specification

**AI Tool:** Gemini (Free Tier)
**Branch:** `feat/cli-commands-mongodb`
**Priority:** P1
**Developer:** Team A (Developer 1)
**Dependencies:** MongoDB Core (Agent A1) - Must wait for A1 to merge
**Estimated Effort:** 1-2 days

---

## Mission

Enhance the FlowGuard CLI with **MongoDB-powered analytics commands** that provide:

1. **Historical trend analysis** for flow success rates
2. **Full-text search** across flows using Atlas Search
3. **Cost analytics** with time-range filtering
4. **Agent-native JSON output** for all commands
5. **Environment validation** before running commands

This module adds developer-friendly CLI commands that showcase FlowGuard's MongoDB integration and make the tool immediately useful for hackathon demos.

---

## File Structure

```
src/
├── cli.ts                       # Main CLI entry point (MODIFY)
├── config.ts                    # Environment validation (MODIFY)
├── commands/
│   ├── trends.ts                # Historical success rate trends
│   ├── search.ts                # Atlas Search integration
│   ├── costs.ts                 # Cost analytics
│   ├── index.ts                 # Export all commands
│   └── __tests__/
│       ├── trends.test.ts
│       ├── search.test.ts
│       └── costs.test.ts
```

---

## Core Deliverables

### 1. Trends Command

**File:** `src/commands/trends.ts`

**Objective:** Show historical success rate trends for a flow

**CLI Signature:**
```bash
flowguard trends <flow-name> [options]

Options:
  --days <n>         Number of days to analyze (default: 30)
  --format <format>  Output format: pretty|json (default: pretty)
  --env <env>        Filter by environment: local|ci|production (default: all)
```

**Implementation:**
```typescript
import { Command } from 'commander';
import { FlowGuardRepository } from '../db/repository.js';
import chalk from 'chalk';
import Table from 'cli-table3';

export function createTrendsCommand(repository: FlowGuardRepository): Command {
  const command = new Command('trends');

  command
    .description('Show historical success rate trends for a flow')
    .argument('<flow-name>', 'Flow name to analyze')
    .option('--days <n>', 'Number of days to analyze', '30')
    .option('--format <format>', 'Output format: pretty|json', 'pretty')
    .option('--env <env>', 'Filter by environment: local|ci|production')
    .action(async (flowName: string, options) => {
      try {
        const daysBack = parseInt(options.days);
        const environment = options.env as 'local' | 'ci' | 'production' | undefined;

        // Fetch trend data from MongoDB
        const trendData = await repository.getSuccessRateTrend(flowName, daysBack, environment);

        if (trendData.length === 0) {
          console.log(chalk.yellow(`⚠️  No data found for flow "${flowName}" in the last ${daysBack} days`));
          process.exit(1);
        }

        // Calculate overall stats
        const totalRuns = trendData.reduce((sum, day) => sum + day.totalRuns, 0);
        const totalPassed = trendData.reduce((sum, day) => sum + day.passedRuns, 0);
        const overallSuccessRate = (totalPassed / totalRuns) * 100;

        // Format output
        if (options.format === 'json') {
          const output = {
            flowName,
            daysBack,
            environment: environment || 'all',
            overallSuccessRate: parseFloat(overallSuccessRate.toFixed(2)),
            totalRuns,
            totalPassed,
            dailyTrends: trendData.map(day => ({
              date: day.date,
              successRate: parseFloat(((day.passedRuns / day.totalRuns) * 100).toFixed(2)),
              runs: day.totalRuns,
              passed: day.passedRuns,
              failed: day.failedRuns,
              avgDuration: day.avgDuration,
              avgCost: parseFloat(day.avgCost.toFixed(4))
            }))
          };
          console.log(JSON.stringify(output, null, 2));
        } else {
          // Pretty table output
          console.log(chalk.bold(`\n📊 Trend Analysis: ${flowName}`));
          console.log(chalk.dim(`Environment: ${environment || 'all'} | Last ${daysBack} days\n`));

          console.log(chalk.bold('Overall Statistics:'));
          console.log(`  Success Rate: ${chalk.green(overallSuccessRate.toFixed(2) + '%')}`);
          console.log(`  Total Runs:   ${totalRuns}`);
          console.log(`  Passed:       ${chalk.green(totalPassed)}`);
          console.log(`  Failed:       ${chalk.red(totalRuns - totalPassed)}\n`);

          // Daily breakdown table
          const table = new Table({
            head: ['Date', 'Runs', 'Success Rate', 'Avg Duration', 'Avg Cost'],
            colWidths: [12, 8, 15, 15, 12]
          });

          trendData.forEach(day => {
            const successRate = (day.passedRuns / day.totalRuns) * 100;
            const rateColor = successRate >= 90 ? chalk.green : successRate >= 70 ? chalk.yellow : chalk.red;

            table.push([
              day.date,
              day.totalRuns.toString(),
              rateColor(`${successRate.toFixed(1)}%`),
              `${day.avgDuration.toFixed(2)}s`,
              `$${day.avgCost.toFixed(4)}`
            ]);
          });

          console.log(table.toString());

          // Trend indicator
          if (trendData.length >= 2) {
            const recentRate = (trendData[trendData.length - 1].passedRuns / trendData[trendData.length - 1].totalRuns) * 100;
            const previousRate = (trendData[trendData.length - 2].passedRuns / trendData[trendData.length - 2].totalRuns) * 100;
            const trend = recentRate - previousRate;

            if (trend > 5) {
              console.log(chalk.green(`\n📈 Trending up: +${trend.toFixed(1)}% vs yesterday`));
            } else if (trend < -5) {
              console.log(chalk.red(`\n📉 Trending down: ${trend.toFixed(1)}% vs yesterday`));
            } else {
              console.log(chalk.dim(`\n➡️  Stable: ${trend.toFixed(1)}% change vs yesterday`));
            }
          }
        }
      } catch (error) {
        console.error(chalk.red(`❌ Error fetching trends: ${error instanceof Error ? error.message : 'Unknown error'}`));
        process.exit(1);
      }
    });

  return command;
}
```

**MongoDB Repository Method (add to Agent A1's repository):**
```typescript
// Add to src/db/repository.ts
export interface TrendDataPoint {
  date: string; // YYYY-MM-DD
  totalRuns: number;
  passedRuns: number;
  failedRuns: number;
  avgDuration: number;
  avgCost: number;
}

export class FlowGuardRepository {
  // ... existing methods ...

  async getSuccessRateTrend(
    flowName: string,
    daysBack: number,
    environment?: 'local' | 'ci' | 'production'
  ): Promise<TrendDataPoint[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const matchStage: any = {
      'metadata.flowName': flowName,
      timestamp: { $gte: startDate }
    };

    if (environment) {
      matchStage['metadata.environment'] = environment;
    }

    const results = await this.db.collection('test_results').aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          totalRuns: { $sum: 1 },
          passedRuns: { $sum: { $cond: ['$measurements.passed', 1, 0] } },
          failedRuns: { $sum: { $cond: ['$measurements.passed', 0, 1] } },
          avgDuration: { $avg: '$measurements.duration' },
          avgCost: { $avg: '$measurements.totalCost' }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    return results.map(r => ({
      date: r._id,
      totalRuns: r.totalRuns,
      passedRuns: r.passedRuns,
      failedRuns: r.failedRuns,
      avgDuration: r.avgDuration,
      avgCost: r.avgCost
    }));
  }
}
```

---

### 2. Search Command

**File:** `src/commands/search.ts`

**Objective:** Full-text search across flow definitions using MongoDB Atlas Search

**CLI Signature:**
```bash
flowguard search <query> [options]

Options:
  --limit <n>        Max results to return (default: 10)
  --format <format>  Output format: pretty|json (default: pretty)
```

**Implementation:**
```typescript
import { Command } from 'commander';
import { FlowGuardRepository } from '../db/repository.js';
import chalk from 'chalk';
import Table from 'cli-table3';

export function createSearchCommand(repository: FlowGuardRepository): Command {
  const command = new Command('search');

  command
    .description('Search flow definitions by intent, steps, or assertions')
    .argument('<query>', 'Search query (e.g., "checkout", "login button")')
    .option('--limit <n>', 'Max results to return', '10')
    .option('--format <format>', 'Output format: pretty|json', 'pretty')
    .action(async (query: string, options) => {
      try {
        const limit = parseInt(options.limit);

        // Use Atlas Search
        const results = await repository.searchFlows(query, limit);

        if (results.length === 0) {
          console.log(chalk.yellow(`⚠️  No flows found matching "${query}"`));
          process.exit(0);
        }

        if (options.format === 'json') {
          const output = {
            query,
            totalResults: results.length,
            flows: results.map(r => ({
              name: r.name,
              description: r.description,
              steps: r.steps.length,
              lastRun: r.lastRun,
              successRate: r.successRate,
              score: r.score
            }))
          };
          console.log(JSON.stringify(output, null, 2));
        } else {
          console.log(chalk.bold(`\n🔍 Search Results: "${query}"`));
          console.log(chalk.dim(`Found ${results.length} flows\n`));

          const table = new Table({
            head: ['Flow Name', 'Description', 'Steps', 'Success Rate', 'Score'],
            colWidths: [25, 40, 8, 15, 8]
          });

          results.forEach(flow => {
            const rateColor = flow.successRate >= 90 ? chalk.green : flow.successRate >= 70 ? chalk.yellow : chalk.red;

            table.push([
              chalk.bold(flow.name),
              flow.description.substring(0, 37) + (flow.description.length > 37 ? '...' : ''),
              flow.steps.length.toString(),
              rateColor(`${flow.successRate.toFixed(1)}%`),
              flow.score.toFixed(2)
            ]);
          });

          console.log(table.toString());

          console.log(chalk.dim(`\n💡 Tip: Use --format json for machine-readable output`));
        }
      } catch (error) {
        console.error(chalk.red(`❌ Error searching flows: ${error instanceof Error ? error.message : 'Unknown error'}`));
        process.exit(1);
      }
    });

  return command;
}
```

**MongoDB Repository Method:**
```typescript
// Add to src/db/repository.ts
export interface FlowSearchResult {
  name: string;
  description: string;
  steps: Array<{ action: string; assertion: string }>;
  lastRun: Date | null;
  successRate: number;
  score: number; // Atlas Search relevance score
}

export class FlowGuardRepository {
  // ... existing methods ...

  async searchFlows(query: string, limit: number): Promise<FlowSearchResult[]> {
    // Atlas Search requires a search index on the flows collection
    // Index name: "flow_search"
    // Fields: name (text), description (text), steps.assertion (text)

    const results = await this.db.collection('flows').aggregate([
      {
        $search: {
          index: 'flow_search',
          text: {
            query,
            path: ['name', 'description', 'steps.assertion'],
            fuzzy: { maxEdits: 1 }
          }
        }
      },
      {
        $limit: limit
      },
      {
        $lookup: {
          from: 'test_results',
          let: { flowName: '$name' },
          pipeline: [
            { $match: { $expr: { $eq: ['$metadata.flowName', '$$flowName'] } } },
            { $sort: { timestamp: -1 } },
            { $limit: 10 }
          ],
          as: 'recentRuns'
        }
      },
      {
        $addFields: {
          score: { $meta: 'searchScore' },
          lastRun: { $max: '$recentRuns.timestamp' },
          successRate: {
            $cond: {
              if: { $gt: [{ $size: '$recentRuns' }, 0] },
              then: {
                $multiply: [
                  {
                    $divide: [
                      { $size: { $filter: { input: '$recentRuns', cond: '$$this.measurements.passed' } } },
                      { $size: '$recentRuns' }
                    ]
                  },
                  100
                ]
              },
              else: 0
            }
          }
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          steps: 1,
          lastRun: 1,
          successRate: 1,
          score: 1
        }
      }
    ]).toArray();

    return results as FlowSearchResult[];
  }
}
```

**Atlas Search Index Setup (Document in README):**
```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "name": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "description": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "steps": {
        "type": "document",
        "fields": {
          "assertion": {
            "type": "string",
            "analyzer": "lucene.standard"
          }
        }
      }
    }
  }
}
```

---

### 3. Costs Command

**File:** `src/commands/costs.ts`

**Objective:** Analyze AI costs by flow and time range

**CLI Signature:**
```bash
flowguard costs [options]

Options:
  --start <date>     Start date (ISO format or relative, e.g., "7d ago")
  --end <date>       End date (ISO format, default: now)
  --flow <name>      Filter by flow name (optional)
  --group-by <unit>  Group by: day|week|month|flow (default: flow)
  --format <format>  Output format: pretty|json (default: pretty)
```

**Implementation:**
```typescript
import { Command } from 'commander';
import { FlowGuardRepository } from '../db/repository.js';
import chalk from 'chalk';
import Table from 'cli-table3';

export function createCostsCommand(repository: FlowGuardRepository): Command {
  const command = new Command('costs');

  command
    .description('Analyze AI costs by flow and time range')
    .option('--start <date>', 'Start date (ISO or relative like "7d")', '30d')
    .option('--end <date>', 'End date (ISO format)', new Date().toISOString())
    .option('--flow <name>', 'Filter by flow name')
    .option('--group-by <unit>', 'Group by: day|week|month|flow', 'flow')
    .option('--format <format>', 'Output format: pretty|json', 'pretty')
    .action(async (options) => {
      try {
        // Parse dates
        const endDate = new Date(options.end);
        const startDate = parseRelativeDate(options.start);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.error(chalk.red('❌ Invalid date format'));
          process.exit(1);
        }

        // Fetch cost data
        const costData = await repository.getCostAnalysis(
          startDate,
          endDate,
          options.flow,
          options.groupBy as 'day' | 'week' | 'month' | 'flow'
        );

        if (costData.length === 0) {
          console.log(chalk.yellow('⚠️  No cost data found for the specified time range'));
          process.exit(0);
        }

        // Calculate totals
        const totalCost = costData.reduce((sum, item) => sum + item.totalCost, 0);
        const totalTokens = costData.reduce((sum, item) => sum + item.totalTokens, 0);
        const totalRuns = costData.reduce((sum, item) => sum + item.runs, 0);

        if (options.format === 'json') {
          const output = {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            groupBy: options.groupBy,
            flowFilter: options.flow || null,
            summary: {
              totalCost: parseFloat(totalCost.toFixed(4)),
              totalTokens,
              totalRuns,
              avgCostPerRun: parseFloat((totalCost / totalRuns).toFixed(4))
            },
            breakdown: costData.map(item => ({
              label: item.label,
              runs: item.runs,
              totalCost: parseFloat(item.totalCost.toFixed(4)),
              totalTokens: item.totalTokens,
              avgCostPerRun: parseFloat(item.avgCostPerRun.toFixed(4)),
              avgTokensPerRun: Math.round(item.avgTokensPerRun)
            }))
          };
          console.log(JSON.stringify(output, null, 2));
        } else {
          console.log(chalk.bold(`\n💰 Cost Analysis`));
          console.log(chalk.dim(`${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`));
          if (options.flow) {
            console.log(chalk.dim(`Flow: ${options.flow}`));
          }
          console.log();

          console.log(chalk.bold('Summary:'));
          console.log(`  Total Cost:     ${chalk.green('$' + totalCost.toFixed(4))}`);
          console.log(`  Total Tokens:   ${totalTokens.toLocaleString()}`);
          console.log(`  Total Runs:     ${totalRuns}`);
          console.log(`  Avg Cost/Run:   $${(totalCost / totalRuns).toFixed(4)}\n`);

          // Breakdown table
          const table = new Table({
            head: ['Label', 'Runs', 'Total Cost', 'Avg Cost/Run', 'Tokens'],
            colWidths: [30, 8, 15, 15, 12]
          });

          costData.forEach(item => {
            table.push([
              item.label,
              item.runs.toString(),
              chalk.green(`$${item.totalCost.toFixed(4)}`),
              `$${item.avgCostPerRun.toFixed(4)}`,
              Math.round(item.avgTokensPerRun).toLocaleString()
            ]);
          });

          console.log(table.toString());

          // Cost insights
          const mostExpensive = costData.reduce((max, item) => item.totalCost > max.totalCost ? item : max);
          console.log(chalk.yellow(`\n💡 Most expensive: ${mostExpensive.label} ($${mostExpensive.totalCost.toFixed(4)})`));
        }
      } catch (error) {
        console.error(chalk.red(`❌ Error fetching costs: ${error instanceof Error ? error.message : 'Unknown error'}`));
        process.exit(1);
      }
    });

  return command;
}

function parseRelativeDate(input: string): Date {
  // Parse relative dates like "7d", "30d", "1w", "2m"
  const match = input.match(/^(\d+)([dwm])$/);
  if (match) {
    const amount = parseInt(match[1]);
    const unit = match[2];

    const date = new Date();
    if (unit === 'd') {
      date.setDate(date.getDate() - amount);
    } else if (unit === 'w') {
      date.setDate(date.getDate() - amount * 7);
    } else if (unit === 'm') {
      date.setMonth(date.getMonth() - amount);
    }
    return date;
  }

  // Try parsing as ISO date
  return new Date(input);
}
```

**MongoDB Repository Method:**
```typescript
// Add to src/db/repository.ts
export interface CostAnalysisItem {
  label: string; // Flow name or date depending on groupBy
  runs: number;
  totalCost: number;
  totalTokens: number;
  avgCostPerRun: number;
  avgTokensPerRun: number;
}

export class FlowGuardRepository {
  // ... existing methods ...

  async getCostAnalysis(
    startDate: Date,
    endDate: Date,
    flowName?: string,
    groupBy: 'day' | 'week' | 'month' | 'flow' = 'flow'
  ): Promise<CostAnalysisItem[]> {
    const matchStage: any = {
      timestamp: { $gte: startDate, $lte: endDate }
    };

    if (flowName) {
      matchStage['metadata.flowName'] = flowName;
    }

    let groupIdExpression: any;
    if (groupBy === 'flow') {
      groupIdExpression = '$metadata.flowName';
    } else if (groupBy === 'day') {
      groupIdExpression = { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } };
    } else if (groupBy === 'week') {
      groupIdExpression = { $dateToString: { format: '%Y-W%V', date: '$timestamp' } };
    } else if (groupBy === 'month') {
      groupIdExpression = { $dateToString: { format: '%Y-%m', date: '$timestamp' } };
    }

    const results = await this.db.collection('test_results').aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupIdExpression,
          runs: { $sum: 1 },
          totalCost: { $sum: '$measurements.totalCost' },
          totalTokens: { $sum: '$measurements.totalTokens' }
        }
      },
      {
        $addFields: {
          avgCostPerRun: { $divide: ['$totalCost', '$runs'] },
          avgTokensPerRun: { $divide: ['$totalTokens', '$runs'] }
        }
      },
      { $sort: { totalCost: -1 } }
    ]).toArray();

    return results.map(r => ({
      label: r._id,
      runs: r.runs,
      totalCost: r.totalCost,
      totalTokens: r.totalTokens,
      avgCostPerRun: r.avgCostPerRun,
      avgTokensPerRun: r.avgTokensPerRun
    }));
  }
}
```

---

### 4. Environment Validation

**File:** `src/config.ts` (MODIFY)

**Objective:** Validate required environment variables before running commands

**Implementation:**
```typescript
import { z } from 'zod';
import chalk from 'chalk';

const ConfigSchema = z.object({
  MONGODB_URI: z.string().url('Invalid MongoDB URI'),
  ANTHROPIC_API_KEY: z.string().min(10, 'Invalid Anthropic API key'),
  PHOENIX_ENDPOINT: z.string().url('Invalid Phoenix endpoint').optional(),
  DO_SPACES_KEY: z.string().optional(),
  DO_SPACES_SECRET: z.string().optional(),
  BROWSERBASE_API_KEY: z.string().optional()
});

export type Config = z.infer<typeof ConfigSchema>;

export function validateConfig(): Config {
  try {
    return ConfigSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(chalk.red('❌ Configuration Error:'));
      error.errors.forEach(err => {
        console.error(chalk.red(`  - ${err.path.join('.')}: ${err.message}`));
      });
      console.error(chalk.dim('\n💡 Make sure you have a .env file with all required variables.'));
      console.error(chalk.dim('   See plans/TECHNICAL_REQUIREMENTS.md for setup instructions.\n'));
      process.exit(1);
    }
    throw error;
  }
}

export function getConfig(): Config {
  return validateConfig();
}
```

---

### 5. Update Main CLI Entry Point

**File:** `src/cli.ts` (MODIFY)

**Changes:**
```typescript
#!/usr/bin/env node

import { Command } from 'commander';
import { validateConfig } from './config.js';
import { FlowGuardRepository } from './db/repository.js';
import { createTrendsCommand } from './commands/trends.js';
import { createSearchCommand } from './commands/search.js';
import { createCostsCommand } from './commands/costs.js';
import chalk from 'chalk';

const program = new Command();

program
  .name('flowguard')
  .description('AI-native UX testing platform')
  .version('1.0.0');

// Validate environment before running any command
program.hook('preAction', () => {
  validateConfig();
});

// Initialize MongoDB repository
const config = validateConfig();
const repository = new FlowGuardRepository(config.MONGODB_URI);

// Register commands
program.addCommand(createTrendsCommand(repository));
program.addCommand(createSearchCommand(repository));
program.addCommand(createCostsCommand(repository));

// ... existing commands (manual, run, etc.) ...

program.parse();
```

---

## Testing Strategy

**File:** `src/commands/__tests__/trends.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { FlowGuardRepository } from '../../db/repository.js';
import { createTrendsCommand } from '../trends.js';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

describe('Trends Command', () => {
  let repository: FlowGuardRepository;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/flowguard_test';
    repository = new FlowGuardRepository(mongoUri);
    await repository.connect();

    // Seed test data
    await seedTrendData(repository);
  });

  afterAll(async () => {
    await repository.disconnect();
  });

  it('should return trend data in JSON format', async () => {
    const { stdout } = await execAsync('flowguard trends test-flow --days 7 --format json');
    const output = JSON.parse(stdout);

    expect(output.flowName).toBe('test-flow');
    expect(output.daysBack).toBe(7);
    expect(output.dailyTrends).toBeInstanceOf(Array);
    expect(output.overallSuccessRate).toBeGreaterThanOrEqual(0);
  });

  it('should filter by environment', async () => {
    const trendData = await repository.getSuccessRateTrend('test-flow', 30, 'ci');
    expect(trendData.every(day => day.totalRuns > 0)).toBe(true);
  });

  it('should handle non-existent flows gracefully', async () => {
    try {
      await execAsync('flowguard trends non-existent-flow --format json');
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.code).toBe(1);
    }
  });
});

async function seedTrendData(repository: FlowGuardRepository) {
  const testResults = [];
  const now = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    for (let j = 0; j < 5; j++) {
      testResults.push({
        timestamp: date,
        metadata: {
          flowName: 'test-flow',
          environment: i % 3 === 0 ? 'ci' : 'local',
          viewport: '1920x1080',
          browser: 'chromium'
        },
        measurements: {
          passed: Math.random() > 0.2, // 80% pass rate
          totalSteps: 5,
          failedSteps: 0,
          duration: 1200 + Math.random() * 500,
          avgConfidence: 85 + Math.random() * 10,
          totalTokens: 5000 + Math.random() * 1000,
          totalCost: 0.05 + Math.random() * 0.02
        },
        steps: []
      });
    }
  }

  await repository.db.collection('test_results').insertMany(testResults);
}
```

---

## Package Dependencies

**Add to `package.json`:**
```json
{
  "dependencies": {
    "commander": "^11.1.0",
    "chalk": "^5.3.0",
    "cli-table3": "^0.6.3",
    "zod": "^3.22.4"
  }
}
```

---

## Acceptance Criteria

- [ ] `flowguard trends <flow>` displays historical success rate
- [ ] `flowguard search <query>` uses Atlas Search to find flows
- [ ] `flowguard costs` shows cost breakdown by flow or time
- [ ] All commands support `--format json` for agent-native output
- [ ] Environment validation catches missing API keys
- [ ] Unit tests pass with 100% coverage
- [ ] Pretty table output is readable and color-coded
- [ ] Documentation complete in README

---

## Dependencies

**Depends on:**
- Agent A1 (MongoDB Core) - MUST merge first

**Provides interfaces for:**
- Agent A4 (HTML Reports) - Can query same repository methods
- Agent B1 (Vision Cache) - Uses same MongoDB client

---

## Integration Notes

**Atlas Search Index Setup:**

Before the `search` command works, you need to create an Atlas Search index:

1. Go to MongoDB Atlas → Database → Search
2. Create Index on `flows` collection
3. Use the JSON definition from the `search.ts` file above
4. Name it `flow_search`

**CLI Usage Examples:**
```bash
# View trends
flowguard trends checkout-flow --days 30 --env ci

# Search flows
flowguard search "login button" --limit 5

# Analyze costs
flowguard costs --start 7d --group-by day

# JSON output for automation
flowguard trends signup --format json | jq '.overallSuccessRate'
```

---

## Merge Strategy

**Branch:** `feat/cli-commands-mongodb`

**Merge Order:** After A1 (MongoDB Core)

**Potential Conflicts:**
- `src/cli.ts` - Add new command imports
- `src/config.ts` - Merge validation logic
- `package.json` - Add CLI dependencies

**Resolution:**
- Combine command registrations in `cli.ts`
- Keep both validation functions in `config.ts`
- Merge all dependencies in `package.json`

---

## Quick Start Commands

```bash
# Create branch (AFTER A1 merges)
git checkout main
git pull
git checkout -b feat/cli-commands-mongodb

# Install dependencies
npm install commander chalk cli-table3

# Create Atlas Search index (see integration notes)

# Test commands
npm run build
./dist/cli.js trends test-flow --format json
./dist/cli.js search "checkout"
./dist/cli.js costs --start 7d

# Run tests
npm test src/commands

# Commit and push
git add .
git commit -m "Add MongoDB-powered CLI analytics commands"
git push -u origin feat/cli-commands-mongodb
```

---

## Estimated Timeline

- **Day 1:** Trends + Search commands (4-6 hours)
- **Day 2:** Costs command + Testing (4-6 hours)

**Total:** 1-2 days (perfect for Gemini's code generation strengths)

---

## Success Metrics

- ✅ All 3 commands work with real MongoDB data
- ✅ JSON output validates with Zod schemas
- ✅ Atlas Search returns relevant results
- ✅ Pretty tables are readable and informative
- ✅ Environment validation prevents runtime errors
- ✅ 100% test coverage

This module showcases **FlowGuard's analytics power** for hackathon demos! 🚀
