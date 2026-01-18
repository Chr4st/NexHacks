import { Command } from 'commander';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseFlowFile, discoverFlows } from './parser.js';
import { executeFlow, closeBrowser } from './runner.js';
import { analyzeScreenshot } from './vision.js';
import { initTracing, traceFlowRun, traceVisionAnalysis, shutdownTracing } from './tracing.js';
import { getCruxMetrics, formatCruxMetrics, getWoodWideAnalysis, formatWoodWideAnalysis } from './metrics.js';
import { saveReport } from './report.js';
import type { FlowRunResult, OutputFormat, Config } from './types.js';
import { ConfigSchema } from './types.js';
import { validatePath, validateOutputDirectory, validateInputFile, PathSecurityError } from './security.js';
import { DevSwarm } from './devswarm.js';
import { db } from './db/client.js';
import { FlowGuardRepository } from './db/repository.js';

const VERSION = '0.1.0';

// Cleanup browser pool on exit
async function cleanup(): Promise<void> {
  await closeBrowser();
}

// Handle process exit signals for proper browser cleanup
process.on('SIGINT', async () => {
  await cleanup();
  process.exit(130);
});

process.on('SIGTERM', async () => {
  await cleanup();
  process.exit(143);
});

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

    try {
      // Create directories with path validation
      const flowsDir = './flows';
      const reportsDir = './reports';

      // Validate and create directories within project bounds
      const validatedFlowsDir = validateOutputDirectory(flowsDir);
      validateOutputDirectory(reportsDir); // Creates directory as side effect

      // Create config file
      const config: Config = {
        version: 1,
        flowsDir,
        reportsDir,
      };

      const configPath = validatePath('./flowguard.config.json', { allowNonExistent: true });
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

      const examplePath = validatePath(path.join(validatedFlowsDir, 'example.yaml'), { allowNonExistent: true });
      if (!fs.existsSync(examplePath)) {
        fs.writeFileSync(examplePath, exampleFlow);
      }

      // Create .gitignore additions
      const gitignoreContent = `
# FlowGuard
.flowguard/
reports/*.html
`;
      const gitignorePath = validatePath('./.gitignore', { allowNonExistent: true });
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
    } catch (error) {
      if (error instanceof PathSecurityError) {
        outputError('Invalid path specified', format);
      }
      throw error;
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
  .option('--devswarm', 'Post UX risk feedback to pull request (if in PR)')
  .option('-o, --output <dir>', 'Output directory for reports', './reports')
  .action(async (flowArg: string | undefined, options: {
    format: OutputFormat;
    vision: boolean;
    trace: boolean;
    mock: boolean;
    devswarm: boolean;
    output: string;
  }) => {
    const format = options.format;

    // Validate output directory early
    let validatedOutputDir: string;
    try {
      validatedOutputDir = validateOutputDirectory(options.output);
    } catch (error) {
      if (error instanceof PathSecurityError) {
        outputError('Invalid output directory path', format);
      }
      throw error; // Re-throw to ensure process exits with error code
    }

    // Find flows to run
    let flowFiles: string[] = [];

    if (flowArg) {
      try {
        // Validate the flow file path
        const validatedFlowPath = validateInputFile(flowArg);
        flowFiles = [validatedFlowPath];
      } catch (error) {
        if (error instanceof PathSecurityError) {
          outputError('Invalid flow file path', format);
        }
        outputError('Flow file not found', format); // outputError exits the process
      }
    } else {
      // Load config or use defaults
      const configPath = './flowguard.config.json';
      let flowsDir = './flows';

      try {
        const validatedConfigPath = validatePath(configPath, { allowNonExistent: true });
        if (fs.existsSync(validatedConfigPath)) {
          const configContent = fs.readFileSync(validatedConfigPath, 'utf-8');
          const parsed = ConfigSchema.safeParse(JSON.parse(configContent));
          if (parsed.success) {
            flowsDir = parsed.data.flowsDir;
          }
        }
      } catch {
        // Use default flowsDir if config is invalid (error already logged by validatePath if it fails)
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

    let repository: FlowGuardRepository | null = null;
    if (process.env.MONGODB_URI) {
      try {
        await db.connect();
        repository = new FlowGuardRepository(db.getDb());
      } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        outputError('Failed to connect to MongoDB for UX risk persistence.', format);
      }
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
        const result = await executeFlow(flow, validatedOutputDir);

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

                if (options.devswarm) {
                  try {
                    const token = process.env.GITHUB_TOKEN;
                    if (token) {
                      const devswarm = new DevSwarm(token);
                      const risk = {
                        flowName: flow.name,
                        stepIndex: step.stepIndex,
                        risk: step.analysis.issues[0] || 'No specific issue reported',
                        recommendation: step.analysis.suggestions[0] || 'No specific suggestion provided',
                      };
                      if (repository) {
                        await repository.saveUXRisk(risk);
                      }
                      await devswarm.postComment(risk);
                    } else {
                      console.warn('GITHUB_TOKEN not set, skipping DevSwarm comment.');
                    }
                  } catch (error) {
                    console.warn('Failed to post DevSwarm comment:', error);
                  }
                }
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

      if (cruxMetrics) {
        const woodWideAnalysis = await getWoodWideAnalysis(cruxMetrics, options.mock);
        if (woodWideAnalysis) {
          if (format === 'text') {
            console.log('');
            console.log(formatWoodWideAnalysis(woodWideAnalysis));
          }
        }
      }

      // Generate report
      const reportPath = saveReport(flowResult, validatedOutputDir, cruxMetrics ?? undefined);

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

    if (repository) {
      await db.disconnect();
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

    // Cleanup browser pool before exit
    await cleanup();

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

    // Validate reports directory path
    let validatedReportsDir: string;
    try {
      validatedReportsDir = validatePath(reportsDir, { allowNonExistent: false });
    } catch (error) {
      if (error instanceof PathSecurityError) {
        outputError('Invalid reports directory path', format);
      }
      outputError('No reports directory found. Run "flowguard run" first.', format);
    }

    const reports = fs.readdirSync(validatedReportsDir)
      .filter((f) => f.endsWith('.html'))
      .map((f) => {
        // Validate each report file path
        const reportPath = path.join(validatedReportsDir, f);
        try {
          validatePath(reportPath, { allowNonExistent: false });
          return {
            name: f,
            path: reportPath,
            mtime: fs.statSync(reportPath).mtime,
          };
        } catch {
          return null;
        }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
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
      const { spawn } = await import('node:child_process');
      let openCommand: string;
      let args: string[];

      if (process.platform === 'darwin') {
        openCommand = 'open';
        args = [latest.path];
      } else if (process.platform === 'win32') {
        openCommand = 'cmd';
        args = ['/c', 'start', '', latest.path];
      } else {
        openCommand = 'xdg-open';
        args = [latest.path];
      }

      spawn(openCommand, args, { detached: true, stdio: 'ignore' }).unref();

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