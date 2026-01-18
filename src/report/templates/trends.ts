import type { TrendDataPoint } from '../types.js';
import { generateSuccessRateTrendChart } from '../charts.js';

/**
 * Generate historical trends section
 */
export function generateTrends(data: TrendDataPoint[]): string {
  if (data.length < 2) {
    return '';
  }

  const chartSvg = generateSuccessRateTrendChart(data);

  return `
    <div class="trends-section">
      <h2 class="trends-title">Historical Success Rate Trend</h2>
      <div class="chart-container">
        ${chartSvg}
      </div>
    </div>
  `;
}

