import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, type Browser, type Page } from 'playwright';
import { ExecutionDataCapturer } from './execution-data-capturer.js';

describe('ExecutionDataCapturer', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should capture DOM snapshots at each step', async () => {
    page = await browser.newPage();
    const capturer = new ExecutionDataCapturer(page);

    await page.goto('https://example.com');
    const snapshot = await capturer.captureDOMSnapshot(0);

    expect(snapshot.html).toBeDefined();
    expect(snapshot.html.length).toBeGreaterThan(0);
    expect(snapshot.serializedDOM).toBeDefined();
    expect(snapshot.serializedDOM.title).toBe('Example Domain');
    expect(snapshot.snapshotId).toMatch(/^dom_0_/);

    await page.close();
  });

  it('should capture network requests and responses', async () => {
    page = await browser.newPage();
    const capturer = new ExecutionDataCapturer(page);

    await page.goto('https://example.com');
    await page.waitForTimeout(1000); // Wait for all requests to complete

    const data = capturer.getData();

    expect(data.networkRequests.length).toBeGreaterThan(0);
    expect(data.networkRequests[0]).toMatchObject({
      url: expect.any(String),
      method: expect.any(String),
      statusCode: expect.any(Number),
      requestHeaders: expect.any(Object),
      responseHeaders: expect.any(Object),
    });

    await page.close();
  });

  it('should capture console logs', async () => {
    page = await browser.newPage();
    const capturer = new ExecutionDataCapturer(page);

    await page.goto('https://example.com');
    await page.evaluate(() => console.log('Test message'));
    await page.waitForTimeout(100);

    const data = capturer.getData();
    const testLog = data.consoleLogs.find(log => log.message.includes('Test message'));

    expect(testLog).toBeDefined();
    expect(testLog?.type).toBe('log');

    await page.close();
  });

  it('should capture page errors', async () => {
    page = await browser.newPage();
    const capturer = new ExecutionDataCapturer(page);

    await page.goto('data:text/html,<script>throw new Error("Test error");</script>');
    await page.waitForTimeout(500);

    const data = capturer.getData();
    const hasError = data.consoleLogs.some(log => log.type === 'error');

    expect(hasError).toBe(true);

    await page.close();
  });

  it('should capture performance metrics', async () => {
    page = await browser.newPage();
    const capturer = new ExecutionDataCapturer(page);

    await page.goto('https://example.com');
    const metrics = await capturer.capturePerformanceMetrics();

    expect(metrics).toBeDefined();
    expect(metrics.domContentLoaded).toBeGreaterThanOrEqual(0);
    expect(metrics.loadComplete).toBeGreaterThanOrEqual(0);
    expect(metrics.totalResourceCount).toBeGreaterThanOrEqual(0);
    expect(metrics.totalResourceSize).toBeGreaterThanOrEqual(0);

    await page.close();
  });

  it('should capture multiple DOM snapshots for different steps', async () => {
    page = await browser.newPage();
    const capturer = new ExecutionDataCapturer(page);

    await page.goto('https://example.com');
    await capturer.captureDOMSnapshot(0);
    await capturer.captureDOMSnapshot(1);
    await capturer.captureDOMSnapshot(2);

    const data = capturer.getData();

    expect(data.domSnapshots.length).toBe(3);
    expect(data.domSnapshots[0].stepIndex).toBe(0);
    expect(data.domSnapshots[1].stepIndex).toBe(1);
    expect(data.domSnapshots[2].stepIndex).toBe(2);

    await page.close();
  });

  it('should reset captured data when reset() is called', async () => {
    page = await browser.newPage();
    const capturer = new ExecutionDataCapturer(page);

    await page.goto('https://example.com');
    await capturer.captureDOMSnapshot(0);

    let data = capturer.getData();
    expect(data.domSnapshots.length).toBeGreaterThan(0);
    expect(data.networkRequests.length).toBeGreaterThan(0);

    capturer.reset();
    data = capturer.getData();

    expect(data.domSnapshots.length).toBe(0);
    expect(data.networkRequests.length).toBe(0);
    expect(data.consoleLogs.length).toBe(0);

    await page.close();
  });
});
