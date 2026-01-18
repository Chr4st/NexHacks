import type { FlowRunResult } from '../../types.js';

/**
 * Generate report footer section
 */
export function generateFooter(run: FlowRunResult): string {
  return `
    <div class="report-footer">
      <div class="report-footer-logo">FlowGuard AI</div>
      <p class="report-footer-text">Generated at ${new Date(run.completedAt).toLocaleString()}</p>
      <div class="report-footer-meta">
        ${run.phoenixTraceUrl ? `<a href="${run.phoenixTraceUrl}" style="color: var(--color-primary); text-decoration: none;">View traces in Arize Phoenix →</a>` : ''}
        ${run.traceId ? `<span>Trace ID: ${run.traceId}</span>` : ''}
      </div>
    </div>
  `;
}

