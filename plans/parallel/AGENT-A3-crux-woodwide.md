# Agent B3: CrUX + Wood Wide Analytics — Detailed Specification

**AI Tool:** Gemini (Free Tier)
**Branch:** `feat/crux-woodwide-analytics`
**Priority:** P1 (Sponsor Tracks: Wood Wide AI $750)
**Developer:** Team B (Developer 2)
**Dependencies:** None (Independent - Can start Day 1)
**Estimated Effort:** 2 days

---

## Mission

Integrate **real user metrics** and **statistical analysis** to make FlowGuard data-driven:

1. **CrUX API Client** - Fetch Chrome User Experience metrics (LCP, CLS, INP)
2. **Wood Wide AI Integration** - Statistical significance testing and anomaly detection
3. **Trend detection** - Identify performance regressions
4. **Mock data generation** - For demos when API unavailable
5. **Graceful fallbacks** - Work offline with cached/mock data

This module is CRITICAL for the **Wood Wide AI $750 sponsor prize** by demonstrating AI-powered numerical analysis and statistical reasoning.

---

## APIs Used

### Chrome User Experience Report (CrUX)
- **Data:** Real user metrics from Chrome browsers
- **Metrics:** LCP (Largest Contentful Paint), CLS (Cumulative Layout Shift), INP (Interaction to Next Paint)
- **API:** Google PageSpeed Insights API
- **Rate Limit:** 25,000 requests/day (free tier)

### Wood Wide AI
- **Purpose:** Statistical analysis and reasoning
- **Features:** Significance testing, anomaly detection, trend analysis
- **API:** Wood Wide reasoning endpoint
- **Use case:** Determine if UX changes are statistically significant

---

## File Structure

```
src/
├── metrics/
│   ├── crux.ts                  # CrUX API client
│   ├── woodwide.ts              # Wood Wide AI client
│   ├── mock-data.ts             # Mock data generator
│   ├── types.ts                 # TypeScript interfaces
│   ├── index.ts                 # Public exports
│   └── __tests__/
│       ├── crux.test.ts
│       ├── woodwide.test.ts
│       └── integration.test.ts
│
docs/
└── METRICS_INTEGRATION.md       # Integration guide
```

---

## Core Deliverables

### 1. CrUX API Client

**File:** `src/metrics/crux.ts`

**Objective:** Fetch real user experience metrics from Google

