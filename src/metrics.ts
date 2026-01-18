import { z } from 'zod';
import type { CruxMetrics } from './types.js';

/**
 * Schema for validating the CrUX API response.
 * The API returns metrics with percentile data nested under 'percentiles'.
 */
const CruxApiResponseSchema = z.object({
  record: z.object({
    metrics: z.object({
      largest_contentful_paint: z.object({
        percentiles: z.object({
          p75: z.number(),
        }),
      }).optional(),
      cumulative_layout_shift: z.object({
        percentiles: z.object({
          p75: z.number(),
        }),
      }).optional(),
      interaction_to_next_paint: z.object({
        percentiles: z.object({
          p75: z.number(),
        }),
      }).optional(),
    }),
  }).optional(),
});

const CRUX_API_URL = 'https://chromeuxreport.googleapis.com/v1/records:queryRecord';

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

    const rawData: unknown = await response.json();

    // Validate the response against our schema
    const parseResult = CruxApiResponseSchema.safeParse(rawData);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      console.error('[FlowGuard] CrUX response validation failed:', errorMessages);
      return null;
    }

    const metrics = parseResult.data.record?.metrics;
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
