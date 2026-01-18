export { BrowserbaseConfig, ProxyConfig, BrowserbaseSession } from './client.js';

export interface SessionPoolConfig {
  minSessions: number;
  maxSessions: number;
  sessionLifetime: number; // milliseconds
  idleTimeout: number; // milliseconds
  region?: string;
}

export interface PooledSession {
  session: any; // BrowserbaseSession
  createdAt: number;
  lastUsedAt: number;
  useCount: number;
}
