import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCruxMetrics, formatCruxMetrics, getWoodWideAnalysis, formatWoodWideAnalysis } from './metrics.js';

// Mock global fetch
global.fetch = vi.fn();

describe('CrUX Metrics', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.CRUX_API_KEY;
    delete process.env.WOOD_WIDE_API_KEY;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getCruxMetrics', () => {
    it('should return mock data when useMock is true', async () => {
      const metrics = await getCruxMetrics('https://example.com', true);

      expect(metrics).toBeDefined();
      expect(metrics?.lcp).toHaveProperty('p75');
      expect(metrics?.lcp).toHaveProperty('rating');
      expect(metrics?.cls).toHaveProperty('p75');
      expect(metrics?.cls).toHaveProperty('rating');
      expect(metrics?.inp).toHaveProperty('p75');
      expect(metrics?.inp).toHaveProperty('rating');
    });

    it('should return null when CRUX_API_KEY is not set', async () => {
      const metrics = await getCruxMetrics('https://example.com', false);

      expect(metrics).toBeNull();
    });

    it('should fetch metrics successfully with valid API key', async () => {
      process.env.CRUX_API_KEY = 'test-api-key';

      const mockResponse = {
        record: {
          metrics: {
            largest_contentful_paint: {
              percentiles: { p75: 2000 } // milliseconds
            },
            cumulative_layout_shift: {
              percentiles: { p75: 0.05 }
            },
            interaction_to_next_paint: {
              percentiles: { p75: 150 }
            }
          }
        }
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const metrics = await getCruxMetrics('https://example.com', false);

      expect(metrics).toBeDefined();
      expect(metrics?.lcp.p75).toBe(2.0); // converted to seconds
      expect(metrics?.lcp.rating).toBe('good');
      expect(metrics?.cls.p75).toBe(0.05);
      expect(metrics?.cls.rating).toBe('good');
      expect(metrics?.inp.p75).toBe(150);
      expect(metrics?.inp.rating).toBe('good');
    });

    it('should handle 404 responses gracefully', async () => {
      process.env.CRUX_API_KEY = 'test-api-key';

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const metrics = await getCruxMetrics('https://example.com', false);

      expect(metrics).toBeNull();
    });

    it('should handle API errors', async () => {
      process.env.CRUX_API_KEY = 'test-api-key';

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const metrics = await getCruxMetrics('https://example.com', false);

      expect(metrics).toBeNull();
    });

    it('should handle malformed API responses', async () => {
      process.env.CRUX_API_KEY = 'test-api-key';

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'response' }),
      } as Response);

      const metrics = await getCruxMetrics('https://example.com', false);

      expect(metrics).toBeNull();
    });

    it('should correctly categorize LCP ratings', async () => {
      process.env.CRUX_API_KEY = 'test-api-key';

      // Test 'good' rating
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          record: {
            metrics: {
              largest_contentful_paint: { percentiles: { p75: 2000 } }, // <= 2500ms = good
              cumulative_layout_shift: { percentiles: { p75: 0 } },
              interaction_to_next_paint: { percentiles: { p75: 0 } }
            }
          }
        }),
      } as Response);

      let metrics = await getCruxMetrics('https://example.com', false);
      expect(metrics?.lcp.rating).toBe('good');

      // Test 'needs-improvement' rating
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          record: {
            metrics: {
              largest_contentful_paint: { percentiles: { p75: 3000 } }, // 2500-4000ms = needs-improvement
              cumulative_layout_shift: { percentiles: { p75: 0 } },
              interaction_to_next_paint: { percentiles: { p75: 0 } }
            }
          }
        }),
      } as Response);

      metrics = await getCruxMetrics('https://example.com', false);
      expect(metrics?.lcp.rating).toBe('needs-improvement');

      // Test 'poor' rating
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          record: {
            metrics: {
              largest_contentful_paint: { percentiles: { p75: 5000 } }, // > 4000ms = poor
              cumulative_layout_shift: { percentiles: { p75: 0 } },
              interaction_to_next_paint: { percentiles: { p75: 0 } }
            }
          }
        }),
      } as Response);

      metrics = await getCruxMetrics('https://example.com', false);
      expect(metrics?.lcp.rating).toBe('poor');
    });

    it('should correctly categorize CLS ratings', async () => {
      process.env.CRUX_API_KEY = 'test-api-key';

      // Test 'good' rating
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          record: {
            metrics: {
              largest_contentful_paint: { percentiles: { p75: 0 } },
              cumulative_layout_shift: { percentiles: { p75: 0.08 } }, // <= 0.1 = good
              interaction_to_next_paint: { percentiles: { p75: 0 } }
            }
          }
        }),
      } as Response);

      let metrics = await getCruxMetrics('https://example.com', false);
      expect(metrics?.cls.rating).toBe('good');

      // Test 'needs-improvement' rating
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          record: {
            metrics: {
              largest_contentful_paint: { percentiles: { p75: 0 } },
              cumulative_layout_shift: { percentiles: { p75: 0.15 } }, // 0.1-0.25 = needs-improvement
              interaction_to_next_paint: { percentiles: { p75: 0 } }
            }
          }
        }),
      } as Response);

      metrics = await getCruxMetrics('https://example.com', false);
      expect(metrics?.cls.rating).toBe('needs-improvement');

      // Test 'poor' rating
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          record: {
            metrics: {
              largest_contentful_paint: { percentiles: { p75: 0 } },
              cumulative_layout_shift: { percentiles: { p75: 0.3 } }, // > 0.25 = poor
              interaction_to_next_paint: { percentiles: { p75: 0 } }
            }
          }
        }),
      } as Response);

      metrics = await getCruxMetrics('https://example.com', false);
      expect(metrics?.cls.rating).toBe('poor');
    });

    it('should correctly categorize INP ratings', async () => {
      process.env.CRUX_API_KEY = 'test-api-key';

      // Test 'good' rating
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          record: {
            metrics: {
              largest_contentful_paint: { percentiles: { p75: 0 } },
              cumulative_layout_shift: { percentiles: { p75: 0 } },
              interaction_to_next_paint: { percentiles: { p75: 150 } } // <= 200ms = good
            }
          }
        }),
      } as Response);

      let metrics = await getCruxMetrics('https://example.com', false);
      expect(metrics?.inp.rating).toBe('good');

      // Test 'needs-improvement' rating
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          record: {
            metrics: {
              largest_contentful_paint: { percentiles: { p75: 0 } },
              cumulative_layout_shift: { percentiles: { p75: 0 } },
              interaction_to_next_paint: { percentiles: { p75: 350 } } // 200-500ms = needs-improvement
            }
          }
        }),
      } as Response);

      metrics = await getCruxMetrics('https://example.com', false);
      expect(metrics?.inp.rating).toBe('needs-improvement');

      // Test 'poor' rating
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          record: {
            metrics: {
              largest_contentful_paint: { percentiles: { p75: 0 } },
              cumulative_layout_shift: { percentiles: { p75: 0 } },
              interaction_to_next_paint: { percentiles: { p75: 600 } } // > 500ms = poor
            }
          }
        }),
      } as Response);

      metrics = await getCruxMetrics('https://example.com', false);
      expect(metrics?.inp.rating).toBe('poor');
    });

    it('should handle network errors gracefully', async () => {
      process.env.CRUX_API_KEY = 'test-api-key';

      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      const metrics = await getCruxMetrics('https://example.com', false);

      expect(metrics).toBeNull();
    });
  });

  describe('formatCruxMetrics', () => {
    it('should format metrics with correct emojis and values', () => {
      const metrics = {
        lcp: { p75: 2.5, rating: 'good' as const },
        cls: { p75: 0.15, rating: 'needs-improvement' as const },
        inp: { p75: 600, rating: 'poor' as const }
      };

      const formatted = formatCruxMetrics(metrics);

      expect(formatted).toContain('Core Web Vitals');
      expect(formatted).toContain('🟢'); // good emoji
      expect(formatted).toContain('🟡'); // needs-improvement emoji
      expect(formatted).toContain('🔴'); // poor emoji
      expect(formatted).toContain('LCP: 2.50s');
      expect(formatted).toContain('CLS: 0.150');
      expect(formatted).toContain('INP: 600ms');
    });

    it('should handle all good ratings', () => {
      const metrics = {
        lcp: { p75: 1.5, rating: 'good' as const },
        cls: { p75: 0.05, rating: 'good' as const },
        inp: { p75: 100, rating: 'good' as const }
      };

      const formatted = formatCruxMetrics(metrics);

      expect(formatted.match(/🟢/g)?.length).toBe(3);
    });
  });

  describe('getWoodWideAnalysis', () => {
    it('should return mock data when useMock is true', async () => {
      const mockMetrics = {
        lcp: { p75: 2.5, rating: 'good' as const },
        cls: { p75: 0.1, rating: 'good' as const },
        inp: { p75: 200, rating: 'good' as const }
      };

      const analysis = await getWoodWideAnalysis(mockMetrics, true);

      expect(analysis).toBeDefined();
      expect(analysis?.significant).toBe(true);
      expect(analysis?.confidence).toBe(0.95);
      expect(analysis?.interpretation).toBeTruthy();
    });

    it('should return null when WOOD_WIDE_API_KEY is not set', async () => {
      const mockMetrics = {
        lcp: { p75: 2.5, rating: 'good' as const },
        cls: { p75: 0.1, rating: 'good' as const },
        inp: { p75: 200, rating: 'good' as const }
      };

      const analysis = await getWoodWideAnalysis(mockMetrics, false);

      expect(analysis).toBeNull();
    });

    it('should return mock data when API key is set but implementation pending', async () => {
      process.env.WOOD_WIDE_API_KEY = 'test-api-key';

      const mockMetrics = {
        lcp: { p75: 2.5, rating: 'good' as const },
        cls: { p75: 0.1, rating: 'good' as const },
        inp: { p75: 200, rating: 'good' as const }
      };

      const analysis = await getWoodWideAnalysis(mockMetrics, false);

      // Should return mock data since implementation is not complete
      expect(analysis).toBeDefined();
      expect(analysis?.significant).toBe(true);
    });
  });

  describe('formatWoodWideAnalysis', () => {
    it('should format significant analysis correctly', () => {
      const analysis = {
        significant: true,
        confidence: 0.95,
        interpretation: 'The change in LCP is statistically significant.'
      };

      const formatted = formatWoodWideAnalysis(analysis);

      expect(formatted).toContain('Wood-Wide Analysis');
      expect(formatted).toContain('✅');
      expect(formatted).toContain('Statistically Significant: true');
      expect(formatted).toContain('Confidence: 95%');
      expect(formatted).toContain('The change in LCP is statistically significant');
    });

    it('should format non-significant analysis correctly', () => {
      const analysis = {
        significant: false,
        confidence: 0.45,
        interpretation: 'The change is not statistically significant.'
      };

      const formatted = formatWoodWideAnalysis(analysis);

      expect(formatted).toContain('❌');
      expect(formatted).toContain('Statistically Significant: false');
      expect(formatted).toContain('Confidence: 45%');
    });

    it('should handle edge case confidence values', () => {
      const analysis = {
        significant: true,
        confidence: 0.999,
        interpretation: 'Very high confidence'
      };

      const formatted = formatWoodWideAnalysis(analysis);

      expect(formatted).toContain('Confidence: 100%');
    });
  });
});
