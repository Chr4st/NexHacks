import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIAnalyzer, analyzeFlowQuick, generateAnalysisReport } from '../ai-analyzer.js';
import type {
  FlowExecutionData,
  DOMSnapshot,
  NetworkRequest,
  ConsoleLog,
  PerformanceMetrics,
  FlowAnalysisResult
} from '../../tracing/types.js';

// Mock Anthropic SDK
const mockCreate = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: mockCreate
    }
  }))
}));

/**
 * Create mock DOM snapshot for testing
 */
function createMockDOMSnapshot(overrides: Partial<DOMSnapshot> = {}): DOMSnapshot {
  return {
    snapshotId: 'dom_0_1234567890',
    stepIndex: 0,
    timestamp: new Date('2024-01-15T10:00:00Z'),
    html: '<html><body><h1>Test Page</h1><button>Click me</button></body></html>',
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
      name: 'Test Page',
      children: [
        { role: 'heading', name: 'Test Page', level: 1 },
        { role: 'button', name: 'Click me' }
      ]
    },
    ...overrides
  };
}

/**
 * Create mock execution data for testing
 */
function createMockExecutionData(overrides: Partial<FlowExecutionData> = {}): FlowExecutionData {
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
    domSnapshots: [createMockDOMSnapshot()],
    networkRequests: [
      {
        requestId: 'req_0',
        stepIndex: 0,
        url: 'https://example.com/',
        method: 'GET',
        statusCode: 200,
        requestHeaders: {},
        responseHeaders: {},
        resourceType: 'document',
        timing: { startTime: 1000, endTime: 1500, durationMs: 500 }
      }
    ],
    consoleLogs: [
      {
        timestamp: new Date('2024-01-15T10:00:00Z'),
        stepIndex: 0,
        type: 'log',
        message: 'Page loaded',
        args: []
      }
    ],
    performanceMetrics: defaultPerformanceMetrics,
    phoenixTraceId: '',
    ...overrides
  };
}

