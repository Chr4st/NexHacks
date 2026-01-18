#!/usr/bin/env tsx
/**
 * Manual test script for Browserbase integration
 * Tests session creation, pool management, and Playwright CDP connection
 */

import { BrowserbaseClient, BrowserbaseSessionPool } from './src/browserbase/index.js';

async function testBrowserbaseIntegration() {
  console.log('🧪 Testing Browserbase Integration\n');

  // Check for required environment variables
  const apiKey = process.env.BROWSERBASE_API_KEY || 'bb_live_-nzxlFuirOXrlqZVN1-Gnx6-cmE';
  const projectId = process.env.BROWSERBASE_PROJECT_ID || '9e32734e-deb9-44fe-9a00-09a1d2c14d4f';

  if (!apiKey || !projectId) {
    console.error('❌ Missing BROWSERBASE_API_KEY or BROWSERBASE_PROJECT_ID');
    process.exit(1);
  }

  console.log(`✓ API Key: ${apiKey.substring(0, 15)}...`);
  console.log(`✓ Project ID: ${projectId}\n`);

  // Test 1: Create Browserbase client
  console.log('📋 Test 1: Create Browserbase client');
  const client = new BrowserbaseClient({
    apiKey,
    projectId,
    region: 'us-east',
  });
  console.log('✓ Client created successfully\n');

  // Test 2: Create a single session
  console.log('📋 Test 2: Create and verify session');
  try {
    const session = await client.createSession({
      keepAlive: true,
    });
    console.log(`✓ Session created: ${session.id}`);
    console.log(`  Status: ${session.status}`);
    console.log(`  Connect URL: ${session.connectUrl.substring(0, 50)}...`);
    console.log(`  Expires: ${session.expiresAt.toISOString()}\n`);

    // Test 3: Get session details
    console.log('📋 Test 3: Retrieve session details');
    const retrieved = await client.getSession(session.id);
    console.log(`✓ Session retrieved: ${retrieved.id}`);
    console.log(`  Status: ${retrieved.status}\n`);

    // Test 4: Test Playwright CDP connection
    console.log('📋 Test 4: Connect Playwright via CDP');
    // Use connectUrl directly from session creation instead of fetching again
    const browser = await import('playwright-core').then(({ chromium }) =>
      chromium.connectOverCDP({ endpointURL: session.connectUrl })
    );
    const contexts = browser.contexts();
    const context = contexts[0];
    console.log('✓ Playwright connected successfully');
    console.log(`  Browser version: ${browser.version()}`);
    console.log(`  Contexts: ${browser.contexts().length}\n`);

    // Test 5: Simple page navigation
    console.log('📋 Test 5: Navigate to test page');
    const page = await context.newPage();
    await page.goto('https://example.com', { waitUntil: 'networkidle', timeout: 30000 });
    const title = await page.title();
    console.log(`✓ Page loaded: ${title}\n`);

    // Cleanup
    await page.close();
    await browser.close();

    // Test 6: Terminate session
    console.log('📋 Test 6: Terminate session');
    const result = await client.terminateSession(session.id);
    console.log('✓ Session terminated');
    if (result.recordingUrl) {
      console.log(`  Recording URL: ${result.recordingUrl}\n`);
    } else {
      console.log('  Recording URL will be available shortly\n');
    }

  } catch (error) {
    console.error('❌ Session test failed:', error);
    throw error;
  }

  // Test 7: Session pool
  console.log('📋 Test 7: Test session pool');
  const pool = new BrowserbaseSessionPool(client, {
    minSessions: 2,
    maxSessions: 5,
    sessionLifetime: 30 * 60 * 1000,
    idleTimeout: 5 * 60 * 1000,
  });

  // Wait for pool to warm
  await new Promise(resolve => setTimeout(resolve, 3000));
  console.log(`✓ Pool initialized: ${JSON.stringify(pool.getStats())}`);

  // Acquire and release
  console.log('📋 Test 8: Acquire and release session from pool');
  const sessionId = await pool.acquire();
  console.log(`✓ Acquired session: ${sessionId}`);
  console.log(`  Pool stats: ${JSON.stringify(pool.getStats())}`);

  await pool.release(sessionId);
  console.log(`✓ Released session: ${sessionId}`);
  console.log(`  Pool stats: ${JSON.stringify(pool.getStats())}\n`);

  // Shutdown
  console.log('📋 Test 9: Shutdown pool');
  await pool.shutdown();
  console.log('✓ Pool shutdown complete\n');

  console.log('✅ All Browserbase integration tests passed!');
}

// Run tests
testBrowserbaseIntegration()
  .then(() => {
    console.log('\n🎉 Integration test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Integration test failed:', error);
    process.exit(1);
  });
