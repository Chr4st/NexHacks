import { chromium, type Browser, type BrowserContext } from 'playwright-core';
import { promises as fs } from 'node:fs';

export interface BrowserbaseConfig {
  apiKey: string;
  projectId: string;
  baseUrl?: string;
  region?: 'us-east' | 'us-west' | 'eu-west' | 'ap-southeast';
  enableStealth?: boolean;
  proxyConfig?: ProxyConfig;
}

export interface ProxyConfig {
  type: 'residential' | 'datacenter' | 'mobile';
  country?: string;
}

export interface BrowserbaseSession {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  connectUrl: string;
  recordingUrl?: string;
  createdAt: Date;
  expiresAt: Date;
  metadata?: Record<string, unknown>;
}

export class BrowserbaseClient {
  private apiKey: string;
  private projectId: string;
  private baseUrl: string;

  constructor(config: BrowserbaseConfig) {
    this.apiKey = config.apiKey;
    this.projectId = config.projectId;
    this.baseUrl = config.baseUrl || 'https://www.browserbase.com';
  }

  /**
   * Create a new Browserbase session
   */
  async createSession(options: {
    extensionId?: string;
    browserSettings?: Record<string, unknown>;
    timeout?: number;
    keepAlive?: boolean;
    proxies?: boolean | ProxyConfig[];
    region?: 'us-west-2' | 'us-east-1' | 'eu-central-1' | 'ap-southeast-1';
    userMetadata?: Record<string, unknown>;
  } = {}): Promise<BrowserbaseSession> {
    const response = await fetch(`${this.baseUrl}/v1/sessions`, {
      method: 'POST',
      headers: {
        'x-bb-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId: this.projectId,
        ...options,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BrowserbaseError(
        `Failed to create session: ${response.status} ${error}`,
        response.status
      );
    }

    const data = await response.json();
    return {
      id: data.id,
      status: data.status,
      connectUrl: data.connectUrl,
      createdAt: new Date(data.createdAt),
      expiresAt: new Date(data.expiresAt),
    };
  }

  /**
   * Get session status and recording URL
   */
  async getSession(sessionId: string): Promise<BrowserbaseSession> {
    const response = await fetch(`${this.baseUrl}/v1/sessions/${sessionId}`, {
      headers: {
        'x-bb-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new BrowserbaseError(
        `Failed to get session: ${response.status}`,
        response.status
      );
    }

    const data = await response.json();
    return {
      id: data.id,
      status: data.status,
      connectUrl: data.connectUrl,
      recordingUrl: data.recordingUrl,
      createdAt: new Date(data.createdAt),
      expiresAt: new Date(data.expiresAt),
    };
  }

  /**
   * Connect Playwright to Browserbase session via CDP
   */
  async connectPlaywright(sessionId: string): Promise<{ browser: Browser; context: BrowserContext }> {
    const session = await this.getSession(sessionId);

    if (!session.connectUrl) {
      throw new BrowserbaseError('Session connectUrl is missing', 500);
    }

    const browser = await chromium.connectOverCDP({
      endpointURL: session.connectUrl,
    });

    // Use the default context provided by Browserbase (has fingerprinting configured)
    const contexts = browser.contexts();
    if (contexts.length === 0) {
      throw new BrowserbaseError('No browser context available', 500);
    }

    const context = contexts[0];
    if (!context) {
      throw new BrowserbaseError('Browser context is undefined', 500);
    }
    return { browser, context };
  }

  /**
   * Terminate session and retrieve recording
   */
  async terminateSession(sessionId: string): Promise<{ recordingUrl?: string }> {
    const response = await fetch(`${this.baseUrl}/v1/sessions/${sessionId}`, {
      method: 'POST',
      headers: {
        'x-bb-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId: this.projectId,
        status: 'REQUEST_RELEASE',
      }),
    });

    if (!response.ok) {
      throw new BrowserbaseError(
        `Failed to terminate session: ${response.status}`,
        response.status
      );
    }

    const data = await response.json();
    return { recordingUrl: data.recordingUrl };
  }

  /**
   * Download session recording HAR file
   */
  async downloadHAR(sessionId: string, outputPath: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/v1/sessions/${sessionId}/har`, {
      headers: {
        'x-bb-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new BrowserbaseError(
        `Failed to download HAR: ${response.status}`,
        response.status
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    await fs.writeFile(outputPath, Buffer.from(arrayBuffer));
  }
}

export class BrowserbaseError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = 'BrowserbaseError';
  }

  isRetryable(): boolean {
    // Retry on 503 Service Unavailable, 429 Too Many Requests
    return this.statusCode === 503 || this.statusCode === 429;
  }
}
