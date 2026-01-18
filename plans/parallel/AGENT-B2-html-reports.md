# Agent A4: HTML Report Generation — Detailed Specification

**AI Tool:** Cursor Pro
**Branch:** `feat/html-report-generator`
**Priority:** P1 (Frontend Excellence)
**Developer:** Team A (Developer 1)
**Dependencies:** MongoDB Core (Agent A1) - Must wait for A1 to merge
**Estimated Effort:** 2-3 days

---

## Mission

Create **stunning, production-grade HTML reports** that showcase FlowGuard's capabilities with:

1. **Modern, clean design** - Professional aesthetics that wow hackathon judges
2. **Fully responsive** - Perfect on mobile, tablet, and desktop
3. **Interactive data visualizations** - Charts, trends, and insights
4. **CrUX + Wood Wide integration** - Real user metrics and statistical analysis
5. **Print-friendly** - Beautiful PDF exports
6. **Accessibility** - WCAG AA compliance
7. **Fast loading** - <100KB total file size, no external dependencies

This module is CRITICAL for demo impact - judges will see these reports and be impressed by the visual polish and data insights.

---

## Design Principles

### Visual Design
- **Color Palette:** Modern gradient-based design (blues/purples for pass, reds for fail, neutrals for data)
- **Typography:** Inter font family (system fallbacks), clear hierarchy
- **Spacing:** Generous whitespace, 8px grid system
- **Shadows:** Subtle depth with modern shadow styles
- **Icons:** Inline SVG icons (no dependencies)

### Responsive Breakpoints
- **Mobile:** 320px - 767px (single column, collapsible sections)
- **Tablet:** 768px - 1023px (two column grid)
- **Desktop:** 1024px+ (three column grid, side-by-side comparisons)

### Interactivity
- **Smooth animations** on load and scroll
- **Expandable sections** for detailed step results
- **Filterable views** (show all / show failures only)
- **Copy-to-clipboard** for sharing data
- **Dark mode toggle** (optional, if time permits)

---

## File Structure

```
src/
├── report/
│   ├── generator.ts             # Main report generator
│   ├── templates/
│   │   ├── base.ts              # Base HTML template
│   │   ├── header.ts            # Report header component
│   │   ├── summary.ts           # Summary cards component
│   │   ├── steps.ts             # Step-by-step results
│   │   ├── trends.ts            # Historical trend charts
│   │   ├── crux.ts              # CrUX metrics display
│   │   ├── woodwide.ts          # Wood Wide insights
│   │   └── footer.ts            # Footer with metadata
│   ├── styles.ts                # Embedded CSS
│   ├── charts.ts                # Chart generation (Canvas/SVG)
│   ├── types.ts                 # TypeScript interfaces
│   ├── index.ts                 # Public exports
│   └── __tests__/
│       ├── generator.test.ts
│       └── snapshot.test.ts     # Visual regression tests
│
src/report.ts                    # MODIFY existing file
```

---

## Core Deliverables

### 1. Beautiful Base Template

**File:** `src/report/templates/base.ts`

**Objective:** Create the foundational HTML structure with embedded modern CSS

