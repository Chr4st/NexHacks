import { BrowserbaseClient, type BrowserbaseSession } from './client.js';
import type { SessionPoolConfig } from './types.js';

interface PooledSession {
  session: BrowserbaseSession;
  createdAt: number;
  lastUsedAt: number;
  useCount: number;
}

export class BrowserbaseSessionPool {
  private client: BrowserbaseClient;
  private config: SessionPoolConfig;
  private idle: Map<string, PooledSession> = new Map();
  private active: Set<string> = new Set();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(client: BrowserbaseClient, config: SessionPoolConfig) {
    this.client = client;
    this.config = config;

    // Start cleanup loop
    this.cleanupInterval = setInterval(() => {
      this.cleanupStale();
    }, 30000); // Every 30 seconds

    // Warm the pool (don't await - let it happen in background)
    this.warmPool().catch(err => {
      console.warn('Failed to warm session pool:', err.message);
    });
  }

  /**
   * Pre-create minimum sessions
   */
  private async warmPool(): Promise<void> {
    console.log(`[Browserbase] Warming session pool (min: ${this.config.minSessions})`);

    const promises = [];
    for (let i = 0; i < this.config.minSessions; i++) {
      promises.push(this.createPooledSession().catch(err => {
        console.warn(`[Browserbase] Failed to create warm session: ${err.message}`);
      }));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Create and add session to pool
   */
  private async createPooledSession(): Promise<PooledSession> {
    const session = await this.client.createSession({
      keepAlive: true,
    });

    const pooled: PooledSession = {
      session,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      useCount: 0,
    };

    this.idle.set(session.id, pooled);

    console.log(`[Browserbase] Created pooled session ${session.id} (pool: ${this.idle.size + this.active.size})`);

    return pooled;
  }

  /**
   * Acquire session from pool or create new
   */
  async acquire(): Promise<string> {
    // Try to get idle session
    const idleSession = this.getIdleSession();
    if (idleSession) {
      this.idle.delete(idleSession.session.id);
      this.active.add(idleSession.session.id);
      idleSession.lastUsedAt = Date.now();
      idleSession.useCount++;

      console.log(`[Browserbase] Acquired session ${idleSession.session.id} from pool (use count: ${idleSession.useCount})`);

      return idleSession.session.id;
    }

    // Create new if under max
    if (this.active.size + this.idle.size < this.config.maxSessions) {
      const pooled = await this.createPooledSession();
      this.idle.delete(pooled.session.id);
      this.active.add(pooled.session.id);
      pooled.lastUsedAt = Date.now();
      pooled.useCount++;

      return pooled.session.id;
    }

    // Wait for available session (up to 60 seconds)
    return await this.waitForSession(60000);
  }

  /**
   * Release session back to pool or destroy if expired
   */
  async release(sessionId: string): Promise<void> {
    this.active.delete(sessionId);

    const pooled = this.findPooledSession(sessionId);
    if (!pooled) {
      console.warn(`[Browserbase] Attempted to release unknown session ${sessionId}`);
      return;
    }

    const age = Date.now() - pooled.createdAt;

    // Destroy if expired or overused
    if (age > this.config.sessionLifetime || pooled.useCount > 50) {
      await this.destroySession(sessionId);
      console.log(`[Browserbase] Destroyed expired session ${sessionId} (age: ${Math.round(age/1000)}s, uses: ${pooled.useCount})`);
      return;
    }

    // Return to pool
    this.idle.set(sessionId, pooled);
    console.log(`[Browserbase] Released session ${sessionId} to pool`);
  }

  /**
   * Get best idle session (newest with fewest uses)
   */
  private getIdleSession(): PooledSession | null {
    const now = Date.now();
    let best: PooledSession | null = null;

    for (const [_sessionId, pooled] of this.idle.entries()) {
      const idleTime = now - pooled.lastUsedAt;

      // Skip if too old
      if (idleTime > this.config.idleTimeout) {
        continue;
      }

      // Pick session with fewest uses (fresher)
      if (!best || pooled.useCount < best.useCount) {
        best = pooled;
      }
    }

    return best;
  }

  /**
   * Wait for session to become available
   */
  private async waitForSession(timeoutMs: number): Promise<string> {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      // Check if any session freed up
      const idleSession = this.getIdleSession();
      if (idleSession) {
        return idleSession.session.id;
      }

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Timeout waiting for available Browserbase session');
  }

  /**
   * Cleanup stale idle sessions
   */
  private async cleanupStale(): Promise<void> {
    const now = Date.now();
    const toDestroy: string[] = [];

    for (const [_sessionId, pooled] of this.idle.entries()) {
      const idleTime = now - pooled.lastUsedAt;
      const age = now - pooled.createdAt;

      if (idleTime > this.config.idleTimeout || age > this.config.sessionLifetime) {
        toDestroy.push(pooled.session.id);
      }
    }

    if (toDestroy.length > 0) {
      console.log(`[Browserbase] Cleaning up ${toDestroy.length} stale sessions`);

      await Promise.all(toDestroy.map(id => this.destroySession(id)));
    }
  }

  /**
   * Destroy session
   */
  private async destroySession(sessionId: string): Promise<void> {
    this.idle.delete(sessionId);
    this.active.delete(sessionId);

    try {
      await this.client.terminateSession(sessionId);
    } catch (error) {
      console.error(`[Browserbase] Failed to destroy session ${sessionId}:`, error);
    }
  }

  /**
   * Find session across idle and active sets
   */
  private findPooledSession(sessionId: string): PooledSession | undefined {
    // Check idle first
    let pooled = this.idle.get(sessionId);
    if (pooled) return pooled;

    // Session might be active - we need to track it differently
    // For now, just return undefined as we can't find metadata for active sessions
    return undefined;
  }

  /**
   * Shutdown pool
   */
  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    const allSessions = [
      ...Array.from(this.idle.keys()),
      ...Array.from(this.active.keys()),
    ];

    console.log(`[Browserbase] Shutting down session pool (${allSessions.length} sessions)`);

    await Promise.all(allSessions.map(id => this.destroySession(id)));
  }

  /**
   * Get pool statistics
   */
  getStats(): { idle: number; active: number; total: number } {
    return {
      idle: this.idle.size,
      active: this.active.size,
      total: this.idle.size + this.active.size,
    };
  }
}
