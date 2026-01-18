/**
 * FlowGuard AI Demo Video Recorder
 * Records a walkthrough of the FlowGuard demo app and CLI
 */
import { chromium } from 'playwright';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SCREENSHOT_DIR = path.join(process.cwd(), 'tmp', 'screenshots');
const DEMO_APP_PATH = path.join(process.cwd(), 'demo-app', 'index.html');

async function recordDemo() {
  // Ensure screenshot directory exists
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  console.log('🎬 Starting FlowGuard AI demo recording...\n');

  const browser = await chromium.launch({ headless: true });

  // Mobile viewport to showcase the UX issue detection
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
  });
  const page = await context.newPage();

  let screenshotIndex = 0;
  const screenshot = async (name: string) => {
    const filename = `${String(screenshotIndex++).padStart(2, '0')}-${name}.png`;
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, filename),
      fullPage: false
    });
    console.log(`📸 Captured: ${filename}`);
  };

  try {
    // Scene 1: Show the demo app with UX issues
    console.log('\n📱 Scene 1: Demo app with UX issues (mobile view)');
    await page.goto(`file://${DEMO_APP_PATH}`);
    await page.waitForTimeout(1000);
    await screenshot('demo-app-mobile-ux-issue');

    // Scene 2: Desktop viewport - show the contrast issue
    console.log('\n🖥️  Scene 2: Desktop view showing low-contrast button');
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`file://${DEMO_APP_PATH}`);
    await page.waitForTimeout(1000);
    await screenshot('demo-app-desktop-contrast');

    // Scene 3: Show the form section
    console.log('\n📝 Scene 3: Form section with error visibility issue');
    await page.click('a.signup-btn');
    await page.waitForTimeout(500);
    await screenshot('demo-app-form-section');

    // Scene 4: Scroll to show success message buried at bottom
    console.log('\n⬇️  Scene 4: Success message below the fold');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await screenshot('demo-app-hidden-success');

    // Scene 5: Show a sample flow YAML
    console.log('\n📄 Scene 5: FlowGuard flow definition');
    const flowYaml = fs.readFileSync(
      path.join(process.cwd(), 'flows', 'test-demo-app.yaml'),
      'utf-8'
    );

    // Create an HTML page displaying the YAML
    await page.setContent(`
      <html>
        <head>
          <style>
            body {
              background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
              color: #e2e8f0;
              font-family: 'SF Mono', 'Monaco', monospace;
              padding: 40px;
              margin: 0;
            }
            h1 {
              color: #818cf8;
              font-size: 1.5rem;
              margin-bottom: 1rem;
            }
            pre {
              background: rgba(0, 0, 0, 0.3);
              padding: 20px;
              border-radius: 8px;
              border: 1px solid rgba(129, 140, 248, 0.3);
              overflow: auto;
              font-size: 14px;
              line-height: 1.6;
            }
            .comment { color: #6b7280; }
            .key { color: #818cf8; }
            .value { color: #34d399; }
            .string { color: #fbbf24; }
          </style>
        </head>
        <body>
          <h1>📋 flows/test-demo-app.yaml</h1>
          <pre>${flowYaml
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/(#.*)/g, '<span class="comment">$1</span>')
            .replace(/^(\s*)(\w+):/gm, '$1<span class="key">$2</span>:')
            .replace(/"([^"]+)"/g, '<span class="string">"$1"</span>')
          }</pre>
        </body>
      </html>
    `);
    await page.waitForTimeout(500);
    await screenshot('flowguard-flow-yaml');

    // Scene 6: Show CLI output (simulated)
    console.log('\n💻 Scene 6: FlowGuard CLI running');
    await page.setContent(`
      <html>
        <head>
          <style>
            body {
              background: #0d1117;
              color: #c9d1d9;
              font-family: 'SF Mono', 'Monaco', monospace;
              padding: 20px;
              margin: 0;
              font-size: 14px;
              line-height: 1.8;
            }
            .prompt { color: #58a6ff; }
            .success { color: #3fb950; }
            .warning { color: #d29922; }
            .info { color: #8b949e; }
            .dim { color: #484f58; }
            .header {
              color: #818cf8;
              font-size: 1.2rem;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">FlowGuard AI - UX Testing</div>
          <div><span class="prompt">$</span> flowguard run flows/test-demo-app.yaml</div>
          <br/>
          <div class="info">📋 Loading flow: demo-app-signup</div>
          <div class="info">🎯 Intent: "User can easily find and click the signup button"</div>
          <div class="dim">───────────────────────────────────────</div>
          <br/>
          <div class="info">🌐 Viewport: 375×667 (mobile)</div>
          <div class="info">📸 Capturing screenshot...</div>
          <div class="info">🤖 Analyzing with Claude 3.5 Sonnet...</div>
          <br/>
          <div class="warning">⚠️  FAIL: UX issues detected</div>
          <br/>
          <div class="dim">┌─────────────────────────────────────┐</div>
          <div class="dim">│</div> <span class="warning">Issues Found:</span></div>
          <div class="dim">│</div>  • Signup button has low contrast (0.15 opacity)</div>
          <div class="dim">│</div>  • Button pushed below fold on mobile</div>
          <div class="dim">│</div>  • CTA text is small (0.9rem)</div>
          <div class="dim">│</div></div>
          <div class="dim">│</div> <span class="success">Suggestions:</span></div>
          <div class="dim">│</div>  • Increase button contrast to WCAG AA</div>
          <div class="dim">│</div>  • Move CTA above the fold</div>
          <div class="dim">│</div>  • Increase font size for mobile</div>
          <div class="dim">└─────────────────────────────────────┘</div>
          <br/>
          <div class="info">📊 Confidence: 89%</div>
          <div class="info">📝 Report saved: reports/demo-app-signup-*.html</div>
          <div class="info">🔍 Trace sent to Arize Phoenix</div>
        </body>
      </html>
    `);
    await page.waitForTimeout(500);
    await screenshot('flowguard-cli-output');

    // Scene 7: Architecture diagram
    console.log('\n🏗️  Scene 7: Architecture overview');
    await page.setContent(`
      <html>
        <head>
          <style>
            body {
              background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
              color: #e2e8f0;
              font-family: system-ui, -apple-system, sans-serif;
              padding: 40px;
              margin: 0;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            h1 { color: #818cf8; margin-bottom: 30px; }
            .diagram {
              display: flex;
              flex-direction: column;
              gap: 20px;
              align-items: center;
            }
            .box {
              background: rgba(129, 140, 248, 0.1);
              border: 2px solid #818cf8;
              padding: 15px 30px;
              border-radius: 8px;
              text-align: center;
            }
            .flow {
              display: flex;
              gap: 20px;
              align-items: center;
            }
            .arrow {
              color: #818cf8;
              font-size: 1.5rem;
            }
            .sponsors {
              display: flex;
              gap: 30px;
              margin-top: 20px;
            }
            .sponsor {
              background: rgba(52, 211, 153, 0.1);
              border: 2px solid #34d399;
              padding: 15px 20px;
              border-radius: 8px;
              text-align: center;
            }
            .prize { color: #fbbf24; font-size: 0.9rem; }
          </style>
        </head>
        <body>
          <h1>🛡️ FlowGuard AI Architecture</h1>
          <div class="diagram">
            <div class="flow">
              <div class="box">📝 YAML Flows</div>
              <div class="arrow">→</div>
              <div class="box">🎭 Playwright</div>
              <div class="arrow">→</div>
              <div class="box">👁️ Claude Vision</div>
              <div class="arrow">→</div>
              <div class="box">📊 Reports</div>
            </div>
            <div class="sponsors">
              <div class="sponsor">
                <div>🔭 Arize Phoenix</div>
                <div class="prize">$1,000 Prize</div>
                <div style="font-size: 0.8rem; color: #6b7280;">OpenTelemetry Tracing</div>
              </div>
              <div class="sponsor">
                <div>🌲 Wood Wide AI</div>
                <div class="prize">$750 Prize</div>
                <div style="font-size: 0.8rem; color: #6b7280;">CrUX Metrics Analysis</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    await page.waitForTimeout(500);
    await screenshot('flowguard-architecture');

    console.log('\n✅ Demo recording complete!');
    console.log(`📁 Screenshots saved to: ${SCREENSHOT_DIR}`);

  } finally {
    await browser.close();
  }
}

recordDemo().catch(console.error);