```typescript
export function generateBaseTemplate(content: string, metadata: ReportMetadata): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="FlowGuard AI Test Report - ${metadata.flowName}">
  <title>FlowGuard Report - ${metadata.flowName}</title>
  <style>
    ${getEmbeddedStyles()}
  </style>
</head>
<body class="report-body">
  <div class="report-container">
    ${content}
  </div>

  <script>
    ${getEmbeddedScripts()}
  </script>
</body>
</html>`;
}
```

---

### 2. Modern Embedded Styles

**File:** `src/report/styles.ts`

**Objective:** Production-grade CSS with modern design patterns

```typescript
export function getEmbeddedStyles(): string {
  return `
    /* ===== RESET & BASE ===== */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      /* Color System */
      --color-primary: #3b82f6;
      --color-primary-dark: #2563eb;
      --color-success: #10b981;
      --color-success-light: #d1fae5;
      --color-danger: #ef4444;
      --color-danger-light: #fee2e2;
      --color-warning: #f59e0b;
      --color-warning-light: #fef3c7;
      --color-neutral-50: #f9fafb;
      --color-neutral-100: #f3f4f6;
      --color-neutral-200: #e5e7eb;
      --color-neutral-300: #d1d5db;
      --color-neutral-600: #4b5563;
      --color-neutral-700: #374151;
      --color-neutral-800: #1f2937;
      --color-neutral-900: #111827;

      /* Gradients */
      --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      --gradient-success: linear-gradient(135deg, #10b981 0%, #059669 100%);
      --gradient-danger: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);

      /* Shadows */
      --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

      /* Spacing */
      --spacing-xs: 0.25rem;
      --spacing-sm: 0.5rem;
      --spacing-md: 1rem;
      --spacing-lg: 1.5rem;
      --spacing-xl: 2rem;
      --spacing-2xl: 3rem;

      /* Border Radius */
      --radius-sm: 0.375rem;
      --radius-md: 0.5rem;
      --radius-lg: 0.75rem;
      --radius-xl: 1rem;

      /* Typography */
      --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif;
      --font-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
    }

    /* ===== BASE STYLES ===== */
    body {
      font-family: var(--font-family);
      font-size: 16px;
      line-height: 1.6;
      color: var(--color-neutral-800);
      background: var(--color-neutral-50);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .report-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: var(--spacing-xl);
    }

    /* ===== HEADER ===== */
    .report-header {
      background: var(--gradient-primary);
      color: white;
      padding: var(--spacing-2xl) var(--spacing-xl);
      border-radius: var(--radius-xl);
      margin-bottom: var(--spacing-2xl);
      box-shadow: var(--shadow-xl);
      position: relative;
      overflow: hidden;
    }

    .report-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="white" opacity="0.05"/></svg>');
      background-size: 200px 200px;
      opacity: 0.3;
    }

    .report-header-content {
      position: relative;
      z-index: 1;
    }

    .report-title {
      font-size: 2.5rem;
      font-weight: 800;
      margin-bottom: var(--spacing-sm);
      letter-spacing: -0.025em;
    }

    .report-subtitle {
      font-size: 1.125rem;
      opacity: 0.9;
      font-weight: 400;
    }

    .report-meta {
      display: flex;
      gap: var(--spacing-lg);
      margin-top: var(--spacing-lg);
      flex-wrap: wrap;
    }

    .report-meta-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-size: 0.875rem;
      opacity: 0.9;
    }

    /* ===== SUMMARY CARDS ===== */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-2xl);
    }

    .summary-card {
      background: white;
      border-radius: var(--radius-lg);
      padding: var(--spacing-xl);
      box-shadow: var(--shadow-md);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid var(--color-neutral-200);
    }

    .summary-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-xl);
    }

    .summary-card.success {
      border-left: 4px solid var(--color-success);
    }

    .summary-card.danger {
      border-left: 4px solid var(--color-danger);
    }

    .summary-card.warning {
      border-left: 4px solid var(--color-warning);
    }

    .summary-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--spacing-md);
    }

    .summary-card-title {
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-neutral-600);
    }

    .summary-card-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .summary-card-icon.success {
      background: var(--color-success-light);
      color: var(--color-success);
    }

    .summary-card-icon.danger {
      background: var(--color-danger-light);
      color: var(--color-danger);
    }

    .summary-card-value {
      font-size: 2.5rem;
      font-weight: 800;
      line-height: 1;
      margin-bottom: var(--spacing-sm);
    }

    .summary-card-label {
      font-size: 0.875rem;
      color: var(--color-neutral-600);
    }

    .summary-card-trend {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-size: 0.75rem;
      margin-top: var(--spacing-md);
      padding-top: var(--spacing-md);
      border-top: 1px solid var(--color-neutral-200);
    }

    .trend-up {
      color: var(--color-success);
    }

    .trend-down {
      color: var(--color-danger);
    }

    /* ===== STEP RESULTS ===== */
    .steps-section {
      background: white;
      border-radius: var(--radius-lg);
      padding: var(--spacing-xl);
      box-shadow: var(--shadow-md);
      margin-bottom: var(--spacing-2xl);
    }

    .steps-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--spacing-lg);
      padding-bottom: var(--spacing-md);
      border-bottom: 2px solid var(--color-neutral-200);
    }

    .steps-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-neutral-900);
    }

    .steps-filter {
      display: flex;
      gap: var(--spacing-sm);
    }

    .filter-btn {
      padding: var(--spacing-sm) var(--spacing-md);
      border: 1px solid var(--color-neutral-300);
      background: white;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
      font-family: var(--font-family);
    }

    .filter-btn:hover {
      background: var(--color-neutral-100);
    }

    .filter-btn.active {
      background: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
    }

    .step-item {
      border-left: 3px solid var(--color-neutral-300);
      padding-left: var(--spacing-lg);
      margin-bottom: var(--spacing-lg);
      position: relative;
      transition: all 0.3s;
    }

    .step-item.passed {
      border-left-color: var(--color-success);
    }

    .step-item.failed {
      border-left-color: var(--color-danger);
    }

    .step-item::before {
      content: '';
      position: absolute;
      left: -8px;
      top: 8px;
      width: 13px;
      height: 13px;
      border-radius: 50%;
      background: var(--color-neutral-300);
      border: 3px solid white;
      box-shadow: var(--shadow-sm);
    }

    .step-item.passed::before {
      background: var(--color-success);
    }

    .step-item.failed::before {
      background: var(--color-danger);
    }

    .step-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: var(--spacing-sm);
      cursor: pointer;
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
      transition: background 0.2s;
    }

    .step-header:hover {
      background: var(--color-neutral-50);
    }

    .step-info {
      flex: 1;
    }

    .step-number {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-neutral-600);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: var(--spacing-xs);
    }

    .step-action {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-neutral-900);
      margin-bottom: var(--spacing-xs);
    }

    .step-assertion {
      font-size: 0.875rem;
      color: var(--color-neutral-600);
      font-style: italic;
    }

    .step-status {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      font-weight: 600;
    }

    .step-status.passed {
      background: var(--color-success-light);
      color: var(--color-success);
    }

    .step-status.failed {
      background: var(--color-danger-light);
      color: var(--color-danger);
    }

    .step-details {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      padding: 0 var(--spacing-md);
    }

    .step-details.expanded {
      max-height: 1000px;
      padding: var(--spacing-md);
    }

    .step-screenshot {
      border-radius: var(--radius-md);
      overflow: hidden;
      margin-top: var(--spacing-md);
      box-shadow: var(--shadow-lg);
    }

    .step-screenshot img {
      width: 100%;
      height: auto;
      display: block;
    }

    .step-reasoning {
      background: var(--color-neutral-50);
      border-radius: var(--radius-md);
      padding: var(--spacing-md);
      margin-top: var(--spacing-md);
      font-size: 0.875rem;
      line-height: 1.6;
      font-family: var(--font-mono);
    }

    .step-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: var(--spacing-md);
      margin-top: var(--spacing-md);
    }

    .step-metric {
      text-align: center;
      padding: var(--spacing-sm);
      background: var(--color-neutral-100);
      border-radius: var(--radius-sm);
    }

    .step-metric-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-neutral-900);
    }

    .step-metric-label {
      font-size: 0.75rem;
      color: var(--color-neutral-600);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* ===== TREND CHARTS ===== */
    .trends-section {
      background: white;
      border-radius: var(--radius-lg);
      padding: var(--spacing-xl);
      box-shadow: var(--shadow-md);
      margin-bottom: var(--spacing-2xl);
    }

    .trends-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: var(--spacing-lg);
      color: var(--color-neutral-900);
    }

    .chart-container {
      position: relative;
      height: 300px;
      margin-bottom: var(--spacing-lg);
    }

    .chart-canvas {
      width: 100%;
      height: 100%;
    }

    /* ===== CRUX METRICS ===== */
    .crux-section {
      background: white;
      border-radius: var(--radius-lg);
      padding: var(--spacing-xl);
      box-shadow: var(--shadow-md);
      margin-bottom: var(--spacing-2xl);
    }

    .crux-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: var(--spacing-sm);
      color: var(--color-neutral-900);
    }

    .crux-subtitle {
      font-size: 0.875rem;
      color: var(--color-neutral-600);
      margin-bottom: var(--spacing-lg);
    }

    .crux-metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-lg);
    }

    .crux-metric {
      text-align: center;
      padding: var(--spacing-lg);
      border: 2px solid var(--color-neutral-200);
      border-radius: var(--radius-lg);
      transition: all 0.3s;
    }

    .crux-metric:hover {
      border-color: var(--color-primary);
      transform: scale(1.05);
    }

    .crux-metric-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-neutral-600);
      margin-bottom: var(--spacing-sm);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .crux-metric-value {
      font-size: 2rem;
      font-weight: 800;
      margin-bottom: var(--spacing-xs);
    }

    .crux-metric-value.good {
      color: var(--color-success);
    }

    .crux-metric-value.needs-improvement {
      color: var(--color-warning);
    }

    .crux-metric-value.poor {
      color: var(--color-danger);
    }

    .crux-metric-rating {
      font-size: 0.75rem;
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--radius-sm);
      display: inline-block;
      font-weight: 600;
    }

    .crux-metric-rating.good {
      background: var(--color-success-light);
      color: var(--color-success);
    }

    .crux-metric-rating.needs-improvement {
      background: var(--color-warning-light);
      color: var(--color-warning);
    }

    .crux-metric-rating.poor {
      background: var(--color-danger-light);
      color: var(--color-danger);
    }

    /* ===== WOOD WIDE INSIGHTS ===== */
    .woodwide-section {
      background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
      border: 2px solid var(--color-primary);
      border-radius: var(--radius-lg);
      padding: var(--spacing-xl);
      margin-bottom: var(--spacing-2xl);
    }

    .woodwide-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
    }

    .woodwide-icon {
      width: 48px;
      height: 48px;
      background: var(--gradient-primary);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 800;
      font-size: 1.5rem;
    }

    .woodwide-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-neutral-900);
    }

    .woodwide-insights {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .woodwide-insight {
      background: white;
      padding: var(--spacing-lg);
      border-radius: var(--radius-md);
      border-left: 4px solid var(--color-primary);
      box-shadow: var(--shadow-sm);
    }

    .woodwide-insight-title {
      font-weight: 600;
      color: var(--color-neutral-900);
      margin-bottom: var(--spacing-sm);
    }

    .woodwide-insight-text {
      font-size: 0.875rem;
      color: var(--color-neutral-700);
      line-height: 1.6;
    }

    /* ===== FOOTER ===== */
    .report-footer {
      background: white;
      border-radius: var(--radius-lg);
      padding: var(--spacing-xl);
      box-shadow: var(--shadow-md);
      text-align: center;
      margin-top: var(--spacing-2xl);
    }

    .report-footer-logo {
      font-size: 1.5rem;
      font-weight: 800;
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: var(--spacing-sm);
    }

    .report-footer-text {
      font-size: 0.875rem;
      color: var(--color-neutral-600);
    }

    .report-footer-meta {
      display: flex;
      justify-content: center;
      gap: var(--spacing-lg);
      margin-top: var(--spacing-md);
      font-size: 0.75rem;
      color: var(--color-neutral-500);
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 767px) {
      .report-container {
        padding: var(--spacing-md);
      }

      .report-title {
        font-size: 1.75rem;
      }

      .summary-grid {
        grid-template-columns: 1fr;
      }

      .report-meta {
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .steps-filter {
        flex-direction: column;
        width: 100%;
      }

      .filter-btn {
        width: 100%;
      }

      .crux-metrics-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (min-width: 768px) and (max-width: 1023px) {
      .summary-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .crux-metrics-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    /* ===== PRINT STYLES ===== */
    @media print {
      body {
        background: white;
      }

      .report-container {
        max-width: 100%;
        padding: 0;
      }

      .summary-card,
      .steps-section,
      .trends-section,
      .crux-section,
      .woodwide-section,
      .report-footer {
        box-shadow: none;
        page-break-inside: avoid;
      }

      .filter-btn {
        display: none;
      }

      .step-details {
        max-height: none !important;
        display: block !important;
      }
    }

    /* ===== ANIMATIONS ===== */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .summary-card,
    .step-item,
    .crux-metric {
      animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      opacity: 0;
    }

    .summary-card:nth-child(1) { animation-delay: 0.1s; }
    .summary-card:nth-child(2) { animation-delay: 0.2s; }
    .summary-card:nth-child(3) { animation-delay: 0.3s; }
    .summary-card:nth-child(4) { animation-delay: 0.4s; }

    .step-item:nth-child(1) { animation-delay: 0.1s; }
    .step-item:nth-child(2) { animation-delay: 0.15s; }
    .step-item:nth-child(3) { animation-delay: 0.2s; }
    .step-item:nth-child(4) { animation-delay: 0.25s; }
    .step-item:nth-child(5) { animation-delay: 0.3s; }
  `;
}
```

---

### 3. Interactive JavaScript

**File:** `src/report/templates/base.ts` (continued)

```typescript
function getEmbeddedScripts(): string {
  return `
    // Step expansion toggle
    document.querySelectorAll('.step-header').forEach((header, index) => {
      header.addEventListener('click', () => {
        const details = header.nextElementSibling;
        const isExpanded = details.classList.contains('expanded');

        if (isExpanded) {
          details.classList.remove('expanded');
        } else {
          details.classList.add('expanded');
        }
      });
    });

    // Filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    const stepItems = document.querySelectorAll('.step-item');

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Update active state
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Filter steps
        const filter = btn.dataset.filter;
        stepItems.forEach(item => {
          if (filter === 'all') {
            item.style.display = 'block';
          } else if (filter === 'failed' && item.classList.contains('failed')) {
            item.style.display = 'block';
          } else if (filter === 'passed' && item.classList.contains('passed')) {
            item.style.display = 'block';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });

    // Copy report URL
    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        alert('Report URL copied to clipboard!');
      });
    }

    // Expand all failed steps by default
    document.querySelectorAll('.step-item.failed .step-details').forEach(details => {
      details.classList.add('expanded');
    });
  `;
}
```

---

### 4. Report Generator

**File:** `src/report/generator.ts`

```typescript
import { generateBaseTemplate } from './templates/base.js';
import { generateHeader } from './templates/header.js';
import { generateSummary } from './templates/summary.js';
import { generateSteps } from './templates/steps.js';
import { generateTrends } from './templates/trends.js';
import { generateCruxMetrics } from './templates/crux.js';
import { generateWoodWideInsights } from './templates/woodwide.js';
import { generateFooter } from './templates/footer.js';
import { FlowGuardRepository } from '../db/repository.js';
import type { TestResult, CruxMetrics, WoodWideAnalysis } from './types.js';