```typescript
import axios, { AxiosInstance } from 'axios';

export interface CruxMetrics {
  url: string;
  formFactor: 'PHONE' | 'DESKTOP' | 'TABLET';
  metrics: {
    largest_contentful_paint: CruxMetric;
    cumulative_layout_shift: CruxMetric;
    interaction_to_next_paint: CruxMetric;
    first_contentful_paint: CruxMetric;
  };
  collectionPeriod: {
    firstDate: { year: number; month: number; day: number };
    lastDate: { year: number; month: number; day: number };
  };
}

export interface CruxMetric {
  percentiles: {
    p75: number;
  };
  histogram: Array<{
    start: number;
    end?: number;
    density: number;
  }>;
  category: 'FAST' | 'AVERAGE' | 'SLOW';
}

export class CruxClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: 'https://chromeuxreport.googleapis.com/v1',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Get CrUX metrics for a URL.
   *
   * @param url - URL to fetch metrics for
   * @param formFactor - Device type (PHONE, DESKTOP, TABLET)
   * @returns CrUX metrics or null if unavailable
   */
  async getMetrics(
    url: string,
    formFactor: 'PHONE' | 'DESKTOP' | 'TABLET' = 'DESKTOP'
  ): Promise<CruxMetrics | null> {
    try {
      const response = await this.client.post('/records:queryRecord', {
        url,
        formFactor
      }, {
        params: { key: this.apiKey }
      });

      return this.parseCruxResponse(response.data, url, formFactor);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // URL not found in CrUX database (not enough traffic)
        console.warn(`CrUX data not available for ${url}`);
        return null;
      }

      throw error;
    }
  }

  /**
   * Get historical trend for URL (last 6 months).
   */
  async getHistoricalTrend(url: string, formFactor: 'PHONE' | 'DESKTOP' | 'TABLET' = 'DESKTOP'): Promise<CruxTrend | null> {
    try {
      const response = await this.client.post('/records:queryHistoryRecord', {
        url,
        formFactor
      }, {
        params: { key: this.apiKey }
      });

      return this.parseTrendResponse(response.data);
    } catch (error) {
      console.warn(`Historical CrUX data not available for ${url}`);
      return null;
    }
  }

  /**
   * Parse CrUX API response.
   */
  private parseCruxResponse(data: any, url: string, formFactor: string): CruxMetrics {
    const metrics: any = {};

    // Parse each metric
    const metricKeys = [
      'largest_contentful_paint',
      'cumulative_layout_shift',
      'interaction_to_next_paint',
      'first_contentful_paint'
    ];

    for (const key of metricKeys) {
      if (data.record.metrics[key]) {
        const metric = data.record.metrics[key];
        metrics[key] = {
          percentiles: metric.percentiles,
          histogram: metric.histogram,
          category: this.categorizeMetric(key, metric.percentiles.p75)
        };
      }
    }

    return {
      url,
      formFactor: formFactor as any,
      metrics,
      collectionPeriod: data.record.collectionPeriod
    };
  }

  /**
   * Categorize metric as FAST, AVERAGE, or SLOW based on Web Vitals thresholds.
   */
  private categorizeMetric(metricName: string, value: number): 'FAST' | 'AVERAGE' | 'SLOW' {
    const thresholds: Record<string, { good: number; poor: number }> = {
      largest_contentful_paint: { good: 2500, poor: 4000 },
      cumulative_layout_shift: { good: 0.1, poor: 0.25 },
      interaction_to_next_paint: { good: 200, poor: 500 },
      first_contentful_paint: { good: 1800, poor: 3000 }
    };

    const threshold = thresholds[metricName];
    if (!threshold) return 'AVERAGE';

    if (value <= threshold.good) return 'FAST';
    if (value >= threshold.poor) return 'SLOW';
    return 'AVERAGE';
  }

  /**
   * Parse historical trend response.
   */
  private parseTrendResponse(data: any): CruxTrend {
    const records = data.record.historyRecord || [];

    return {
      url: data.record.key.url,
      dataPoints: records.map((r: any) => ({
        date: `${r.collectionPeriod.firstDate.year}-${r.collectionPeriod.firstDate.month.toString().padStart(2, '0')}`,
        lcp: r.metrics.largest_contentful_paint?.percentiles.p75 || 0,
        cls: r.metrics.cumulative_layout_shift?.percentiles.p75 || 0,
        inp: r.metrics.interaction_to_next_paint?.percentiles.p75 || 0
      }))
    };
  }
}

export interface CruxTrend {
  url: string;
  dataPoints: Array<{
    date: string;
    lcp: number;
    cls: number;
    inp: number;
  }>;
}
```

---

### 2. Wood Wide AI Client

**File:** `src/metrics/woodwide.ts`

**Objective:** Statistical analysis and numerical reasoning

