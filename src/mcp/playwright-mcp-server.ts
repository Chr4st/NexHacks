import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { Flow, Step, StepAction } from '../types.js';
import { executeFlow, closeBrowser } from '../runner.js';
import { ExecutionDataStorage } from '../tracing/execution-data-storage.js';
import { getDb } from '../db/client.js';
import { FlowGuardRepository } from '../db/repository.js';
import { AIAnalyzer } from '../analysis/ai-analyzer.js';
import type { FlowExecutionData } from '../tracing/types.js';

/**
 * PlaywrightMCPServer exposes Playwright flow execution capabilities
 * through the Model Context Protocol (MCP) for AI agent integration.
 *
 * Tools exposed:
 * - execute_flow: Execute a Playwright flow and capture all execution data
 * - get_execution_data: Retrieve captured execution data for a flow run
 * - query_executions: Query flow executions by filters
 */
export class PlaywrightMCPServer {
  private server: Server;
  private repository: FlowGuardRepository | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'flowguard-playwright',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  /**
   * Initialize database connection and repository
   */
  private async initRepository(): Promise<FlowGuardRepository> {
    if (!this.repository) {
      const db = await getDb();
      this.repository = new FlowGuardRepository(db);
    }
    return this.repository;
  }

  /**
   * Setup MCP tool request handlers
   */
  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'execute_flow',
          description: 'Execute a Playwright flow and capture all execution data (DOM snapshots, network requests, console logs, performance metrics). Returns execution ID for retrieving captured data.',
          inputSchema: {
            type: 'object',
            properties: {
              flowName: {
                type: 'string',
                description: 'Name identifier for this flow execution'
              },
              intent: {
                type: 'string',
                description: 'Natural language description of what this flow tests (e.g., "User can complete checkout process")'
              },
              url: {
                type: 'string',
                description: 'Starting URL for the flow'
              },
              steps: {
                type: 'array',
                description: 'Steps to execute in sequence',
                items: {
                  type: 'object',
                  properties: {
                    action: {
                      type: 'string',
                      enum: ['navigate', 'click', 'type', 'scroll', 'wait', 'screenshot'],
                      description: 'Action type to perform'
                    },
                    target: {
                      type: 'string',
                      description: 'CSS selector for click/type actions, or URL for navigate'
                    },
                    value: {
                      type: 'string',
                      description: 'Value to type (for type action) or scroll amount (for scroll action)'
                    },
                    timeout: {
                      type: 'number',
                      description: 'Optional timeout in milliseconds (default: 30000)'
                    }
                  },
                  required: ['action']
                }
              },
              viewport: {
                type: 'object',
                description: 'Optional viewport dimensions',
                properties: {
                  width: { type: 'number' },
                  height: { type: 'number' }
                }
              }
            },
            required: ['flowName', 'url', 'steps']
          }
        },
        {
          name: 'get_execution_data',
          description: 'Retrieve captured execution data for a flow run, including DOM snapshots, network requests, console logs, and performance metrics.',
          inputSchema: {
            type: 'object',
            properties: {
              flowId: {
                type: 'string',
                description: 'Flow execution ID returned from execute_flow'
              },
              includeHtml: {
                type: 'boolean',
                description: 'Whether to include full HTML in DOM snapshots (default: false, as it can be large)'
              }
            },
            required: ['flowId']
          }
        },
        {
          name: 'query_executions',
          description: 'Query flow executions by filters to find past runs',
          inputSchema: {
            type: 'object',
            properties: {
              flowName: {
                type: 'string',
                description: 'Filter by flow name'
              },
              verdict: {
                type: 'string',
                enum: ['pass', 'fail', 'error'],
                description: 'Filter by execution verdict'
              },
              limit: {
                type: 'number',
                description: 'Maximum number of results to return (default: 10)'
              },
              startDate: {
                type: 'string',
                description: 'Filter executions after this ISO date'
              },
              endDate: {
                type: 'string',
                description: 'Filter executions before this ISO date'
              }
            }
          }
        },
        {
          name: 'get_dom_snapshot',
          description: 'Get a specific DOM snapshot from a flow execution by snapshot ID',
          inputSchema: {
            type: 'object',
            properties: {
              flowId: {
                type: 'string',
                description: 'Flow execution ID'
              },
              snapshotId: {
                type: 'string',
                description: 'DOM snapshot ID (e.g., "dom_0_1234567890")'
              }
            },
            required: ['flowId', 'snapshotId']
          }
        },
        {
          name: 'get_network_logs',
          description: 'Get network request/response logs from a flow execution',
          inputSchema: {
            type: 'object',
            properties: {
              flowId: {
                type: 'string',
                description: 'Flow execution ID'
              },
              filter: {
                type: 'object',
                description: 'Optional filters for network logs',
                properties: {
                  statusCode: {
                    type: 'number',
                    description: 'Filter by HTTP status code'
                  },
                  resourceType: {
                    type: 'string',
                    enum: ['document', 'script', 'stylesheet', 'image', 'xhr', 'fetch'],
                    description: 'Filter by resource type'
                  },
                  slowOnly: {
                    type: 'boolean',
                    description: 'Only return requests slower than 1 second'
                  },
                  failedOnly: {
                    type: 'boolean',
                    description: 'Only return failed requests (status >= 400)'
                  }
                }
              }
            },
            required: ['flowId']
          }
        },
        {
          name: 'get_console_logs',
          description: 'Get console logs from a flow execution',
          inputSchema: {
            type: 'object',
            properties: {
              flowId: {
                type: 'string',
                description: 'Flow execution ID'
              },
              type: {
                type: 'string',
                enum: ['log', 'info', 'warn', 'error', 'debug'],
                description: 'Filter by log type'
              },
              errorsOnly: {
                type: 'boolean',
                description: 'Only return errors and warnings'
              }
            },
            required: ['flowId']
          }
        },
        {
          name: 'get_performance_metrics',
          description: 'Get performance metrics (Core Web Vitals, timing data) from a flow execution',
          inputSchema: {
            type: 'object',
            properties: {
              flowId: {
                type: 'string',
                description: 'Flow execution ID'
              }
            },
            required: ['flowId']
          }
        },
        {
          name: 'analyze_flow_execution',
          description: 'Get AI-powered analysis of flow execution data, identifying UX issues, performance problems, and console errors with actionable recommendations',
          inputSchema: {
            type: 'object',
            properties: {
              flowId: {
                type: 'string',
                description: 'Flow execution ID to analyze'
              },
              analysisTypes: {
                type: 'array',
                description: 'Types of analysis to perform (default: all)',
                items: {
                  type: 'string',
                  enum: ['ux', 'performance', 'console']
                }
              }
            },
            required: ['flowId']
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'execute_flow':
            return await this.handleExecuteFlow(args as ExecuteFlowArgs);

          case 'get_execution_data':
            return await this.handleGetExecutionData(args as GetExecutionDataArgs);

          case 'query_executions':
            return await this.handleQueryExecutions(args as QueryExecutionsArgs);

          case 'get_dom_snapshot':
            return await this.handleGetDOMSnapshot(args as GetDOMSnapshotArgs);

          case 'get_network_logs':
            return await this.handleGetNetworkLogs(args as GetNetworkLogsArgs);

          case 'get_console_logs':
            return await this.handleGetConsoleLogs(args as GetConsoleLogsArgs);

          case 'get_performance_metrics':
            return await this.handleGetPerformanceMetrics(args as GetPerformanceMetricsArgs);

          case 'analyze_flow_execution':
            return await this.handleAnalyzeFlowExecution(args as AnalyzeFlowExecutionArgs);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ error: errorMessage }, null, 2)
            }
          ],
          isError: true
        };
      }
    });
  }

  /**
   * Execute a flow and capture all execution data
   */
  private async handleExecuteFlow(args: ExecuteFlowArgs) {
    const { flowName, intent, url, steps, viewport } = args;

    // Build Flow object
    const flow: Flow = {
      name: flowName,
      intent: intent || `Execute flow: ${flowName}`,
      url,
      steps: steps.map(s => ({
        action: s.action as StepAction,
        target: s.target,
        value: s.value,
        timeout: s.timeout
      })) as Step[],
      viewport
    };

    // Get repository for data capture
    const repository = await this.initRepository();

    // Execute the flow
    const outputDir = process.env.FLOWGUARD_OUTPUT_DIR || './flowguard-output';
    const result = await executeFlow(flow, outputDir, undefined, repository);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            verdict: result.verdict,
            executionDataId: result.traceId,
            flowName: result.flowName,
            durationMs: result.durationMs,
            steps: result.steps.map((s, idx) => ({
              stepIndex: idx,
              action: s.action,
              success: s.success,
              error: s.error,
              durationMs: s.durationMs
            })),
            summary: result.verdict === 'pass'
              ? `Flow "${flowName}" completed successfully in ${result.durationMs}ms`
              : `Flow "${flowName}" ${result.verdict} at step ${result.steps.findIndex(s => !s.success)}`
          }, null, 2)
        }
      ]
    };
  }

  /**
   * Retrieve execution data for a flow run
   */
  private async handleGetExecutionData(args: GetExecutionDataArgs) {
    const { flowId, includeHtml } = args;

    const repository = await this.initRepository();
    const storage = new ExecutionDataStorage(repository);
    const data = await storage.getFlowExecution(flowId);

    if (!data) {
      throw new Error(`Execution not found: ${flowId}`);
    }

    // Optionally strip HTML to reduce response size
    const sanitizedData = includeHtml ? data : {
      ...data,
      domSnapshots: data.domSnapshots.map(snapshot => ({
        ...snapshot,
        html: `[${snapshot.html.length} characters - use includeHtml: true to see full HTML]`
      }))
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            flowId: data.flowId,
            flowName: data.flowName,
            intent: data.intent,
            url: data.url,
            verdict: data.verdict,
            startTime: data.startTime,
            endTime: data.endTime,
            durationMs: new Date(data.endTime).getTime() - new Date(data.startTime).getTime(),
            stepCount: data.steps.length,
            domSnapshotCount: data.domSnapshots.length,
            networkRequestCount: data.networkRequests.length,
            consoleLogCount: data.consoleLogs.length,
            summary: {
              failedSteps: data.steps.filter(s => !s.success).length,
              slowRequests: data.networkRequests.filter(r => r.timing.durationMs > 1000).length,
              failedRequests: data.networkRequests.filter(r => r.statusCode >= 400).length,
              consoleErrors: data.consoleLogs.filter(l => l.type === 'error').length,
              consoleWarnings: data.consoleLogs.filter(l => l.type === 'warn').length
            },
            performanceMetrics: data.performanceMetrics,
            ...(includeHtml && { domSnapshots: sanitizedData.domSnapshots })
          }, null, 2)
        }
      ]
    };
  }

  /**
   * Query executions by filters
   */
  private async handleQueryExecutions(args: QueryExecutionsArgs) {
    const repository = await this.initRepository();
    const storage = new ExecutionDataStorage(repository);

    const filters: Parameters<ExecutionDataStorage['queryExecutions']>[0] = {};
    if (args.flowName) filters.flowName = args.flowName;
    if (args.verdict) filters.verdict = args.verdict;
    if (args.startDate) filters.startDate = new Date(args.startDate);
    if (args.endDate) filters.endDate = new Date(args.endDate);

    const executions = await storage.queryExecutions(filters);
    const limit = args.limit || 10;
    const limitedExecutions = executions.slice(0, limit);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            total: executions.length,
            returned: limitedExecutions.length,
            executions: limitedExecutions.map(e => ({
              flowId: e.flowId,
              flowName: e.flowName,
              verdict: e.verdict,
              startTime: e.startTime,
              durationMs: new Date(e.endTime).getTime() - new Date(e.startTime).getTime(),
              stepCount: e.steps.length,
              summary: {
                failedSteps: e.steps.filter(s => !s.success).length,
                consoleErrors: e.consoleLogs.filter(l => l.type === 'error').length
              }
            }))
          }, null, 2)
        }
      ]
    };
  }

  /**
   * Get specific DOM snapshot
   */
  private async handleGetDOMSnapshot(args: GetDOMSnapshotArgs) {
    const { flowId, snapshotId } = args;

    const repository = await this.initRepository();
    const storage = new ExecutionDataStorage(repository);
    const data = await storage.getFlowExecution(flowId);

    if (!data) {
      throw new Error(`Execution not found: ${flowId}`);
    }

    const snapshot = data.domSnapshots.find(s => s.snapshotId === snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            snapshotId: snapshot.snapshotId,
            stepIndex: snapshot.stepIndex,
            timestamp: snapshot.timestamp,
            serializedDOM: snapshot.serializedDOM,
            accessibilityTree: snapshot.accessibilityTree,
            html: snapshot.html
          }, null, 2)
        }
      ]
    };
  }

  /**
   * Get network logs with optional filtering
   */
  private async handleGetNetworkLogs(args: GetNetworkLogsArgs) {
    const { flowId, filter } = args;

    const repository = await this.initRepository();
    const storage = new ExecutionDataStorage(repository);
    const data = await storage.getFlowExecution(flowId);

    if (!data) {
      throw new Error(`Execution not found: ${flowId}`);
    }

    let requests = data.networkRequests;

    // Apply filters
    if (filter) {
      if (filter.statusCode) {
        requests = requests.filter(r => r.statusCode === filter.statusCode);
      }
      if (filter.resourceType) {
        requests = requests.filter(r => r.resourceType === filter.resourceType);
      }
      if (filter.slowOnly) {
        requests = requests.filter(r => r.timing.durationMs > 1000);
      }
      if (filter.failedOnly) {
        requests = requests.filter(r => r.statusCode >= 400);
      }
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            flowId,
            total: data.networkRequests.length,
            filtered: requests.length,
            requests: requests.map(r => ({
              requestId: r.requestId,
              stepIndex: r.stepIndex,
              url: r.url,
              method: r.method,
              statusCode: r.statusCode,
              resourceType: r.resourceType,
              durationMs: r.timing.durationMs,
              isSlow: r.timing.durationMs > 1000,
              isFailed: r.statusCode >= 400
            }))
          }, null, 2)
        }
      ]
    };
  }

  /**
   * Get console logs with optional filtering
   */
  private async handleGetConsoleLogs(args: GetConsoleLogsArgs) {
    const { flowId, type, errorsOnly } = args;

    const repository = await this.initRepository();
    const storage = new ExecutionDataStorage(repository);
    const data = await storage.getFlowExecution(flowId);

    if (!data) {
      throw new Error(`Execution not found: ${flowId}`);
    }

    let logs = data.consoleLogs;

    if (type) {
      logs = logs.filter(l => l.type === type);
    }
    if (errorsOnly) {
      logs = logs.filter(l => l.type === 'error' || l.type === 'warn');
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            flowId,
            total: data.consoleLogs.length,
            filtered: logs.length,
            summary: {
              errors: data.consoleLogs.filter(l => l.type === 'error').length,
              warnings: data.consoleLogs.filter(l => l.type === 'warn').length,
              logs: data.consoleLogs.filter(l => l.type === 'log').length,
              info: data.consoleLogs.filter(l => l.type === 'info').length,
              debug: data.consoleLogs.filter(l => l.type === 'debug').length
            },
            logs: logs.map(l => ({
              timestamp: l.timestamp,
              stepIndex: l.stepIndex,
              type: l.type,
              message: l.message,
              stackTrace: l.stackTrace
            }))
          }, null, 2)
        }
      ]
    };
  }

  /**
   * Get performance metrics
   */
  private async handleGetPerformanceMetrics(args: GetPerformanceMetricsArgs) {
    const { flowId } = args;

    const repository = await this.initRepository();
    const storage = new ExecutionDataStorage(repository);
    const data = await storage.getFlowExecution(flowId);

    if (!data) {
      throw new Error(`Execution not found: ${flowId}`);
    }

    const metrics = data.performanceMetrics;

    // Provide human-readable analysis
    const analysis = {
      coreWebVitals: {
        lcp: {
          value: metrics.lcp,
          rating: metrics.lcp <= 2500 ? 'good' : metrics.lcp <= 4000 ? 'needs-improvement' : 'poor'
        },
        fid: {
          value: metrics.fid,
          rating: metrics.fid <= 100 ? 'good' : metrics.fid <= 300 ? 'needs-improvement' : 'poor'
        },
        cls: {
          value: metrics.cls,
          rating: metrics.cls <= 0.1 ? 'good' : metrics.cls <= 0.25 ? 'needs-improvement' : 'poor'
        }
      },
      pageLoad: {
        domContentLoaded: metrics.domContentLoaded,
        loadComplete: metrics.loadComplete,
        firstPaint: metrics.firstPaint,
        firstContentfulPaint: metrics.firstContentfulPaint
      },
      resources: {
        totalCount: metrics.totalResourceCount,
        totalSizeBytes: metrics.totalResourceSize,
        totalSizeKB: Math.round(metrics.totalResourceSize / 1024)
      },
      memory: {
        heapSizeBytes: metrics.jsHeapSize,
        usedHeapBytes: metrics.usedJsHeapSize,
        heapUtilization: metrics.jsHeapSize > 0
          ? Math.round((metrics.usedJsHeapSize / metrics.jsHeapSize) * 100)
          : 0
      }
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            flowId,
            flowName: data.flowName,
            metrics,
            analysis,
            summary: `Page loaded in ${metrics.loadComplete}ms with ${analysis.resources.totalCount} resources (${analysis.resources.totalSizeKB}KB)`
          }, null, 2)
        }
      ]
    };
  }

  /**
   * AI-powered analysis of flow execution
   */
  private async handleAnalyzeFlowExecution(args: AnalyzeFlowExecutionArgs) {
    const { flowId } = args;

    const repository = await this.initRepository();
    const storage = new ExecutionDataStorage(repository);
    const data = await storage.getFlowExecution(flowId);

    if (!data) {
      throw new Error(`Execution not found: ${flowId}`);
    }

    // Run AI analysis
    const analyzer = new AIAnalyzer();
    const analysis = await analyzer.analyzeFlowExecution(data);
    const report = await analyzer.generateUserReport(analysis);

    return {
      content: [
        {
          type: 'text' as const,
          text: report
        }
      ]
    };
  }

  /**
   * Start the MCP server on stdio transport
   */
  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('FlowGuard Playwright MCP server running on stdio');

    // Handle shutdown
    process.on('SIGINT', async () => {
      await closeBrowser();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await closeBrowser();
      process.exit(0);
    });
  }
}

