import * as fs from 'node:fs';
import * as path from 'node:path';
import type { FlowRunResult, StepResult, CruxMetrics } from './types.js';

/**
 * Convert step result to HTML.
 */
function stepToHtml(step: StepResult): string {
  const statusIcon = step.success ? '✅' : '❌';
  const screenshotHtml = step.screenshotBase64
    ? `<img class="screenshot" src="data:image/png;base64,${step.screenshotBase64}" alt="Screenshot for step ${step.stepIndex}" />`
    : '';

  const analysisHtml = step.analysis
    ? `
    <div class="analysis">
      <strong>Analysis:</strong>
      <span class="${step.analysis.status}">${step.analysis.status.toUpperCase()}</span>
      ${step.analysis.status !== 'error' ? `(${step.analysis.confidence}% confidence)` : ''}
      <p>${step.analysis.status === 'error' ? step.analysis.error : step.analysis.reasoning}</p>
      ${step.analysis.status === 'fail' && step.analysis.issues.length > 0
        ? `<ul class="issues">${step.analysis.issues.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`
        : ''
      }
    </div>
  `
    : '';

  return `
    <div class="step ${step.success ? 'pass' : 'fail'}">
      <h3>${statusIcon} Step ${step.stepIndex + 1}: ${step.action}</h3>
      <p class="meta">Duration: ${step.durationMs}ms</p>
      ${step.error ? `<p class="error">Error: ${escapeHtml(step.error)}</p>` : ''}
      ${screenshotHtml}
      ${analysisHtml}
    </div>
  `;
}

/**
 * Escape HTML special characters.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format CrUX metrics for HTML.
 */
function cruxToHtml(metrics: CruxMetrics): string {
  const ratingClass = (rating: 'good' | 'needs-improvement' | 'poor') => {
    switch (rating) {
      case 'good':
        return 'metric-good';
      case 'needs-improvement':
        return 'metric-warning';
      case 'poor':
        return 'metric-poor';
    }
  };

  return `
    <div class="crux-metrics">
      <h3>Core Web Vitals</h3>
      <div class="metrics-grid">
        <div class="metric ${ratingClass(metrics.lcp.rating)}">
          <span class="metric-value">${metrics.lcp.p75.toFixed(2)}s</span>
          <span class="metric-label">LCP</span>
        </div>
        <div class="metric ${ratingClass(metrics.cls.rating)}">
          <span class="metric-value">${metrics.cls.p75.toFixed(3)}</span>
          <span class="metric-label">CLS</span>
        </div>
        <div class="metric ${ratingClass(metrics.inp.rating)}">
          <span class="metric-value">${metrics.inp.p75}ms</span>
          <span class="metric-label">INP</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate a complete HTML report for a flow run.
 *
 * @param run - Flow run result
 * @param cruxMetrics - Optional CrUX metrics
 * @returns HTML string
 */
export function generateReport(run: FlowRunResult, cruxMetrics?: CruxMetrics): string {
  const verdictIcon = run.verdict === 'pass' ? '✅' : run.verdict === 'fail' ? '❌' : '⚠️';
  const stepsHtml = run.steps.map(stepToHtml).join('');
  const cruxHtml = cruxMetrics ? cruxToHtml(cruxMetrics) : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FlowGuard Report: ${escapeHtml(run.flowName)}</title>
  <style>
    :root {
      --bg: #0a0a0a;
      --surface: #141414;
      --border: #262626;
      --text: #fafafa;
      --text-muted: #a3a3a3;
      --accent: #22d3ee;
      --pass: #22c55e;
      --fail: #ef4444;
      --warning: #f59e0b;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      min-height: 100vh;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
    }

    header {
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border);
    }

    h1 {
      font-size: 1.75rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    h2 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 1.5rem 0 1rem;
      color: var(--text-muted);
    }

    h3 {
      font-size: 1rem;
      font-weight: 500;
    }

    .meta {
      color: var(--text-muted);
      font-size: 0.875rem;
    }

    .pass { color: var(--pass); }
    .fail { color: var(--fail); }
    .error { color: var(--fail); }

    .verdict-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 500;
      text-transform: uppercase;
    }

    .verdict-pass { background: rgba(34, 197, 94, 0.2); color: var(--pass); }
    .verdict-fail { background: rgba(239, 68, 68, 0.2); color: var(--fail); }
    .verdict-error { background: rgba(245, 158, 11, 0.2); color: var(--warning); }

    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin: 1.5rem 0;
    }

    .summary-item {
      background: var(--surface);
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid var(--border);
    }

    .summary-value {
      font-size: 1.5rem;
      font-weight: 600;
      font-family: 'SF Mono', 'Monaco', monospace;
    }

    .summary-label {
      color: var(--text-muted);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .step {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.5rem;
      margin: 1rem 0;
    }

    .step.fail {
      border-color: rgba(239, 68, 68, 0.3);
    }

    .screenshot {
      max-width: 100%;
      border-radius: 8px;
      margin: 1rem 0;
      border: 1px solid var(--border);
    }

    .analysis {
      background: var(--bg);
      border-radius: 6px;
      padding: 1rem;
      margin-top: 1rem;
    }

    .issues {
      margin-top: 0.5rem;
      padding-left: 1.5rem;
    }

    .issues li {
      margin: 0.25rem 0;
      color: var(--text-muted);
    }

    .crux-metrics {
      margin: 1.5rem 0;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-top: 1rem;
    }

    .metric {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
    }

    .metric-value {
      font-size: 1.5rem;
      font-weight: 600;
      font-family: 'SF Mono', 'Monaco', monospace;
      display: block;
    }

    .metric-label {
      color: var(--text-muted);
      font-size: 0.75rem;
      text-transform: uppercase;
    }

    .metric-good { border-color: var(--pass); }
    .metric-warning { border-color: var(--warning); }
    .metric-poor { border-color: var(--fail); }

    footer {
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
      color: var(--text-muted);
      font-size: 0.875rem;
    }

    a {
      color: var(--accent);
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${verdictIcon} ${escapeHtml(run.flowName)}</h1>
      <span class="verdict-badge verdict-${run.verdict}">${run.verdict}</span>
      <p class="meta" style="margin-top: 1rem;">
        <strong>Intent:</strong> ${escapeHtml(run.intent)}
      </p>
    </header>

    <div class="summary">
      <div class="summary-item">
        <div class="summary-value">${run.confidence}%</div>
        <div class="summary-label">Confidence</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${run.steps.length}</div>
        <div class="summary-label">Steps</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${(run.durationMs / 1000).toFixed(1)}s</div>
        <div class="summary-label">Duration</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${run.viewport.width}x${run.viewport.height}</div>
        <div class="summary-label">Viewport</div>
      </div>
    </div>

    ${cruxHtml}

    <h2>Steps</h2>
    ${stepsHtml}

    <footer>
      <p>Generated by <strong>FlowGuard AI</strong> at ${run.completedAt}</p>
      ${run.phoenixTraceUrl ? `<p><a href="${run.phoenixTraceUrl}">View traces in Arize Phoenix →</a></p>` : ''}
      ${run.traceId ? `<p class="meta">Trace ID: ${run.traceId}</p>` : ''}
    </footer>
  </div>
</body>
</html>`;
}

/**
 * Save report to a file.
 *
 * @param run - Flow run result
 * @param outputDir - Directory to save report
 * @param cruxMetrics - Optional CrUX metrics
 * @returns Path to saved report
 */
export function saveReport(
  run: FlowRunResult,
  outputDir: string,
  cruxMetrics?: CruxMetrics
): string {
  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const html = generateReport(run, cruxMetrics);
  const filename = `${run.flowName}-${Date.now()}.html`;
  const filepath = path.join(outputDir, filename);

  fs.writeFileSync(filepath, html, 'utf-8');

  return filepath;
}