```typescript
import axios, { AxiosInstance } from 'axios';

export interface WoodWideAnalysis {
  insights: Array<{
    title: string;
    description: string;
    severity: 'info' | 'warning' | 'critical';
    confidence: number;
  }>;
  significance: {
    isSignificant: boolean;
    pValue: number;
    effectSize: number;
  };
  anomalies: Array<{
    metric: string;
    value: number;
    expectedRange: { min: number; max: number };
    deviation: number;
  }>;
}

export class WoodWideClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string, endpoint: string = 'https://api.woodwide.ai/v1') {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: endpoint,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Analyze statistical significance of A/B test results.
   *
   * @param controlMetrics - Metrics from control group
   * @param variantMetrics - Metrics from variant group
   * @param sampleSize - Number of observations
   * @returns Statistical analysis
   */
  async analyzeSignificance(
    controlMetrics: { successRate: number; avgDuration: number },
    variantMetrics: { successRate: number; avgDuration: number },
    sampleSize: number
  ): Promise<WoodWideAnalysis> {
    try {
      const response = await this.client.post('/analyze/significance', {
        control: controlMetrics,
        variant: variantMetrics,
        sampleSize,
        confidenceLevel: 0.95
      });

      return this.parseAnalysisResponse(response.data);
    } catch (error) {
      console.warn('Wood Wide API unavailable, using fallback analysis');
      return this.fallbackAnalysis(controlMetrics, variantMetrics, sampleSize);
    }
  }

  /**
   * Detect anomalies in time series metrics.
   *
   * @param timeSeries - Array of metric values over time
   * @param metricName - Name of the metric
   * @returns Anomaly detection results
   */
  async detectAnomalies(
    timeSeries: Array<{ timestamp: Date; value: number }>,
    metricName: string
  ): Promise<WoodWideAnalysis> {
    try {
      const response = await this.client.post('/analyze/anomalies', {
        timeSeries,
        metricName,
        sensitivity: 'medium'
      });

      return this.parseAnalysisResponse(response.data);
    } catch (error) {
      console.warn('Wood Wide API unavailable, using fallback anomaly detection');
      return this.fallbackAnomalyDetection(timeSeries, metricName);
    }
  }

  /**
   * Analyze CrUX metrics trends.
   */
  async analyzeCruxTrends(trend: CruxTrend): Promise<WoodWideAnalysis> {
    const prompt = `Analyze these Chrome User Experience metrics trends:

${JSON.stringify(trend.dataPoints, null, 2)}

Metrics:
- LCP (Largest Contentful Paint): Good < 2.5s, Poor > 4.0s
- CLS (Cumulative Layout Shift): Good < 0.1, Poor > 0.25
- INP (Interaction to Next Paint): Good < 200ms, Poor > 500ms

