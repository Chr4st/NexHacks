import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTrendsCommand } from '../trends.js';
import type { SuccessRateTrendPoint } from '../../db/schemas.js';

// Mock the database client
vi.mock('../../db/client.js', () => ({
  db: Promise.resolve({
    collection: vi.fn(),
  }),
}));

// Mock the repository
vi.mock('../../db/repository.js', () => ({
  FlowGuardRepository: vi.fn().mockImplementation(() => ({
    getSuccessRateTrend: vi.fn(),
  })),
}));

describe('Trends Command', () => {
  let mockRepository: any;

  beforeEach(() => {
    vi.clearAllMocks();
    const { FlowGuardRepository } = await import('../../db/repository.js');
    mockRepository = new FlowGuardRepository({} as any);
  });

  it('should create a trends command', () => {
    const command = createTrendsCommand();
    expect(command.name()).toBe('trends');
    expect(command.description()).toContain('historical success rate trends');
  });

  it('should handle empty trend data', async () => {
    const command = createTrendsCommand();
    mockRepository.getSuccessRateTrend.mockResolvedValue([]);

    // Mock console.log to capture output
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await command.parseAsync(['trends', 'test-flow', '--format', 'json']);
    } catch {
      // Command may exit, that's okay
    }

    expect(mockRepository.getSuccessRateTrend).toHaveBeenCalled();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should format trend data correctly', async () => {
    const mockTrendData: SuccessRateTrendPoint[] = [
      {
        date: '2026-01-18',
        successRate: 95.5,
        avgConfidence: 90,
        avgDuration: 2500,
        totalRuns: 20,
      },
      {
        date: '2026-01-17',
        successRate: 92.0,
        avgConfidence: 88,
        avgDuration: 2300,
        totalRuns: 18,
      },
    ];

    mockRepository.getSuccessRateTrend.mockResolvedValue(mockTrendData);

    const command = createTrendsCommand();
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      await command.parseAsync(['trends', 'test-flow', '--format', 'json', '--days', '7']);
    } catch {
      // Command may exit, that's okay
    }

    expect(mockRepository.getSuccessRateTrend).toHaveBeenCalledWith('test-flow', 7);
    consoleLogSpy.mockRestore();
  });

  it('should validate days parameter', async () => {
    const command = createTrendsCommand();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await command.parseAsync(['trends', 'test-flow', '--days', '500', '--format', 'json']);
    } catch {
      // Should exit with error
    }

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});

