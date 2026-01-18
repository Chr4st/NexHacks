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
    // Validate directory exists
    try {
      const stats = await fs.stat(screenshotDir);
      if (!stats.isDirectory()) {
        throw new Error(`${screenshotDir} is not a directory`);
      }
    } catch (error) {
      throw new Error(`Screenshot directory does not exist: ${screenshotDir}`);
    }

    const screenshots = await fs.readdir(screenshotDir);
    const urls = new Map<string, string>();

    console.log(`\n📤 Uploading ${screenshots.length} screenshots to Spaces...`);

    for (const file of screenshots) {
      if (!file.endsWith('.png')) continue;

      const filePath: string = path.join(screenshotDir, file);

      // Validate file exists and is a file (not directory)
      try {
        const fileStats = await fs.stat(filePath);
        if (!fileStats.isFile()) {
          console.warn(`  ⚠ Skipping ${file} (not a file)`);
          continue;
        }
      } catch (error) {
        console.error(`  ✗ Failed to access ${file}: ${error}`);
        continue;
      }

      // Extract step number from filename (e.g., "step-1-screenshot.png")
      const match = file.match(/step-(\d+)/);
      const stepNumber = match && match[1] ? parseInt(match[1], 10) : 0;

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

    // Extract key from URL with error handling
    let key: string;
    try {
      const urlObj = new URL(url);
      key = urlObj.pathname.slice(1); // Remove leading slash
      
      // Validate key is not empty
      if (!key || key.trim().length === 0) {
        throw new Error(`Invalid key extracted from URL: ${url}`);
      }
    } catch (error) {
      throw new Error(`Failed to parse URL ${url}: ${error}`);
    }

    return await this.storage.getSignedUrl(key, expiresIn);
  }
}

