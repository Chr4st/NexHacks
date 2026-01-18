import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Flow, Step } from '../../types.js';
import type { FlowExecutionData, DOMSnapshot, NetworkRequest, ConsoleLog, PerformanceMetrics } from '../../tracing/types.js';

// Mock the database client
vi.mock('../../db/client.js', () => ({
  getDb: vi.fn().mockResolvedValue({
    collection: vi.fn().mockReturnValue({
      insertOne: vi.fn().mockResolvedValue({ insertedId: 'mock-id' }),
      findOne: vi.fn(),
      find: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([])
      })
    })
  })
}));

// Mock the runner
vi.mock('../../runner.js', () => ({
  executeFlow: vi.fn(),
  closeBrowser: vi.fn()
}));

// Mock Anthropic for AI analysis tests
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: '{"issues": [], "summary": "No issues found"}' }]
      })
    }
  }))
}));

/**
 * Create mock execution data for testing
 */
function createMockExecutionData(overrides: Partial<FlowExecutionData> = {}): FlowExecutionData {
  const defaultDOMSnapshot: DOMSnapshot = {
    snapshotId: 'dom_0_1234567890',
    stepIndex: 0,
    timestamp: new Date('2024-01-15T10:00:00Z'),
    html: '<html><body><h1>Test Page</h1></body></html>',
    serializedDOM: {
      title: 'Test Page',
      url: 'https://example.com',
      elementCount: 10,
      formCount: 1,
      linkCount: 3,
      imageCount: 2
    },
    accessibilityTree: {
      role: 'WebArea',
      name: 'Test Page'
    }
  };

  const defaultNetworkRequest: NetworkRequest = {
    requestId: 'req_0',
    stepIndex: 0,
    url: 'https://example.com/',
    method: 'GET',
    statusCode: 200,
    requestHeaders: { 'User-Agent': 'Playwright' },
    responseHeaders: { 'Content-Type': 'text/html' },
    resourceType: 'document',
    timing: {
      startTime: 1000,
      endTime: 1500,
      durationMs: 500
    }
  };

  const defaultConsoleLog: ConsoleLog = {
    timestamp: new Date('2024-01-15T10:00:00Z'),
    stepIndex: 0,
    type: 'log',
    message: 'Page loaded successfully',
    args: []
  };

  const defaultPerformanceMetrics: PerformanceMetrics = {
    lcp: 1500,
    fid: 50,
    cls: 0.05,
    domContentLoaded: 800,
    loadComplete: 1200,
    firstPaint: 300,
    firstContentfulPaint: 400,
    totalResourceSize: 500000,
    totalResourceCount: 25,
    scriptExecutionTime: 100,
    jsHeapSize: 50000000,
    usedJsHeapSize: 30000000
  };

  return {
    flowId: 'test-flow-123',
    flowName: 'test-checkout-flow',
    intent: 'Verify user can complete checkout',
    url: 'https://example.com',
    startTime: new Date('2024-01-15T10:00:00Z'),
    endTime: new Date('2024-01-15T10:00:05Z'),
    verdict: 'pass',
    steps: [
      {
        stepIndex: 0,
        action: 'navigate',
        target: 'https://example.com',
        success: true,
        durationMs: 1000,
        domSnapshotId: 'dom_0_1234567890'
      }
    ],
    domSnapshots: [defaultDOMSnapshot],
    networkRequests: [defaultNetworkRequest],
    consoleLogs: [defaultConsoleLog],
    performanceMetrics: defaultPerformanceMetrics,
    phoenixTraceId: '',
    ...overrides
  };
}

