import type { SummaryData } from '../types.js';

/**
 * Generate summary cards section
 */
export function generateSummary(data: SummaryData): string {
  const successRate = data.totalSteps > 0 
    ? ((data.passedSteps / data.totalSteps) * 100).toFixed(0)
    : '0';
  
  const trend = data.historicalSuccessRate !== undefined
    ? data.historicalSuccessRate - parseFloat(successRate)
    : 0;

  const trendIcon = trend >= 0 ? '↑' : '↓';
  const trendClass = trend >= 0 ? 'trend-up' : 'trend-down';

  return `
    <div class="summary-grid">
      <div class="summary-card ${data.failedSteps === 0 ? 'success' : 'danger'}">
        <div class="summary-card-header">
          <div class="summary-card-title">Test Result</div>
          <div class="summary-card-icon ${data.failedSteps === 0 ? 'success' : 'danger'}">
            ${data.failedSteps === 0 ? '✓' : '✗'}
          </div>
        </div>
        <div class="summary-card-value">${successRate}%</div>
        <div class="summary-card-label">Success Rate</div>
        ${data.historicalSuccessRate !== undefined ? `
        <div class="summary-card-trend ${trendClass}">
          ${trendIcon} ${Math.abs(trend).toFixed(1)}% vs 30-day average
        </div>
        ` : ''}
      </div>

      <div class="summary-card">
        <div class="summary-card-header">
          <div class="summary-card-title">Steps</div>
          <div class="summary-card-icon success">
            📋
          </div>
        </div>
        <div class="summary-card-value">${data.passedSteps}/${data.totalSteps}</div>
        <div class="summary-card-label">Passed Steps</div>
      </div>

      <div class="summary-card">
        <div class="summary-card-header">
          <div class="summary-card-title">Duration</div>
          <div class="summary-card-icon success">
            ⏱️
          </div>
        </div>
        <div class="summary-card-value">${(data.duration / 1000).toFixed(1)}s</div>
        <div class="summary-card-label">Total Time</div>
      </div>

      ${data.cost !== undefined ? `
      <div class="summary-card">
        <div class="summary-card-header">
          <div class="summary-card-title">Cost</div>
          <div class="summary-card-icon success">
            💰
          </div>
        </div>
        <div class="summary-card-value">$${data.cost.toFixed(4)}</div>
        <div class="summary-card-label">AI Costs</div>
      </div>
      ` : ''}
    </div>
  `;
}

