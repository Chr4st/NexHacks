import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { verifyWebhookSignature, createSignature } from '../signature.js';

describe('Webhook Signature Verification', () => {
  const webhookSecret = 'test-webhook-secret-12345';

  describe('verifyWebhookSignature', () => {
    it('should verify valid signature', () => {
      const payload = JSON.stringify({ test: 'data', action: 'opened' });
      const signature = createSignature(payload, webhookSecret);

      expect(verifyWebhookSignature(payload, signature, webhookSecret)).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const invalidSignature = 'sha256=invalid-signature';

      expect(verifyWebhookSignature(payload, invalidSignature, webhookSecret)).toBe(false);
    });

    it('should reject tampered payload', () => {
      const originalPayload = JSON.stringify({ test: 'data' });
      const signature = createSignature(originalPayload, webhookSecret);
      const tamperedPayload = JSON.stringify({ test: 'tampered' });

      expect(verifyWebhookSignature(tamperedPayload, signature, webhookSecret)).toBe(false);
    });

    it('should reject empty signature', () => {
      const payload = JSON.stringify({ test: 'data' });

      expect(verifyWebhookSignature(payload, '', webhookSecret)).toBe(false);
    });

    it('should reject signature without sha256 prefix', () => {
      const payload = JSON.stringify({ test: 'data' });
      const hash = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      expect(verifyWebhookSignature(payload, hash, webhookSecret)).toBe(false);
    });

    it('should handle unicode payloads', () => {
      const payload = JSON.stringify({ message: '你好世界 🚀' });
      const signature = createSignature(payload, webhookSecret);

      expect(verifyWebhookSignature(payload, signature, webhookSecret)).toBe(true);
    });

    it('should handle large payloads', () => {
      const largeData = { items: Array(1000).fill({ id: 1, name: 'test item with some data' }) };
      const payload = JSON.stringify(largeData);
      const signature = createSignature(payload, webhookSecret);

      expect(verifyWebhookSignature(payload, signature, webhookSecret)).toBe(true);
    });
  });

  describe('createSignature', () => {
    it('should create valid sha256 signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const signature = createSignature(payload, webhookSecret);

      expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);
    });

    it('should be deterministic', () => {
      const payload = JSON.stringify({ test: 'data' });
      const sig1 = createSignature(payload, webhookSecret);
      const sig2 = createSignature(payload, webhookSecret);

      expect(sig1).toBe(sig2);
    });

    it('should produce different signatures for different payloads', () => {
      const sig1 = createSignature('payload1', webhookSecret);
      const sig2 = createSignature('payload2', webhookSecret);

      expect(sig1).not.toBe(sig2);
    });

    it('should produce different signatures for different secrets', () => {
      const payload = JSON.stringify({ test: 'data' });
      const sig1 = createSignature(payload, 'secret1');
      const sig2 = createSignature(payload, 'secret2');

      expect(sig1).not.toBe(sig2);
    });
  });
});