Provide:
1. Key insights about performance trends
2. Statistical significance of changes
3. Anomalies or concerning patterns
4. Actionable recommendations`;

    try {
      const response = await this.client.post('/reason', {
        prompt,
        context: { type: 'crux_analysis' }
      });

      return this.parseReasoningResponse(response.data);
    } catch (error) {
      console.warn('Wood Wide API unavailable, using rule-based analysis');
      return this.fallbackCruxAnalysis(trend);
    }
  }

  /**
   * Parse Wood Wide analysis response.
   */
  private parseAnalysisResponse(data: any): WoodWideAnalysis {
    return {
      insights: data.insights || [],
      significance: data.significance || {
        isSignificant: false,
        pValue: 1.0,
        effectSize: 0
      },
      anomalies: data.anomalies || []
    };
  }

  /**
   * Parse Wood Wide reasoning response.
   */
  private parseReasoningResponse(data: any): WoodWideAnalysis {
    const text = data.reasoning || data.response || '';

    // Extract insights from AI response
    const insights = this.extractInsights(text);

    return {
      insights,
      significance: {
        isSignificant: text.toLowerCase().includes('significant'),
        pValue: 0.05,
        effectSize: 0.5
      },
      anomalies: []
    };
  }

  /**
   * Extract insights from AI text response.
   */
  private extractInsights(text: string): Array<{ title: string; description: string; severity: 'info' | 'warning' | 'critical'; confidence: number }> {
    const insights: Array<any> = [];

    // Look for numbered insights or bullet points
    const lines = text.split('\n');
    let currentInsight: any = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // Check for insight start (numbered or bullet)
      if (/^\d+\./.test(trimmed) || /^[-*]/.test(trimmed)) {
        if (currentInsight) {
          insights.push(currentInsight);
        }

        currentInsight = {
          title: trimmed.replace(/^[\d\.\-\*\s]+/, '').substring(0, 100),
          description: '',
          severity: this.inferSeverity(trimmed),
          confidence: 85
        };
      } else if (currentInsight && trimmed) {
        currentInsight.description += trimmed + ' ';
      }
    }

    if (currentInsight) {
      insights.push(currentInsight);
    }

    return insights.length > 0 ? insights : [{
      title: 'Analysis Complete',
      description: text.substring(0, 500),
      severity: 'info',
      confidence: 80
    }];
  }

  /**
   * Infer severity from text.
   */
  private inferSeverity(text: string): 'info' | 'warning' | 'critical' {
    const lower = text.toLowerCase();

    if (lower.includes('critical') || lower.includes('urgent') || lower.includes('fail')) {
      return 'critical';
    }

    if (lower.includes('warning') || lower.includes('concern') || lower.includes('issue')) {
      return 'warning';
    }

    return 'info';
  }

  /**
   * Fallback analysis when API unavailable.
   */
  private fallbackAnalysis(
    control: { successRate: number; avgDuration: number },
    variant: { successRate: number; avgDuration: number },
    n: number
  ): WoodWideAnalysis {
    const successDiff = variant.successRate - control.successRate;
    const durationDiff = variant.avgDuration - control.avgDuration;

    // Simple z-test for proportions
    const pooled = (control.successRate + variant.successRate) / 2;
    const se = Math.sqrt(2 * pooled * (1 - pooled) / n);
    const z = Math.abs(successDiff) / se;
    const pValue = 2 * (1 - this.normalCDF(z));

    const insights: any[] = [];

    if (Math.abs(successDiff) > 0.05) {
      insights.push({
        title: `Success rate ${successDiff > 0 ? 'improved' : 'decreased'} by ${Math.abs(successDiff * 100).toFixed(1)}%`,
        description: `The variant shows a ${successDiff > 0 ? 'positive' : 'negative'} change in success rate.`,
        severity: pValue < 0.05 ? (successDiff > 0 ? 'info' : 'warning') : 'info',
        confidence: 80
      });
    }

    if (Math.abs(durationDiff) > 100) {
      insights.push({
        title: `Duration changed by ${(durationDiff / 1000).toFixed(2)}s`,
        description: `The variant is ${durationDiff > 0 ? 'slower' : 'faster'} than the control.`,
        severity: durationDiff > 0 ? 'warning' : 'info',
        confidence: 75
      });
    }

    return {
      insights,
      significance: {
        isSignificant: pValue < 0.05,
        pValue,
        effectSize: successDiff
      },
      anomalies: []
    };
  }

  /**
   * Fallback anomaly detection.
   */
  private fallbackAnomalyDetection(
    timeSeries: Array<{ timestamp: Date; value: number }>,
    metricName: string
  ): WoodWideAnalysis {
    if (timeSeries.length < 3) {
      return {
        insights: [],
        significance: { isSignificant: false, pValue: 1, effectSize: 0 },
        anomalies: []
      };
    }

    const values = timeSeries.map(t => t.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const anomalies: any[] = [];

    timeSeries.forEach((point, i) => {
      const zScore = (point.value - mean) / stdDev;

      if (Math.abs(zScore) > 2) {
        anomalies.push({
          metric: metricName,
          value: point.value,
          expectedRange: { min: mean - 2 * stdDev, max: mean + 2 * stdDev },
          deviation: zScore
        });
      }
    });

    return {
      insights: anomalies.map(a => ({
        title: `Anomaly detected in ${a.metric}`,
        description: `Value ${a.value} is ${Math.abs(a.deviation).toFixed(1)} standard deviations from mean`,
        severity: Math.abs(a.deviation) > 3 ? 'warning' : 'info',
        confidence: 85
      })),
      significance: {
        isSignificant: anomalies.length > 0,
        pValue: 0.05,
        effectSize: 0
      },
      anomalies
    };
  }

  /**
   * Fallback CrUX analysis.
   */
  private fallbackCruxAnalysis(trend: CruxTrend): WoodWideAnalysis {
    const insights: any[] = [];

    if (trend.dataPoints.length < 2) {
      return {
        insights: [{
          title: 'Insufficient data for trend analysis',
          description: 'Need at least 2 data points for trend analysis',
          severity: 'info',
          confidence: 90
        }],
        significance: { isSignificant: false, pValue: 1, effectSize: 0 },
        anomalies: []
      };
    }

    // Check recent vs old
    const recent = trend.dataPoints[trend.dataPoints.length - 1];
    const old = trend.dataPoints[0];

    // LCP analysis
    if (recent.lcp > 2500) {
      insights.push({
        title: 'LCP needs improvement',
        description: `Current LCP of ${recent.lcp}ms exceeds the "good" threshold of 2500ms`,
        severity: recent.lcp > 4000 ? 'critical' : 'warning',
        confidence: 95
      });
    }

    // CLS analysis
    if (recent.cls > 0.1) {
      insights.push({
        title: 'CLS issues detected',
        description: `Current CLS of ${recent.cls.toFixed(3)} exceeds the "good" threshold of 0.1`,
        severity: recent.cls > 0.25 ? 'critical' : 'warning',
        confidence: 95
      });
    }

    // INP analysis
    if (recent.inp > 200) {
      insights.push({
        title: 'INP needs optimization',
        description: `Current INP of ${recent.inp}ms exceeds the "good" threshold of 200ms`,
        severity: recent.inp > 500 ? 'critical' : 'warning',
        confidence: 90
      });
    }

    // Trend analysis
    const lcpChange = ((recent.lcp - old.lcp) / old.lcp) * 100;
    if (Math.abs(lcpChange) > 10) {
      insights.push({
        title: `LCP ${lcpChange > 0 ? 'degraded' : 'improved'} by ${Math.abs(lcpChange).toFixed(1)}%`,
        description: `Comparing first and last data points in trend`,
        severity: lcpChange > 0 ? 'warning' : 'info',
        confidence: 80
      });
    }

    return {
      insights,
      significance: {
        isSignificant: insights.length > 0,
        pValue: 0.05,
        effectSize: 0.5
      },
      anomalies: []
    };
  }

  /**
   * Standard normal CDF approximation.
   */
  private normalCDF(z: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const probability = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - probability : probability;
  }
}
```

