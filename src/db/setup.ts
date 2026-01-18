import { Db } from 'mongodb';

export async function setupDatabase(db: Db): Promise<void> {
  console.log('🔧 Setting up database...');

  // Create time-series collection for test results
  try {
    await db.createCollection('test_results', {
      timeseries: {
        timeField: 'timestamp',
        metaField: 'metadata',
        granularity: 'minutes'
      },
      expireAfterSeconds: 7776000 // 90 days retention
    });
    console.log('✅ Created time-series collection: test_results');
  } catch (error: any) {
    if (error.code === 48) {
      console.log('ℹ️  Time-series collection already exists');
    } else {
      throw error;
    }
  }

  // Create indexes
  const indexPromises = [
    // Test results indexes
    db.collection('test_results').createIndex(
      { 'metadata.flowName': 1, timestamp: -1 },
      { name: 'flow_timeline' }
    ),

    // Vision cache indexes
    db.collection('vision_cache').createIndex(
      { screenshotHash: 1, assertion: 1, model: 1, promptVersion: 1 },
      { unique: true, name: 'cache_lookup' }
    ),
    db.collection('vision_cache').createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0, name: 'cache_ttl' }
    ),

    // Flow definitions indexes
    db.collection('flow_definitions').createIndex(
      { name: 1 },
      { unique: true, name: 'flow_name_unique' }
    ),
    db.collection('flow_definitions').createIndex(
      { intent: 'text', name: 'text', tags: 'text' },
      { name: 'flow_search' }
    ),

    // Usage events indexes
    db.collection('usage_events').createIndex(
      { timestamp: -1 },
      { name: 'event_timeline' }
    ),
    db.collection('usage_events').createIndex(
      { flowName: 1, timestamp: -1 },
      { name: 'flow_usage' }
    )
  ];

  await Promise.all(indexPromises);
  console.log('✅ Created all indexes');

  console.log('✅ Database setup complete');
}
