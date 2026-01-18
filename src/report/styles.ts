/**
 * Embedded CSS styles for HTML reports.
 * Modern, responsive design with gradients, shadows, and animations.
 */

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
      font-size: 1.25rem;
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

