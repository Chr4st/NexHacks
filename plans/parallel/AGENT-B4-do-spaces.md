# Agent B2: DigitalOcean Spaces Storage — Detailed Specification

**AI Tool:** Cursor Pro
**Branch:** `feat/do-spaces-storage`
**Priority:** P1 (DigitalOcean Sponsor Track - $500)
**Developer:** Team B (Developer 2)
**Dependencies:** None (Independent - Can start Day 1)
**Estimated Effort:** 1-2 days

---

## Mission

Implement **cloud-native storage** using DigitalOcean Spaces (S3-compatible) for:

1. **Screenshot uploads** with organized folder structure
2. **HTML report hosting** with public CDN URLs
3. **Private ACL** with signed URL generation for security
4. **Automatic cleanup** of old artifacts (30-day retention)
5. **Droplet setup automation** for CI runners

This module is CRITICAL for the **DigitalOcean $500 sponsor prize** by demonstrating heavy platform usage and cloud-native architecture.

---

## DigitalOcean Services Used

### Spaces (Object Storage)
- S3-compatible API
- Built-in CDN
- $5/month for 250GB
- **Use case:** Store screenshots, reports, artifacts

### Droplets (CI Runners)
- $6/month basic droplet
- **Use case:** Run FlowGuard tests in cloud

### App Platform (Optional)
- **Use case:** Host dashboard (if time permits)

---

## File Structure

```
src/
├── storage/
│   ├── spaces.ts                # Main Spaces client
│   ├── uploader.ts              # Upload utilities
│   ├── cleaner.ts               # Cleanup old artifacts
│   ├── types.ts                 # TypeScript interfaces
│   ├── index.ts                 # Public exports
│   └── __tests__/
│       ├── spaces.test.ts
│       ├── uploader.test.ts
│       └── mock-s3.ts           # Mock S3 for tests
│
scripts/
├── setup-droplet.sh             # Droplet provisioning
└── cleanup-old-artifacts.ts     # Scheduled cleanup

docs/
└── DIGITALOCEAN_SETUP.md        # Setup guide
```

---

## Core Deliverables

### 1. Spaces Client

**File:** `src/storage/spaces.ts`

**Objective:** S3-compatible client for DigitalOcean Spaces

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs/promises';
import path from 'path';
import mime from 'mime-types';

export interface SpacesConfig {
  region: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  cdnEndpoint?: string;
}

export class SpacesStorage {
  private client: S3Client;
  private bucket: string;
  private cdnEndpoint?: string;

