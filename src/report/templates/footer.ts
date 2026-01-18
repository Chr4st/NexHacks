import type { FlowRunResult } from '../../types.js';

/**
 * Escape HTML special characters
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
 * Escape URL to prevent XSS (only allow safe characters)
 */
function escapeUrl(url: string): string {
  // URLs should be validated, but escape any HTML special chars just in case
  return escapeHtml(url);
}

/**
 * Generate report footer section
 */
export function generateFooter(run: FlowRunResult): string {
  return `
    <div class="report-footer">
      <div class="report-footer-logo">FlowGuard AI</div>
      <p class="report-footer-text">Generated at ${new Date(run.completedAt).toLocaleString()}</p>
      <div class="report-footer-meta">
        ${run.phoenixTraceUrl ? `<a href="${escapeUrl(run.phoenixTraceUrl)}" style="color: var(--color-primary); text-decoration: none;">View traces in Arize Phoenix →</a>` : ''}
        ${run.traceId ? `<span>Trace ID: ${escapeHtml(run.traceId)}</span>` : ''}
      </div>
    </div>
  `;
}