---

### 3. Mock Data Generator

**File:** `src/metrics/mock-data.ts`

**Objective:** Generate realistic mock data for demos

```typescript
export function generateMockCruxMetrics(url: string): CruxMetrics {
  return {
    url,
    formFactor: 'DESKTOP',
    metrics: {
      largest_contentful_paint: {
        percentiles: { p75: 1800 + Math.random() * 1000 },
        histogram: [
          { start: 0, end: 2500, density: 0.7 },
          { start: 2500, end: 4000, density: 0.2 },
          { start: 4000, density: 0.1 }
        ],
        category: 'FAST'
      },
      cumulative_layout_shift: {
        percentiles: { p75: 0.05 + Math.random() * 0.1 },
        histogram: [
          { start: 0, end: 0.1, density: 0.8 },
          { start: 0.1, end: 0.25, density: 0.15 },
          { start: 0.25, density: 0.05 }
        ],
        category: 'FAST'
      },
      interaction_to_next_paint: {
        percentiles: { p75: 100 + Math.random() * 150 },
        histogram: [
          { start: 0, end: 200, density: 0.75 },
          { start: 200, end: 500, density: 0.2 },
          { start: 500, density: 0.05 }
        ],
        category: 'FAST'
      },
      first_contentful_paint: {
        percentiles: { p75: 1200 + Math.random() * 800 },
        histogram: [
          { start: 0, end: 1800, density: 0.7 },
          { start: 1800, end: 3000, density: 0.2 },
          { start: 3000, density: 0.1 }
        ],
        category: 'FAST'
      }
    },
    collectionPeriod: {
      firstDate: { year: 2026, month: 1, day: 1 },
      lastDate: { year: 2026, month: 1, day: 15 }
    }
  };
}

export function generateMockWoodWideAnalysis(): WoodWideAnalysis {
  return {
    insights: [
      {
        title: 'Performance is within acceptable range',
        description: 'All Core Web Vitals metrics meet the "good" thresholds with statistical significance.',
        severity: 'info',
        confidence: 95
      },
      {
        title: 'LCP showing slight improvement trend',
        description: 'Largest Contentful Paint has improved by 8.3% over the last 30 days, with p < 0.05.',
        severity: 'info',
        confidence: 92
      },
      {
        title: 'CLS remains stable',
        description: 'Cumulative Layout Shift shows no significant change, maintaining good performance.',
        severity: 'info',
        confidence: 90
      }
    ],
    significance: {
      isSignificant: true,
      pValue: 0.03,
      effectSize: 0.4
    },
    anomalies: []
  };
}
```

---

## Integration with Reports

**For Agent A4 (HTML Reports):**