export interface ReportOptions {
  flowRun: TestResult;
  historicalData?: TestResult[];
  cruxMetrics?: CruxMetrics;
  woodWideInsights?: WoodWideAnalysis;
}

export class ReportGenerator {
  constructor(private repository: FlowGuardRepository) {}

  async generateReport(options: ReportOptions): Promise<string> {
    const { flowRun, historicalData, cruxMetrics, woodWideInsights } = options;

    // Fetch historical data if not provided
    const history = historicalData || await this.repository.getRecentResults(
      flowRun.metadata.flowName,
      30
    );

    // Build report sections
    const sections: string[] = [];

    // Header
    sections.push(generateHeader({
      flowName: flowRun.metadata.flowName,
      timestamp: flowRun.timestamp,
      environment: flowRun.metadata.environment,
      viewport: flowRun.metadata.viewport,
      browser: flowRun.metadata.browser,
      passed: flowRun.measurements.passed
    }));

    // Summary cards
    sections.push(generateSummary({
      totalSteps: flowRun.measurements.totalSteps,
      passedSteps: flowRun.measurements.totalSteps - flowRun.measurements.failedSteps,
      failedSteps: flowRun.measurements.failedSteps,
      duration: flowRun.measurements.duration,
      cost: flowRun.measurements.totalCost,
      avgConfidence: flowRun.measurements.avgConfidence,
      historicalSuccessRate: this.calculateSuccessRate(history)
    }));

    // Step-by-step results
    sections.push(generateSteps(flowRun.steps));

    // Historical trends (if data available)
    if (history.length > 1) {
      sections.push(generateTrends(history));
    }

    // CrUX metrics (if available)
    if (cruxMetrics) {
      sections.push(generateCruxMetrics(cruxMetrics));
    }

    // Wood Wide insights (if available)
    if (woodWideInsights) {
      sections.push(generateWoodWideInsights(woodWideInsights));
    }

    // Footer
    sections.push(generateFooter({
      generatedAt: new Date(),
      version: '1.0.0'
    }));

    // Combine into full HTML
    const content = sections.join('\n');
    const html = generateBaseTemplate(content, {
      flowName: flowRun.metadata.flowName,
      timestamp: flowRun.timestamp
    });

    return html;
  }

