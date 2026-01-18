#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseFlowFile, discoverFlows } from './parser.js';
import { executeFlow } from './runner.js';
import { analyzeScreenshot } from './vision.js';
import { initTracing, traceFlowRun, traceVisionAnalysis, shutdownTracing } from './tracing.js';
import { getCruxMetrics, formatCruxMetrics } from './metrics.js';
import { saveReport } from './report.js';
import type { FlowRunResult, OutputFormat, Config } from './types.js';
import { ConfigSchema } from './types.js';

const VERSION = '0.1.0';

const program = new Command();

// Output helpers
function output(data: unknown, format: OutputFormat): void {
  if (format === 'json') {
    console.log(JSON.stringify(data, null, 2));
  } else {
    if (typeof data === 'string') {
      console.log(data);
    } else {
      console.log(data);
    }
  }
}

function outputError(message: string, format: OutputFormat, code = 2): never {
  if (format === 'json') {
    console.error(JSON.stringify({ error: message, code }));
  } else {
    console.error(`Error: ${message}`);
  }
  process.exit(code);
}

program
  .name('flowguard')
  .description('AI-native UX testing platform')
  .version(VERSION);

// Init command
program
  .command('init')
  .description('Initialize FlowGuard in the current directory')
  .option('-f, --format <format>', 'Output format (text|json)', 'text')
  .action(async (options: { format: OutputFormat }) => {
    const format = options.format;

    // Create directories
    const flowsDir = './flows';
    const reportsDir = './reports';

    if (!fs.existsSync(flowsDir)) {
      fs.mkdirSync(flowsDir, { recursive: true });
    }
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Create config file
    const config: Config = {
      version: 1,
      flowsDir,
      reportsDir,
    };

    const configPath = './flowguard.config.json';
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Create example flow
    const exampleFlow = `# Example FlowGuard flow
name: example-homepage
intent: "User can see the main headline and find the primary call-to-action"
url: https://example.com
viewport:
  width: 1280
  height: 720
steps:
  - action: screenshot
    assert: "Main headline is visible and CTA button is prominent"
`;

    const examplePath = path.join(flowsDir, 'example.yaml');
    if (!fs.existsSync(examplePath)) {
      fs.writeFileSync(examplePath, exampleFlow);
    }

    // Create .gitignore additions
    const gitignoreContent = `
# FlowGuard
.flowguard/
reports/*.html
`;
    const gitignorePath = './.gitignore';
    if (fs.existsSync(gitignorePath)) {
      const existing = fs.readFileSync(gitignorePath, 'utf-8');
      if (!existing.includes('.flowguard/')) {
        fs.appendFileSync(gitignorePath, gitignoreContent);
      }
    }

    if (format === 'json') {
      output({
        success: true,
        config: configPath,
        flowsDir,
        reportsDir,
        exampleFlow: examplePath,
      }, format);
    } else {
      console.log('FlowGuard initialized successfully!');
      console.log('');
      console.log('Created:');
      console.log(`  ${configPath} - Configuration file`);
      console.log(`  ${flowsDir}/ - Flow definitions directory`);
      console.log(`  ${reportsDir}/ - Report output directory`);
      console.log(`  ${examplePath} - Example flow`);
      console.log('');
      console.log('Next steps:');
      console.log('  1. Edit flows/example.yaml with your URL and intent');
      console.log('  2. Set ANTHROPIC_API_KEY environment variable');
      console.log('  3. Run: flowguard run');
    }
  });

