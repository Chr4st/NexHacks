import { chromium, type Page, type Browser } from 'playwright';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Flow, Step, StepResult, FlowRunResult, Viewport } from './types.js';

export const DEFAULT_VIEWPORT: Viewport = {
  width: 1280,
  height: 720,
};

const DEFAULT_TIMEOUT = 30000;

/**
 * Executes a single step in a flow.
 *
 * @param page - Playwright page instance
 * @param step - Step to execute
 * @param stepIndex - Index of the step in the flow
 * @param screenshotDir - Directory to save screenshots
 * @returns StepResult with execution details
 */
export async function executeStep(
  page: Page,
  step: Step,
  stepIndex: number,
  screenshotDir: string
): Promise<StepResult> {
  const startTime = Date.now();
  const timeout = step.timeout ?? DEFAULT_TIMEOUT;

  try {
    let screenshotPath: string | undefined;
    let screenshotBase64: string | undefined;

    switch (step.action) {
      case 'navigate':
        if (!step.target) {
          throw new Error('Navigate action requires a target URL');
        }
        await page.goto(step.target, { timeout, waitUntil: 'networkidle' });
        break;

      case 'click':
        if (!step.target) {
          throw new Error('Click action requires a target selector');
        }
        await page.click(step.target, { timeout });
        break;

      case 'type':
        if (!step.target) {
          throw new Error('Type action requires a target selector');
        }
        await page.fill(step.target, step.value ?? '', { timeout });
        break;

      case 'screenshot': {
        // Ensure screenshot directory exists
        if (!fs.existsSync(screenshotDir)) {
          fs.mkdirSync(screenshotDir, { recursive: true });
        }

        const filename = `step-${stepIndex}-${Date.now()}.png`;
        screenshotPath = path.join(screenshotDir, filename);
        const buffer = await page.screenshot({ fullPage: false });
        fs.writeFileSync(screenshotPath, buffer);
        screenshotBase64 = buffer.toString('base64');
        break;
      }

      case 'wait':
        await page.waitForTimeout(step.timeout ?? 1000);
        break;

      case 'scroll': {
        const scrollAmount = parseInt(step.value ?? '500', 10);
        await page.evaluate((amount) => {
          window.scrollBy(0, amount);
        }, scrollAmount);
        break;
      }

      default:
        throw new Error(`Unknown action: ${step.action}`);
    }

    return {
      stepIndex,
      action: step.action,
      success: true,
      screenshotPath,
      screenshotBase64,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      stepIndex,
      action: step.action,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Executes a complete flow and returns results.
 *
 * @param flow - Flow definition to execute
 * @param outputDir - Directory for screenshots and artifacts
 * @returns FlowRunResult with all step results
 */
export async function executeFlow(
  flow: Flow,
  outputDir: string
): Promise<FlowRunResult> {
  const startedAt = new Date().toISOString();
  const startTime = Date.now();
  const viewport = flow.viewport ?? DEFAULT_VIEWPORT;

  // Create unique directory for this run
  const runId = `${flow.name}-${Date.now()}`;
  const screenshotDir = path.join(outputDir, runId);

  let browser: Browser | null = null;
  const stepResults: StepResult[] = [];

  try {
    // Launch browser
    browser = await chromium.launch({
      headless: true,
    });

    const page = await browser.newPage();
    await page.setViewportSize(viewport);

    // Navigate to initial URL
    await page.goto(flow.url, { waitUntil: 'networkidle', timeout: DEFAULT_TIMEOUT });

    // Execute each step
    for (let i = 0; i < flow.steps.length; i++) {
      const step = flow.steps[i];
      if (!step) continue;

      const result = await executeStep(page, step, i, screenshotDir);
      stepResults.push(result);

      // Stop on first failure
      if (!result.success) {
        break;
      }
    }

    await page.close();
  } catch (error) {
    // Add error as a failed step if browser setup failed
    stepResults.push({
      stepIndex: 0,
      action: 'navigate',
      success: false,
      error: error instanceof Error ? error.message : 'Browser launch failed',
      durationMs: Date.now() - startTime,
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  const completedAt = new Date().toISOString();
  const allPassed = stepResults.every((s) => s.success);
  const hasError = stepResults.some((s) => s.error);

  return {
    flowName: flow.name,
    intent: flow.intent,
    url: flow.url,
    viewport,
    verdict: hasError ? 'error' : allPassed ? 'pass' : 'fail',
    confidence: 0, // Will be set by vision analyzer
    steps: stepResults,
    startedAt,
    completedAt,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Executes multiple flows in parallel (limited concurrency).
 *
 * @param flows - Array of flows to execute
 * @param outputDir - Directory for artifacts
 * @param concurrency - Maximum parallel executions
 * @returns Array of flow results
 */
export async function executeFlows(
  flows: Flow[],
  outputDir: string,
  concurrency = 3
): Promise<FlowRunResult[]> {
  const results: FlowRunResult[] = [];
  const queue = [...flows];

  const worker = async () => {
    while (queue.length > 0) {
      const flow = queue.shift();
      if (flow) {
        const result = await executeFlow(flow, outputDir);
        results.push(result);
      }
    }
  };

  // Create worker pool
  const workers = Array(Math.min(concurrency, flows.length))
    .fill(null)
    .map(() => worker());

  await Promise.all(workers);

  return results;
}
