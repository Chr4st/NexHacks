import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SpacesStorage } from '../spaces.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('SpacesStorage', () => {
  let storage: SpacesStorage;
  const testScreenshotPath = path.join(__dirname, 'fixtures', 'test.png');

  beforeAll(async () => {
    // Only run tests if credentials are available
    if (
      !process.env.DO_SPACES_KEY ||
      !process.env.DO_SPACES_SECRET ||
      !process.env.DO_SPACES_BUCKET
    ) {
      return;
    }

    storage = new SpacesStorage({
      region: process.env.DO_SPACES_REGION || 'nyc3',
      endpoint: `https://${process.env.DO_SPACES_REGION || 'nyc3'}.digitaloceanspaces.com`,
      accessKeyId: process.env.DO_SPACES_KEY,
      secretAccessKey: process.env.DO_SPACES_SECRET,
      bucket: process.env.DO_SPACES_BUCKET,
    });

    // Create test screenshot directory
    const fixturesDir = path.dirname(testScreenshotPath);
    await fs.mkdir(fixturesDir, { recursive: true });

    // Create test screenshot (minimal PNG)
    const minimalPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    await fs.writeFile(testScreenshotPath, minimalPng);
  });

  afterAll(async () => {
    try {
      await fs.unlink(testScreenshotPath);
    } catch {
      // Ignore if file doesn't exist
    }
  });

  it('should upload screenshot and return CDN URL', async () => {
    if (!storage) {
      console.log('Skipping test - DO Spaces credentials not available');
      return;
    }

    const url = await storage.uploadScreenshot(testScreenshotPath, 'test-flow', 1);

    expect(url).toContain('digitaloceanspaces.com');
    expect(url).toContain('screenshots/test-flow');
  });

  it('should upload HTML report', async () => {
    if (!storage) {
      console.log('Skipping test - DO Spaces credentials not available');
      return;
    }

    const html = '<html><body>Test Report</body></html>';
    const url = await storage.uploadReport(html, 'test-report');

    expect(url).toContain('reports/test-report');
    expect(url).toContain('.html');
  });

  it('should generate signed URL', async () => {
    if (!storage) {
      console.log('Skipping test - DO Spaces credentials not available');
      return;
    }

    const url = await storage.uploadScreenshot(testScreenshotPath, 'test-flow', 2);
    const urlObj = new URL(url);
    const key = urlObj.pathname.slice(1);

    const signedUrl = await storage.getSignedUrl(key, 3600);

    expect(signedUrl).toContain('X-Amz-Signature');
    expect(signedUrl).toContain('X-Amz-Expires=3600');
  });

  it('should list objects with prefix', async () => {
    if (!storage) {
      console.log('Skipping test - DO Spaces credentials not available');
      return;
    }

    const objects = await storage.listObjects('screenshots/test-flow');

    expect(Array.isArray(objects)).toBe(true);
  });

  it('should get storage statistics', async () => {
    if (!storage) {
      console.log('Skipping test - DO Spaces credentials not available');
      return;
    }

    const stats = await storage.getStatistics();

    expect(stats.totalObjects).toBeGreaterThanOrEqual(0);
    expect(stats.totalSize).toBeGreaterThanOrEqual(0);
    expect(stats.screenshotCount).toBeGreaterThanOrEqual(0);
    expect(stats.reportCount).toBeGreaterThanOrEqual(0);
    expect(stats.flowCount).toBeGreaterThanOrEqual(0);
  });
});