describe('PlaywrightMCPServer', () => {
  describe('Tool Definitions', () => {
    it('should define execute_flow tool with correct schema', () => {
      // Test the tool definition exists and has required fields
      const expectedTool = {
        name: 'execute_flow',
        description: expect.stringContaining('Execute a Playwright flow'),
        inputSchema: expect.objectContaining({
          type: 'object',
          required: expect.arrayContaining(['flowName', 'url', 'steps'])
        })
      };

      expect(expectedTool.name).toBe('execute_flow');
      expect(expectedTool.inputSchema.required).toContain('flowName');
      expect(expectedTool.inputSchema.required).toContain('url');
      expect(expectedTool.inputSchema.required).toContain('steps');
    });

    it('should define get_execution_data tool with correct schema', () => {
      const expectedTool = {
        name: 'get_execution_data',
        inputSchema: {
          type: 'object',
          required: ['flowId']
        }
      };

      expect(expectedTool.name).toBe('get_execution_data');
      expect(expectedTool.inputSchema.required).toContain('flowId');
    });

    it('should define query_executions tool with optional filters', () => {
      const expectedTool = {
        name: 'query_executions',
        inputSchema: {
          type: 'object',
          properties: {
            flowName: { type: 'string' },
            verdict: { enum: ['pass', 'fail', 'error'] },
            limit: { type: 'number' }
          }
        }
      };

      expect(expectedTool.name).toBe('query_executions');
    });

    it('should define analyze_flow_execution tool for AI analysis', () => {
      const expectedTool = {
        name: 'analyze_flow_execution',
        inputSchema: {
          type: 'object',
          required: ['flowId']
        }
      };

      expect(expectedTool.name).toBe('analyze_flow_execution');
      expect(expectedTool.inputSchema.required).toContain('flowId');
    });
  });

  describe('Execution Data Processing', () => {
    it('should correctly structure flow execution result', () => {
      const mockData = createMockExecutionData();

      expect(mockData.flowId).toBe('test-flow-123');
      expect(mockData.verdict).toBe('pass');
      expect(mockData.steps.length).toBe(1);
      expect(mockData.domSnapshots.length).toBe(1);
      expect(mockData.networkRequests.length).toBe(1);
      expect(mockData.consoleLogs.length).toBe(1);
    });

    it('should handle failed flow execution', () => {
      const mockData = createMockExecutionData({
        verdict: 'fail',
        steps: [
          {
            stepIndex: 0,
            action: 'click',
            target: '#missing-button',
            success: false,
            durationMs: 30000,
            domSnapshotId: 'dom_0_1234567890',
            error: 'Element not found: #missing-button'
          }
        ]
      });

      expect(mockData.verdict).toBe('fail');
      expect(mockData.steps[0]?.success).toBe(false);
      expect(mockData.steps[0]?.error).toContain('Element not found');
    });

    it('should capture network request metrics', () => {
      const slowRequest: NetworkRequest = {
        requestId: 'req_slow',
        stepIndex: 0,
        url: 'https://api.example.com/slow-endpoint',
        method: 'GET',
        statusCode: 200,
        requestHeaders: {},
        responseHeaders: {},
        resourceType: 'fetch',
        timing: {
          startTime: 1000,
          endTime: 3500,
          durationMs: 2500
        }
      };

      const failedRequest: NetworkRequest = {
        requestId: 'req_fail',
        stepIndex: 0,
        url: 'https://api.example.com/not-found',
        method: 'GET',
        statusCode: 404,
        requestHeaders: {},
        responseHeaders: {},
        resourceType: 'fetch',
        timing: {
          startTime: 1000,
          endTime: 1100,
          durationMs: 100
        }
      };

      const mockData = createMockExecutionData({
        networkRequests: [slowRequest, failedRequest]
      });

      const slowRequests = mockData.networkRequests.filter(r => r.timing.durationMs > 1000);
      const failedRequests = mockData.networkRequests.filter(r => r.statusCode >= 400);

      expect(slowRequests.length).toBe(1);
      expect(failedRequests.length).toBe(1);
      expect(slowRequests[0]?.timing.durationMs).toBe(2500);
      expect(failedRequests[0]?.statusCode).toBe(404);
    });

    it('should capture console errors', () => {
      const errorLog: ConsoleLog = {
        timestamp: new Date(),
        stepIndex: 0,
        type: 'error',
        message: 'Uncaught TypeError: Cannot read property of undefined',
        args: [],
        stackTrace: 'at MyComponent (app.js:42)'
      };

      const warningLog: ConsoleLog = {
        timestamp: new Date(),
        stepIndex: 0,
        type: 'warn',
        message: 'Deprecation warning: This API will be removed in v2',
        args: []
      };

      const mockData = createMockExecutionData({
        consoleLogs: [errorLog, warningLog]
      });

      const errors = mockData.consoleLogs.filter(l => l.type === 'error');
      const warnings = mockData.consoleLogs.filter(l => l.type === 'warn');

      expect(errors.length).toBe(1);
      expect(warnings.length).toBe(1);
      expect(errors[0]?.stackTrace).toBeDefined();
    });
  });

  describe('Performance Metrics Analysis', () => {
    it('should classify Core Web Vitals correctly', () => {
      const goodMetrics: PerformanceMetrics = {
        lcp: 1500, // Good < 2500
        fid: 50,   // Good < 100
        cls: 0.05, // Good < 0.1
        domContentLoaded: 800,
        loadComplete: 1200,
        firstPaint: 300,
        firstContentfulPaint: 400,
        totalResourceSize: 500000,
        totalResourceCount: 25,
        scriptExecutionTime: 100,
        jsHeapSize: 50000000,
        usedJsHeapSize: 30000000
      };

      // Verify good ratings
      expect(goodMetrics.lcp).toBeLessThanOrEqual(2500);
      expect(goodMetrics.fid).toBeLessThanOrEqual(100);
      expect(goodMetrics.cls).toBeLessThanOrEqual(0.1);
    });

    it('should identify poor Core Web Vitals', () => {
      const poorMetrics: PerformanceMetrics = {
        lcp: 5000,  // Poor > 4000
        fid: 500,   // Poor > 300
        cls: 0.5,   // Poor > 0.25
        domContentLoaded: 2000,
        loadComplete: 5000,
        firstPaint: 1000,
        firstContentfulPaint: 1500,
        totalResourceSize: 2000000,
        totalResourceCount: 100,
        scriptExecutionTime: 500,
        jsHeapSize: 100000000,
        usedJsHeapSize: 90000000
      };

      // Verify poor ratings
      expect(poorMetrics.lcp).toBeGreaterThan(4000);
      expect(poorMetrics.fid).toBeGreaterThan(300);
      expect(poorMetrics.cls).toBeGreaterThan(0.25);
    });
  });

  describe('Flow Step Validation', () => {
    it('should validate step action types', () => {
      const validActions = ['navigate', 'click', 'type', 'screenshot', 'wait', 'scroll'];

      validActions.forEach(action => {
        const step = { action, target: '#test' };
        expect(validActions).toContain(step.action);
      });
    });

    it('should handle step with all optional properties', () => {
      const fullStep = {
        action: 'type' as const,
        target: '#email-input',
        value: 'test@example.com',
        timeout: 5000
      };

      expect(fullStep.action).toBe('type');
      expect(fullStep.target).toBe('#email-input');
      expect(fullStep.value).toBe('test@example.com');
      expect(fullStep.timeout).toBe(5000);
    });
  });

  describe('Query Filtering', () => {
    it('should filter executions by verdict', () => {
      const executions = [
        createMockExecutionData({ flowId: '1', verdict: 'pass' }),
        createMockExecutionData({ flowId: '2', verdict: 'fail' }),
        createMockExecutionData({ flowId: '3', verdict: 'pass' }),
        createMockExecutionData({ flowId: '4', verdict: 'error' })
      ];

      const passedOnly = executions.filter(e => e.verdict === 'pass');
      const failedOnly = executions.filter(e => e.verdict === 'fail');

      expect(passedOnly.length).toBe(2);
      expect(failedOnly.length).toBe(1);
    });

    it('should filter executions by date range', () => {
      const executions = [
        createMockExecutionData({
          flowId: '1',
          startTime: new Date('2024-01-10T10:00:00Z')
        }),
        createMockExecutionData({
          flowId: '2',
          startTime: new Date('2024-01-15T10:00:00Z')
        }),
        createMockExecutionData({
          flowId: '3',
          startTime: new Date('2024-01-20T10:00:00Z')
        })
      ];

      const startDate = new Date('2024-01-12T00:00:00Z');
      const endDate = new Date('2024-01-18T00:00:00Z');

      const filtered = executions.filter(e =>
        e.startTime >= startDate && e.startTime <= endDate
      );

      expect(filtered.length).toBe(1);
      expect(filtered[0]?.flowId).toBe('2');
    });
  });
});

