# FlowGuard Playwright MCP Server Guide

This document describes how to use the FlowGuard Playwright MCP server to enable AI agents to autonomously execute and analyze web application flows.

## Overview

The FlowGuard Playwright MCP server exposes Playwright browser automation through the Model Context Protocol (MCP), allowing AI agents like Claude to:

- Execute multi-step browser flows
- Capture comprehensive execution data (DOM, network, console, performance)
- Query historical executions
- Get AI-powered analysis of execution results

## Quick Start

### 1. Start the MCP Server

```bash
# Build the project first
npm run build

# Start the MCP server
npm run mcp:playwright
```

### 2. Configure Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "flowguard-playwright": {
      "command": "node",
      "args": ["/path/to/flowguard/dist/mcp/playwright-mcp-server.js"],
      "env": {
        "MONGODB_URI": "mongodb://localhost:27017/flowguard",
        "FLOWGUARD_OUTPUT_DIR": "./flowguard-output"
      }
    }
  }
}
```

### 3. Use with Claude

Once configured, Claude can autonomously execute browser flows:

```
User: "Test the checkout flow on example-shop.com and tell me about any UX issues"

Claude: I'll execute a checkout flow test and analyze the results.
[Calls execute_flow tool]
[Calls analyze_flow_execution tool]

"I tested the checkout flow and found 3 UX issues:
1. Email input field is missing an accessible label (WCAG violation)
2. Submit button has insufficient color contrast (2.1:1, needs 4.5:1)
3. Product API endpoint is slow (1.2s response time)

Recommendations:
- Add aria-label to email input
- Increase button text contrast ratio to 4.5:1
- Consider adding caching to /api/products endpoint"
```

## Available Tools

### execute_flow

Execute a Playwright flow and capture all execution data.

**Input Schema:**
```json
{
  "flowName": "checkout-flow",
  "intent": "Verify user can complete checkout process",
  "url": "https://example-shop.com",
  "steps": [
    { "action": "navigate", "target": "/products" },
    { "action": "click", "target": "#add-to-cart" },
    { "action": "click", "target": "#checkout" },
    { "action": "type", "target": "#email", "value": "test@example.com" },
    { "action": "click", "target": "#submit-order" }
  ],
  "viewport": { "width": 1280, "height": 720 }
}
```

**Supported Actions:**
- `navigate` - Navigate to a URL
- `click` - Click an element (requires `target` selector)
- `type` - Type text into an element (requires `target` and `value`)
- `scroll` - Scroll the page (optional `value` for scroll amount)
- `wait` - Wait for a duration (optional `timeout` in ms)
- `screenshot` - Capture a screenshot

**Output:**
```json
{
  "verdict": "pass",
  "executionDataId": "abc123",
  "flowName": "checkout-flow",
  "durationMs": 3500,
  "steps": [
    { "stepIndex": 0, "action": "navigate", "success": true, "durationMs": 1200 },
    { "stepIndex": 1, "action": "click", "success": true, "durationMs": 150 }
  ],
  "summary": "Flow \"checkout-flow\" completed successfully in 3500ms"
}
```

### get_execution_data

Retrieve captured execution data for a flow run.

**Input Schema:**
```json
{
  "flowId": "abc123",
  "includeHtml": false
}
```

**Output:**
```json
{
  "flowId": "abc123",
  "flowName": "checkout-flow",
  "verdict": "pass",
  "durationMs": 3500,
  "stepCount": 5,
  "domSnapshotCount": 6,
  "networkRequestCount": 25,
  "consoleLogCount": 8,
  "summary": {
    "failedSteps": 0,
    "slowRequests": 1,
    "failedRequests": 0,
    "consoleErrors": 0,
    "consoleWarnings": 2
  },
  "performanceMetrics": {
    "lcp": 1500,
    "fid": 50,
    "cls": 0.05,
    "domContentLoaded": 800,
    "loadComplete": 1200
  }
}
```

### query_executions

Query flow executions by filters.

**Input Schema:**
```json
{
  "flowName": "checkout-flow",
  "verdict": "fail",
  "limit": 10,
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T23:59:59Z"
}
```

### get_dom_snapshot

Get a specific DOM snapshot from a flow execution.

**Input Schema:**
```json
{
  "flowId": "abc123",
  "snapshotId": "dom_2_1234567890"
}
```

### get_network_logs

Get network request/response logs with optional filtering.

**Input Schema:**
```json
{
  "flowId": "abc123",
  "filter": {
    "slowOnly": true,
    "failedOnly": false,
    "resourceType": "fetch"
  }
}
```

### get_console_logs

Get console logs with optional filtering.

**Input Schema:**
```json
{
  "flowId": "abc123",
  "errorsOnly": true
}
```

### get_performance_metrics

Get Core Web Vitals and performance metrics.

**Input Schema:**
```json
{
  "flowId": "abc123"
}
```

**Output:**
```json
{
  "flowId": "abc123",
  "metrics": {
    "lcp": 1500,
    "fid": 50,
    "cls": 0.05
  },
  "analysis": {
    "coreWebVitals": {
      "lcp": { "value": 1500, "rating": "good" },
      "fid": { "value": 50, "rating": "good" },
      "cls": { "value": 0.05, "rating": "good" }
    }
  },
  "summary": "Page loaded in 1200ms with 25 resources (487KB)"
}
```

### analyze_flow_execution

Get AI-powered analysis of execution data with UX issues, performance problems, and recommendations.

**Input Schema:**
```json
{
  "flowId": "abc123"
}
```

**Output (Markdown):**
```markdown
# Flow Analysis: checkout-flow

