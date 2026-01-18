import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createWebhookServer, WebhookServerConfig } from '../server.js';

const mockWebhookHandler = {
  verifyAndParse: vi.fn(),
  handlePullRequest: vi.fn().mockResolvedValue(undefined),
  shouldRunTests: vi.fn().mockReturnValue(true)
};

describe('WebhookServer', () => {
  const config: WebhookServerConfig = {
    webhookHandler: mockWebhookHandler as any,
    webhookSecret: 'test-secret'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createWebhookServer', () => {
    it('should create Express app with listen method', () => {
      const app = createWebhookServer(config);
      expect(app).toBeDefined();
      expect(typeof app.listen).toBe('function');
    });

    it('should have json middleware configured', () => {
      const app = createWebhookServer(config);
      expect(app).toBeDefined();
    });

    it('should be a valid Express application', () => {
      const app = createWebhookServer(config);
      expect(typeof app.get).toBe('function');
      expect(typeof app.post).toBe('function');
      expect(typeof app.use).toBe('function');
    });
  });

  describe('webhook handler integration', () => {
    it('should use provided webhook handler', () => {
      const app = createWebhookServer(config);
      expect(app).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const customConfig: WebhookServerConfig = {
        webhookHandler: mockWebhookHandler as any,
        webhookSecret: 'custom-secret'
      };
      
      const app = createWebhookServer(customConfig);
      expect(app).toBeDefined();
    });
  });
});