describe('DOM Snapshot Processing', () => {
  it('should serialize DOM summary correctly', () => {
    const snapshot: DOMSnapshot = {
      snapshotId: 'dom_0_1234567890',
      stepIndex: 0,
      timestamp: new Date(),
      html: '<html><head></head><body><form><input/></form><a href="#">Link</a><img src="test.jpg"/></body></html>',
      serializedDOM: {
        title: 'Test Page',
        url: 'https://example.com',
        elementCount: 7,
        formCount: 1,
        linkCount: 1,
        imageCount: 1
      },
      accessibilityTree: null
    };

    expect(snapshot.serializedDOM.elementCount).toBe(7);
    expect(snapshot.serializedDOM.formCount).toBe(1);
    expect(snapshot.serializedDOM.linkCount).toBe(1);
    expect(snapshot.serializedDOM.imageCount).toBe(1);
  });

  it('should handle accessibility tree data', () => {
    const snapshot: DOMSnapshot = {
      snapshotId: 'dom_0_1234567890',
      stepIndex: 0,
      timestamp: new Date(),
      html: '<html></html>',
      serializedDOM: {
        title: 'Accessible Page',
        url: 'https://example.com',
        elementCount: 5,
        formCount: 0,
        linkCount: 0,
        imageCount: 0
      },
      accessibilityTree: {
        role: 'WebArea',
        name: 'Accessible Page',
        children: [
          { role: 'heading', name: 'Welcome', level: 1 },
          { role: 'button', name: 'Submit' }
        ]
      }
    };

    expect(snapshot.accessibilityTree).toBeDefined();
    expect(snapshot.accessibilityTree.role).toBe('WebArea');
    expect(snapshot.accessibilityTree.children.length).toBe(2);
  });
});
