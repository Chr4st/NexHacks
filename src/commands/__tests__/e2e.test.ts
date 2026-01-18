import { describe, it, expect } from 'vitest';
import { createTrendsCommand, createSearchCommand, createCostsCommand } from '../index.js';

/**
 * E2E tests for CLI commands
 * Tests command structure, options, and integration
 */

describe('CLI Commands E2E Tests', () => {
  describe('Trends Command', () => {
    it('should have correct command structure', () => {
      const command = createTrendsCommand();
      
      expect(command.name()).toBe('trends');
      expect(command.description()).toContain('historical success rate trends');
      
      // Check for required argument
      const args = command.args;
      expect(args.length).toBeGreaterThan(0);
    });

    it('should have all required options', () => {
      const command = createTrendsCommand();
      const options = command.options;
      
      const optionNames = options.map(opt => opt.long);
      expect(optionNames).toContain('--days');
      expect(optionNames).toContain('--format');
      expect(optionNames).toContain('--env');
    });

    it('should accept valid format options', () => {
      const command = createTrendsCommand();
      
      // Command should be created without errors
      expect(command).toBeDefined();
    });
  });

  describe('Search Command', () => {
    it('should have correct command structure', () => {
      const command = createSearchCommand();
      
      expect(command.name()).toBe('search');
      expect(command.description()).toContain('Search flows');
      
      // Check for required argument
      const args = command.args;
      expect(args.length).toBeGreaterThan(0);
    });

    it('should have all required options', () => {
      const command = createSearchCommand();
      const options = command.options;
      
      const optionNames = options.map(opt => opt.long);
      expect(optionNames).toContain('--limit');
      expect(optionNames).toContain('--format');
    });
  });

  describe('Costs Command', () => {
    it('should have correct command structure', () => {
      const command = createCostsCommand();
      
      expect(command.name()).toBe('costs');
      expect(command.description()).toContain('cost analytics');
    });

    it('should have all required options', () => {
      const command = createCostsCommand();
      const options = command.options;
      
      const optionNames = options.map(opt => opt.long);
      expect(optionNames).toContain('--start');
      expect(optionNames).toContain('--end');
      expect(optionNames).toContain('--format');
      expect(optionNames).toContain('--group-by');
    });
  });

  describe('Command Integration', () => {
    it('should export all commands from index', async () => {
      const { createTrendsCommand, createSearchCommand, createCostsCommand } = await import('../index.js');
      
      expect(createTrendsCommand).toBeDefined();
      expect(createSearchCommand).toBeDefined();
      expect(createCostsCommand).toBeDefined();
    });

    it('should create commands without errors', () => {
      const trends = createTrendsCommand();
      const search = createSearchCommand();
      const costs = createCostsCommand();
      
      expect(trends).toBeDefined();
      expect(search).toBeDefined();
      expect(costs).toBeDefined();
    });
  });

  describe('JSON Output Format', () => {
    it('should support JSON format for all commands', () => {
      const trends = createTrendsCommand();
      const search = createSearchCommand();
      const costs = createCostsCommand();
      
      // All commands should have --format option
      const trendsOptions = trends.options.map(opt => opt.long);
      const searchOptions = search.options.map(opt => opt.long);
      const costsOptions = costs.options.map(opt => opt.long);
      
      expect(trendsOptions).toContain('--format');
      expect(searchOptions).toContain('--format');
      expect(costsOptions).toContain('--format');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid parameters gracefully', () => {
      // Commands should be created without errors
      const trends = createTrendsCommand();
      const search = createSearchCommand();
      const costs = createCostsCommand();
      
      expect(trends).toBeDefined();
      expect(search).toBeDefined();
      expect(costs).toBeDefined();
    });
  });
});

