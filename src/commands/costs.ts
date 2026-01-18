import { Command } from 'commander';
import { FlowGuardRepository } from '../db/repository.js';
import { db } from '../db/client.js';

/**
 * Create costs command for CLI
 */
export function createCostsCommand(): Command {
  const command = new Command('costs');

  command
    .description('Show cost analytics for flow runs')
    .option('--start <date>', 'Start date (YYYY-MM-DD or relative like 7d, 30d)', '30d')
    .option('--end <date>', 'End date (YYYY-MM-DD)', new Date().toISOString().split('T')[0])
    .option('--format <format>', 'Output format: pretty|json', 'pretty')
    .option('--group-by <field>', 'Group by: day|flow|none', 'flow')
    .action(async (options: {
      start?: string;
      end?: string;
      format?: string;
      groupBy?: string;
    }) => {
      try {
        const format = (options.format || 'pretty') as 'pretty' | 'json';
        const groupBy = (options.groupBy || 'flow') as 'day' | 'flow' | 'none';

        // Parse start date
        let startDate: Date;
        if (options.start?.endsWith('d')) {
          const days = parseInt(options.start.slice(0, -1), 10);
          if (isNaN(days) || days < 1) {
            throw new Error('Invalid start date format. Use YYYY-MM-DD or Nd (e.g., 7d, 30d)');
          }
          startDate = new Date();
          startDate.setDate(startDate.getDate() - days);
        } else if (options.start) {
          startDate = new Date(options.start);
          if (isNaN(startDate.getTime())) {
            throw new Error('Invalid start date format. Use YYYY-MM-DD or Nd (e.g., 7d, 30d)');
          }
        } else {
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
        }

        // Parse end date
        const endDate = options.end ? new Date(options.end) : new Date();
        if (isNaN(endDate.getTime())) {
          throw new Error('Invalid end date format. Use YYYY-MM-DD');
        }

        if (startDate > endDate) {
          throw new Error('Start date must be before end date');
        }

        // Get database connection
        const database = await db.connect();
        const repository = new FlowGuardRepository(database);

        // Fetch cost data
        const costData = await repository.getCostByFlow(startDate, endDate);

        if (costData.length === 0) {
          if (format === 'json') {
            console.log(JSON.stringify({
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              totalCost: 0,
              totalRuns: 0,
              flows: []
            }));
          } else {
            console.log(`No cost data found for the period ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
          }
          process.exit(0);
        }

        // Calculate totals
        const totalCost = costData.reduce((sum, flow) => sum + (flow.totalCost || 0), 0);
        const totalRuns = costData.reduce((sum, flow) => sum + (flow.totalRuns || 0), 0);
        const totalTokens = costData.reduce((sum, flow) => sum + (flow.totalTokens || 0), 0);

        // Format output
        if (format === 'json') {
          const output = {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            totalCost: parseFloat(totalCost.toFixed(4)),
            totalRuns,
            totalTokens,
            flows: costData.map(flow => ({
              flowName: (flow._id || 'Unknown') as string,
              totalCost: parseFloat((flow.totalCost || 0).toFixed(4)),
              totalRuns: flow.totalRuns || 0,
              totalTokens: flow.totalTokens || 0,
              avgCostPerRun: flow.totalRuns > 0
                ? parseFloat(((flow.totalCost || 0) / flow.totalRuns).toFixed(4))
                : 0,
            }))
          };
          console.log(JSON.stringify(output, null, 2));
        } else {
          // Pretty output
          console.log(`\n💰 Cost Analytics`);
          console.log(`Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}\n`);

          console.log('Summary:');
          console.log(`  Total Cost:    $${totalCost.toFixed(4)}`);
          console.log(`  Total Runs:    ${totalRuns}`);
          console.log(`  Total Tokens:  ${totalTokens.toLocaleString()}`);
          console.log(`  Avg Cost/Run:  $${totalRuns > 0 ? (totalCost / totalRuns).toFixed(4) : '0.0000'}\n`);

          if (groupBy === 'flow' && costData.length > 0) {
            console.log('By Flow:');
            console.log('Flow Name          | Runs  | Cost      | Tokens    | Avg Cost/Run');
            console.log('-------------------|-------|-----------|-----------|-------------');
            
            costData.forEach(flow => {
              const flowName = ((flow._id || 'Unknown') as string).padEnd(17);
              const runs = (flow.totalRuns || 0).toString().padStart(5);
              const cost = `$${(flow.totalCost || 0).toFixed(4)}`.padStart(9);
              const tokens = (flow.totalTokens || 0).toLocaleString().padStart(9);
              const avgCost = flow.totalRuns > 0
                ? `$${((flow.totalCost || 0) / flow.totalRuns).toFixed(4)}`.padStart(11)
                : '$0.0000'.padStart(11);
              
              console.log(`${flowName} | ${runs} | ${cost} | ${tokens} | ${avgCost}`);
            });
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
          console.error(`❌ Error fetching costs: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        process.exit(1);
      }
    });

  return command;
}

