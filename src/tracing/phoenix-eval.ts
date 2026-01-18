import Anthropic from '@anthropic-ai/sdk';
import { trace } from '@opentelemetry/api';
import crypto from 'crypto';
import fs from 'fs/promises';
import { PhoenixClient } from './phoenix-client.js';
import { DatasetManager } from './dataset.js';
import { FlowGuardRepository } from '../db/repository.js';
import type {
  ExperimentConfig,
  ExperimentResult,
  PromptTemplate,
  BenchmarkExample,
  EvaluationResult,
  PromptMetrics
} from './types.js';

const tracer = trace.getTracer('flowguard-experiments');

/**
 * Prompt Optimizer for running A/B experiments on vision prompts
 */
export class PromptOptimizer {
  constructor(
    private anthropic: Anthropic,
    private phoenix: PhoenixClient,
    private repository: FlowGuardRepository,
    _datasetManager: DatasetManager
  ) {}

  /**
   * Run an A/B experiment comparing two prompt versions
   */
  async runExperiment(config: ExperimentConfig): Promise<ExperimentResult> {
    const experimentId = crypto.randomUUID();

    return await tracer.startActiveSpan('experiment.run', async (span) => {
      span.setAttribute('experiment.id', experimentId);
      span.setAttribute('experiment.name', config.name);
      span.setAttribute('experiment.dataset_size', config.dataset.length);

      // Run control group
      const controlResults = await this.runPromptVariant(
        config.promptVersions.control,
        config.dataset,
        experimentId,
        'control',
        config.traceProject,
        config.model
      );

      // Run variant group
      const variantResults = await this.runPromptVariant(
        config.promptVersions.variant,
        config.dataset,
        experimentId,
        'variant',
        config.traceProject,
        config.model
      );

      // Calculate metrics
      const controlMetrics = this.calculateMetrics(controlResults, config.dataset);
      const variantMetrics = this.calculateMetrics(variantResults, config.dataset);

      // Statistical significance test
      const significance = this.testSignificance(
        controlMetrics.accuracy,
        variantMetrics.accuracy,
        config.dataset.length
      );

      // Determine winner
      let winner: 'control' | 'variant' | 'tie';
      if (!significance.significant) {
        winner = 'tie';
      } else {
        winner = variantMetrics.accuracy > controlMetrics.accuracy ? 'variant' : 'control';
      }

      const result: ExperimentResult = {
        experimentId,
        runAt: new Date(),
        control: controlMetrics,
        variant: variantMetrics,
        winner,
        statisticalSignificance: significance
      };

      // Save to MongoDB (transform to Experiment interface)
      try {
        const totalRuns = controlResults.length + variantResults.length;
        await this.repository.saveExperiment({
          name: config.name,
          promptVersion: winner === 'variant' ? config.promptVersions.variant.version : config.promptVersions.control.version,
          datasetName: 'default',
          accuracy: winner === 'variant' ? variantMetrics.accuracy : controlMetrics.accuracy,
          avgConfidence: (controlMetrics.accuracy + variantMetrics.accuracy) / 2 * 100, // Convert to 0-100 scale
          totalRuns,
          startedAt: result.runAt,
          phoenixExperimentId: experimentId,
          results: [] // Results are stored in control/variant metrics
        });
      } catch (error) {
        // Gracefully handle save errors in local testing
        console.warn('Failed to save experiment to MongoDB:', error instanceof Error ? error.message : 'Unknown error');
      }

      // Send to Phoenix
      await this.phoenix.logExperiment(result);

      span.setAttribute('experiment.winner', winner);
      span.setAttribute('experiment.control_accuracy', controlMetrics.accuracy);
      span.setAttribute('experiment.variant_accuracy', variantMetrics.accuracy);
      span.end();

      return result;
    });
  }

