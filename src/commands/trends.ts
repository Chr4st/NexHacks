import { Command } from 'commander';
import { FlowGuardRepository } from '../db/repository.js';
import { db } from '../db/client.js';

/**
 * Create trends command for CLI
 */
export function createTrendsCommand(): Command {
  const command = new Command('trends');

  command
    .description('Show historical success rate trends for a flow')
    .argument('<flow-name>', 'Flow name to analyze')
    .option('--days <n>', 'Number of days to analyze', '30')
    .option('--format <format>', 'Output format: pretty|json', 'pretty')
    .option('--env <env>', 'Filter by environment: local|ci|production')
    .action(async (flowName: string, options: {
      days?: string;
      format?: string;
      env?: string;
    }) => {
      try {
        const daysBack = parseInt(options.days || '30', 10);
        const format = (options.format || 'pretty') as 'pretty' | 'json';

        if (isNaN(daysBack) || daysBack < 1 || daysBack > 365) {
          if (format === 'json') {
            console.error(JSON.stringify({ error: 'Days must be between 1 and 365' }));
          } else {
            console.error('Error: Days must be between 1 and 365');
          }
          process.exit(1);
        }

        // Get database connection
        const database = await db.connect();
        const repository = new FlowGuardRepository(database);

        // Fetch trend data from MongoDB
        const trendData = await repository.getSuccessRateTrend(flowName, daysBack);

        if (trendData.length === 0) {
          if (format === 'json') {
            console.log(JSON.stringify({
              flowName,
              daysBack,
              message: `No data found for flow "${flowName}" in the last ${daysBack} days`,
              trends: []
            }));
          } else {
            console.log(`⚠️  No data found for flow "${flowName}" in the last ${daysBack} days`);
          }
          process.exit(0);
        }

        // Calculate overall stats
        const totalRuns = trendData.reduce((sum, day) => sum + (day.totalRuns || 0), 0);
        // Calculate successful runs from success rate
        const successfulRuns = Math.round(
          trendData.reduce((sum, day) => {
            const dayRuns = day.totalRuns || 0;
            const daySuccessRate = day.successRate || 0;
            return sum + (dayRuns * daySuccessRate / 100);
          }, 0)
        );
        const overallSuccessRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0;

        // Format output
        if (format === 'json') {
          const output = {
            flowName,
            daysBack,
            overallSuccessRate: parseFloat(overallSuccessRate.toFixed(2)),
            totalRuns,
            successfulRuns,
            failedRuns: totalRuns - successfulRuns,
            dailyTrends: trendData.map(day => {
              const runs = day.totalRuns || 0;
              const successRate = day.successRate || 0;
              const successful = Math.round(runs * successRate / 100);
              return {
                date: day.date,
                successRate: parseFloat(successRate.toFixed(2)),
                runs,
                successful,
                failed: runs - successful,
                avgDuration: day.avgDuration ? parseFloat(day.avgDuration.toFixed(2)) : 0,
                avgConfidence: day.avgConfidence ? parseFloat(day.avgConfidence.toFixed(2)) : 0,
              };
            })
          };
          console.log(JSON.stringify(output, null, 2));
        } else {
          // Pretty output
          console.log(`\n📊 Trend Analysis: ${flowName}`);
          console.log(`Last ${daysBack} days\n`);

          console.log('Overall Statistics:');
          console.log(`  Success Rate: ${overallSuccessRate.toFixed(2)}%`);
          console.log(`  Total Runs:   ${totalRuns}`);
          console.log(`  Successful:   ${successfulRuns}`);
          console.log(`  Failed:       ${totalRuns - successfulRuns}\n`);

          // Daily breakdown
          console.log('Daily Breakdown:');
          console.log('Date       | Runs | Success Rate | Avg Duration | Avg Confidence');
          console.log('-----------|------|--------------|--------------|---------------');
          
          trendData.forEach(day => {
            const successRate = day.successRate || 0;
            const date = day.date.substring(5); // Remove year for compact display
            const runs = day.totalRuns || 0;
            const duration = day.avgDuration ? `${(day.avgDuration / 1000).toFixed(1)}s` : 'N/A';
            const confidence = day.avgConfidence ? `${day.avgConfidence.toFixed(1)}%` : 'N/A';
            
            console.log(
              `${date.padEnd(10)} | ${runs.toString().padStart(4)} | ${successRate.toFixed(1).padStart(11)}% | ${duration.padStart(12)} | ${confidence.padStart(13)}`
            );
          });

          // Trend indicator
          if (trendData.length >= 2) {
            const recent = trendData[trendData.length - 1]!;
            const previous = trendData[trendData.length - 2]!;
            const recentRate = recent.successRate || 0;
            const previousRate = previous.successRate || 0;
            const trend = recentRate - previousRate;

            console.log('');
            if (trend > 5) {
              console.log(`📈 Trending up: +${trend.toFixed(1)}% vs previous day`);
            } else if (trend < -5) {
              console.log(`📉 Trending down: ${trend.toFixed(1)}% vs previous day`);
            } else {
              console.log(`➡️  Stable: ${trend.toFixed(1)}% change vs previous day`);
            }
          }
        }
      } catch (error) {
        const format = (options.format || 'pretty') as 'pretty' | 'json';
        if (format === 'json') {
          console.error(JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
            code: 1
          }));
        } else {
          console.error(`❌ Error fetching trends: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        process.exit(1);
      }
    });

  return command;
}