describe('AIAnalyzer', () => {
  let analyzer: AIAnalyzer;

  beforeEach(() => {
    vi.clearAllMocks();
    analyzer = new AIAnalyzer();
  });

  describe('analyzeDOMForUXIssues', () => {
    it('should return issues when accessibility problems found', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{
          type: 'text',
          text: JSON.stringify({
            issues: [
              { type: 'accessibility', severity: 'high', description: 'Button missing accessible label' },
              { type: 'layout', severity: 'medium', description: 'Heading hierarchy skipped' }
            ],
            summary: 'Found 2 UX issues'
          })
        }]
      });

      const snapshot = createMockDOMSnapshot();
      const result = await analyzer.analyzeDOMForUXIssues(snapshot);

      expect(result.issues).toHaveLength(2);
      expect(result.issues[0]?.type).toBe('accessibility');
      expect(result.issues[0]?.severity).toBe('high');
      expect(result.summary).toBe('Found 2 UX issues');
    });

    it('should return empty issues when no problems found', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{
          type: 'text',
          text: JSON.stringify({
            issues: [],
            summary: 'No accessibility issues found'
          })
        }]
      });

      const snapshot = createMockDOMSnapshot();
      const result = await analyzer.analyzeDOMForUXIssues(snapshot);

      expect(result.issues).toHaveLength(0);
      expect(result.summary).toBe('No accessibility issues found');
    });

    it('should handle API errors gracefully', async () => {
      mockCreate.mockRejectedValueOnce(new Error('API rate limit exceeded'));

      const snapshot = createMockDOMSnapshot();
      const result = await analyzer.analyzeDOMForUXIssues(snapshot);

      expect(result.issues).toHaveLength(0);
      expect(result.summary).toContain('Analysis failed');
    });

    it('should handle malformed JSON response', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{
          type: 'text',
          text: 'This is not valid JSON'
        }]
      });

      const snapshot = createMockDOMSnapshot();
      const result = await analyzer.analyzeDOMForUXIssues(snapshot);

      // Should return fallback
      expect(result.issues).toHaveLength(0);
    });
  });

  describe('analyzeNetworkForPerformance', () => {
    it('should identify slow requests', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{
          type: 'text',
          text: JSON.stringify({
            issues: [
              { type: 'performance', severity: 'high', description: 'API endpoint /api/products is slow (2.5s)' }
            ],
            recommendations: ['Consider adding caching', 'Optimize database queries'],
            summary: 'Found 1 slow request'
          })
        }]
      });

      const slowRequests: NetworkRequest[] = [
        {
          requestId: 'req_1',
          stepIndex: 0,
          url: 'https://api.example.com/products',
          method: 'GET',
          statusCode: 200,
          requestHeaders: {},
          responseHeaders: {},
          resourceType: 'fetch',
          timing: { startTime: 1000, endTime: 3500, durationMs: 2500 }
        }
      ];

      const result = await analyzer.analyzeNetworkForPerformance(slowRequests);

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]?.severity).toBe('high');
      expect(result.recommendations).toHaveLength(2);
    });

    it('should identify failed requests', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{
          type: 'text',
          text: JSON.stringify({
            issues: [
              { type: 'performance', severity: 'high', description: 'Critical resource failed to load' }
            ],
            recommendations: ['Check server logs', 'Verify endpoint availability'],
            summary: 'Found 1 failed request'
          })
        }]
      });

      const failedRequests: NetworkRequest[] = [
        {
          requestId: 'req_1',
          stepIndex: 0,
          url: 'https://api.example.com/critical',
          method: 'GET',
          statusCode: 500,
          requestHeaders: {},
          responseHeaders: {},
          resourceType: 'fetch',
          timing: { startTime: 1000, endTime: 1100, durationMs: 100 }
        }
      ];

      const result = await analyzer.analyzeNetworkForPerformance(failedRequests);

      expect(result.issues).toHaveLength(1);
    });

    it('should return simple result when no issues', async () => {
      const goodRequests: NetworkRequest[] = [
        {
          requestId: 'req_1',
          stepIndex: 0,
          url: 'https://example.com/',
          method: 'GET',
          statusCode: 200,
          requestHeaders: {},
          responseHeaders: {},
          resourceType: 'document',
          timing: { startTime: 1000, endTime: 1200, durationMs: 200 }
        }
      ];

      const result = await analyzer.analyzeNetworkForPerformance(goodRequests);

      // Should not call API when no issues
      expect(result.issues).toHaveLength(0);
      expect(result.summary).toContain('all within acceptable parameters');
    });
  });

  describe('analyzeConsoleForErrors', () => {
    it('should identify console errors', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{
          type: 'text',
          text: JSON.stringify({
            issues: [
              { type: 'console', severity: 'high', description: 'TypeError in payment processing module' }
            ],
            summary: 'Found 1 critical console error'
          })
        }]
      });

      const logs: ConsoleLog[] = [
        {
          timestamp: new Date(),
          stepIndex: 0,
          type: 'error',
          message: 'Uncaught TypeError: Cannot read property of undefined',
          args: [],
          stackTrace: 'at PaymentProcessor (checkout.js:42)'
        }
      ];

      const result = await analyzer.analyzeConsoleForErrors(logs);

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]?.type).toBe('console');
      expect(result.issues[0]?.severity).toBe('high');
    });

    it('should return empty when no errors or warnings', async () => {
      const logs: ConsoleLog[] = [
        {
          timestamp: new Date(),
          stepIndex: 0,
          type: 'log',
          message: 'Page loaded successfully',
          args: []
        },
        {
          timestamp: new Date(),
          stepIndex: 0,
          type: 'info',
          message: 'User session started',
          args: []
        }
      ];

      const result = await analyzer.analyzeConsoleForErrors(logs);

      expect(result.issues).toHaveLength(0);
      expect(result.summary).toBe('No console errors or warnings detected.');
    });

    it('should include warnings in analysis', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{
          type: 'text',
          text: JSON.stringify({
            issues: [
              { type: 'console', severity: 'medium', description: 'Deprecation warning for API' }
            ],
            summary: 'Found 1 warning'
          })
        }]
      });

      const logs: ConsoleLog[] = [
        {
          timestamp: new Date(),
          stepIndex: 0,
          type: 'warn',
          message: 'Deprecation warning: This API will be removed in v2',
          args: []
        }
      ];

      const result = await analyzer.analyzeConsoleForErrors(logs);

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]?.severity).toBe('medium');
    });
  });

  describe('analyzeFlowExecution', () => {
    it('should run all analyses in parallel', async () => {
      // Mock all three analysis calls
      mockCreate
        .mockResolvedValueOnce({
          content: [{ type: 'text', text: '{"issues": [{"type": "accessibility", "severity": "high", "description": "Missing alt text"}], "summary": "1 UX issue"}' }]
        })
        .mockResolvedValueOnce({
          content: [{ type: 'text', text: '{"issues": [{"type": "performance", "severity": "medium", "description": "Slow API"}], "recommendations": ["Add caching"], "summary": "1 perf issue"}' }]
        })
        .mockResolvedValueOnce({
          content: [{ type: 'text', text: '{"issues": [{"type": "console", "severity": "high", "description": "JS error"}], "summary": "1 error"}' }]
        });

      const data = createMockExecutionData({
        networkRequests: [
          {
            requestId: 'req_1',
            stepIndex: 0,
            url: 'https://api.example.com/slow',
            method: 'GET',
            statusCode: 200,
            requestHeaders: {},
            responseHeaders: {},
            resourceType: 'fetch',
            timing: { startTime: 1000, endTime: 3000, durationMs: 2000 }
          }
        ],
        consoleLogs: [
          {
            timestamp: new Date(),
            stepIndex: 0,
            type: 'error',
            message: 'JS Error',
            args: []
          }
        ]
      });

      const result = await analyzer.analyzeFlowExecution(data);

      expect(result.flowId).toBe('test-flow-123');
      expect(result.uxIssues).toHaveLength(1);
      expect(result.performanceIssues).toHaveLength(1);
      expect(result.consoleErrors).toHaveLength(1);
      expect(result.recommendations).toHaveLength(1);
    });

    it('should handle flow with no DOM snapshots', async () => {
      const data = createMockExecutionData({
        domSnapshots: []
      });

      const result = await analyzer.analyzeFlowExecution(data);

      expect(result.uxIssues).toHaveLength(0);
    });

    it('should calculate correct execution time', async () => {
      const data = createMockExecutionData({
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T10:00:05Z')
      });

      const result = await analyzer.analyzeFlowExecution(data);

      expect(result.executionTime).toBe(5000);
    });

    it('should count critical issues correctly', async () => {
      mockCreate
        .mockResolvedValueOnce({
          content: [{ type: 'text', text: '{"issues": [{"type": "accessibility", "severity": "high", "description": "Issue 1"}, {"type": "accessibility", "severity": "high", "description": "Issue 2"}], "summary": "2 issues"}' }]
        });

      const data = createMockExecutionData();
      const result = await analyzer.analyzeFlowExecution(data);

      const highSeverityCount = result.uxIssues.filter(i => i.severity === 'high').length;
      expect(highSeverityCount).toBe(2);
    });
  });

  describe('generateUserReport', () => {
    it('should generate markdown report', async () => {
      const analysis: FlowAnalysisResult = {
        flowId: 'test-123',
        flowName: 'checkout-flow',
        verdict: 'pass',
        summary: 'Flow completed successfully with some issues',
        uxIssues: [
          { type: 'accessibility', severity: 'high', description: 'Button missing label' }
        ],
        performanceIssues: [
          { type: 'performance', severity: 'medium', description: 'Slow API call' }
        ],
        consoleErrors: [],
        recommendations: ['Add accessible labels', 'Optimize API'],
        executionTime: 5000
      };

      const report = await analyzer.generateUserReport(analysis);

      expect(report).toContain('# Flow Analysis: checkout-flow');
      expect(report).toContain('## UX Issues (1)');
      expect(report).toContain('## Performance Issues (1)');
      expect(report).toContain('## Recommendations');
      expect(report).toContain('Button missing label');
      expect(report).toContain('Add accessible labels');
    });

    it('should omit empty sections', async () => {
      const analysis: FlowAnalysisResult = {
        flowId: 'test-123',
        flowName: 'clean-flow',
        verdict: 'pass',
        summary: 'Flow completed with no issues',
        uxIssues: [],
        performanceIssues: [],
        consoleErrors: [],
        recommendations: [],
        executionTime: 2000
      };

      const report = await analyzer.generateUserReport(analysis);

      expect(report).toContain('# Flow Analysis: clean-flow');
      expect(report).not.toContain('## UX Issues');
      expect(report).not.toContain('## Performance Issues');
      expect(report).not.toContain('## Console Errors');
      expect(report).not.toContain('## Recommendations');
    });
  });
});

