#!/usr/bin/env node

/**
 * Scheduled cleanup script for old artifacts in DigitalOcean Spaces
 * Run via cron: 0 2 * * * (daily at 2 AM)
 */

import { SpacesStorage } from '../src/storage/spaces.js';
import { StorageCleaner } from '../src/storage/cleaner.js';

const RETENTION_DAYS = 30;

async function main() {
  const region = process.env.DO_SPACES_REGION || 'nyc3';
  const endpoint = `https://${region}.digitaloceanspaces.com`;

  if (!process.env.DO_SPACES_KEY || !process.env.DO_SPACES_SECRET || !process.env.DO_SPACES_BUCKET) {
    console.error('Missing required environment variables:');
    console.error('  DO_SPACES_KEY');
    console.error('  DO_SPACES_SECRET');
    console.error('  DO_SPACES_BUCKET');
    process.exit(1);
  }

  const storage = new SpacesStorage({
    region,
    endpoint,
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
    bucket: process.env.DO_SPACES_BUCKET,
    cdnEndpoint: process.env.DO_SPACES_CDN_ENDPOINT,
  });

  const cleaner = new StorageCleaner(storage);

  try {
    const report = await cleaner.cleanup(RETENTION_DAYS);
    console.log(`Cleanup completed: ${report.totalDeleted} files deleted`);
    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

main();

