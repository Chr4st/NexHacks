import { SpacesStorage } from './spaces.js';
import type { CleanupReport, CleanupPreview } from './types.js';

// Type for storage with metadata method
type StorageWithMetadata = SpacesStorage & {
  listObjectsWithMetadata: (prefix: string) => Promise<Array<{ key: string; lastModified?: Date; size?: number }>>;
};

export class StorageCleaner {
  constructor(private storage: SpacesStorage) {}

  /**
   * Clean up artifacts older than retention period.
   *
   * @param retentionDays - Number of days to retain (default: 30)
   */
  async cleanup(retentionDays: number = 30): Promise<CleanupReport> {
    console.log(`\n🧹 Cleaning up artifacts older than ${retentionDays} days...\n`);

    const report: CleanupReport = {
      screenshotsDeleted: 0,
      reportsDeleted: 0,
      totalDeleted: 0,
      spaceSaved: 0,
    };

    // Clean screenshots
    console.log('Cleaning screenshots...');
    report.screenshotsDeleted = await this.storage.deleteOlderThan(
      'screenshots/',
      retentionDays
    );
    console.log(`  ✓ Deleted ${report.screenshotsDeleted} old screenshots`);

    // Clean reports (keep longer - 60 days)
    console.log('Cleaning reports...');
    report.reportsDeleted = await this.storage.deleteOlderThan(
      'reports/',
      retentionDays * 2
    );
    console.log(`  ✓ Deleted ${report.reportsDeleted} old reports`);

    report.totalDeleted = report.screenshotsDeleted + report.reportsDeleted;

    console.log(`\n✅ Cleanup complete: ${report.totalDeleted} files deleted\n`);

    return report;
  }

  /**
   * Get cleanup preview without deleting.
   */
  async previewCleanup(retentionDays: number = 30): Promise<CleanupPreview> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Use listObjectsWithMetadata to get accurate counts
    const storageWithMetadata = this.storage as StorageWithMetadata;

    const screenshotObjects = await storageWithMetadata.listObjectsWithMetadata('screenshots/');
    const reportObjects = await storageWithMetadata.listObjectsWithMetadata('reports/');

    // Filter by date
    const screenshotsToDelete = screenshotObjects.filter(
      (obj) => obj.lastModified && obj.lastModified < cutoffDate
    ).length;

    const reportsCutoffDate = new Date();
    reportsCutoffDate.setDate(reportsCutoffDate.getDate() - retentionDays * 2);
    const reportsToDelete = reportObjects.filter(
      (obj) => obj.lastModified && obj.lastModified < reportsCutoffDate
    ).length;

    return {
      screenshotsToDelete,
      reportsToDelete,
      totalToDelete: screenshotsToDelete + reportsToDelete,
      cutoffDate,
    };
  }
}

