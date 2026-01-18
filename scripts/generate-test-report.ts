#!/usr/bin/env node

/**
 * Test script to generate a sample HTML report using fixture data
 * This demonstrates the report generator working without MongoDB
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateModernReport } from '../src/report/generator.js';
import type { FlowRunResult, CruxMetrics, WoodWideResult } from '../src/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  // Load fixture data
  const fixturePath = path.join(__dirname, '..', 'fixtures', 'sample-test-results.json');
  const fixtureData = JSON.parse(await fs.readFile(fixturePath, 'utf-8'));

  const flowRun: FlowRunResult = fixtureData.checkoutFlow;
  const historicalData: FlowRunResult[] = fixtureData.history;

  // Mock CrUX metrics
  const cruxMetrics: CruxMetrics = {
    lcp: { p75: 1200, rating: 'good' },
    cls: { p75: 0.05, rating: 'good' },
    inp: { p75: 150, rating: 'good' },
  };

  // Mock Wood Wide insights
  const woodWideInsights: WoodWideResult = {
    significant: true,
    confidence: 0.95,
    interpretation: 'The checkout flow improvements show a statistically significant 15% increase in success rate with 95% confidence. This improvement is likely due to better mobile button visibility.',
  };

  // Generate report
  console.log('Generating HTML report from fixture data...');
  const html = generateModernReport(flowRun, {
    historicalData,
    cruxMetrics,
    woodWideInsights,
  });

  // Check file size
  const sizeKB = Buffer.byteLength(html, 'utf-8') / 1024;
  console.log(`Report size: ${sizeKB.toFixed(2)} KB`);

  if (sizeKB >= 100) {
    console.warn('⚠️  Warning: Report size exceeds 100KB target');
  } else {
    console.log('✅ Report size is under 100KB');
  }

  // Save report
  const outputDir = path.join(__dirname, '..', 'tmp', 'reports');
  await fs.mkdir(outputDir, { recursive: true });

  const filename = `test-report-${Date.now()}.html`;
  const filepath = path.join(outputDir, filename);

  await fs.writeFile(filepath, html, 'utf-8');

  console.log(`✅ Report saved to: ${filepath}`);
  console.log(`\nOpen in browser: file://${filepath}`);
}

main().catch((error) => {
  console.error('Failed to generate test report:', error);
  process.exit(1);
});

