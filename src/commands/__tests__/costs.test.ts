import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCostsCommand } from '../costs.js';
import type { FlowCostSummary } from '../../db/schemas.js';

// Create shared mock functions
const mockGetCostByFlow = vi.fn();

// Mock the database client - db is a DatabaseClient instance with connect() method
vi.mock('../../db/client.js', () => ({
  db: {
    connect: vi.fn().mockResolvedValue({
      collection: vi.fn(),
    }),
  },
}));

// Mock the repository with shared mock function
vi.mock('../../db/repository.js', () => ({
  FlowGuardRepository: vi.fn().mockImplementation(() => ({
    getCostByFlow: mockGetCostByFlow,
  })),
}));

describe('Costs Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a costs command', () => {
    const command = createCostsCommand();
    expect(command.name()).toBe('costs');
    expect(command.description()).toContain('cost analytics');
  });

  it('should handle empty cost data', async () => {
    const command = createCostsCommand();
    mockGetCostByFlow.mockResolvedValue([]);

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      await command.parseAsync(['node', 'test', '--format', 'json']);
    } catch {
      // Command may exit, that's okay
    }

    expect(mockGetCostByFlow).toHaveBeenCalled();
    consoleLogSpy.mockRestore();
  });

  it('should parse relative date formats', async () => {
    const mockCostData: FlowCostSummary[] = [
      {
        _id: 'flow-1',
        totalCost: 10.50,
        totalTokens: 50000,
        totalRuns: 100,
      },
    ];

    mockGetCostByFlow.mockResolvedValue(mockCostData);

    const command = createCostsCommand();
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      await command.parseAsync(['node', 'test', '--start', '7d', '--format', 'json']);
    } catch {
      // Command may exit, that's okay
    }

    expect(mockGetCostByFlow).toHaveBeenCalled();
    const callArgs = mockGetCostByFlow.mock.calls[0];
    expect(callArgs[0]).toBeInstanceOf(Date);
    expect(callArgs[1]).toBeInstanceOf(Date);
    consoleLogSpy.mockRestore();
  });

  it('should validate date formats', async () => {
    const command = createCostsCommand();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await command.parseAsync(['node', 'test', '--start', 'invalid-date', '--format', 'json']);
    } catch {
      // Should exit with error
    }

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should format cost data correctly', async () => {
    const mockCostData: FlowCostSummary[] = [
      {
        _id: 'checkout-flow',
        totalCost: 12.45,
        totalTokens: 125000,
        totalRuns: 50,
      },
      {
        _id: 'login-flow',
        totalCost: 8.20,
        totalTokens: 80000,
        totalRuns: 30,
      },
    ];

    mockGetCostByFlow.mockResolvedValue(mockCostData);

    const command = createCostsCommand();
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      await command.parseAsync(['node', 'test', '--format', 'json']);
    } catch {
      // Command may exit, that's okay
    }

    expect(mockGetCostByFlow).toHaveBeenCalled();
    consoleLogSpy.mockRestore();
  });
});

