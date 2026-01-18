#!/usr/bin/env tsx
/**
 * Cleanup script to terminate all active Browserbase sessions
 */

const apiKey = process.env.BROWSERBASE_API_KEY || 'bb_live_-nzxlFuirOXrlqZVN1-Gnx6-cmE';
const projectId = process.env.BROWSERBASE_PROJECT_ID || '9e32734e-deb9-44fe-9a00-09a1d2c14d4f';

async function listSessions() {
  const response = await fetch(`https://www.browserbase.com/v1/sessions?status=RUNNING`, {
    headers: {
      'x-bb-api-key': apiKey,
    },
  });

  if (!response.ok) {
    console.error(`Failed to list sessions: ${response.status}`);
    return [];
  }

  const sessions = await response.json();
  return sessions;
}

async function terminateSession(sessionId: string) {
  const response = await fetch(`https://www.browserbase.com/v1/sessions/${sessionId}`, {
    method: 'POST',
    headers: {
      'x-bb-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      projectId,
      status: 'REQUEST_RELEASE',
    }),
  });

  if (!response.ok) {
    console.error(`Failed to terminate session ${sessionId}: ${response.status}`);
    return false;
  }

  console.log(`✓ Terminated session: ${sessionId}`);
  return true;
}

async function cleanup() {
  console.log('🧹 Cleaning up Browserbase sessions...\n');

  const sessions = await listSessions();
  console.log(`Found ${sessions.length} running sessions\n`);

  for (const session of sessions) {
    await terminateSession(session.id);
  }

  console.log('\n✅ Cleanup complete');
}

cleanup().catch(console.error);
