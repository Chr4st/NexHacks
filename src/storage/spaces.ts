import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import mime from 'mime-types';
import type { SpacesConfig, StorageStatistics } from './types.js';

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
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: false,
    });

    this.bucket = config.bucket;
    this.cdnEndpoint = config.cdnEndpoint;
  }

  /**
   * Sanitize key to prevent S3 key issues
   */
  private sanitizeKey(unsafeKey: string): string {
    if (!unsafeKey || typeof unsafeKey !== 'string') {
      return 'default';
    }

    // Replace problematic characters with safe alternatives
    let sanitized = unsafeKey
      .replace(/[^a-zA-Z0-9._/-]/g, '-') // Replace special chars with dash
      .replace(/\/+/g, '/') // Collapse multiple slashes
      .replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
      .replace(/\.\./g, '') // Remove path traversal attempts
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes

    // S3 key limit is 1024 bytes (not characters, but close enough for ASCII)
    if (sanitized.length > 1024) {
      sanitized = sanitized.substring(0, 1024);
    }

    // Ensure we don't return empty string
    return sanitized || 'default';
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
    const ext = path.extname(filePath) || '.png';
    const sanitizedFlowName = this.sanitizeKey(flowName);
    const key = this.sanitizeKey(`screenshots/${sanitizedFlowName}/${timestamp}-step-${stepNumber}${ext}`);

    const fileBuffer = await fs.readFile(filePath);
    const contentType = mime.lookup(filePath) || 'image/png';

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        ACL: 'private', // Use signed URLs for access
        CacheControl: 'max-age=31536000', // 1 year
      })
    );

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
    const sanitizedReportId = this.sanitizeKey(reportId);
    const key = this.sanitizeKey(`reports/${sanitizedReportId}-${timestamp}.html`);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: Buffer.from(htmlContent, 'utf-8'),
        ContentType: 'text/html; charset=utf-8',
        ACL: 'public-read', // Reports are public
        CacheControl: 'no-cache', // Always fetch fresh
      })
    );

    return this.getCDNUrl(key);
  }

  /**
   * Upload flow definition YAML.
   */
  async uploadFlowDefinition(
    yamlContent: string,
    flowName: string
  ): Promise<string> {
    const sanitizedFlowName = this.sanitizeKey(flowName);
    const key = this.sanitizeKey(`flows/${sanitizedFlowName}.yaml`);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: Buffer.from(yamlContent, 'utf-8'),
        ContentType: 'text/yaml',
        ACL: 'private',
      })
    );

    return this.getCDNUrl(key);
  }

  /**
   * Generate signed URL for private object access.
   *
   * @param key - Object key
   * @param expiresIn - Expiration time in seconds (default: 1 hour, max 7 days)
   * @returns Signed URL
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    // Validate and clamp expiration time
    // AWS S3 signed URLs max expiration is 7 days (604800 seconds)
    const maxExpiration = 604800; // 7 days
    const minExpiration = 1; // Minimum 1 second
    const validExpiration = Math.max(minExpiration, Math.min(maxExpiration, expiresIn));

    // Validate key
    if (!key || key.trim().length === 0) {
      throw new Error('Key cannot be empty');
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return await getSignedUrl(this.client, command, { expiresIn: validExpiration });
  }

  /**
   * Delete object from Spaces.
   */
  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }

  /**
   * List objects with prefix.
   */
  async listObjects(prefix: string): Promise<string[]> {
    const response = await this.client.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
      })
    );

    return response.Contents?.map((obj) => obj.Key!) || [];
  }

  /**
   * List objects with metadata (for preview operations).
   */
  async listObjectsWithMetadata(prefix: string): Promise<Array<{ key: string; lastModified?: Date; size?: number }>> {
    const response = await this.client.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
      })
    );

    return (
      response.Contents?.map((obj) => ({
        key: obj.Key!,
        lastModified: obj.LastModified,
        size: obj.Size,
      })) || []
    );
  }

  /**
   * Delete objects older than specified days.
   * 
   * @param prefix - Object key prefix
   * @param days - Number of days (must be >= 0)
   * @returns Number of objects deleted
   */
  async deleteOlderThan(prefix: string, days: number): Promise<number> {
    // Validate days parameter
    if (days < 0) {
      days = 0; // Clamp negative values to 0
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const response = await this.client.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
      })
    );

    const oldObjects = response.Contents?.filter((obj) => {
      return obj.LastModified && obj.LastModified < cutoffDate;
    });

    if (!oldObjects || oldObjects.length === 0) {
      return 0;
    }

    // Delete in batches with error handling
    let deletedCount = 0;
    for (const obj of oldObjects) {
      try {
        if (obj.Key) {
          await this.deleteObject(obj.Key);
          deletedCount++;
        }
      } catch (error) {
        // Log error but continue deleting other objects
        console.error(`Failed to delete ${obj.Key}: ${error}`);
      }
    }

    return deletedCount;
  }

  /**
   * Get CDN URL for object.
   */
  private getCDNUrl(key: string): string {
    if (this.cdnEndpoint) {
      // Handle trailing slash in CDN endpoint
      const endpoint = this.cdnEndpoint.endsWith('/') 
        ? this.cdnEndpoint.slice(0, -1) 
        : this.cdnEndpoint;
      // Ensure key doesn't start with slash
      const cleanKey = key.startsWith('/') ? key.slice(1) : key;
      return `${endpoint}/${cleanKey}`;
    }

    // Fallback to Spaces endpoint
    const region = this.client.config.region || 'nyc3';
    const cleanKey = key.startsWith('/') ? key.slice(1) : key;
    return `https://${this.bucket}.${region}.digitaloceanspaces.com/${cleanKey}`;
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
      flowCount: 0,
    };

    for (const prefix of prefixes) {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
        })
      );

      const count = response.Contents?.length || 0;
      const size =
        response.Contents?.reduce((sum, obj) => sum + (obj.Size || 0), 0) || 0;

      stats.totalObjects += count;
      stats.totalSize += size;

      if (prefix === 'screenshots/') stats.screenshotCount = count;
      if (prefix === 'reports/') stats.reportCount = count;
      if (prefix === 'flows/') stats.flowCount = count;
    }

    return stats;
  }
}