  private calculateSuccessRate(history: TestResult[]): number {
    if (history.length === 0) return 0;
    const passed = history.filter(r => r.measurements.passed).length;
    return (passed / history.length) * 100;
  }
}
```

---

### 5. Component Templates

**File:** `src/report/templates/summary.ts`

```typescript
export interface SummaryData {
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  duration: number;
  cost: number;
  avgConfidence: number;
  historicalSuccessRate: number;
}

export function generateSummary(data: SummaryData): string {
  const successRate = (data.passedSteps / data.totalSteps) * 100;
  const trend = data.historicalSuccessRate - successRate;

  return `
    <div class="summary-grid">
      <div class="summary-card ${data.failedSteps === 0 ? 'success' : 'danger'}">
        <div class="summary-card-header">
          <div class="summary-card-title">Test Result</div>
          <div class="summary-card-icon ${data.failedSteps === 0 ? 'success' : 'danger'}">
            ${data.failedSteps === 0 ? '✓' : '✗'}
          </div>
        </div>
        <div class="summary-card-value">${successRate.toFixed(0)}%</div>
        <div class="summary-card-label">Success Rate</div>
        <div class="summary-card-trend ${trend >= 0 ? 'trend-up' : 'trend-down'}">
          ${trend >= 0 ? '↑' : '↓'} ${Math.abs(trend).toFixed(1)}% vs 30-day average
        </div>
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
    </div>
  `;
}
```

---

## Chart Generation (Simple SVG)

**File:** `src/report/charts.ts`

```typescript
export interface TrendDataPoint {
  date: string;
  successRate: number;
}