  constructor(config: SpacesConfig) {
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    });

    this.bucket = config.bucket;
    this.cdnEndpoint = config.cdnEndpoint;
  }

  /**
   * Upload screenshot to Spaces.
   *
   * @param filePath - Local path to screenshot
   * @param flowName - Flow name for organization
   * @param stepNumber - Step number
   * @returns Public CDN URL
   */
  async uploadScreenshot(
    filePath: string,
    flowName: string,
    stepNumber: number
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ext = path.extname(filePath);
    const key = `screenshots/${flowName}/${timestamp}-step-${stepNumber}${ext}`;

    const fileBuffer = await fs.readFile(filePath);
    const contentType = mime.lookup(filePath) || 'image/png';

    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: 'private', // Use signed URLs for access
      CacheControl: 'max-age=31536000' // 1 year
    }));

    return this.getCDNUrl(key);
  }

  /**
   * Upload HTML report to Spaces.
   *
   * @param htmlContent - Report HTML content
   * @param reportId - Unique report identifier
   * @returns Public CDN URL
   */
  async uploadReport(htmlContent: string, reportId: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const key = `reports/${reportId}-${timestamp}.html`;

    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: Buffer.from(htmlContent, 'utf-8'),
      ContentType: 'text/html; charset=utf-8',
      ACL: 'public-read', // Reports are public
      CacheControl: 'no-cache' // Always fetch fresh
    }));

    return this.getCDNUrl(key);
  }

  /**
   * Upload flow definition YAML.
   */
  async uploadFlowDefinition(
    yamlContent: string,
    flowName: string
  ): Promise<string> {
    const key = `flows/${flowName}.yaml`;

    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: Buffer.from(yamlContent, 'utf-8'),
      ContentType: 'text/yaml',
      ACL: 'private'
    }));

    return this.getCDNUrl(key);
  }

  /**
   * Generate signed URL for private object access.
   *
   * @param key - Object key
   * @param expiresIn - Expiration time in seconds (default: 1 hour)
   * @returns Signed URL
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key
    });

    return await getSignedUrl(this.client, command, { expiresIn });
  }

  /**
   * Delete object from Spaces.
   */
  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key
    }));
  }

  /**
   * List objects with prefix.
   */
  async listObjects(prefix: string): Promise<string[]> {
    const response = await this.client.send(new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix
    }));

    return response.Contents?.map(obj => obj.Key!) || [];
  }

  /**
   * Delete objects older than specified days.
   */
  async deleteOlderThan(prefix: string, days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const response = await this.client.send(new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix
    }));

    const oldObjects = response.Contents?.filter(obj => {
      return obj.LastModified && obj.LastModified < cutoffDate;
    });

    if (!oldObjects || oldObjects.length === 0) {
      return 0;
    }

    // Delete in batches
    for (const obj of oldObjects) {
      await this.deleteObject(obj.Key!);
    }

    return oldObjects.length;
  }

  /**
   * Get CDN URL for object.
   */
  private getCDNUrl(key: string): string {
    if (this.cdnEndpoint) {
      return `${this.cdnEndpoint}/${key}`;
    }

    // Fallback to Spaces endpoint
    const region = this.client.config.region || 'nyc3';
    return `https://${this.bucket}.${region}.digitaloceanspaces.com/${key}`;
  }

  /**
   * Get storage statistics.
   */
  async getStatistics(): Promise<StorageStatistics> {
    const prefixes = ['screenshots/', 'reports/', 'flows/'];
    const stats: StorageStatistics = {
      totalObjects: 0,
      totalSize: 0,
      screenshotCount: 0,
      reportCount: 0,
      flowCount: 0
    };

    for (const prefix of prefixes) {
      const response = await this.client.send(new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix
      }));

      const count = response.Contents?.length || 0;
      const size = response.Contents?.reduce((sum, obj) => sum + (obj.Size || 0), 0) || 0;

      stats.totalObjects += count;
      stats.totalSize += size;

      if (prefix === 'screenshots/') stats.screenshotCount = count;
      if (prefix === 'reports/') stats.reportCount = count;
      if (prefix === 'flows/') stats.flowCount = count;
    }

    return stats;
  }
}

