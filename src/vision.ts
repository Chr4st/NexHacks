import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type { AnalysisResult } from './types.js';

/**
 * Schema for validating the Claude vision API response JSON content.
 * This validates the parsed JSON that Claude returns, not the raw API response.
 */
const VisionResponseJsonSchema = z.object({
  canComplete: z.boolean(),
  confidence: z.number().min(0).max(100).default(0),
  issues: z.array(z.string()).default([]),
  suggestions: z.array(z.string()).default([]),
});

const MODEL = 'claude-3-5-sonnet-20241022';
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

/**
 * Builds a structured prompt for UX analysis.
 *
 * @param intent - The user intent being tested
 * @param assertion - Optional specific assertion to verify
 * @returns Formatted prompt string
 */
export function buildPrompt(intent: string, assertion?: string): string {
  const assertionText = assertion ? `\n\nSpecific check: ${assertion}` : '';

  return `You are a UX expert analyzing a screenshot to determine if a user can successfully complete their intended action.

User intent: "${intent}"${assertionText}

Analyze this screenshot and determine:
1. Can a user clearly understand how to complete their intent?
2. Are there any UX issues that would confuse or block the user?

Focus on:
- CTA visibility and prominence
- Form clarity and labels
- Error state handling
- Mobile usability (if viewport suggests mobile)
- Content above/below the fold
- Visual hierarchy and contrast

Return your analysis as JSON in this exact format:
{
  "canComplete": boolean,
  "confidence": number (0-100),
  "issues": ["string array of UX problems found"],
  "suggestions": ["string array of improvement suggestions"]
}

Be strict but fair. Only flag issues that would genuinely confuse real users.
Return ONLY the JSON, no additional text.`;
}

/**
 * Parses the vision model response into an AnalysisResult.
 *
 * @param responseText - Raw text response from Claude
 * @returns Parsed AnalysisResult
 */
export function parseVisionResponse(responseText: string): AnalysisResult {
  // Try to extract JSON from response (in case there's extra text)
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      status: 'error',
      error: 'Failed to parse vision response: No JSON found in response',
    };
  }

  let rawJson: unknown;
  try {
    rawJson = JSON.parse(jsonMatch[0]);
  } catch (error) {
    return {
      status: 'error',
      error: `Failed to parse vision response: Invalid JSON - ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }

  // Validate the parsed JSON against our schema
  const parseResult = VisionResponseJsonSchema.safeParse(rawJson);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    return {
      status: 'error',
      error: `Failed to parse vision response: Invalid response shape - ${errorMessages}`,
    };
  }

  const { canComplete, confidence, issues, suggestions } = parseResult.data;

  if (canComplete) {
    return {
      status: 'pass',
      confidence,
      reasoning: `User can complete the intended action with ${confidence}% confidence.`,
    };
  }

  return {
    status: 'fail',
    confidence,
    reasoning: `User may struggle to complete the intended action. ${issues.length} issues found.`,
    issues,
    suggestions,
  };
}

/**
 * Sleeps for a specified duration.
 */
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Analyzes a screenshot using Claude vision to evaluate UX quality.
 *
 * @param screenshotBase64 - Base64 encoded PNG screenshot
 * @param intent - The user intent being tested
 * @param assertion - Optional specific assertion to check
 * @returns AnalysisResult with pass/fail verdict and reasoning
 */
export async function analyzeScreenshot(
  screenshotBase64: string,
  intent: string,
  assertion?: string
): Promise<AnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      status: 'error',
      error: 'Missing ANTHROPIC_API_KEY environment variable',
    };
  }

  const client = new Anthropic({ apiKey });
  const prompt = buildPrompt(intent, assertion);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: screenshotBase64,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      });

      // Extract text content from response
      const textContent = response.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in response');
      }

      return parseVisionResponse(textContent.text);
    } catch (error) {
      // On last attempt, return error
      if (attempt === MAX_RETRIES) {
        return {
          status: 'error',
          error: `Vision analysis failed after ${MAX_RETRIES + 1} attempts: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        };
      }

      // Exponential backoff
      await sleep(RETRY_DELAY_MS * Math.pow(2, attempt));
    }
  }

  return {
    status: 'error',
    error: 'Vision analysis failed unexpectedly',
  };
}
