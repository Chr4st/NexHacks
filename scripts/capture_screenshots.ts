#!/usr/bin/env tsx
/**
 * Capture screenshots using Playwright for UX testing benchmarks
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

const scenarios = [
  {
    id: 'example_001',
    url: 'https://www.google.com',
    filename: 'accessibility_contrast.png',
    description: 'Google homepage - test contrast'
  },
  {
    id: 'example_002',
    url: 'https://www.github.com',
    filename: 'accessibility_focus.png',
    description: 'GitHub homepage - test focus indicators'
  },
  {
    id: 'example_003',
    url: 'https://www.stripe.com',
    filename: 'layout_alignment.png',
    description: 'Stripe homepage - test alignment'
  },
  {
    id: 'example_004',
    url: 'https://www.airbnb.com',
    filename: 'layout_spacing.png',
    description: 'Airbnb homepage - test spacing'
  },
  {
    id: 'example_005',
    url: 'https://www.amazon.com',
    filename: 'responsive_mobile.png',
    description: 'Amazon - mobile responsive test',
    viewport: { width: 375, height: 812 }
  },
  {
    id: 'example_006',
    url: 'https://www.apple.com',
    filename: 'responsive_tablet.png',
    description: 'Apple - tablet responsive test',
    viewport: { width: 768, height: 1024 }
  },
  {
    id: 'example_007',
    url: 'https://www.linkedin.com',
    filename: 'ux_dark_pattern.png',
    description: 'LinkedIn - dark pattern check'
  },
  {
    id: 'example_008',
    url: 'https://www.dropbox.com',
    filename: 'ux_cta_clarity.png',
    description: 'Dropbox - CTA clarity'
  },
  {
    id: 'example_009',
    url: 'https://www.twitter.com/login',
    filename: 'security_input.png',
    description: 'Twitter login - password field test'
  },
  {
    id: 'example_010',
    url: 'https://www.paypal.com',
    filename: 'security_https.png',
    description: 'PayPal - HTTPS security'
  }
];

async function captureScreenshots() {
  console.log('🚀 Launching Playwright browser...');
  const browser = await chromium.launch({ headless: true });

  // Create screenshots directory
  const screenshotsDir = path.join(process.cwd(), 'benchmarks', 'screenshots');
  await fs.mkdir(screenshotsDir, { recursive: true });

  for (const scenario of scenarios) {
    console.log(`\n📸 Capturing: ${scenario.description}`);
    console.log(`   URL: ${scenario.url}`);

    const page = await browser.newPage({
      viewport: scenario.viewport || { width: 1280, height: 720 }
    });

    try {
      // Navigate to URL
      await page.goto(scenario.url, {
        waitUntil: 'networkidle',
        timeout: 15000
      });

      // Wait for page to be fully rendered
      await page.waitForTimeout(2000);

      // Take screenshot
      const screenshotPath = path.join(screenshotsDir, scenario.filename);
      await page.screenshot({
        path: screenshotPath,
        fullPage: false
      });

      console.log(`   ✅ Saved: ${scenario.filename}`);
    } catch (error) {
      console.error(`   ❌ Failed: ${error instanceof Error ? error.message : error}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log('\n✅ All screenshots captured!');
}

captureScreenshots().catch(console.error);