// Run command
program
  .command('run')
  .description('Execute flow tests')
  .argument('[flow]', 'Specific flow file to run (runs all if not specified)')
  .option('-f, --format <format>', 'Output format (text|json)', 'text')
  .option('--no-vision', 'Skip vision analysis (faster, but no UX validation)')
  .option('--no-trace', 'Disable Phoenix tracing')
  .option('--mock', 'Use mock data for APIs (demo mode)')
  .option('-o, --output <dir>', 'Output directory for reports', './reports')
  .action(async (flowArg: string | undefined, options: {
    format: OutputFormat;
    vision: boolean;
    trace: boolean;
    mock: boolean;
    output: string;
  }) => {
    const format = options.format;

    // Find flows to run
    let flowFiles: string[] = [];

    if (flowArg) {
      if (!fs.existsSync(flowArg)) {
        outputError(`Flow file not found: ${flowArg}`, format);
      }
      flowFiles = [flowArg];
    } else {
      // Load config or use defaults
      const configPath = './flowguard.config.json';
      let flowsDir = './flows';

      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, 'utf-8');
        const parsed = ConfigSchema.safeParse(JSON.parse(configContent));
        if (parsed.success) {
          flowsDir = parsed.data.flowsDir;
        }
      }

      flowFiles = discoverFlows(flowsDir);
    }

    if (flowFiles.length === 0) {
      outputError('No flow files found. Run "flowguard init" first.', format);
    }

    // Initialize tracing if enabled
    if (options.trace) {
      initTracing();
    }

    const results: FlowRunResult[] = [];

    for (const flowFile of flowFiles) {
      if (format === 'text') {
        console.log(`\nRunning: ${flowFile}`);
      }

      // Parse flow
      const parseResult = parseFlowFile(flowFile);
      if (!parseResult.success) {
        if (format === 'json') {
          results.push({
            flowName: path.basename(flowFile),
            intent: '',
            url: '',
            viewport: { width: 0, height: 0 },
            verdict: 'error',
            confidence: 0,
            steps: [],
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            durationMs: 0,
          });
        } else {
          console.error(`  Parse error: ${parseResult.error}`);
        }
        continue;
      }

      const flow = parseResult.data;

      // Execute flow with optional tracing
      const runFlow = async (): Promise<FlowRunResult> => {
        const result = await executeFlow(flow, options.output);

        // Run vision analysis on screenshot steps
        if (options.vision) {
          for (const step of result.steps) {
            if (step.action === 'screenshot' && step.screenshotBase64 && step.success) {
              const assertion = flow.steps[step.stepIndex]?.assert;

              const analyze = async () => {
                return analyzeScreenshot(step.screenshotBase64!, flow.intent, assertion);
              };

              if (options.trace) {
                step.analysis = await traceVisionAnalysis(flow.intent, 1000, analyze);
              } else {
                step.analysis = await analyze();
              }

              // Update step success based on analysis
              if (step.analysis.status === 'fail') {
                step.success = false;
              }
            }
          }

          // Calculate overall confidence
          const analyses = result.steps
            .filter((s) => s.analysis && s.analysis.status !== 'error')
            .map((s) => s.analysis!);

          if (analyses.length > 0) {
            const avgConfidence =
              analyses.reduce((sum, a) => sum + ('confidence' in a ? a.confidence : 0), 0) /
              analyses.length;
            result.confidence = Math.round(avgConfidence);
          }

          // Update verdict based on analyses
          const hasFail = result.steps.some((s) => s.analysis?.status === 'fail');
          const hasError = result.steps.some((s) => !s.success || s.analysis?.status === 'error');

          result.verdict = hasError ? 'error' : hasFail ? 'fail' : 'pass';
        }

        return result;
      };

      let flowResult: FlowRunResult;

      if (options.trace) {
        flowResult = await traceFlowRun(flow.name, flow.intent, runFlow);
      } else {
        flowResult = await runFlow();
      }

      results.push(flowResult);

      // Fetch CrUX metrics if available
      const cruxMetrics = await getCruxMetrics(flow.url, options.mock);

      // Generate report
      const reportPath = saveReport(flowResult, options.output, cruxMetrics ?? undefined);

      if (format === 'text') {
        const icon = flowResult.verdict === 'pass' ? '✅' : flowResult.verdict === 'fail' ? '❌' : '⚠️';
        console.log(`  ${icon} ${flowResult.verdict.toUpperCase()} (${flowResult.confidence}% confidence)`);
        console.log(`  Duration: ${flowResult.durationMs}ms`);
        console.log(`  Report: ${reportPath}`);

        if (flowResult.traceId) {
          console.log(`  Trace: ${flowResult.phoenixTraceUrl}`);
        }

        if (cruxMetrics) {
          console.log('');
          console.log(formatCruxMetrics(cruxMetrics));
        }

        // Show issues if failed
        if (flowResult.verdict === 'fail') {
          const failedSteps = flowResult.steps.filter(
            (s) => s.analysis?.status === 'fail'
          );
          for (const step of failedSteps) {
            if (step.analysis?.status === 'fail') {
              console.log('');
              console.log(`  Issues at step ${step.stepIndex + 1}:`);
              for (const issue of step.analysis.issues) {
                console.log(`    - ${issue}`);
              }
            }
          }
        }
      }
    }

    // Shutdown tracing
    if (options.trace) {
      await shutdownTracing();
    }

    // Output JSON results
    if (format === 'json') {
      output({
        success: results.every((r) => r.verdict === 'pass'),
        results,
      }, format);
    } else {
      console.log('');
      const passed = results.filter((r) => r.verdict === 'pass').length;
      const failed = results.filter((r) => r.verdict === 'fail').length;
      const errors = results.filter((r) => r.verdict === 'error').length;

      console.log(`Summary: ${passed} passed, ${failed} failed, ${errors} errors`);
    }

    // Set exit code based on results
    const allPassed = results.every((r) => r.verdict === 'pass');
    process.exit(allPassed ? 0 : 1);
  });

// Report command
program
  .command('report')
  .description('Open or generate reports')
  .option('-f, --format <format>', 'Output format (text|json)', 'text')
  .option('--open', 'Open latest report in browser')
  .option('-l, --list', 'List all reports')
  .action(async (options: { format: OutputFormat; open?: boolean; list?: boolean }) => {
    const format = options.format;
    const reportsDir = './reports';

    if (!fs.existsSync(reportsDir)) {
      outputError('No reports directory found. Run "flowguard run" first.', format);
    }

    const reports = fs.readdirSync(reportsDir)
      .filter((f) => f.endsWith('.html'))
      .map((f) => ({
        name: f,
        path: path.join(reportsDir, f),
        mtime: fs.statSync(path.join(reportsDir, f)).mtime,
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    if (reports.length === 0) {
      outputError('No reports found. Run "flowguard run" first.', format);
    }

    if (options.list) {
      if (format === 'json') {
        output({ reports: reports.map((r) => ({ name: r.name, path: r.path, modified: r.mtime.toISOString() })) }, format);
      } else {
        console.log('Available reports:');
        for (const report of reports) {
          console.log(`  ${report.name} (${report.mtime.toLocaleString()})`);
        }
      }
      return;
    }

    const latest = reports[0];
    if (!latest) {
      outputError('No reports found.', format);
    }

    if (options.open) {
      const { exec } = await import('node:child_process');
      const openCommand = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
      exec(`${openCommand} "${latest.path}"`);

      if (format === 'json') {
        output({ opened: latest.path }, format);
      } else {
        console.log(`Opened: ${latest.path}`);
      }
    } else {
      if (format === 'json') {
        output({ latest: { name: latest.name, path: latest.path, modified: latest.mtime.toISOString() } }, format);
      } else {
        console.log(`Latest report: ${latest.path}`);
        console.log('Use --open to open in browser, or --list to see all reports');
      }
    }
  });

program.parse();
