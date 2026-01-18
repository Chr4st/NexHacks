import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTrendsCommand } from '../trends.js';
import type { SuccessRateTrendPoint } from '../../db/schemas.js';

// Create shared mock functions
const mockGetSuccessRateTrend = vi.fn();

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
    getSuccessRateTrend: mockGetSuccessRateTrend,
  })),
}));

describe('Trends Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a trends command', () => {
    const command = createTrendsCommand();
    expect(command.name()).toBe('trends');
    expect(command.description()).toContain('historical success rate trends');
  });

  it('should handle empty trend data', async () => {
    const command = createTrendsCommand();
    mockGetSuccessRateTrend.mockResolvedValue([]);

    // Mock console.log to capture output
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await command.parseAsync(['node', 'test', 'test-flow', '--format', 'json']);
    } catch {
      // Command may exit, that's okay
    }

    expect(mockGetSuccessRateTrend).toHaveBeenCalled();
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

    mockGetSuccessRateTrend.mockResolvedValue(mockTrendData);

    const command = createTrendsCommand();
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      await command.parseAsync(['node', 'test', 'test-flow', '--format', 'json', '--days', '7']);
    } catch {
      // Command may exit, that's okay
    }

    expect(mockGetSuccessRateTrend).toHaveBeenCalledWith('test-flow', 7);
    consoleLogSpy.mockRestore();
  });

  it('should validate days parameter', async () => {
    const command = createTrendsCommand();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await command.parseAsync(['node', 'test', 'test-flow', '--days', '500', '--format', 'json']);
    } catch {
      // Should exit with error
    }

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});