export interface StorageStatistics {
  totalObjects: number;
  totalSize: number;
  screenshotCount: number;
  reportCount: number;
  flowCount: number;
}
```

---

### 2. Upload Utilities

**File:** `src/storage/uploader.ts`

**Objective:** Helper functions for common upload patterns

```typescript
import { SpacesStorage } from './spaces.js';
import path from 'path';
import fs from 'fs/promises';
import chalk from 'chalk';

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

    console.log(chalk.dim(`\n📤 Uploading ${screenshots.length} screenshots to Spaces...`));

    for (const file of screenshots) {
      if (!file.endsWith('.png')) continue;

      const filePath = path.join(screenshotDir, file);

      // Extract step number from filename (e.g., "step-1-screenshot.png")
      const match = file.match(/step-(\d+)/);
      const stepNumber = match ? parseInt(match[1]) : 0;

      try {
        const url = await this.storage.uploadScreenshot(filePath, flowName, stepNumber);
        urls.set(file, url);

        console.log(chalk.green(`  ✓ ${file} → ${url}`));
      } catch (error) {
        console.error(chalk.red(`  ✗ Failed to upload ${file}: ${error}`));
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

    console.log(chalk.green(`\n✅ Report uploaded successfully!`));
    console.log(chalk.bold(`   ${url}`));

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
```

---

### 3. Automated Cleanup

**File:** `src/storage/cleaner.ts`

**Objective:** Clean up old artifacts to save storage costs

```typescript
import { SpacesStorage } from './spaces.js';
import chalk from 'chalk';

export class StorageCleaner {
  constructor(private storage: SpacesStorage) {}

  /**
   * Clean up artifacts older than retention period.
   *
   * @param retentionDays - Number of days to retain (default: 30)
   */
  async cleanup(retentionDays: number = 30): Promise<CleanupReport> {
    console.log(chalk.bold(`\n🧹 Cleaning up artifacts older than ${retentionDays} days...\n`));

    const report: CleanupReport = {
      screenshotsDeleted: 0,
      reportsDeleted: 0,
      totalDeleted: 0,
      spaceSaved: 0
    };

    // Clean screenshots
    console.log(chalk.dim('Cleaning screenshots...'));
    report.screenshotsDeleted = await this.storage.deleteOlderThan(
      'screenshots/',
      retentionDays
    );
    console.log(chalk.green(`  ✓ Deleted ${report.screenshotsDeleted} old screenshots`));

    // Clean reports (keep longer - 60 days)
    console.log(chalk.dim('Cleaning reports...'));
    report.reportsDeleted = await this.storage.deleteOlderThan(
      'reports/',
      retentionDays * 2
    );
    console.log(chalk.green(`  ✓ Deleted ${report.reportsDeleted} old reports`));

    report.totalDeleted = report.screenshotsDeleted + report.reportsDeleted;

    console.log(chalk.bold(`\n✅ Cleanup complete: ${report.totalDeleted} files deleted\n`));

    return report;
  }

  /**
   * Get cleanup preview without deleting.
   */
  async previewCleanup(retentionDays: number = 30): Promise<CleanupPreview> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const screenshots = await this.storage.listObjects('screenshots/');
    const reports = await this.storage.listObjects('reports/');

    return {
      screenshotsToDelete: screenshots.length,
      reportsToDelete: reports.length,
      totalToDelete: screenshots.length + reports.length,
      cutoffDate
    };
  }
}

export interface CleanupReport {
  screenshotsDeleted: number;
  reportsDeleted: number;
  totalDeleted: number;
  spaceSaved: number;
}

export interface CleanupPreview {
  screenshotsToDelete: number;
  reportsToDelete: number;
  totalToDelete: number;
  cutoffDate: Date;
}
```

---

### 4. Droplet Setup Script

**File:** `scripts/setup-droplet.sh`

**Objective:** Automate CI runner setup on DigitalOcean Droplet

```bash
#!/bin/bash
set -e

echo "🚀 Setting up FlowGuard CI Runner on DigitalOcean Droplet"

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 20
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
echo "📦 Installing pnpm..."
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Install Playwright dependencies
echo "📦 Installing Playwright dependencies..."
sudo npx playwright install-deps

# Install Playwright browsers
echo "📦 Installing Playwright browsers..."
npx playwright install

# Clone FlowGuard repository
echo "📦 Cloning FlowGuard..."
git clone https://github.com/YOUR_ORG/flowguard.git /home/flowguard
cd /home/flowguard

# Install dependencies
echo "📦 Installing FlowGuard dependencies..."
pnpm install

# Build project
echo "🔨 Building FlowGuard..."
pnpm build

# Setup environment variables
echo "🔧 Setting up environment..."
cat > .env << EOF
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
MONGODB_URI=${MONGODB_URI}
PHOENIX_ENDPOINT=${PHOENIX_ENDPOINT}
DO_SPACES_KEY=${DO_SPACES_KEY}
DO_SPACES_SECRET=${DO_SPACES_SECRET}
DO_SPACES_BUCKET=${DO_SPACES_BUCKET}
DO_SPACES_REGION=${DO_SPACES_REGION}
BROWSERBASE_API_KEY=${BROWSERBASE_API_KEY}
EOF

# Setup systemd service
echo "🔧 Setting up systemd service..."
sudo cat > /etc/systemd/system/flowguard.service << EOF
[Unit]
Description=FlowGuard CI Runner
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/home/flowguard
ExecStart=/usr/bin/node /home/flowguard/dist/cli.js run --all
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable flowguard.service

echo "✅ FlowGuard CI Runner setup complete!"
echo ""
echo "To start the service:"
echo "  sudo systemctl start flowguard"
echo ""
echo "To view logs:"
echo "  sudo journalctl -u flowguard -f"
```

---

### 5. CLI Integration

**Add to `src/cli.ts`:**

```typescript
program
  .command('storage')
  .description('Manage DigitalOcean Spaces storage')
  .option('--stats', 'Show storage statistics')
  .option('--cleanup', 'Clean up old artifacts')
  .option('--preview', 'Preview cleanup without deleting')
  .option('--retention <days>', 'Retention period in days', '30')
  .action(async (options) => {
    const config = getConfig();

    const storage = new SpacesStorage({
      region: config.DO_SPACES_REGION,
      endpoint: `https://${config.DO_SPACES_REGION}.digitaloceanspaces.com`,
      accessKeyId: config.DO_SPACES_KEY,
      secretAccessKey: config.DO_SPACES_SECRET,
      bucket: config.DO_SPACES_BUCKET,
      cdnEndpoint: config.DO_SPACES_CDN_ENDPOINT
    });

    if (options.stats) {
      const stats = await storage.getStatistics();

      console.log(chalk.bold('\n📊 Storage Statistics\n'));
      console.log(`  Total Objects:    ${stats.totalObjects}`);
      console.log(`  Total Size:       ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Screenshots:      ${stats.screenshotCount}`);
      console.log(`  Reports:          ${stats.reportCount}`);
      console.log(`  Flow Definitions: ${stats.flowCount}\n`);
    } else if (options.preview) {
      const cleaner = new StorageCleaner(storage);
      const preview = await cleaner.previewCleanup(parseInt(options.retention));

      console.log(chalk.bold('\n🔍 Cleanup Preview\n'));
      console.log(`  Cutoff Date:         ${preview.cutoffDate.toISOString()}`);
      console.log(`  Screenshots to delete: ${preview.screenshotsToDelete}`);
      console.log(`  Reports to delete:   ${preview.reportsToDelete}`);
      console.log(`  Total to delete:     ${preview.totalToDelete}\n`);
    } else if (options.cleanup) {
      const cleaner = new StorageCleaner(storage);
      await cleaner.cleanup(parseInt(options.retention));
    } else {
      console.log(chalk.red('Please specify an option: --stats, --cleanup, or --preview'));
    }
  });
```

---

## Testing Strategy

**File:** `src/storage/__tests__/spaces.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { SpacesStorage } from '../spaces.js';
import fs from 'fs/promises';
import path from 'path';

describe('SpacesStorage', () => {
  let storage: SpacesStorage;
  const testScreenshotPath = path.join(__dirname, 'fixtures', 'test.png');

  beforeAll(async () => {
    storage = new SpacesStorage({
      region: process.env.DO_SPACES_REGION || 'nyc3',
      endpoint: `https://${process.env.DO_SPACES_REGION || 'nyc3'}.digitaloceanspaces.com`,
      accessKeyId: process.env.DO_SPACES_KEY!,
      secretAccessKey: process.env.DO_SPACES_SECRET!,
      bucket: process.env.DO_SPACES_BUCKET || 'flowguard-test'
    });

    // Create test screenshot
    await fs.writeFile(testScreenshotPath, Buffer.from('fake-png'));
  });

  afterAll(async () => {
    await fs.unlink(testScreenshotPath);
  });

  it('should upload screenshot and return CDN URL', async () => {
    const url = await storage.uploadScreenshot(testScreenshotPath, 'test-flow', 1);

    expect(url).toContain('digitaloceanspaces.com');
    expect(url).toContain('screenshots/test-flow');
  });

  it('should upload HTML report', async () => {
    const html = '<html><body>Test Report</body></html>';
    const url = await storage.uploadReport(html, 'test-report');

    expect(url).toContain('reports/test-report');
    expect(url).toContain('.html');
  });

  it('should generate signed URL', async () => {
    const url = await storage.uploadScreenshot(testScreenshotPath, 'test-flow', 2);
    const urlObj = new URL(url);
    const key = urlObj.pathname.slice(1);

    const signedUrl = await storage.getSignedUrl(key, 3600);

    expect(signedUrl).toContain('X-Amz-Signature');
    expect(signedUrl).toContain('X-Amz-Expires=3600');
  });

  it('should list objects with prefix', async () => {
    const objects = await storage.listObjects('screenshots/test-flow');

    expect(objects.length).toBeGreaterThan(0);
  });

  it('should get storage statistics', async () => {
    const stats = await storage.getStatistics();

    expect(stats.totalObjects).toBeGreaterThanOrEqual(0);
    expect(stats.totalSize).toBeGreaterThanOrEqual(0);
  });
});
```

---

## Environment Variables

**Add to `.env`:**
```bash
DO_SPACES_REGION=nyc3
DO_SPACES_KEY=<access-key>
DO_SPACES_SECRET=<secret-key>
DO_SPACES_BUCKET=flowguard-artifacts
DO_SPACES_CDN_ENDPOINT=https://flowguard-artifacts.nyc3.cdn.digitaloceanspaces.com
```

---

## Documentation

**File:** `docs/DIGITALOCEAN_SETUP.md`

```markdown
# DigitalOcean Setup Guide

## 1. Create Spaces Bucket

1. Go to DigitalOcean Console → Spaces
2. Click "Create Spaces Bucket"
3. Name: `flowguard-artifacts-{random}`
4. Region: `nyc3` (New York)
5. Enable CDN
6. Create

## 2. Generate API Keys

1. API → Spaces Keys
2. Generate New Key
3. Copy Access Key and Secret
4. Add to `.env`:
   ```bash
   DO_SPACES_KEY=<access-key>
   DO_SPACES_SECRET=<secret-key>
   ```

## 3. Setup Droplet (CI Runner)

```bash
# Create droplet
doctl compute droplet create flowguard-ci \
  --image ubuntu-22-04-x64 \
  --size s-1vcpu-1gb \
  --region nyc3 \
  --ssh-keys <your-ssh-key-id>

# SSH into droplet
ssh root@<droplet-ip>

# Run setup script
curl -fsSL https://raw.githubusercontent.com/YOUR_ORG/flowguard/main/scripts/setup-droplet.sh | bash
```

## 4. Verify Setup

```bash
# Check storage stats
flowguard storage --stats

# Upload test screenshot
flowguard storage --upload test.png
```
```

---

## Acceptance Criteria

- [ ] Screenshots upload to Spaces with organized folder structure
- [ ] HTML reports upload and return CDN URLs
- [ ] Signed URLs work for private screenshots
- [ ] Cleanup script deletes objects older than 30 days
- [ ] Droplet setup script works end-to-end
- [ ] CLI storage commands work
- [ ] Tests pass with mock S3
- [ ] Documentation complete

---

## Dependencies

**Depends on:** None (Independent!)

**Integrates with:**
- Agent A4 (HTML Reports) - Uploads reports to Spaces
- All agents - Uploads screenshots

---

## Quick Start

```bash
# Create branch (Can start Day 1!)
git checkout -b feat/do-spaces-storage

# Install dependencies
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner mime-types

# Setup DO Spaces (see docs/DIGITALOCEAN_SETUP.md)

# Test uploads
npm run build
tsx scripts/test-spaces-upload.ts

# Run tests
npm test src/storage
```

---

## Success Metrics

- ✅ All uploads succeed with <2s latency
- ✅ CDN URLs load instantly
- ✅ Signed URLs work correctly
- ✅ Cleanup automation works
- ✅ Droplet CI runner functional
- ✅ DigitalOcean sponsor prize criteria met

**This module showcases cloud-native architecture!** ☁️