export function generateSuccessRateTrendChart(data: TrendDataPoint[]): string {
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

  return `
    <svg viewBox="0 0 ${width} ${height}" class="chart-canvas">
      <!-- Grid lines -->
      ${[0, 25, 50, 75, 100].map(val => `
        <line
          x1="${padding}"
          y1="${height - padding - val * yScale}"
          x2="${width - padding}"
          y2="${height - padding - val * yScale}"
          stroke="#e5e7eb"
          stroke-width="1"
        />
        <text
          x="${padding - 10}"
          y="${height - padding - val * yScale + 5}"
          text-anchor="end"
          font-size="12"
          fill="#6b7280"
        >${val}%</text>
      `).join('')}

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
      ${points.map((p, i) => `
        <circle
          cx="${p.split(',')[0]}"
          cy="${p.split(',')[1]}"
          r="4"
          fill="#3b82f6"
        />
      `).join('')}

      <!-- Gradient definition -->
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:0" />
        </linearGradient>
      </defs>

      <!-- X-axis labels -->
      ${data.map((d, i) => {
        if (i % Math.ceil(data.length / 7) === 0) {
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
      }).join('')}
    </svg>
  `;
}
```

---

## Testing

**File:** `src/report/__tests__/generator.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals';
import { ReportGenerator } from '../generator.js';
import { FlowGuardRepository } from '../../db/repository.js';
import fs from 'fs/promises';

