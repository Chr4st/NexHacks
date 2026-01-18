/**
 * Test MongoDB connection and basic operations
 * Uses in-memory MongoDB if production connection fails
 */
import { MongoClient, Db } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { FlowGuardRepository } from '../src/db/repository.js';

async function testDatabaseConnection() {
  console.log('🔌 Testing MongoDB connection...\n');

  let mongoServer: MongoMemoryServer | null = null;
  let client: MongoClient | null = null;
  let database: Db;

  try {
    // Try production connection first
    const productionUri = process.env.MONGODB_URI;

    if (productionUri) {
      console.log('Attempting production MongoDB connection...');
      try {
        client = new MongoClient(productionUri, {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000,
        });
        await client.connect();
        database = client.db(process.env.MONGODB_DATABASE || 'flowguard');
        console.log('✅ Connected to production MongoDB\n');
      } catch (prodError) {
        console.log(`⚠️  Production connection failed: ${prodError instanceof Error ? prodError.message : prodError}`);
        console.log('Falling back to in-memory MongoDB...\n');

        // Fallback to in-memory
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        client = new MongoClient(uri);
        await client.connect();
        database = client.db('flowguard-test');
        console.log('✅ Connected to in-memory MongoDB\n');
      }
    } else {
      console.log('No MONGODB_URI set, using in-memory MongoDB...');
      mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      client = new MongoClient(uri);
      await client.connect();
      database = client.db('flowguard-test');
      console.log('✅ Connected to in-memory MongoDB\n');
    }

    // Create repository
    const repository = new FlowGuardRepository(database);

    // Test basic operations
    console.log('📊 Testing basic operations...\n');

    // 1. Test listing collections
    const collections = await database.listCollections().toArray();
    console.log(`Found ${collections.length} collections`);

    // 2. Test saving and retrieving flow definition
    console.log('\nTesting flow definitions...');
    const flowId = await repository.saveFlow({
      name: 'test-flow',
      intent: 'Test the login flow works correctly',
      url: 'https://example.com',
      viewport: { width: 1280, height: 720 },
      steps: [
        { action: 'navigate', target: 'https://example.com/login' },
        { action: 'type', target: '#email', value: 'test@example.com' },
        { action: 'click', target: '#submit' },
      ],
      tags: ['auth', 'login'],
      critical: true,
    });
    console.log(`  Created flow with ID: ${flowId}`);

    const flow = await repository.getFlow('test-flow');
    console.log(`  Retrieved flow: ${flow?.name}`);

    // 3. Test cache operations
    console.log('\nTesting vision cache...');
    await repository.cacheVisionResult({
      screenshotHash: 'abc123',
      assertion: 'Login button is visible',
      model: 'claude-3-5-sonnet',
      promptVersion: 'v1.0',
      verdict: true,
      confidence: 95,
      reasoning: 'The login button is clearly visible',
      tokens: { input: 1000, output: 100 },
      cost: 0.001,
    });
    console.log('  Cache entry created');

    const cacheStats = await repository.getCacheStats();
    console.log(`  Cache stats: ${cacheStats.totalEntries} entries`);

    // 4. Test usage tracking
    console.log('\nTesting usage tracking...');
    await repository.trackUsage({
      eventType: 'flow_run',
      flowName: 'test-flow',
      cost: 0.05,
      tokens: 5000,
    });
    console.log('  Usage event tracked');

    // 5. Test A/B experiments
    console.log('\nTesting A/B experiments...');
    await repository.saveABExperiment({
      experimentId: 'exp-001',
      name: 'Prompt v1 vs v2',
      description: 'Testing new prompt structure',
      runAt: new Date(),
      promptVersions: {
        control: { version: 'v1.0', systemPrompt: 'You are a UX tester...' },
        variant: { version: 'v2.0', systemPrompt: 'You are an expert UX analyst...' },
      },
      control: {
        accuracy: 0.85,
        precision: 0.9,
        recall: 0.8,
        f1Score: 0.85,
        avgTokens: 1200,
        avgCost: 0.02,
        avgLatency: 2000,
        phoenixTraceIds: ['trace-1', 'trace-2'],
      },
      variant: {
        accuracy: 0.92,
        precision: 0.94,
        recall: 0.9,
        f1Score: 0.92,
        avgTokens: 1400,
        avgCost: 0.025,
        avgLatency: 2200,
        phoenixTraceIds: ['trace-3', 'trace-4'],
      },
      winner: 'variant',
      statisticalSignificance: { pValue: 0.03, significant: true },
    });
    console.log('  A/B experiment saved');

    const abExperiments = await repository.getRecentABExperiments(5);
    console.log(`  Retrieved ${abExperiments.length} A/B experiments`);

    // 6. Test search
    console.log('\nTesting search...');
    const searchResults = await repository.searchFlowsByIntent('login');
    console.log(`  Found ${searchResults.length} flows matching "login"`);

    console.log('\n✅ All database tests passed!\n');

    // Cleanup
    if (client) {
      await client.close();
      console.log('✅ Disconnected from MongoDB');
    }
    if (mongoServer) {
      await mongoServer.stop();
      console.log('✅ In-memory MongoDB stopped');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database test failed:', error instanceof Error ? error.message : error);
    console.error(error);

    // Cleanup on error
    if (client) await client.close().catch(() => {});
    if (mongoServer) await mongoServer.stop().catch(() => {});

    process.exit(1);
  }
}

testDatabaseConnection();
