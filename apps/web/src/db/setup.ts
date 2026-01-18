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

  // Create vision_cache collection with schema validation
  try {
    await db.createCollection('vision_cache', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['screenshotHash', 'assertion', 'model', 'verdict', 'confidence'],
          properties: {
            screenshotHash: { bsonType: 'string', minLength: 1 },
            assertion: { bsonType: 'string', minLength: 1 },
            model: { bsonType: 'string' },
            verdict: { bsonType: 'bool' },
            confidence: { bsonType: 'number', minimum: 0, maximum: 100 },
            tokens: {
              bsonType: 'object',
              required: ['input', 'output'],
              properties: {
                input: { bsonType: 'number', minimum: 0 },
                output: { bsonType: 'number', minimum: 0 }
              }
            },
            cost: { bsonType: 'number', minimum: 0 },
            hitCount: { bsonType: 'number', minimum: 0 }
          }
        }
      },
      validationAction: 'error'
    });
    console.log('✅ Created vision_cache collection with schema validation');
  } catch (error: any) {
    if (error.code === 48) {
      console.log('ℹ️  Vision cache collection already exists');
    } else {
      throw error;
    }
  }

  // Create flow_definitions collection with schema validation
  try {
    await db.createCollection('flow_definitions', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name', 'intent', 'url', 'steps'],
          properties: {
            name: { bsonType: 'string', minLength: 1 },
            intent: { bsonType: 'string', minLength: 1 },
            url: { bsonType: 'string', minLength: 1 },
            steps: { bsonType: 'array' },
            tags: { bsonType: 'array' },
            critical: { bsonType: 'bool' }
          }
        }
      },
      validationAction: 'error'
    });
    console.log('✅ Created flow_definitions collection with schema validation');
  } catch (error: any) {
    if (error.code === 48) {
      console.log('ℹ️  Flow definitions collection already exists');
    } else {
      throw error;
    }
  }

  // Create usage_events collection with schema validation
  try {
    await db.createCollection('usage_events', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['eventType', 'timestamp'],
          properties: {
            eventType: {
              bsonType: 'string',
              enum: ['flow_run', 'vision_call', 'cache_hit', 'cache_miss']
            },
            cost: { bsonType: 'number', minimum: 0 },
            tokens: { bsonType: 'number', minimum: 0 }
          }
        }
      },
      validationAction: 'error'
    });
    console.log('✅ Created usage_events collection with schema validation');
  } catch (error: any) {
    if (error.code === 48) {
      console.log('ℹ️  Usage events collection already exists');
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
