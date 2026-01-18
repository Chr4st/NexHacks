import { Command } from 'commander';
import { FlowGuardRepository } from '../db/repository.js';
import { db } from '../db/client.js';

/**
 * Create search command for CLI
 */
export function createSearchCommand(): Command {
  const command = new Command('search');

  command
    .description('Search flows by intent, name, or tags')
    .argument('<query>', 'Search query')
    .option('--limit <n>', 'Maximum number of results', '10')
    .option('--format <format>', 'Output format: pretty|json', 'pretty')
    .action(async (query: string, options: {
      limit?: string;
      format?: string;
    }) => {
      try {
        const limit = parseInt(options.limit || '10', 10);
        const format = (options.format || 'pretty') as 'pretty' | 'json';

        if (isNaN(limit) || limit < 1 || limit > 100) {
          if (format === 'json') {
            console.error(JSON.stringify({ error: 'Limit must be between 1 and 100' }));
          } else {
            console.error('Error: Limit must be between 1 and 100');
          }
          process.exit(1);
        }

        if (!query || query.trim().length === 0) {
          if (format === 'json') {
            console.error(JSON.stringify({ error: 'Query cannot be empty' }));
          } else {
            console.error('Error: Query cannot be empty');
          }
          process.exit(1);
        }

        // Get database connection
        const database = await db;
        const repository = new FlowGuardRepository(database);

        // Search flows
        const flows = await repository.searchFlowsByIntent(query);

        if (flows.length === 0) {
          if (format === 'json') {
            console.log(JSON.stringify({
              query,
              results: [],
              message: `No flows found matching "${query}"`
            }));
          } else {
            console.log(`No flows found matching "${query}"`);
          }
          process.exit(0);
        }

        // Format output
        if (format === 'json') {
          const output = {
            query,
            count: flows.length,
            results: flows.map(flow => ({
              id: flow._id.toString(),
              name: flow.name,
              intent: flow.intent,
              url: flow.url,
              viewport: flow.viewport,
              steps: flow.steps.length,
              tags: flow.tags || [],
              createdAt: flow.createdAt.toISOString(),
              updatedAt: flow.updatedAt.toISOString(),
            }))
          };
          console.log(JSON.stringify(output, null, 2));
        } else {
          // Pretty output
          console.log(`\n🔍 Search Results for "${query}"`);
          console.log(`Found ${flows.length} flow(s)\n`);

          flows.forEach((flow, index) => {
            console.log(`${index + 1}. ${flow.name}`);
            console.log(`   Intent: ${flow.intent}`);
            console.log(`   URL: ${flow.url}`);
            console.log(`   Steps: ${flow.steps.length}`);
            if (flow.tags && flow.tags.length > 0) {
              console.log(`   Tags: ${flow.tags.join(', ')}`);
            }
            console.log(`   Created: ${flow.createdAt.toLocaleDateString()}`);
            console.log('');
          });
        }
      } catch (error) {
        const format = (options.format || 'pretty') as 'pretty' | 'json';
        if (format === 'json') {
          console.error(JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
            code: 1
          }));
        } else {
          console.error(`❌ Error searching flows: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        process.exit(1);
      }
    });

  return command;
}

