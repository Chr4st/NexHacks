import type { WoodWideResult } from '../../types.js';

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
 * Generate Wood Wide AI insights section
 */
export function generateWoodWideInsights(insights: WoodWideResult): string {
  return `
    <div class="woodwide-section">
      <div class="woodwide-header">
        <div class="woodwide-icon">🌲</div>
        <h2 class="woodwide-title">Wood Wide AI Analysis</h2>
      </div>
      <div class="woodwide-insights">
        <div class="woodwide-insight">
          <div class="woodwide-insight-title">Statistical Significance</div>
          <div class="woodwide-insight-text">
            ${insights.significant 
              ? `✅ The observed changes are statistically significant (${(insights.confidence * 100).toFixed(0)}% confidence).`
              : `⚠️ The observed changes are not statistically significant (${(insights.confidence * 100).toFixed(0)}% confidence).`
            }
          </div>
        </div>
        <div class="woodwide-insight">
          <div class="woodwide-insight-title">Interpretation</div>
          <div class="woodwide-insight-text">
            ${escapeHtml(insights.interpretation)}
          </div>
        </div>
      </div>
    </div>
  `;
}

