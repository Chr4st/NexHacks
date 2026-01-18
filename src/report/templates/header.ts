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
 * Generate report header section
 */
export function generateHeader(run: FlowRunResult): string {
  const verdictIcon = run.verdict === 'pass' ? '✅' : run.verdict === 'fail' ? '❌' : '⚠️';
  const verdictText = run.verdict === 'pass' ? 'PASSED' : run.verdict === 'fail' ? 'FAILED' : 'ERROR';

  return `
    <div class="report-header">
      <div class="report-header-content">
        <h1 class="report-title">${verdictIcon} ${escapeHtml(run.flowName)}</h1>
        <p class="report-subtitle">${escapeHtml(run.intent)}</p>
        <div class="report-meta">
          <div class="report-meta-item">
            <span>📊</span>
            <span>${verdictText}</span>
          </div>
          <div class="report-meta-item">
            <span>🎯</span>
            <span>${run.confidence}% confidence</span>
          </div>
          <div class="report-meta-item">
            <span>📐</span>
            <span>${run.viewport.width}×${run.viewport.height}</span>
          </div>
          <div class="report-meta-item">
            <span>⏱️</span>
            <span>${(run.durationMs / 1000).toFixed(1)}s</span>
          </div>
          <div class="report-meta-item">
            <span>📅</span>
            <span>${new Date(run.completedAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

