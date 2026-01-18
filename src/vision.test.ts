import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeScreenshot, buildPrompt, parseVisionResponse } from './vision.js';
import type { AnalysisResult } from './types.js';

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              canComplete: true,
              confidence: 85,
              issues: [],
              suggestions: ['Consider adding more contrast to the CTA'],
            }),
          },
        ],
        usage: {
          input_tokens: 1000,
          output_tokens: 200,
        },
      }),
    },
  })),
}));

describe('buildPrompt', () => {
  it('builds a structured prompt for UX analysis', () => {
    const intent = 'User can find and click the signup button';
    const assertion = 'Signup button is clearly visible';
    const prompt = buildPrompt(intent, assertion);

    expect(prompt).toContain('intent');
    expect(prompt).toContain(intent);
    expect(prompt).toContain('JSON');
    expect(prompt).toContain('canComplete');
    expect(prompt).toContain('confidence');
    expect(prompt).toContain('issues');
    expect(prompt).toContain('suggestions');
  });

  it('includes assertion in prompt when provided', () => {
    const prompt = buildPrompt('Test intent here', 'Button is visible');
    expect(prompt).toContain('Button is visible');
  });

  it('works without assertion', () => {
    const prompt = buildPrompt('Test intent here', undefined);
    expect(prompt).toContain('Test intent here');
  });
});

describe('parseVisionResponse', () => {
  it('parses valid pass response', () => {
    const response = JSON.stringify({
      canComplete: true,
      confidence: 90,
      issues: [],
      suggestions: ['Minor: add hover state'],
    });

    const result = parseVisionResponse(response);

    expect(result.status).toBe('pass');
    if (result.status === 'pass') {
      expect(result.confidence).toBe(90);
      expect(result.reasoning).toContain('can complete');
    }
  });

  it('parses valid fail response', () => {
    const response = JSON.stringify({
      canComplete: false,
      confidence: 75,
      issues: ['CTA is below the fold', 'Low contrast text'],
      suggestions: ['Move CTA above fold', 'Increase contrast'],
    });

    const result = parseVisionResponse(response);

    expect(result.status).toBe('fail');
    if (result.status === 'fail') {
      expect(result.confidence).toBe(75);
      expect(result.issues).toContain('CTA is below the fold');
      expect(result.suggestions).toContain('Move CTA above fold');
    }
  });

  it('handles invalid JSON gracefully', () => {
    const result = parseVisionResponse('not valid json');

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.error).toContain('parse');
    }
  });

  it('handles missing fields', () => {
    const result = parseVisionResponse(JSON.stringify({ canComplete: true }));

    expect(result.status).toBe('pass');
    if (result.status === 'pass') {
      expect(result.confidence).toBe(0);
    }
  });

  it('clamps confidence to 0-100', () => {
    const response = JSON.stringify({
      canComplete: true,
      confidence: 150,
      issues: [],
      suggestions: [],
    });

    const result = parseVisionResponse(response);
    if (result.status === 'pass') {
      expect(result.confidence).toBe(100);
    }
  });
});

describe('analyzeScreenshot', () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    // Set a mock API key for tests
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    // Restore original key
    if (originalKey) {
      process.env.ANTHROPIC_API_KEY = originalKey;
    } else {
      delete process.env.ANTHROPIC_API_KEY;
    }
  });

  it('returns analysis result for valid screenshot', async () => {
    const result = await analyzeScreenshot(
      'base64-encoded-image-data',
      'User can complete signup',
      'Signup button visible'
    );

    expect(result.status).toBe('pass');
    if (result.status === 'pass') {
      expect(result.confidence).toBe(85);
    }
  });

  it('handles missing API key', async () => {
    // Remove API key
    delete process.env.ANTHROPIC_API_KEY;

    const result = await analyzeScreenshot('data', 'intent');

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.error).toContain('ANTHROPIC_API_KEY');
    }
  });
});
