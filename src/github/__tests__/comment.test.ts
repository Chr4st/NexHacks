import { describe, it, expect } from 'vitest';
import { CommentGenerator } from '../comment-generator.js';
import type { FlowGuardResult } from '../types.js';

describe('CommentGenerator', () => {
  const generator = new CommentGenerator();

  describe('generateComment', () => {
    it('should include flowguard marker', () => {
      const results: FlowGuardResult[] = [];
      const comment = generator.generateComment(results);

      expect(comment).toContain('<!-- flowguard-report -->');
    });

    it('should show success message when all tests pass', () => {
      const results: FlowGuardResult[] = [
        {
          flowName: 'checkout-flow',
          passed: true,
          duration: 5000,
          steps: [{ name: 'Navigate to cart', passed: true }]
        },
        {
          flowName: 'login-flow',
          passed: true,
          duration: 3000,
          steps: [{ name: 'Enter credentials', passed: true }]
        }
      ];

      const comment = generator.generateComment(results);

      expect(comment).toContain('✅');
      expect(comment).toContain('All Tests Passed');
      expect(comment).toContain('2/2');
    });

    it('should show failure message when any test fails', () => {
      const results: FlowGuardResult[] = [
        {
          flowName: 'checkout-flow',
          passed: true,
          duration: 5000,
          steps: [{ name: 'Navigate to cart', passed: true }]
        },
        {
          flowName: 'login-flow',
          passed: false,
          duration: 3000,
          steps: [
            { name: 'Enter credentials', passed: true },
            { name: 'Submit form', passed: false, error: 'Button not found' }
          ]
        }
      ];

      const comment = generator.generateComment(results);

      expect(comment).toContain('❌');
      expect(comment).toContain('Tests Failed');
      expect(comment).toContain('1/2');
    });

    it('should list all flows with their status', () => {
      const results: FlowGuardResult[] = [
        {
          flowName: 'checkout-flow',
          passed: true,
          duration: 5000,
          steps: []
        },
        {
          flowName: 'login-flow',
          passed: false,
          duration: 3000,
          steps: []
        }
      ];

      const comment = generator.generateComment(results);

      expect(comment).toContain('checkout-flow');
      expect(comment).toContain('login-flow');
    });

    it('should show duration for each flow', () => {
      const results: FlowGuardResult[] = [
        {
          flowName: 'checkout-flow',
          passed: true,
          duration: 5500,
          steps: []
        }
      ];

      const comment = generator.generateComment(results);

      expect(comment).toContain('5.50s');
    });

    it('should show failed steps with error messages', () => {
      const results: FlowGuardResult[] = [
        {
          flowName: 'checkout-flow',
          passed: false,
          duration: 5000,
          steps: [
            { name: 'Add to cart', passed: true },
            { name: 'Proceed to checkout', passed: false, error: 'Element not visible' }
          ]
        }
      ];

      const comment = generator.generateComment(results);

      expect(comment).toContain('Proceed to checkout');
      expect(comment).toContain('Element not visible');
    });

    it('should include report URL when provided', () => {
      const results: FlowGuardResult[] = [
        {
          flowName: 'checkout-flow',
          passed: true,
          duration: 5000,
          steps: [],
          reportUrl: 'https://cdn.example.com/reports/checkout-123.html'
        }
      ];

      const comment = generator.generateComment(results);

      expect(comment).toContain('https://cdn.example.com/reports/checkout-123.html');
    });

    it('should handle empty results', () => {
      const comment = generator.generateComment([]);

      expect(comment).toContain('<!-- flowguard-report -->');
      expect(comment).toContain('0/0');
    });

    it('should show total duration', () => {
      const results: FlowGuardResult[] = [
        { flowName: 'flow1', passed: true, duration: 3000, steps: [] },
        { flowName: 'flow2', passed: true, duration: 2000, steps: [] }
      ];

      const comment = generator.generateComment(results);

      expect(comment).toContain('5.00s');
    });
  });

  describe('generateCheckRunSummary', () => {
    it('should generate markdown summary', () => {
      const results: FlowGuardResult[] = [
        {
          flowName: 'checkout-flow',
          passed: true,
          duration: 5000,
          steps: [{ name: 'Add to cart', passed: true }]
        }
      ];

      const summary = generator.generateCheckRunSummary(results);

      expect(summary).toContain('FlowGuard');
      expect(summary).toContain('checkout-flow');
    });

    it('should include failure details in summary', () => {
      const results: FlowGuardResult[] = [
        {
          flowName: 'login-flow',
          passed: false,
          duration: 3000,
          steps: [
            { name: 'Submit', passed: false, error: 'Timeout waiting for element' }
          ]
        }
      ];

      const summary = generator.generateCheckRunSummary(results);

      expect(summary).toContain('Timeout waiting for element');
    });
  });
});
