import { SpacesStorage } from './spaces.js';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

export class UploadManager {
  constructor(private storage: SpacesStorage) {}

  /**
   * Upload all screenshots from a flow run.
   */
  async uploadFlowScreenshots(
    screenshotDir: string,
    flowName: string
  ): Promise<Map<string, string>> {
    const screenshots = await fs.readdir(screenshotDir);
    const urls = new Map<string, string>();

    console.log(`\n📤 Uploading ${screenshots.length} screenshots to Spaces...`);

    for (const file of screenshots) {
      if (!file.endsWith('.png')) continue;

      const filePath = path.join(screenshotDir, file);

      // Extract step number from filename (e.g., "step-1-screenshot.png")
      const match = file.match(/step-(\d+)/);
      const stepNumber = match ? parseInt(match[1], 10) : 0;

      try {
        const url = await this.storage.uploadScreenshot(filePath, flowName, stepNumber);
        urls.set(file, url);

        console.log(`  ✓ ${file} → ${url}`);
      } catch (error) {
        console.error(`  ✗ Failed to upload ${file}: ${error}`);
      }
    }

    return urls;
  }

  /**
   * Upload report and return shareable URL.
   */
  async uploadAndShareReport(
    htmlContent: string,
    flowName: string
  ): Promise<{ url: string; shortUrl: string }> {
    const reportId = `${flowName}-${Date.now()}`;
    const url = await this.storage.uploadReport(htmlContent, reportId);

    // Generate short URL (last segment)
    const shortUrl = url.split('/').pop() || reportId;

    console.log(`\n✅ Report uploaded successfully!`);
    console.log(`   ${url}`);

    return { url, shortUrl };
  }

  /**
   * Upload and get signed URL for private screenshot.
   */
  async uploadPrivateScreenshot(
    filePath: string,
    flowName: string,
    stepNumber: number,
    expiresIn: number = 3600
  ): Promise<string> {
    const url = await this.storage.uploadScreenshot(filePath, flowName, stepNumber);

    // Extract key from URL
    const urlObj = new URL(url);
    const key = urlObj.pathname.slice(1); // Remove leading slash

    return await this.storage.getSignedUrl(key, expiresIn);
  }
}