Flow "checkout-flow" completed with PASS verdict in 3500ms.
Found 2 critical and 1 warning issues across UX, performance, and console analysis.

## UX Issues (2)
🔴 **[HIGH]** Button element missing accessible label attribute
🟡 **[MEDIUM]** Form input has insufficient color contrast

## Performance Issues (1)
🔴 **[HIGH]** API endpoint /api/products responds slowly (1.2s)

## Recommendations
1. Add aria-label attribute to submit button
2. Increase input text color contrast to meet WCAG AA standards
3. Implement caching for product API endpoint

---
*Analysis generated in 3500ms*
```

## Agent Workflow Example

Here's how an AI agent might use these tools to autonomously test a web application:

```
User: "Test the login flow and identify any problems"

Agent thought process:
1. First, I'll execute the login flow to capture execution data
2. Then retrieve the detailed execution data
3. Finally, run AI analysis to identify issues

Agent actions:
1. Call execute_flow with login steps
2. Call get_execution_data to see detailed metrics
3. Call analyze_flow_execution for AI-powered insights
4. Summarize findings for the user
```

## Data Captured

For each flow execution, the MCP server captures:

### DOM Snapshots
- Full HTML content after each step
- Serialized DOM summary (element counts, forms, links, images)
- Accessibility tree structure

### Network Requests
- All HTTP requests/responses
- Request/response headers
- Response bodies (for small responses)
- Timing information (start, end, duration)
- Resource types (document, script, image, fetch, etc.)

### Console Logs
- All console output (log, info, warn, error, debug)
- Stack traces for errors
- Step correlation

### Performance Metrics
- Core Web Vitals (LCP, FID, CLS)
- Page load timing (DOMContentLoaded, load complete)
- Paint timing (first paint, first contentful paint)
- Resource metrics (count, total size)
- Memory usage (JS heap size)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | Required |
| `FLOWGUARD_OUTPUT_DIR` | Directory for screenshots/artifacts | `./flowguard-output` |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI analysis | Required for analysis |

## Troubleshooting

### MCP Server Won't Start
- Ensure MongoDB is running and accessible
- Check that `MONGODB_URI` is set correctly
- Verify the build completed: `npm run build`

### Flow Execution Fails
- Check that the target URL is accessible
- Verify CSS selectors are correct
- Increase timeout values for slow pages

### AI Analysis Returns Empty Results
- Ensure `ANTHROPIC_API_KEY` is set
- Check API rate limits
- Verify execution data was captured (domSnapshots not empty)

## Architecture

```
┌─────────────────────────────────┐
│   AI Agent (Claude)             │
│   - Understands user intent     │
│   - Calls MCP tools             │
│   - Generates insights          │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│   FlowGuard MCP Server          │
│   - execute_flow                │
│   - get_execution_data          │
│   - query_executions            │
│   - analyze_flow_execution      │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│   Playwright Browser            │
│   - Execute steps               │
│   - Capture DOM/network/console │
│   - Record performance          │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│   MongoDB Storage               │
│   - Flow execution data         │
│   - Historical queries          │
│   - Analysis results            │
└─────────────────────────────────┘
```

## Related Documentation

- [FlowGuard CLI Guide](./CLI_GUIDE.md)
- [Phoenix Tracing Integration](./PHOENIX_INTEGRATION.md)
- [Browserbase Cloud Execution](./BROWSERBASE_GUIDE.md)
