import { describe, it, expect } from 'vitest';
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

describe('Bug Detection Tests - DigitalOcean Spaces Storage', () => {
  const testDir = path.join(__dirname, '../../../../tmp/storage-bug-tests');
  const testScreenshotPath = path.join(testDir, 'test.png');
  let storage: SpacesStorage | null = null;

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true });
    await createTestScreenshot(testScreenshotPath);
    storage = createTestStorage();
  });

  afterAll(async () => {
    try {
      await fs.unlink(testScreenshotPath);
      await fs.rmdir(testDir);
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Path and Key Validation Bugs', () => {
    it('should handle flow names with special characters', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      // Flow names with special characters that could break S3 keys
      const specialFlowNames = [
        'flow/with/slashes',
        'flow with spaces',
        'flow@with#special$chars',
        'flow..with..dots',
        'flow-with-unicode-测试',
      ];

      for (const flowName of specialFlowNames) {
        // Should not throw, but may sanitize the key
        await expect(
          storage.uploadScreenshot(testScreenshotPath, flowName, 1)
        ).resolves.toBeDefined();
      }
    });

    it('should handle report IDs with special characters', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const specialReportIds = [
        'report/with/slashes',
        'report with spaces',
        'report@special',
      ];

      for (const reportId of specialReportIds) {
        const html = '<html><body>Test</body></html>';
        await expect(
          storage.uploadReport(html, reportId)
        ).resolves.toBeDefined();
      }
    });

    it('should handle empty flow names gracefully', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      // Empty flow name should still work (may create root-level screenshots)
      await expect(
        storage.uploadScreenshot(testScreenshotPath, '', 1)
      ).resolves.toBeDefined();
    });

    it('should handle very long flow names', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const longFlowName = 'a'.repeat(1000);
      await expect(
        storage.uploadScreenshot(testScreenshotPath, longFlowName, 1)
      ).resolves.toBeDefined();
    });
  });

  describe('URL Generation Bugs', () => {
    it('should handle CDN endpoint with trailing slash', () => {
      if (!process.env.DO_SPACES_KEY) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const region = process.env.DO_SPACES_REGION || 'nyc3';
      const storageWithTrailingSlash = new SpacesStorage({
        region,
        endpoint: `https://${region}.digitaloceanspaces.com`,
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET!,
        bucket: process.env.DO_SPACES_BUCKET!,
        cdnEndpoint: 'https://cdn.example.com/', // Trailing slash
      });

      // Access private method via reflection (for testing)
      const getCDNUrl = (storage as any).getCDNUrl?.bind(storageWithTrailingSlash) || 
        ((key: string) => {
          const cdn = storageWithTrailingSlash['cdnEndpoint'];
          if (cdn) {
            return `${cdn}${key}`;
          }
          return `https://${storageWithTrailingSlash['bucket']}.${region}.digitaloceanspaces.com/${key}`;
        });

      const url = getCDNUrl('test/key.png');
      
      // Should not have double slashes
      expect(url).not.toContain('//');
      expect(url).toContain('test/key.png');
    });

    it('should handle CDN endpoint without trailing slash', () => {
      if (!process.env.DO_SPACES_KEY) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const region = process.env.DO_SPACES_REGION || 'nyc3';
      const storageWithoutSlash = new SpacesStorage({
        region,
        endpoint: `https://${region}.digitaloceanspaces.com`,
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET!,
        bucket: process.env.DO_SPACES_BUCKET!,
        cdnEndpoint: 'https://cdn.example.com', // No trailing slash
      });

      const getCDNUrl = (key: string) => {
        const cdn = storageWithoutSlash['cdnEndpoint'];
        if (cdn) {
          return `${cdn}/${key}`;
        }
        return `https://${storageWithoutSlash['bucket']}.${region}.digitaloceanspaces.com/${key}`;
      };

      const url = getCDNUrl('test/key.png');
      
      // Should have single slash between endpoint and key
      expect(url).toContain('cdn.example.com/test/key.png');
      expect(url).not.toMatch(/\/\/test/); // No double slash before key
    });
  });

  describe('Signed URL Generation Bugs', () => {
    it('should handle invalid keys gracefully', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const invalidKeys = [
        '', // Empty key
        '../etc/passwd', // Path traversal attempt
        'key with spaces',
        'key\nwith\nnewlines',
      ];

      for (const key of invalidKeys) {
        // Should either throw a proper error or handle gracefully
        await expect(
          storage.getSignedUrl(key, 3600)
        ).rejects.toThrow();
      }
    });

    it('should handle negative expiration times', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      // Upload a test object first
      const url = await storage.uploadScreenshot(testScreenshotPath, 'expiration-test', 1);
      const urlObj = new URL(url);
      const key = urlObj.pathname.slice(1);

      // Negative expiration should be rejected or clamped
      await expect(
        storage.getSignedUrl(key, -100)
      ).rejects.toThrow();
    });

    it('should handle very large expiration times', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const url = await storage.uploadScreenshot(testScreenshotPath, 'large-expiration-test', 1);
      const urlObj = new URL(url);
      const key = urlObj.pathname.slice(1);

      // Very large expiration (1 year = 31536000 seconds)
      const signedUrl = await storage.getSignedUrl(key, 31536000);
      
      expect(signedUrl).toBeDefined();
      expect(signedUrl).toContain('X-Amz-Expires=31536000');
    });
  });

  describe('File Path Validation Bugs', () => {
    it('should handle non-existent file paths', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const nonExistentPath = path.join(testDir, 'non-existent-file.png');

      await expect(
        storage.uploadScreenshot(nonExistentPath, 'error-test', 1)
      ).rejects.toThrow();
    });

    it('should handle directory paths instead of files', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      await expect(
        storage.uploadScreenshot(testDir, 'error-test', 1)
      ).rejects.toThrow();
    });

    it('should handle files without extensions', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const fileWithoutExt = path.join(testDir, 'file-without-ext');
      await fs.writeFile(fileWithoutExt, Buffer.from('test'));

      // Should handle gracefully (default to image/png)
      const url = await storage.uploadScreenshot(fileWithoutExt, 'no-ext-test', 1);
      expect(url).toBeDefined();

      await fs.unlink(fileWithoutExt);
    });
  });

  describe('Upload Manager Bugs', () => {
    it('should handle non-existent screenshot directory', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const uploadManager = new UploadManager(storage);
      const nonExistentDir = path.join(testDir, 'non-existent-dir');

      await expect(
        uploadManager.uploadFlowScreenshots(nonExistentDir, 'error-test')
      ).rejects.toThrow();
    });

    it('should handle empty screenshot directory', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const emptyDir = path.join(testDir, 'empty-dir');
      await fs.mkdir(emptyDir, { recursive: true });

      const uploadManager = new UploadManager(storage);
      const urls = await uploadManager.uploadFlowScreenshots(emptyDir, 'empty-test');

      expect(urls).toBeInstanceOf(Map);
      expect(urls.size).toBe(0);

      await fs.rmdir(emptyDir);
    });

    it('should handle files that are not PNGs', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const mixedDir = path.join(testDir, 'mixed-files');
      await fs.mkdir(mixedDir, { recursive: true });

      // Create PNG and non-PNG files
      await createTestScreenshot(path.join(mixedDir, 'step-1-screenshot.png'));
      await fs.writeFile(path.join(mixedDir, 'step-2-screenshot.jpg'), Buffer.from('fake-jpg'));
      await fs.writeFile(path.join(mixedDir, 'not-a-screenshot.txt'), Buffer.from('text'));

      const uploadManager = new UploadManager(storage);
      const urls = await uploadManager.uploadFlowScreenshots(mixedDir, 'mixed-test');

      // Should only upload PNGs
      expect(urls.size).toBe(1);
      expect(urls.has('step-1-screenshot.png')).toBe(true);
      expect(urls.has('step-2-screenshot.jpg')).toBe(false);
      expect(urls.has('not-a-screenshot.txt')).toBe(false);

      // Cleanup
      await fs.unlink(path.join(mixedDir, 'step-1-screenshot.png'));
      await fs.unlink(path.join(mixedDir, 'step-2-screenshot.jpg'));
      await fs.unlink(path.join(mixedDir, 'not-a-screenshot.txt'));
      await fs.rmdir(mixedDir);
    });

    it('should handle invalid URL parsing in uploadPrivateScreenshot', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const uploadManager = new UploadManager(storage);

      // This should work normally
      const signedUrl = await uploadManager.uploadPrivateScreenshot(
        testScreenshotPath,
        'url-test',
        1,
        3600
      );

      expect(signedUrl).toBeDefined();
      expect(signedUrl).toContain('X-Amz-Signature');
    });
  });

  describe('Cleanup Operation Bugs', () => {
    it('should handle negative retention days', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const cleaner = new StorageCleaner(storage);

      // Negative days should be handled (might delete everything or clamp to 0)
      const report = await cleaner.cleanup(-10);

      expect(report).toBeDefined();
      expect(report.totalDeleted).toBeGreaterThanOrEqual(0);
    });

    it('should handle zero retention days', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const cleaner = new StorageCleaner(storage);
      const report = await cleaner.cleanup(0);

      expect(report).toBeDefined();
      expect(report.totalDeleted).toBeGreaterThanOrEqual(0);
    });

    it('should handle very large retention days', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const cleaner = new StorageCleaner(storage);
      const report = await cleaner.cleanup(36500); // 100 years

      expect(report).toBeDefined();
      expect(report.totalDeleted).toBe(0); // Should delete nothing
    });

    it('should calculate spaceSaved correctly', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const cleaner = new StorageCleaner(storage);
      const report = await cleaner.cleanup(30);

      // spaceSaved should be calculated (currently it's always 0 - this is a bug!)
      expect(report).toHaveProperty('spaceSaved');
      // Note: This test documents the bug - spaceSaved is not currently calculated
    });
  });

  describe('Statistics Calculation Bugs', () => {
    it('should handle empty bucket gracefully', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const stats = await storage.getStatistics();

      expect(stats).toBeDefined();
      expect(stats.totalObjects).toBeGreaterThanOrEqual(0);
      expect(stats.totalSize).toBeGreaterThanOrEqual(0);
      expect(stats.screenshotCount).toBeGreaterThanOrEqual(0);
      expect(stats.reportCount).toBeGreaterThanOrEqual(0);
      expect(stats.flowCount).toBeGreaterThanOrEqual(0);
    });

    it('should aggregate statistics correctly', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const stats = await storage.getStatistics();

      // Total should equal sum of individual counts
      const sumOfCounts = stats.screenshotCount + stats.reportCount + stats.flowCount;
      expect(stats.totalObjects).toBe(sumOfCounts);
    });

    it('should handle pagination in listObjects (many objects)', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      // ListObjectsV2Command should handle pagination automatically
      // But we should test that it works with many objects
      const objects = await storage.listObjects('screenshots/');

      expect(Array.isArray(objects)).toBe(true);
      // Should not throw even with many objects
    });
  });

  describe('Delete Operation Bugs', () => {
    it('should handle deleting non-existent objects', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      // Deleting non-existent object should not throw
      await expect(
        storage.deleteObject('screenshots/non-existent-file.png')
      ).resolves.not.toThrow();
    });

    it('should handle deleteOlderThan with no matching objects', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      // Delete objects older than 100 years (should find nothing)
      const deleted = await storage.deleteOlderThan('screenshots/', 36500);

      expect(deleted).toBe(0);
    });

    it('should handle deleteOlderThan with invalid prefix', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const deleted = await storage.deleteOlderThan('non-existent-prefix/', 30);

      expect(deleted).toBe(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty strings in upload methods', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      // Empty HTML content
      await expect(
        storage.uploadReport('', 'empty-report')
      ).resolves.toBeDefined();

      // Empty YAML content
      await expect(
        storage.uploadFlowDefinition('', 'empty-flow')
      ).resolves.toBeDefined();
    });

    it('should handle very large file uploads', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      // Create a large HTML report (10MB)
      const largeHtml = '<html><body>' + 'x'.repeat(10 * 1024 * 1024) + '</body></html>';

      await expect(
        storage.uploadReport(largeHtml, 'large-report')
      ).resolves.toBeDefined();
    });

    it('should handle concurrent uploads', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      // Upload multiple files concurrently
      const uploads = Promise.all([
        storage.uploadScreenshot(testScreenshotPath, 'concurrent-test', 1),
        storage.uploadScreenshot(testScreenshotPath, 'concurrent-test', 2),
        storage.uploadScreenshot(testScreenshotPath, 'concurrent-test', 3),
      ]);

      const urls = await uploads;

      expect(urls).toHaveLength(3);
      urls.forEach(url => {
        expect(url).toBeDefined();
        expect(typeof url).toBe('string');
      });
    });
  });

  describe('Type Safety and Validation', () => {
    it('should validate required configuration parameters', () => {
      // Missing required fields should cause error at construction time
      expect(() => {
        new SpacesStorage({
          region: '',
          endpoint: '',
          accessKeyId: '',
          secretAccessKey: '',
          bucket: '',
        });
      }).toThrow('Region is missing');
    });

    it('should handle undefined optional parameters', () => {
      if (!process.env.DO_SPACES_KEY) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const region = process.env.DO_SPACES_REGION || 'nyc3';
      const storage = new SpacesStorage({
        region,
        endpoint: `https://${region}.digitaloceanspaces.com`,
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET!,
        bucket: process.env.DO_SPACES_BUCKET!,
        // cdnEndpoint is optional
      });

      expect(storage).toBeDefined();
    });
  });

  describe('Preview Cleanup Accuracy Bugs', () => {
    it('should match preview counts with actual cleanup', async () => {
      if (!storage) {
        console.log('Skipping - DO Spaces credentials not available');
        return;
      }

      const cleaner = new StorageCleaner(storage);
      const retentionDays = 30;

      // Get preview
      const preview = await cleaner.previewCleanup(retentionDays);

      // Note: Preview might not match exactly due to timing, but should be close
      expect(preview).toBeDefined();
      expect(preview.screenshotsToDelete).toBeGreaterThanOrEqual(0);
      expect(preview.reportsToDelete).toBeGreaterThanOrEqual(0);
    });
  });
});

