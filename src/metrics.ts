import type { CruxMetrics, WoodWideResult } from './types.js';

const CRUX_API_URL = 'https://chromeuxreport.googleapis.com/v1/records:queryRecord';
const WOOD_WIDE_API_URL = 'https://api.woodwide.ai/analyze';

// Mock data for demo when APIs are unavailable
const MOCK_CRUX_METRICS: CruxMetrics = {
  lcp: { p75: 2.1, rating: 'needs-improvement' },
  cls: { p75: 0.12, rating: 'good' },
  inp: { p75: 180, rating: 'needs-improvement' },
};

/**
 * Fetch CrUX metrics for a given URL.
 *
 * @param url - URL to fetch metrics for
 * @param useMock - Use mock data if true (for demos)
 * @returns CrUX metrics or null if unavailable
 */
export async function getCruxMetrics(
  url: string,
  useMock = false
): Promise<CruxMetrics | null> {
  if (useMock) {
    console.log('[FlowGuard] Using mock CrUX data for demo');
    return MOCK_CRUX_METRICS;
  }

  const apiKey = process.env.CRUX_API_KEY;
  if (!apiKey) {
    console.warn('[FlowGuard] No CRUX_API_KEY set, CrUX metrics unavailable');
    return null;
  }

  try {
    const response = await fetch(`${CRUX_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        formFactor: 'PHONE',
        metrics: ['largest_contentful_paint', 'cumulative_layout_shift', 'interaction_to_next_paint'],
      }),
    });

    if (!response.ok) {
      // CrUX often returns 404 for URLs without enough data
      if (response.status === 404) {
        console.log('[FlowGuard] No CrUX data available for this URL');
        return null;
      }
      throw new Error(`CrUX API error: ${response.status}`);
    }

    const data = await response.json() as {
      record?: {
        metrics?: {
          largest_contentful_paint?: { percentiles?: { p75?: number } };
          cumulative_layout_shift?: { percentiles?: { p75?: number } };
          interaction_to_next_paint?: { percentiles?: { p75?: number } };
        };
      };
    };

    const metrics = data.record?.metrics;
    if (!metrics) {
      return null;
    }

    const lcpP75 = metrics.largest_contentful_paint?.percentiles?.p75 ?? 0;
    const clsP75 = metrics.cumulative_layout_shift?.percentiles?.p75 ?? 0;
    const inpP75 = metrics.interaction_to_next_paint?.percentiles?.p75 ?? 0;

    return {
      lcp: {
        p75: lcpP75 / 1000, // Convert to seconds
        rating: lcpP75 <= 2500 ? 'good' : lcpP75 <= 4000 ? 'needs-improvement' : 'poor',
      },
      cls: {
        p75: clsP75,
        rating: clsP75 <= 0.1 ? 'good' : clsP75 <= 0.25 ? 'needs-improvement' : 'poor',
      },
      inp: {
        p75: inpP75,
        rating: inpP75 <= 200 ? 'good' : inpP75 <= 500 ? 'needs-improvement' : 'poor',
      },
    };
  } catch (error) {
    console.error('[FlowGuard] CrUX fetch failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Analyze metrics using Wood Wide AI for statistical reasoning.
 *
 * @param question - Question to ask about the data
 * @param data - Structured data for analysis
 * @param useMock - Use mock response if true (for demos)
 * @returns Wood Wide analysis result
 */
export async function analyzeWithWoodWide(
  question: string,
  data: Record<string, unknown>,
  useMock = false
): Promise<WoodWideResult | null> {
  if (useMock) {
    console.log('[FlowGuard] Using mock Wood Wide response for demo');
    return {
      significant: true,
      confidence: 0.95,
      interpretation: 'The observed improvement is statistically significant with 95% confidence.',
    };
  }

  const apiKey = process.env.WOOD_WIDE_API_KEY;
  if (!apiKey) {
    console.warn('[FlowGuard] No WOOD_WIDE_API_KEY set, Wood Wide analysis unavailable');
    return null;
  }

  try {
    const response = await fetch(WOOD_WIDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ question, data }),
    });

    if (!response.ok) {
      throw new Error(`Wood Wide API error: ${response.status}`);
    }

    const result = await response.json() as WoodWideResult;
    return result;
  } catch (error) {
    console.error('[FlowGuard] Wood Wide analysis failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Compare two sets of CrUX metrics and analyze significance.
 *
 * @param before - Metrics before change
 * @param after - Metrics after change
 * @param useMock - Use mock data for demo
 * @returns Analysis of whether improvement is significant
 */
export async function compareMetrics(
  before: CruxMetrics,
  after: CruxMetrics,
  useMock = false
): Promise<WoodWideResult | null> {
  const question = `
    Compare these web performance metrics and determine if the changes are statistically significant:
    Before: LCP=${before.lcp.p75}s, CLS=${before.cls.p75}, INP=${before.inp.p75}ms
    After: LCP=${after.lcp.p75}s, CLS=${after.cls.p75}, INP=${after.inp.p75}ms

    Consider Core Web Vitals thresholds:
    - LCP: Good ≤2.5s, Needs Improvement ≤4s, Poor >4s
    - CLS: Good ≤0.1, Needs Improvement ≤0.25, Poor >0.25
    - INP: Good ≤200ms, Needs Improvement ≤500ms, Poor >500ms
  `;

  return analyzeWithWoodWide(
    question,
    { before, after },
    useMock
  );
}

/**
 * Format CrUX metrics for display.
 *
 * @param metrics - CrUX metrics to format
 * @returns Formatted string
 */
export function formatCruxMetrics(metrics: CruxMetrics): string {
  const ratingEmoji = (rating: 'good' | 'needs-improvement' | 'poor') => {
    switch (rating) {
      case 'good':
        return '🟢';
      case 'needs-improvement':
        return '🟡';
      case 'poor':
        return '🔴';
    }
  };

  return `
Core Web Vitals:
  ${ratingEmoji(metrics.lcp.rating)} LCP: ${metrics.lcp.p75.toFixed(2)}s (${metrics.lcp.rating})
  ${ratingEmoji(metrics.cls.rating)} CLS: ${metrics.cls.p75.toFixed(3)} (${metrics.cls.rating})
  ${ratingEmoji(metrics.inp.rating)} INP: ${metrics.inp.p75}ms (${metrics.inp.rating})
`.trim();
}