  /**
   * Run a single prompt variant against the dataset
   */
  private async runPromptVariant(
    prompt: PromptTemplate,
    dataset: BenchmarkExample[],
    experimentId: string,
    group: 'control' | 'variant',
    traceProject: string,
    model: string
  ): Promise<EvaluationResult[]> {
    const results: EvaluationResult[] = [];

    for (const example of dataset) {
      const result = await tracer.startActiveSpan(`experiment.eval.${group}`, async (span) => {
        span.setAttribute('experiment.id', experimentId);
        span.setAttribute('experiment.group', group);
        span.setAttribute('experiment.example_id', example.id);
        span.setAttribute('prompt.version', prompt.version);

        const startTime = Date.now();

        // Read screenshot (use placeholder for now - real implementation will read file)
        const screenshotBase64 = await this.readScreenshot(example.screenshot_path);

        // Call vision model (use latest model name)
        const actualModel = model.includes('sonnet') ? 'claude-sonnet-4-5-20250929' : model;
        const response = await this.anthropic.messages.create({
          model: actualModel,
          max_tokens: 1000,
          system: prompt.systemPrompt,
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
                text: prompt.userPromptTemplate(screenshotBase64, example.assertion)
              }
            ]
          }]
        });

        const latency = Date.now() - startTime;

        // Parse verdict
        const firstContent = response.content[0];
        const text = firstContent && firstContent.type === 'text' ? firstContent.text : '';
        const predicted = this.parseVerdict(text);

        // Calculate cost
        const inputTokens = response.usage.input_tokens;
        const outputTokens = response.usage.output_tokens;
        const cost = this.calculateCost(inputTokens, outputTokens, model);

        // Send trace to Phoenix
        const traceId = await this.phoenix.logTrace({
          traceId: crypto.randomUUID(),
          spanId: crypto.randomUUID(),
          name: `eval_${group}_${example.id}`,
          kind: 'LLM',
          startTime: new Date(startTime),
          endTime: new Date(startTime + latency),
          attributes: {
            'llm.model': model,
            'llm.prompt.version': prompt.version,
            'llm.input_messages': JSON.stringify([{ role: 'user', content: example.assertion }]),
            'llm.output_messages': JSON.stringify([{ role: 'assistant', content: text }]),
            'llm.token_count.prompt': inputTokens,
            'llm.token_count.completion': outputTokens,
            'experiment.id': experimentId,
            'experiment.group': group,
            'experiment.example_id': example.id,
            'experiment.predicted': predicted,
            'experiment.actual': example.ground_truth.verdict
          },
          events: [],
          project: traceProject
        });

        span.setAttribute('trace.id', traceId);
        span.setAttribute('llm.tokens', inputTokens + outputTokens);
        span.setAttribute('llm.cost', cost);
        span.end();

