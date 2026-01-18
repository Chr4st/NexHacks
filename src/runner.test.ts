import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Flow, Step, StepResult, Viewport } from './types.js';

// Mock Playwright
vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        setViewportSize: vi.fn().mockResolvedValue(undefined),
        goto: vi.fn().mockResolvedValue(undefined),
        click: vi.fn().mockResolvedValue(undefined),
        fill: vi.fn().mockResolvedValue(undefined),
        screenshot: vi.fn().mockResolvedValue(Buffer.from('fake-screenshot')),
        waitForTimeout: vi.fn().mockResolvedValue(undefined),
        evaluate: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      }),
      close: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

import { executeStep, executeFlow, DEFAULT_VIEWPORT } from './runner.js';

describe('DEFAULT_VIEWPORT', () => {
  it('has sensible defaults', () => {
    expect(DEFAULT_VIEWPORT.width).toBe(1280);
    expect(DEFAULT_VIEWPORT.height).toBe(720);
  });
});

describe('executeStep', () => {
  const mockPage = {
    goto: vi.fn().mockResolvedValue(undefined),
    click: vi.fn().mockResolvedValue(undefined),
    fill: vi.fn().mockResolvedValue(undefined),
    screenshot: vi.fn().mockResolvedValue(Buffer.from('screenshot-data')),
    waitForTimeout: vi.fn().mockResolvedValue(undefined),
    evaluate: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('executes navigate action', async () => {
    const step: Step = { action: 'navigate', target: 'https://example.com' };
    const result = await executeStep(mockPage as any, step, 0, '/tmp');

    expect(result.success).toBe(true);
    expect(result.action).toBe('navigate');
    expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', expect.any(Object));
  });

  it('executes click action', async () => {
    const step: Step = { action: 'click', target: '#submit-button' };
    const result = await executeStep(mockPage as any, step, 0, '/tmp');

    expect(result.success).toBe(true);
    expect(result.action).toBe('click');
    expect(mockPage.click).toHaveBeenCalledWith('#submit-button', expect.any(Object));
  });

  it('executes type action', async () => {
    const step: Step = { action: 'type', target: '#email', value: 'test@example.com' };
    const result = await executeStep(mockPage as any, step, 0, '/tmp');

    expect(result.success).toBe(true);
    expect(result.action).toBe('type');
    expect(mockPage.fill).toHaveBeenCalledWith('#email', 'test@example.com', expect.any(Object));
  });

  it('executes screenshot action', async () => {
    const step: Step = { action: 'screenshot', assert: 'Button is visible' };
    const result = await executeStep(mockPage as any, step, 0, '/tmp');

    expect(result.success).toBe(true);
    expect(result.action).toBe('screenshot');
    expect(result.screenshotPath).toBeDefined();
    expect(result.screenshotBase64).toBeDefined();
    expect(mockPage.screenshot).toHaveBeenCalled();
  });

  it('executes wait action', async () => {
    const step: Step = { action: 'wait', timeout: 1000 };
    const result = await executeStep(mockPage as any, step, 0, '/tmp');

    expect(result.success).toBe(true);
    expect(result.action).toBe('wait');
    expect(mockPage.waitForTimeout).toHaveBeenCalledWith(1000);
  });

  it('executes scroll action', async () => {
    const step: Step = { action: 'scroll', value: '500' };
    const result = await executeStep(mockPage as any, step, 0, '/tmp');

    expect(result.success).toBe(true);
    expect(result.action).toBe('scroll');
    expect(mockPage.evaluate).toHaveBeenCalled();
  });

  it('tracks duration for each step', async () => {
    const step: Step = { action: 'screenshot' };
    const result = await executeStep(mockPage as any, step, 0, '/tmp');

    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('handles step errors gracefully', async () => {
    mockPage.click.mockRejectedValueOnce(new Error('Element not found'));
    const step: Step = { action: 'click', target: '#missing' };
    const result = await executeStep(mockPage as any, step, 0, '/tmp');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Element not found');
  });
});

describe('executeFlow', () => {
  it('returns flow result with all steps', async () => {
    const flow: Flow = {
      name: 'test-flow',
      intent: 'Test that the flow executes correctly',
      url: 'https://example.com',
      steps: [
        { action: 'navigate', target: 'https://example.com' },
        { action: 'screenshot' },
      ],
    };

    const result = await executeFlow(flow, '/tmp');

    expect(result.flowName).toBe('test-flow');
    expect(result.intent).toBe('Test that the flow executes correctly');
    expect(result.url).toBe('https://example.com');
    expect(result.steps).toHaveLength(2);
    expect(result.startedAt).toBeDefined();
    expect(result.completedAt).toBeDefined();
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('uses custom viewport when provided', async () => {
    const flow: Flow = {
      name: 'mobile-flow',
      intent: 'Test mobile viewport is applied',
      url: 'https://example.com',
      viewport: { width: 375, height: 667 },
      steps: [{ action: 'screenshot' }],
    };

    const result = await executeFlow(flow, '/tmp');

    expect(result.viewport).toEqual({ width: 375, height: 667 });
  });

  it('uses default viewport when not specified', async () => {
    const flow: Flow = {
      name: 'desktop-flow',
      intent: 'Test default viewport is used',
      url: 'https://example.com',
      steps: [{ action: 'screenshot' }],
    };

    const result = await executeFlow(flow, '/tmp');

    expect(result.viewport).toEqual(DEFAULT_VIEWPORT);
  });
});