describe('ReportGenerator', () => {
  let generator: ReportGenerator;
  let repository: FlowGuardRepository;

  beforeAll(async () => {
    repository = new FlowGuardRepository(process.env.MONGODB_TEST_URI!);
    await repository.connect();
    generator = new ReportGenerator(repository);
  });

  afterAll(async () => {
    await repository.disconnect();
  });

  it('should generate a complete HTML report', async () => {
    const mockFlowRun = createMockFlowRun();
    const html = await generator.generateReport({ flowRun: mockFlowRun });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('FlowGuard Report');
    expect(html).toContain(mockFlowRun.metadata.flowName);
  });

  it('should be under 100KB', async () => {
    const mockFlowRun = createMockFlowRun();
    const html = await generator.generateReport({ flowRun: mockFlowRun });

    const sizeKB = Buffer.byteLength(html, 'utf-8') / 1024;
    expect(sizeKB).toBeLessThan(100);
  });

  it('should render CrUX metrics when provided', async () => {
    const mockFlowRun = createMockFlowRun();
    const cruxMetrics = {
      lcp: { value: 1200, rating: 'good' },
      cls: { value: 0.05, rating: 'good' },
      inp: { value: 150, rating: 'good' }
    };

    const html = await generator.generateReport({
      flowRun: mockFlowRun,
      cruxMetrics
    });

    expect(html).toContain('Chrome User Experience');
    expect(html).toContain('1200');
  });

  it('should save report to file', async () => {
    const mockFlowRun = createMockFlowRun();
    const html = await generator.generateReport({ flowRun: mockFlowRun });

    await fs.writeFile('/tmp/test-report.html', html);
    const saved = await fs.readFile('/tmp/test-report.html', 'utf-8');

    expect(saved).toBe(html);
  });
});