describe('Helper Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeFlowQuick', () => {
    it('should create analyzer and run analysis', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: '{"issues": [], "summary": "No issues"}' }]
      });

      const data = createMockExecutionData();
      const result = await analyzeFlowQuick(data);

      expect(result.flowId).toBe('test-flow-123');
      expect(result.verdict).toBe('pass');
    });
  });

  describe('generateAnalysisReport', () => {
    it('should create analyzer, run analysis, and generate report', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: '{"issues": [], "summary": "No issues"}' }]
      });

      const data = createMockExecutionData();
      const report = await generateAnalysisReport(data);

      expect(report).toContain('# Flow Analysis: test-checkout-flow');
    });
  });
});

describe('JSON Parsing', () => {
  let analyzer: AIAnalyzer;

  beforeEach(() => {
    vi.clearAllMocks();
    analyzer = new AIAnalyzer();
  });

  it('should extract JSON from response with surrounding text', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{
        type: 'text',
        text: 'Here is my analysis:\n\n{"issues": [{"type": "accessibility", "severity": "high", "description": "Test issue"}], "summary": "Found 1 issue"}\n\nLet me know if you need more details.'
      }]
    });

    const snapshot = createMockDOMSnapshot();
    const result = await analyzer.analyzeDOMForUXIssues(snapshot);

    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.description).toBe('Test issue');
  });

  it('should handle markdown code blocks in response', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{
        type: 'text',
        text: '```json\n{"issues": [], "summary": "No issues found"}\n```'
      }]
    });

    const snapshot = createMockDOMSnapshot();
    const result = await analyzer.analyzeDOMForUXIssues(snapshot);

    expect(result.issues).toHaveLength(0);
    expect(result.summary).toBe('No issues found');
  });
});
