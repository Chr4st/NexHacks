/**
 * TypeScript interfaces for DigitalOcean Spaces storage
 */

export interface SpacesConfig {
  region: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  cdnEndpoint?: string;
}

export interface StorageStatistics {
  totalObjects: number;
  totalSize: number;
  screenshotCount: number;
  reportCount: number;
  flowCount: number;
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

