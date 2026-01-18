import { getEmbeddedStyles } from '../styles.js';
import type { ReportMetadata } from '../types.js';

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
 * Get embedded JavaScript for interactivity
 */
function getEmbeddedScripts(): string {
  return `
    // Step expansion toggle
    document.querySelectorAll('.step-header').forEach((header) => {
      header.addEventListener('click', () => {
        const details = header.nextElementSibling;
        if (!details || !details.classList.contains('step-details')) return;
        
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

    // Expand all failed steps by default
    document.querySelectorAll('.step-item.failed .step-details').forEach(details => {
      details.classList.add('expanded');
    });
  `;
}

/**
 * Generate base HTML template with embedded CSS and JavaScript
 */
export function generateBaseTemplate(content: string, metadata: ReportMetadata): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="FlowGuard AI Test Report - ${escapeHtml(metadata.flowName)}">
  <title>FlowGuard Report - ${escapeHtml(metadata.flowName)}</title>
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

