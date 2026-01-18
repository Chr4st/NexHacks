#!/usr/bin/env tsx
/**
 * Run an A/B test comparing two prompt versions.
 *
 * Usage:
 *   tsx scripts/run_ab_test.ts --control v1.0 --variant v2.0 --dataset benchmarks/dataset.json
 */

import { program } from 'commander';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { PromptOptimizer, DEFAULT_PROMPT_V1, IMPROVED_PROMPT_V2 } from '../src/tracing/phoenix-eval.js';
import { DatasetManager } from '../src/tracing/dataset.js';
import { PhoenixClient } from '../src/tracing/phoenix-client.js';
import { FlowGuardRepository } from '../src/db/repository.js';
import Anthropic from '@anthropic-ai/sdk';

program
  .option('--control <version>', 'Control prompt version', 'v1.0')
  .option('--variant <version>', 'Variant prompt version', 'v2.0')
  .option('--dataset <path>', 'Dataset path', 'benchmarks/dataset.json')
  .option('--sample-size <n>', 'Number of examples to test', '20')
  .parse();

const options = program.opts();

async function main() {
  console.log('🧪 Running A/B Test');
  console.log(`  Control: ${options.control}`);
  console.log(`  Variant: ${options.variant}`);
  console.log(`  Dataset: ${options.dataset}`);

  // Start in-memory MongoDB
  console.log('\n🔧 Starting MongoDB Memory Server...');
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  try {
    // Initialize clients
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('❌ Error: ANTHROPIC_API_KEY environment variable not set');
      process.exit(1);
    }

    const anthropic = new Anthropic({ apiKey });
    const phoenix = new PhoenixClient(process.env.PHOENIX_ENDPOINT || 'http://localhost:6006');
    const repository = new FlowGuardRepository(mongoUri);
    await repository.connect();

    const datasetManager = new DatasetManager(options.dataset);

    const optimizer = new PromptOptimizer(anthropic, phoenix, repository, datasetManager);

    // Load dataset
    const dataset = await datasetManager.load();
    const sampleSize = parseInt(options.sampleSize);
    const sample = dataset.examples.slice(0, sampleSize);

    console.log(`\n📊 Testing ${sample.length} examples...`);

    // Run experiment
    const result = await optimizer.runExperiment({
      name: `ab_test_${options.control}_vs_${options.variant}`,
      description: `Compare ${options.control} and ${options.variant}`,
      promptVersions: {
        control: options.control === 'v1.0' ? DEFAULT_PROMPT_V1 : IMPROVED_PROMPT_V2,
        variant: options.variant === 'v2.0' ? IMPROVED_PROMPT_V2 : DEFAULT_PROMPT_V1
      },
      dataset: sample,
      model: 'claude-3-5-sonnet-20241022',
      traceProject: 'flowguard-ab-tests'
    });

    // Print results
    console.log('\n✅ Experiment Complete!');
    console.log(`\n📈 Results:`);
    console.log(`  Control (${options.control}):`);
    console.log(`    Accuracy:  ${(result.control.accuracy * 100).toFixed(2)}%`);
    console.log(`    Precision: ${(result.control.precision * 100).toFixed(2)}%`);
    console.log(`    Avg Cost:  $${result.control.avgCost.toFixed(4)}`);
    console.log(`    Avg Tokens: ${Math.round(result.control.avgTokens)}`);

    console.log(`\n  Variant (${options.variant}):`);
    console.log(`    Accuracy:  ${(result.variant.accuracy * 100).toFixed(2)}%`);
    console.log(`    Precision: ${(result.variant.precision * 100).toFixed(2)}%`);
    console.log(`    Avg Cost:  $${result.variant.avgCost.toFixed(4)}`);
    console.log(`    Avg Tokens: ${Math.round(result.variant.avgTokens)}`);

    console.log(`\n🏆 Winner: ${result.winner.toUpperCase()}`);
    console.log(`   Statistical Significance: ${result.statisticalSignificance.significant ? 'YES' : 'NO'} (p=${result.statisticalSignificance.pValue.toFixed(4)})`);

    console.log(`\n🔗 View traces in Phoenix: http://localhost:6006`);

    // Cleanup
    await repository.disconnect();
    await mongoServer.stop();
  } catch (error) {
    console.error('❌ Error running experiment:', error);
    await mongoServer.stop();
    process.exit(1);
  }
}

main().catch(console.error);
