import type { CruxMetrics } from '../../types.js';

/**
 * Generate CrUX metrics section
 */
export function generateCruxMetrics(metrics: CruxMetrics): string {
  const formatLCP = (value: number): string => {
    return value < 1000 ? `${value.toFixed(0)}ms` : `${(value / 1000).toFixed(2)}s`;
  };

  const formatCLS = (value: number): string => {
    return value.toFixed(3);
  };

  const formatINP = (value: number): string => {
    return `${value.toFixed(0)}ms`;
  };

  return `
    <div class="crux-section">
      <h2 class="crux-title">Chrome User Experience (CrUX) Metrics</h2>
      <p class="crux-subtitle">Real user performance data from Chrome</p>
      <div class="crux-metrics-grid">
        <div class="crux-metric">
          <div class="crux-metric-label">LCP</div>
          <div class="crux-metric-value ${metrics.lcp.rating}">${formatLCP(metrics.lcp.p75)}</div>
          <div class="crux-metric-rating ${metrics.lcp.rating}">${metrics.lcp.rating.replace('-', ' ')}</div>
        </div>
        <div class="crux-metric">
          <div class="crux-metric-label">CLS</div>
          <div class="crux-metric-value ${metrics.cls.rating}">${formatCLS(metrics.cls.p75)}</div>
          <div class="crux-metric-rating ${metrics.cls.rating}">${metrics.cls.rating.replace('-', ' ')}</div>
        </div>
        <div class="crux-metric">
          <div class="crux-metric-label">INP</div>
          <div class="crux-metric-value ${metrics.inp.rating}">${formatINP(metrics.inp.p75)}</div>
          <div class="crux-metric-rating ${metrics.inp.rating}">${metrics.inp.rating.replace('-', ' ')}</div>
        </div>
      </div>
    </div>
  `;
}