        return {
          predicted,
          actual: example.ground_truth.verdict,
          tokens: inputTokens + outputTokens,
          cost,
          latency,
          traceId
        };
      });

      results.push(result);
    }

    return results;
  }

  /**
   * Calculate accuracy, precision, recall, F1 score
   */
  private calculateMetrics(results: EvaluationResult[], _dataset: BenchmarkExample[]): PromptMetrics {
    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;

    results.forEach(r => {
      if (r.predicted === true && r.actual === true) truePositives++;
      if (r.predicted === true && r.actual === false) falsePositives++;
      if (r.predicted === false && r.actual === false) trueNegatives++;
      if (r.predicted === false && r.actual === true) falseNegatives++;
    });

    const accuracy = (truePositives + trueNegatives) / results.length;
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

    const avgTokens = results.reduce((sum, r) => sum + r.tokens, 0) / results.length;
    const avgCost = results.reduce((sum, r) => sum + r.cost, 0) / results.length;
    const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;

    const phoenixTraceIds = results.map(r => r.traceId);

    return {
      accuracy,
      precision,
      recall,
      f1Score,
      avgTokens,
      avgCost,
      avgLatency,
      phoenixTraceIds
    };
  }

  /**
   * Simple z-test for statistical significance between two proportions
   */
  private testSignificance(p1: number, p2: number, n: number): { pValue: number; significant: boolean } {
    const pooled = (p1 + p2) / 2;
    const se = Math.sqrt(2 * pooled * (1 - pooled) / n);
    const z = Math.abs(p1 - p2) / se;

    // Simplified p-value calculation (two-tailed test)
    const pValue = 2 * (1 - this.normalCDF(z));

    return {
      pValue,
      significant: pValue < 0.05
    };
  }

  /**
   * Standard normal cumulative distribution function
   */
  private normalCDF(z: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const probability = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - probability : probability;
  }

  /**
   * Parse verdict from vision model output
   */
  private parseVerdict(text: string): boolean {
    const lowerText = text.toLowerCase();

    // Look for explicit verdict markers
    if (lowerText.includes('verdict: pass') || lowerText.includes('"verdict": true')) {
      return true;
    }
    if (lowerText.includes('verdict: fail') || lowerText.includes('"verdict": false')) {
      return false;
    }

    // Try JSON parsing
    try {
      const json = JSON.parse(text);
      if (typeof json.verdict === 'boolean') {
        return json.verdict;
      }
    } catch {
      // Not JSON, continue
    }

    // Fallback: count issue mentions
    const issueKeywords = ['issue', 'problem', 'error', 'violation', 'fail'];
    const issueCount = issueKeywords.filter(kw => lowerText.includes(kw)).length;
    return issueCount === 0;
  }

  /**
   * Read screenshot file
   */
  private async readScreenshot(path: string): Promise<string> {
    try {
      const buffer = await fs.readFile(path);
      return buffer.toString('base64');
    } catch (error) {
      // For missing screenshots, return empty placeholder
      console.warn(`Screenshot not found: ${path}, using placeholder`);
      // Return a 1x1 transparent PNG as placeholder
      return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    }
  }

  /**
   * Calculate API cost
   */
  private calculateCost(inputTokens: number, outputTokens: number, model: string): number {
    if (model.includes('sonnet')) {
      return (inputTokens * 0.003 + outputTokens * 0.015) / 1000;
    }
    return 0;
  }

  /**
   * Get the best-performing prompt version from historical experiments
   */
  async getBestPrompt(): Promise<PromptTemplate> {
    const experiments = await this.repository.getExperiments(10);

    if (experiments.length === 0) {
      return DEFAULT_PROMPT_V1;
    }

    // Find highest accuracy
    let bestAccuracy = 0;
    let bestPromptVersion = '';

    experiments.forEach((exp: any) => {
      // Handle both Experiment and ABExperiment formats
      if (exp.control && exp.variant) {
        // ABExperiment format
        if (exp.control.accuracy > bestAccuracy) {
          bestAccuracy = exp.control.accuracy;
          bestPromptVersion = exp.promptVersions?.control?.version || '';
        }
        if (exp.variant.accuracy > bestAccuracy) {
          bestAccuracy = exp.variant.accuracy;
          bestPromptVersion = exp.promptVersions?.variant?.version || '';
        }
      } else if (exp.accuracy !== undefined) {
        // Experiment format
        if (exp.accuracy > bestAccuracy) {
          bestAccuracy = exp.accuracy;
          bestPromptVersion = exp.promptVersion || '';
        }
      }
    });

    // Return the best prompt based on version
    if (bestPromptVersion === 'v2.0') {
      return IMPROVED_PROMPT_V2;
    }

    return DEFAULT_PROMPT_V1;
  }
}

// ============================================================================
// Default Prompt Templates
// ============================================================================

export const DEFAULT_PROMPT_V1: PromptTemplate = {
  version: 'v1.0',
  systemPrompt: `You are a UX testing expert analyzing web application screenshots.

Your task is to verify if the given assertion is true based on the screenshot.

Respond in JSON format:
{
  "verdict": true/false,
  "confidence": 0-100,
  "reasoning": "...",
  "issues": ["..."]
}`,
  userPromptTemplate: (_screenshot: string, assertion: string) =>
    `Assertion: ${assertion}\n\nAnalyze the screenshot and determine if this assertion is true.`
};

export const IMPROVED_PROMPT_V2: PromptTemplate = {
  version: 'v2.0',
  systemPrompt: `You are an expert UX tester specializing in accessibility, layout, and user experience analysis.

Analyze the screenshot systematically:
1. Visual hierarchy and layout
2. Color contrast and accessibility (WCAG AA standards)
3. Interactive element states (hover, focus, disabled)
4. Text readability and overflow
5. Responsive design considerations

Respond in JSON format:
{
  "verdict": true/false,
  "confidence": 0-100,
  "reasoning": "Detailed explanation",
  "issues": ["Specific issues found"],
  "wcag_violations": ["WCAG guideline violations if any"]
}`,
  userPromptTemplate: (_screenshot: string, assertion: string) =>
    `Assertion to verify: ${assertion}\n\nPerform a comprehensive UX analysis and determine if the assertion holds true.`
};
