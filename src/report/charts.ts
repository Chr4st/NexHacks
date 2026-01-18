import type { TrendDataPoint } from './types.js';

/**
 * Generate SVG chart for success rate trends
 */
export function generateSuccessRateTrendChart(data: TrendDataPoint[]): string {
  // Handle edge cases
  if (data.length === 0) {
    return '<svg viewBox="0 0 800 300" class="chart-canvas"><text x="400" y="150" text-anchor="middle" fill="#6b7280">No data available</text></svg>';
  }

  if (data.length === 1) {
    // Single point - show as a horizontal line
    const width = 800;
    const height = 300;
    const padding = 40;
    const yScale = (height - 2 * padding) / 100;
    const x = padding + (width - 2 * padding) / 2;
    const y = height - padding - data[0].successRate * yScale;
    
    return `
      <svg viewBox="0 0 ${width} ${height}" class="chart-canvas">
        <line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#3b82f6" stroke-width="3" stroke-dasharray="5,5" />
        <circle cx="${x}" cy="${y}" r="6" fill="#3b82f6" />
        <text x="${x}" y="${y - 10}" text-anchor="middle" font-size="12" fill="#6b7280">${data[0].successRate.toFixed(0)}%</text>
        <text x="${x}" y="${height - padding + 25}" text-anchor="middle" font-size="11" fill="#6b7280">${data[0].date}</text>
      </svg>
    `;
  }

  const width = 800;
  const height = 300;
  const padding = 40;

  // Calculate scales
  const xScale = (width - 2 * padding) / (data.length - 1);
  const yScale = (height - 2 * padding) / 100;

  // Generate path
  const points = data.map((d, i) => {
    const x = padding + i * xScale;
    const y = height - padding - d.successRate * yScale;
    return `${x},${y}`;
  });

  const linePath = points.map((p, i) => {
    return i === 0 ? `M ${p}` : `L ${p}`;
  }).join(' ');

  // Generate area fill
  const areaPath = `${linePath} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`;

  // Generate grid lines and labels
  const gridLines = [0, 25, 50, 75, 100].map(val => {
    const y = height - padding - val * yScale;
    return `
      <line
        x1="${padding}"
        y1="${y}"
        x2="${width - padding}"
        y2="${y}"
        stroke="#e5e7eb"
        stroke-width="1"
      />
      <text
        x="${padding - 10}"
        y="${y + 5}"
        text-anchor="end"
        font-size="12"
        fill="#6b7280"
      >${val}%</text>
    `;
  }).join('');

  // Generate data points
  const dataPoints = points.map((p, i) => {
    const [x, y] = p.split(',').map(Number);
    return `
      <circle
        cx="${x}"
        cy="${y}"
        r="4"
        fill="#3b82f6"
      />
    `;
  }).join('');

  // Generate X-axis labels (show every nth label to avoid crowding)
  const labelInterval = Math.max(1, Math.ceil(data.length / 7));
  const xAxisLabels = data.map((d, i) => {
    if (i % labelInterval === 0 || i === data.length - 1) {
      const x = padding + i * xScale;
      return `
        <text
          x="${x}"
          y="${height - padding + 25}"
          text-anchor="middle"
          font-size="11"
          fill="#6b7280"
        >${d.date}</text>
      `;
    }
    return '';
  }).join('');

  return `
    <svg viewBox="0 0 ${width} ${height}" class="chart-canvas">
      ${gridLines}
      
      <!-- Area fill -->
      <path
        d="${areaPath}"
        fill="url(#gradient)"
        opacity="0.2"
      />

      <!-- Line -->
      <path
        d="${linePath}"
        fill="none"
        stroke="#3b82f6"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      <!-- Data points -->
      ${dataPoints}

      <!-- Gradient definition -->
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:0" />
        </linearGradient>
      </defs>

      <!-- X-axis labels -->
      ${xAxisLabels}
    </svg>
  `;
}