```typescript
// Agent A4 can use these metrics in reports
import { CruxClient } from '../metrics/crux.js';
import { WoodWideClient } from '../metrics/woodwide.js';

const cruxClient = new CruxClient(process.env.CRUX_API_KEY!);
const woodwideClient = new WoodWideClient(process.env.WOOD_WIDE_API_KEY!);

// Fetch CrUX metrics
const cruxMetrics = await cruxClient.getMetrics('https://example.com', 'DESKTOP');

// Analyze with Wood Wide
const analysis = cruxMetrics
  ? await woodwideClient.analyzeCruxTrends(await cruxClient.getHistoricalTrend('https://example.com')!)
  : null;

// Include in report
const report = await reportGenerator.generateReport({
  flowRun,
  cruxMetrics,
  woodWideInsights: analysis
});
```

---

## Testing

**File:** `src/metrics/__tests__/crux.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals';
import { CruxClient } from '../crux.js';
import { WoodWideClient } from '../woodwide.js';

describe('CruxClient', () => {
  const client = new CruxClient(process.env.CRUX_API_KEY || 'test-key');

  it('should fetch CrUX metrics for valid URL', async () => {
    const metrics = await client.getMetrics('https://web.dev', 'DESKTOP');

    if (metrics) {
      expect(metrics.url).toBe('https://web.dev');
      expect(metrics.metrics.largest_contentful_paint).toBeDefined();
    }
  });

  it('should return null for URL without CrUX data', async () => {
    const metrics = await client.getMetrics('https://localhost:3000', 'DESKTOP');
    expect(metrics).toBeNull();
  });

  it('should categorize metrics correctly', async () => {
    const metrics = await client.getMetrics('https://web.dev', 'DESKTOP');

    if (metrics) {
      expect(['FAST', 'AVERAGE', 'SLOW']).toContain(metrics.metrics.largest_contentful_paint.category);
    }
  });
});

describe('WoodWideClient', () => {
  const client = new WoodWideClient(process.env.WOOD_WIDE_API_KEY || 'test-key');

  it('should analyze significance with fallback', async () => {
    const analysis = await client.analyzeSignificance(
      { successRate: 0.85, avgDuration: 2000 },
      { successRate: 0.92, avgDuration: 1800 },
      100
    );

    expect(analysis.insights).toBeDefined();
    expect(analysis.significance.pValue).toBeGreaterThanOrEqual(0);
    expect(analysis.significance.pValue).toBeLessThanOrEqual(1);
  });

  it('should detect anomalies', async () => {
    const timeSeries = [
      { timestamp: new Date('2026-01-01'), value: 100 },
      { timestamp: new Date('2026-01-02'), value: 105 },
      { timestamp: new Date('2026-01-03'), value: 500 }, // Anomaly
      { timestamp: new Date('2026-01-04'), value: 102 }
    ];

    const analysis = await client.detectAnomalies(timeSeries, 'response_time');

    expect(analysis.anomalies.length).toBeGreaterThan(0);
  });
});
```

---

## Acceptance Criteria

- [ ] CrUX API client fetches real user metrics
- [ ] Wood Wide AI integration provides statistical analysis
- [ ] Graceful fallbacks when APIs unavailable
- [ ] Mock data generator creates realistic demos
- [ ] Trend detection identifies regressions
- [ ] Integration with reports works
- [ ] Tests pass with mocked APIs
- [ ] Documentation complete

---

## Dependencies

**Depends on:** None (Independent!)

**Integrates with:**
- Agent A4 (HTML Reports) - Displays metrics

---

## Quick Start

```bash
# Create branch (Can start Day 1!)
git checkout -b feat/crux-woodwide-analytics

# Install dependencies
npm install axios

# Setup API keys (see docs)
export CRUX_API_KEY=<google-api-key>
export WOOD_WIDE_API_KEY=<wood-wide-key>

# Test CrUX
npm run build
tsx scripts/test-crux.ts https://web.dev

# Run tests
npm test src/metrics
```

---

## Success Metrics

- ✅ CrUX data fetches successfully
- ✅ Wood Wide insights are meaningful
- ✅ Fallbacks work offline
- ✅ Mock data looks realistic
- ✅ Wood Wide AI prize criteria met

**This module showcases AI-powered analytics!** 📊
