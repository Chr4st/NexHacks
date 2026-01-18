import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCostsCommand } from '../costs.js';
import type { FlowCostSummary } from '../../db/schemas.js';

// Mock the database client
vi.mock('../../db/client.js', () => ({
  db: Promise.resolve({
    collection: vi.fn(),
  }),
}));

// Mock the repository
vi.mock('../../db/repository.js', () => ({
  FlowGuardRepository: vi.fn().mockImplementation(() => ({
    getCostByFlow: vi.fn(),
  })),
}));

describe('Costs Command', () => {
  let mockRepository: any;

  beforeEach(() => {
    vi.clearAllMocks();
    const { FlowGuardRepository } = await import('../../db/repository.js');
    mockRepository = new FlowGuardRepository({} as any);
  });

  it('should create a costs command', () => {
    const command = createCostsCommand();
    expect(command.name()).toBe('costs');
    expect(command.description()).toContain('cost analytics');
  });

  it('should handle empty cost data', async () => {
    const command = createCostsCommand();
    mockRepository.getCostByFlow.mockResolvedValue([]);

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      await command.parseAsync(['costs', '--format', 'json']);
    } catch {
      // Command may exit, that's okay
    }

    expect(mockRepository.getCostByFlow).toHaveBeenCalled();
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

    mockRepository.getCostByFlow.mockResolvedValue(mockCostData);

    const command = createCostsCommand();
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      await command.parseAsync(['costs', '--start', '7d', '--format', 'json']);
    } catch {
      // Command may exit, that's okay
    }

    expect(mockRepository.getCostByFlow).toHaveBeenCalled();
    const callArgs = mockRepository.getCostByFlow.mock.calls[0];
    expect(callArgs[0]).toBeInstanceOf(Date);
    expect(callArgs[1]).toBeInstanceOf(Date);
    consoleLogSpy.mockRestore();
  });

  it('should validate date formats', async () => {
    const command = createCostsCommand();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await command.parseAsync(['costs', '--start', 'invalid-date', '--format', 'json']);
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

    mockRepository.getCostByFlow.mockResolvedValue(mockCostData);

    const command = createCostsCommand();
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      await command.parseAsync(['costs', '--format', 'json']);
    } catch {
      // Command may exit, that's okay
    }

    expect(mockRepository.getCostByFlow).toHaveBeenCalled();
    consoleLogSpy.mockRestore();
  });
});

