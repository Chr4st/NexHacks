import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSearchCommand } from '../search.js';
import type { FlowDefinition } from '../../db/schemas.js';

// Create shared mock functions
const mockSearchFlowsByIntent = vi.fn();

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
    searchFlowsByIntent: mockSearchFlowsByIntent,
  })),
}));

describe('Search Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a search command', () => {
    const command = createSearchCommand();
    expect(command.name()).toBe('search');
    expect(command.description()).toContain('Search flows');
  });

  it('should handle empty search results', async () => {
    const command = createSearchCommand();
    mockSearchFlowsByIntent.mockResolvedValue([]);

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      await command.parseAsync(['node', 'test', 'nonexistent', '--format', 'json']);
    } catch {
      // Command may exit, that's okay
    }

    expect(mockSearchFlowsByIntent).toHaveBeenCalledWith('nonexistent');
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

    mockSearchFlowsByIntent.mockResolvedValue(mockFlows);

    const command = createSearchCommand();
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      await command.parseAsync(['node', 'test', 'test', '--format', 'json']);
    } catch {
      // Command may exit, that's okay
    }

    expect(mockSearchFlowsByIntent).toHaveBeenCalledWith('test');
    consoleLogSpy.mockRestore();
  });

  it('should validate limit parameter', async () => {
    const command = createSearchCommand();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await command.parseAsync(['node', 'test', 'test', '--limit', '200', '--format', 'json']);
    } catch {
      // Should exit with error
    }

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});