// Type definitions for tool arguments
interface ExecuteFlowArgs {
  flowName: string;
  intent?: string;
  url: string;
  steps: Array<{
    action: string;
    target?: string;
    value?: string;
    timeout?: number;
  }>;
  viewport?: {
    width: number;
    height: number;
  };
}

interface GetExecutionDataArgs {
  flowId: string;
  includeHtml?: boolean;
}

interface QueryExecutionsArgs {
  flowName?: string;
  verdict?: 'pass' | 'fail' | 'error';
  limit?: number;
  startDate?: string;
  endDate?: string;
}

interface GetDOMSnapshotArgs {
  flowId: string;
  snapshotId: string;
}

interface GetNetworkLogsArgs {
  flowId: string;
  filter?: {
    statusCode?: number;
    resourceType?: string;
    slowOnly?: boolean;
    failedOnly?: boolean;
  };
}

interface GetConsoleLogsArgs {
  flowId: string;
  type?: 'log' | 'info' | 'warn' | 'error' | 'debug';
  errorsOnly?: boolean;
}

interface GetPerformanceMetricsArgs {
  flowId: string;
}

interface AnalyzeFlowExecutionArgs {
  flowId: string;
  analysisTypes?: ('ux' | 'performance' | 'console')[];
}

// Start server when run directly
const server = new PlaywrightMCPServer();
server.run().catch(console.error);