function createMockFlowRun() {
  return {
    timestamp: new Date(),
    metadata: {
      flowName: 'test-checkout-flow',
      environment: 'ci',
      viewport: '1920x1080',
      browser: 'chromium'
    },
    measurements: {
      passed: true,
      totalSteps: 5,
      failedSteps: 0,
      duration: 3200,
      avgConfidence: 92,
      totalTokens: 8500,
      totalCost: 0.085
    },
    steps: [
      {
        stepNumber: 1,
        action: 'Navigate to checkout',
        assertion: 'Checkout page loads',
        verdict: true,
        confidence: 95,
        reasoning: 'Page loaded successfully'
      }
    ]
  };
}
```

---

## Acceptance Criteria

- [ ] Reports are visually stunning and modern
- [ ] Fully responsive (mobile, tablet, desktop tested)
- [ ] All charts render correctly as inline SVG
- [ ] CrUX metrics display with color-coded ratings
- [ ] Wood Wide insights section prominent
- [ ] Interactive step expansion works
- [ ] Filter buttons work (all/passed/failed)
- [ ] File size < 100KB
- [ ] Print styles work perfectly
- [ ] WCAG AA accessibility compliance
- [ ] No external dependencies (all CSS/JS embedded)
- [ ] Smooth animations on page load

---

## Dependencies

**Depends on:**
- Agent A1 (MongoDB Core) - Historical data queries

**Integrates with:**
- Agent B3 (CrUX + Wood Wide) - Metrics display

---

## Quick Start

```bash
# Create branch (AFTER A1 merges)
git checkout -b feat/html-report-generator

# No new dependencies needed!

# Generate test report
npm run build
tsx scripts/generate-test-report.ts

# Open in browser
open tmp/reports/test-report.html

# Run tests
npm test src/report
```

---

## Success Metrics

- ✅ Hackathon judges say "Wow, this looks professional!"
- ✅ Mobile responsive (tested on iPhone, Android)
- ✅ Print-to-PDF looks perfect
- ✅ Loading is instant (<100ms)
- ✅ No console errors
- ✅ Passes WCAG AA audit

**This is your chance to shine with beautiful frontend work!** 🎨
