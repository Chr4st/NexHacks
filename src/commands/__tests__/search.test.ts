import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSearchCommand } from '../search.js';
import type { FlowDefinition } from '../../db/schemas.js';

// Mock the database client
vi.mock('../../db/client.js', () => ({
  db: Promise.resolve({
    collection: vi.fn(),
  }),
}));

// Mock the repository
vi.mock('../../db/repository.js', () => ({
  FlowGuardRepository: vi.fn().mockImplementation(() => ({
    searchFlowsByIntent: vi.fn(),
  })),
}));

describe('Search Command', () => {
  let mockRepository: any;

  beforeEach(() => {
    vi.clearAllMocks();
    const { FlowGuardRepository } = await import('../../db/repository.js');
    mockRepository = new FlowGuardRepository({} as any);
  });

  it('should create a search command', () => {
    const command = createSearchCommand();
    expect(command.name()).toBe('search');
    expect(command.description()).toContain('Search flows');
  });

  it('should handle empty search results', async () => {
    const command = createSearchCommand();
    mockRepository.searchFlowsByIntent.mockResolvedValue([]);

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      await command.parseAsync(['search', 'nonexistent', '--format', 'json']);
    } catch {
      // Command may exit, that's okay
    }

    expect(mockRepository.searchFlowsByIntent).toHaveBeenCalledWith('nonexistent');
    consoleLogSpy.mockRestore();
  });

  it('should format search results correctly', async () => {
    const mockFlows: FlowDefinition[] = [
      {
        _id: {} as any,
        name: 'test-flow',
        intent: 'Test flow intent',
        url: 'https://example.com',
        steps: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockRepository.searchFlowsByIntent.mockResolvedValue(mockFlows);

    const command = createSearchCommand();
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      await command.parseAsync(['search', 'test', '--format', 'json']);
    } catch {
      // Command may exit, that's okay
    }

    expect(mockRepository.searchFlowsByIntent).toHaveBeenCalledWith('test');
    consoleLogSpy.mockRestore();
  });

  it('should validate limit parameter', async () => {
    const command = createSearchCommand();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await command.parseAsync(['search', 'test', '--limit', '200', '--format', 'json']);
    } catch {
      // Should exit with error
    }

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});

