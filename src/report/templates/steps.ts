import type { StepResult } from '../../types.js';

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
 * Generate step-by-step results section
 */
export function generateSteps(steps: StepResult[]): string {
  const stepsHtml = steps.map((step, index) => {
    const statusClass = step.success ? 'passed' : 'failed';
    const statusText = step.success ? 'PASSED' : 'FAILED';
    const statusIcon = step.success ? '✓' : '✗';

    const screenshotHtml = step.screenshotBase64
      ? `
        <div class="step-screenshot">
          <img src="data:image/png;base64,${step.screenshotBase64}" alt="Screenshot for step ${step.stepIndex + 1}" />
        </div>
      `
      : '';

    const analysisHtml = step.analysis
      ? `
        <div class="step-reasoning">
          <strong>Analysis:</strong> ${escapeHtml(step.analysis.status === 'error' ? step.analysis.error : step.analysis.reasoning)}
          ${step.analysis.status === 'fail' && 'issues' in step.analysis && step.analysis.issues.length > 0
            ? `<ul style="margin-top: 0.5rem; padding-left: 1.5rem;">
                ${step.analysis.issues.map(issue => `<li>${escapeHtml(issue)}</li>`).join('')}
              </ul>`
            : ''
          }
        </div>
      `
      : '';

    return `
      <div class="step-item ${statusClass}">
        <div class="step-header">
          <div class="step-info">
            <div class="step-number">Step ${step.stepIndex + 1}</div>
            <div class="step-action">${escapeHtml(step.action)}</div>
          </div>
          <div class="step-status ${statusClass}">
            ${statusIcon} ${statusText}
          </div>
        </div>
        <div class="step-details ${!step.success ? 'expanded' : ''}">
          ${step.error ? `<p style="color: var(--color-danger); margin-bottom: var(--spacing-md);">Error: ${escapeHtml(step.error)}</p>` : ''}
          ${screenshotHtml}
          ${analysisHtml}
          <div class="step-metrics">
            <div class="step-metric">
              <div class="step-metric-value">${step.durationMs}ms</div>
              <div class="step-metric-label">Duration</div>
            </div>
            ${step.analysis && step.analysis.status !== 'error' ? `
            <div class="step-metric">
              <div class="step-metric-value">${step.analysis.confidence}%</div>
              <div class="step-metric-label">Confidence</div>
            </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="steps-section">
      <div class="steps-header">
        <h2 class="steps-title">Step-by-Step Results</h2>
        <div class="steps-filter">
          <button class="filter-btn active" data-filter="all">All</button>
          <button class="filter-btn" data-filter="passed">Passed</button>
          <button class="filter-btn" data-filter="failed">Failed</button>
        </div>
      </div>
      ${stepsHtml}
    </div>
  `;
}

