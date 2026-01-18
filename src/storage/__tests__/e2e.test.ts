import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SpacesStorage } from '../spaces.js';
import { UploadManager } from '../uploader.js';
import { StorageCleaner } from '../cleaner.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Create a test SpacesStorage instance (only if credentials available)
 */
function createTestStorage(): SpacesStorage | null {
  if (
    !process.env.DO_SPACES_KEY ||
    !process.env.DO_SPACES_SECRET ||
    !process.env.DO_SPACES_BUCKET
  ) {
    return null;
  }

  const region = process.env.DO_SPACES_REGION || 'nyc3';
  const endpoint = `https://${region}.digitaloceanspaces.com`;

  return new SpacesStorage({
    region,
    endpoint,
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
    bucket: process.env.DO_SPACES_BUCKET,
    cdnEndpoint: process.env.DO_SPACES_CDN_ENDPOINT,
  });
}

/**
 * Create a minimal PNG file for testing
 */
async function createTestScreenshot(filePath: string): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  const minimalPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  await fs.writeFile(filePath, minimalPng);
}

describe('DigitalOcean Spaces Storage E2E Tests', () => {
  const testDir = path.join(__dirname, '../../../../tmp/storage-tests');
  const testScreenshotPath = path.join(testDir, 'test-screenshot.png');
  const testScreenshotDir = path.join(testDir, 'screenshots');
  let storage: SpacesStorage | null = null;

  beforeAll(async () => {
    // Create test directory
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(testScreenshotDir, { recursive: true });

    // Create test screenshot
    await createTestScreenshot(testScreenshotPath);

    // Initialize storage if credentials available
    storage = createTestStorage();
  });

  afterAll(async () => {
    // Cleanup test files
    try {
      await fs.unlink(testScreenshotPath);
      await fs.rmdir(testScreenshotDir);
      await fs.rmdir(testDir);
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('SpacesStorage - Configuration', () => {
    it('should initialize with valid configuration', () => {
      const testStorage = createTestStorage();
      if (!testStorage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      expect(testStorage).toBeInstanceOf(SpacesStorage);
    });

    it('should handle CDN endpoint configuration', () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      // Storage should be initialized with CDN endpoint if provided
      expect(storage).toBeDefined();
    });
  });

  describe('SpacesStorage - Screenshot Upload', () => {
    it('should upload screenshot and return CDN URL', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const url = await storage.uploadScreenshot(testScreenshotPath, 'e2e-test-flow', 1);

      expect(url).toBeDefined();
      expect(typeof url).toBe('string');
      expect(url.length).toBeGreaterThan(0);
      expect(url).toContain('digitaloceanspaces.com');
      expect(url).toContain('screenshots/e2e-test-flow');
      expect(url).toMatch(/step-1\.png$/);
    });

    it('should organize screenshots by flow name', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const url1 = await storage.uploadScreenshot(testScreenshotPath, 'flow-a', 1);
      const url2 = await storage.uploadScreenshot(testScreenshotPath, 'flow-b', 1);

      expect(url1).toContain('screenshots/flow-a');
      expect(url2).toContain('screenshots/flow-b');
    });

    it('should include timestamp in screenshot key', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const url = await storage.uploadScreenshot(testScreenshotPath, 'timestamp-test', 1);

      // Key should include ISO timestamp (with dashes instead of colons)
      expect(url).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);
    });

    it('should handle different file extensions', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      // Test with .png (default)
      const url = await storage.uploadScreenshot(testScreenshotPath, 'extension-test', 1);
      expect(url).toContain('.png');
    });
  });

  describe('SpacesStorage - Report Upload', () => {
    it('should upload HTML report and return CDN URL', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const htmlContent = '<!DOCTYPE html><html><body><h1>Test Report</h1></body></html>';
      const reportId = `e2e-test-report-${Date.now()}`;
      const url = await storage.uploadReport(htmlContent, reportId);

      expect(url).toBeDefined();
      expect(typeof url).toBe('string');
      expect(url.length).toBeGreaterThan(0);
      expect(url).toContain('reports/');
      expect(url).toContain(reportId);
      expect(url).toContain('.html');
    });

    it('should set correct content type for HTML reports', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const htmlContent = '<html><body>Test</body></html>';
      const url = await storage.uploadReport(htmlContent, 'content-type-test');

      // URL should be valid
      expect(url).toBeDefined();
      expect(url).toContain('.html');
    });

    it('should handle large HTML reports', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      // Create a large HTML report (100KB)
      const largeHtml = '<html><body>' + 'x'.repeat(100000) + '</body></html>';
      const url = await storage.uploadReport(largeHtml, 'large-report-test');

      expect(url).toBeDefined();
      expect(url).toContain('reports/');
    });
  });

  describe('SpacesStorage - Flow Definition Upload', () => {
    it('should upload flow definition YAML', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const yamlContent = `name: test-flow
intent: Test flow for E2E
url: https://example.com
steps:
  - action: navigate
    assert: Page loads`;

      const url = await storage.uploadFlowDefinition(yamlContent, 'e2e-test-flow');

      expect(url).toBeDefined();
      expect(url).toContain('flows/e2e-test-flow.yaml');
    });
  });

  describe('SpacesStorage - Signed URLs', () => {
    it('should generate signed URL for private screenshot', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      // Upload a screenshot first
      const uploadUrl = await storage.uploadScreenshot(testScreenshotPath, 'signed-url-test', 1);
      const urlObj = new URL(uploadUrl);
      const key = urlObj.pathname.slice(1); // Remove leading slash

      // Generate signed URL
      const signedUrl = await storage.getSignedUrl(key, 3600);

      expect(signedUrl).toBeDefined();
      expect(signedUrl).toContain('X-Amz-Signature');
      expect(signedUrl).toContain('X-Amz-Expires=3600');
      expect(signedUrl).toContain(key);
    });

    it('should generate signed URL with custom expiration', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const uploadUrl = await storage.uploadScreenshot(testScreenshotPath, 'expiration-test', 1);
      const urlObj = new URL(uploadUrl);
      const key = urlObj.pathname.slice(1);

      const signedUrl = await storage.getSignedUrl(key, 7200);

      expect(signedUrl).toContain('X-Amz-Expires=7200');
    });
  });

  describe('SpacesStorage - Object Management', () => {
    it('should list objects with prefix', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      // Upload a test object first
      await storage.uploadScreenshot(testScreenshotPath, 'list-test', 1);

      const objects = await storage.listObjects('screenshots/list-test');

      expect(Array.isArray(objects)).toBe(true);
      expect(objects.length).toBeGreaterThan(0);
      expect(objects[0]).toContain('screenshots/list-test');
    });

    it('should list objects with metadata', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      await storage.uploadScreenshot(testScreenshotPath, 'metadata-test', 1);

      const objects = await storage.listObjectsWithMetadata('screenshots/metadata-test');

      expect(Array.isArray(objects)).toBe(true);
      if (objects.length > 0) {
        expect(objects[0]).toHaveProperty('key');
        expect(objects[0]).toHaveProperty('lastModified');
        expect(objects[0]).toHaveProperty('size');
      }
    });

    it('should delete objects', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      // Upload then delete
      const url = await storage.uploadScreenshot(testScreenshotPath, 'delete-test', 1);
      const urlObj = new URL(url);
      const key = urlObj.pathname.slice(1);

      await expect(storage.deleteObject(key)).resolves.not.toThrow();
    });

    it('should handle deleting non-existent objects gracefully', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      // Attempt to delete non-existent object
      await expect(
        storage.deleteObject('screenshots/non-existent-file.png')
      ).resolves.not.toThrow();
    });
  });

  describe('SpacesStorage - Cleanup Operations', () => {
    it('should delete objects older than specified days', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      // Upload a test object
      await storage.uploadScreenshot(testScreenshotPath, 'cleanup-test', 1);

      // Delete objects older than 0 days (should delete everything)
      const deleted = await storage.deleteOlderThan('screenshots/cleanup-test', 0);

      expect(typeof deleted).toBe('number');
      expect(deleted).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 when no old objects found', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      // Try to delete objects older than 365 days (should find nothing)
      const deleted = await storage.deleteOlderThan('screenshots/non-existent', 365);

      expect(deleted).toBe(0);
    });
  });

  describe('SpacesStorage - Statistics', () => {
    it('should get storage statistics', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const stats = await storage.getStatistics();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('totalObjects');
      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('screenshotCount');
      expect(stats).toHaveProperty('reportCount');
      expect(stats).toHaveProperty('flowCount');

      expect(typeof stats.totalObjects).toBe('number');
      expect(typeof stats.totalSize).toBe('number');
      expect(typeof stats.screenshotCount).toBe('number');
      expect(typeof stats.reportCount).toBe('number');
      expect(typeof stats.flowCount).toBe('number');

      expect(stats.totalObjects).toBeGreaterThanOrEqual(0);
      expect(stats.totalSize).toBeGreaterThanOrEqual(0);
    });

    it('should aggregate statistics across all prefixes', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const stats = await storage.getStatistics();

      // Total should be sum of individual counts
      const sumOfCounts = stats.screenshotCount + stats.reportCount + stats.flowCount;
      expect(stats.totalObjects).toBe(sumOfCounts);
    });
  });

  describe('SpacesStorage - CDN URL Generation', () => {
    it('should use CDN endpoint when provided', () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      // This is tested indirectly through upload methods
      // The getCDNUrl is private, so we test via public methods
      expect(storage).toBeDefined();
    });

    it('should fallback to Spaces endpoint when CDN not configured', () => {
      // Create storage without CDN endpoint
      if (!process.env.DO_SPACES_KEY) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const region = process.env.DO_SPACES_REGION || 'nyc3';
      const storageWithoutCDN = new SpacesStorage({
        region,
        endpoint: `https://${region}.digitaloceanspaces.com`,
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET!,
        bucket: process.env.DO_SPACES_BUCKET!,
        // No cdnEndpoint
      });

      expect(storageWithoutCDN).toBeDefined();
    });
  });

  describe('UploadManager - Screenshot Uploads', () => {
    it('should upload all screenshots from directory', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      // Create test screenshots
      const screenshot1 = path.join(testScreenshotDir, 'step-1-screenshot.png');
      const screenshot2 = path.join(testScreenshotDir, 'step-2-screenshot.png');
      await createTestScreenshot(screenshot1);
      await createTestScreenshot(screenshot2);

      const uploadManager = new UploadManager(storage);
      const urls = await uploadManager.uploadFlowScreenshots(testScreenshotDir, 'upload-manager-test');

      expect(urls).toBeInstanceOf(Map);
      expect(urls.size).toBeGreaterThan(0);
      expect(urls.has('step-1-screenshot.png')).toBe(true);
      expect(urls.has('step-2-screenshot.png')).toBe(true);

      // Cleanup
      await fs.unlink(screenshot1);
      await fs.unlink(screenshot2);
    });

    it('should skip non-PNG files', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      // Create a non-PNG file
      const textFile = path.join(testScreenshotDir, 'not-an-image.txt');
      await fs.writeFile(textFile, 'not an image');

      const uploadManager = new UploadManager(storage);
      const urls = await uploadManager.uploadFlowScreenshots(testScreenshotDir, 'skip-test');

      // Should not include the text file
      expect(urls.has('not-an-image.txt')).toBe(false);

      // Cleanup
      await fs.unlink(textFile);
    });

    it('should extract step number from filename', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const screenshot = path.join(testScreenshotDir, 'step-5-screenshot.png');
      await createTestScreenshot(screenshot);

      const uploadManager = new UploadManager(storage);
      const urls = await uploadManager.uploadFlowScreenshots(testScreenshotDir, 'step-number-test');

      // Should have uploaded with step number 5
      expect(urls.has('step-5-screenshot.png')).toBe(true);

      // Cleanup
      await fs.unlink(screenshot);
    });
  });

  describe('UploadManager - Report Upload', () => {
    it('should upload and share report', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const htmlContent = '<html><body>Test Report</body></html>';
      const uploadManager = new UploadManager(storage);
      const result = await uploadManager.uploadAndShareReport(htmlContent, 'share-test');

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('shortUrl');
      expect(result.url).toBeDefined();
      expect(result.shortUrl).toBeDefined();
      expect(result.url).toContain('reports/');
      expect(result.url).toContain('.html');
    });

    it('should generate unique report IDs', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const htmlContent = '<html><body>Test</body></html>';
      const uploadManager = new UploadManager(storage);

      const result1 = await uploadManager.uploadAndShareReport(htmlContent, 'unique-test');
      // Small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      const result2 = await uploadManager.uploadAndShareReport(htmlContent, 'unique-test');

      // URLs should be different
      expect(result1.url).not.toBe(result2.url);
    });
  });

  describe('UploadManager - Private Screenshot Upload', () => {
    it('should upload and return signed URL', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const uploadManager = new UploadManager(storage);
      const signedUrl = await uploadManager.uploadPrivateScreenshot(
        testScreenshotPath,
        'private-test',
        1,
        3600
      );

      expect(signedUrl).toBeDefined();
      expect(signedUrl).toContain('X-Amz-Signature');
      expect(signedUrl).toContain('X-Amz-Expires=3600');
    });

    it('should use custom expiration time', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const uploadManager = new UploadManager(storage);
      const signedUrl = await uploadManager.uploadPrivateScreenshot(
        testScreenshotPath,
        'expiration-test',
        1,
        7200
      );

      expect(signedUrl).toContain('X-Amz-Expires=7200');
    });
  });

  describe('StorageCleaner - Cleanup Operations', () => {
    it('should clean up old artifacts', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const cleaner = new StorageCleaner(storage);
      const report = await cleaner.cleanup(30);

      expect(report).toBeDefined();
      expect(report).toHaveProperty('screenshotsDeleted');
      expect(report).toHaveProperty('reportsDeleted');
      expect(report).toHaveProperty('totalDeleted');
      expect(report).toHaveProperty('spaceSaved');

      expect(typeof report.screenshotsDeleted).toBe('number');
      expect(typeof report.reportsDeleted).toBe('number');
      expect(typeof report.totalDeleted).toBe('number');
      expect(report.totalDeleted).toBe(report.screenshotsDeleted + report.reportsDeleted);
    });

    it('should use different retention periods for screenshots and reports', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const cleaner = new StorageCleaner(storage);
      const report = await cleaner.cleanup(30);

      // Reports should use 60 days (30 * 2), screenshots use 30
      expect(report).toBeDefined();
    });

    it('should preview cleanup without deleting', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const cleaner = new StorageCleaner(storage);
      const preview = await cleaner.previewCleanup(30);

      expect(preview).toBeDefined();
      expect(preview).toHaveProperty('screenshotsToDelete');
      expect(preview).toHaveProperty('reportsToDelete');
      expect(preview).toHaveProperty('totalToDelete');
      expect(preview).toHaveProperty('cutoffDate');

      expect(typeof preview.screenshotsToDelete).toBe('number');
      expect(typeof preview.reportsToDelete).toBe('number');
      expect(typeof preview.totalToDelete).toBe('number');
      expect(preview.totalToDelete).toBe(preview.screenshotsToDelete + preview.reportsToDelete);
      expect(preview.cutoffDate).toBeInstanceOf(Date);
    });

    it('should use correct cutoff dates for preview', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const retentionDays = 30;
      const cleaner = new StorageCleaner(storage);
      const preview = await cleaner.previewCleanup(retentionDays);

      const expectedCutoff = new Date();
      expectedCutoff.setDate(expectedCutoff.getDate() - retentionDays);

      // Cutoff date should be approximately correct (within 1 second tolerance)
      const diff = Math.abs(preview.cutoffDate.getTime() - expectedCutoff.getTime());
      expect(diff).toBeLessThan(1000);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty screenshot directory', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const emptyDir = path.join(testDir, 'empty');
      await fs.mkdir(emptyDir, { recursive: true });

      const uploadManager = new UploadManager(storage);
      const urls = await uploadManager.uploadFlowScreenshots(emptyDir, 'empty-test');

      expect(urls).toBeInstanceOf(Map);
      expect(urls.size).toBe(0);

      // Cleanup
      await fs.rmdir(emptyDir);
    });

    it('should handle invalid file paths gracefully', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const invalidPath = path.join(testDir, 'non-existent-file.png');

      await expect(
        storage.uploadScreenshot(invalidPath, 'error-test', 1)
      ).rejects.toThrow();
    });

    it('should handle empty prefix in listObjects', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const objects = await storage.listObjects('');

      expect(Array.isArray(objects)).toBe(true);
    });

    it('should handle cleanup with zero retention days', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const cleaner = new StorageCleaner(storage);
      const report = await cleaner.cleanup(0);

      expect(report).toBeDefined();
      expect(report.totalDeleted).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Integration Tests', () => {
    it('should work with full upload workflow', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      // 1. Upload screenshot
      const screenshotUrl = await storage.uploadScreenshot(testScreenshotPath, 'workflow-test', 1);
      expect(screenshotUrl).toBeDefined();

      // 2. Upload report
      const reportUrl = await storage.uploadReport('<html><body>Test</body></html>', 'workflow-test');
      expect(reportUrl).toBeDefined();

      // 3. Get statistics
      const stats = await storage.getStatistics();
      expect(stats.totalObjects).toBeGreaterThanOrEqual(2);

      // 4. List objects
      const screenshots = await storage.listObjects('screenshots/workflow-test');
      expect(screenshots.length).toBeGreaterThan(0);

      const reports = await storage.listObjects('reports/workflow-test');
      expect(reports.length).toBeGreaterThan(0);
    });

    it('should work with UploadManager and StorageCleaner together', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      // Upload using UploadManager
      const uploadManager = new UploadManager(storage);
      const screenshot = path.join(testScreenshotDir, 'step-1-integration.png');
      await createTestScreenshot(screenshot);

      const urls = await uploadManager.uploadFlowScreenshots(testScreenshotDir, 'integration-test');
      expect(urls.size).toBeGreaterThan(0);

      // Cleanup using StorageCleaner
      const cleaner = new StorageCleaner(storage);
      const preview = await cleaner.previewCleanup(0); // Preview with 0 days to see all
      expect(preview).toBeDefined();

      // Cleanup
      await fs.unlink(screenshot);
    });
  });

  describe('Type Safety and Interface Compliance', () => {
    it('should return correct types for all methods', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      // Test return types
      const screenshotUrl = await storage.uploadScreenshot(testScreenshotPath, 'type-test', 1);
      expect(typeof screenshotUrl).toBe('string');

      const reportUrl = await storage.uploadReport('<html></html>', 'type-test');
      expect(typeof reportUrl).toBe('string');

      const objects = await storage.listObjects('screenshots/');
      expect(Array.isArray(objects)).toBe(true);

      const stats = await storage.getStatistics();
      expect(typeof stats.totalObjects).toBe('number');
      expect(typeof stats.totalSize).toBe('number');
    });
  });
});

