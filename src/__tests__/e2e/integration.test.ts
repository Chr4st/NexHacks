import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { parseFlowFile } from '../../parser.js';
import { validatePath, validateOutputDirectory } from '../../security.js';
import { getCruxMetrics, getWoodWideAnalysis } from '../../metrics.js';

/**
 * End-to-End Integration Tests for FlowGuard
 *
 * These tests verify complete workflows from flow definition to report generation.
 * They test the integration of all components working together.
 */

describe('FlowGuard E2E Integration Tests', () => {
  let testDir: string;
  let flowsDir: string;
  let reportsDir: string;
  let originalCwd: string;

  beforeAll(() => {
    originalCwd = process.cwd();
  });

  afterAll(() => {
    process.chdir(originalCwd);
  });

  beforeEach(() => {
    // Create isolated test environment
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flowguard-e2e-test-'));
    flowsDir = path.join(testDir, 'flows');
    reportsDir = path.join(testDir, 'reports');

    fs.mkdirSync(flowsDir, { recursive: true });
    fs.mkdirSync(reportsDir, { recursive: true });

    process.chdir(testDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Complete Flow Lifecycle', () => {
    it('should handle complete flow from definition to parsing', () => {
      // Step 1: Create flow definition
      const flowDefinition = `name: test-homepage
intent: "User can view the homepage and see the main content"
url: https://example.com
viewport:
  width: 1280
  height: 720
steps:
  - action: screenshot
    assert: "Main content is visible"
`;

      const flowPath = path.join(flowsDir, 'test-flow.yaml');
      fs.writeFileSync(flowPath, flowDefinition);

      // Step 2: Validate the file path
      const validatedPath = validatePath(flowPath, {
        baseDir: testDir,
        allowNonExistent: false
      });

      expect(validatedPath).toBe(flowPath);
      expect(fs.existsSync(validatedPath)).toBe(true);

      // Step 3: Parse the flow file
      const parseResult = parseFlowFile(validatedPath, testDir);

      expect(parseResult.success).toBe(true);
      if (parseResult.success) {
        expect(parseResult.data.name).toBe('test-homepage');
        expect(parseResult.data.intent).toContain('homepage');
        expect(parseResult.data.url).toBe('https://example.com');
        expect(parseResult.data.steps).toHaveLength(1);
        expect(parseResult.data.steps[0].action).toBe('screenshot');
      }
    });

    it('should create and validate output directory structure', () => {
      // Create output directory with validation
      const outputDir = path.join(testDir, 'output', 'reports');

      const validatedOutputDir = validateOutputDirectory(outputDir, {
        baseDir: testDir
      });

      expect(fs.existsSync(validatedOutputDir)).toBe(true);
      expect(fs.statSync(validatedOutputDir).isDirectory()).toBe(true);

      // Verify directory is within test boundary
      expect(validatedOutputDir).toContain(testDir);
    });

    it('should handle multiple flow files in directory', () => {
      // Create multiple flow files
      const flows = [
        { name: 'homepage', url: 'https://example.com' },
        { name: 'login', url: 'https://example.com/login' },
        { name: 'dashboard', url: 'https://example.com/dashboard' },
      ];

      for (const flow of flows) {
        const flowDef = `name: ${flow.name}
intent: "Test ${flow.name} page"
url: ${flow.url}
steps:
  - action: screenshot
    assert: "Page loads correctly"
`;
        fs.writeFileSync(path.join(flowsDir, `${flow.name}.yaml`), flowDef);
      }

      // Discover all flow files
      const flowFiles = fs.readdirSync(flowsDir)
        .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
        .map(f => path.join(flowsDir, f));

      expect(flowFiles).toHaveLength(3);

      // Parse all flows
      const parsedFlows = flowFiles.map(file => parseFlowFile(file, testDir));

      expect(parsedFlows.every(r => r.success)).toBe(true);
      expect(parsedFlows).toHaveLength(3);
    });
  });

  describe('Configuration and Initialization', () => {
    it('should create valid configuration file', () => {
      const config = {
        version: 1,
        flowsDir: './flows',
        reportsDir: './reports',
      };

      const configPath = path.join(testDir, 'flowguard.config.json');
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      // Validate config file path
      const validatedConfigPath = validatePath(configPath, {
        baseDir: testDir,
        allowNonExistent: false
      });

      expect(fs.existsSync(validatedConfigPath)).toBe(true);

      // Parse and validate config content
      const loadedConfig = JSON.parse(fs.readFileSync(validatedConfigPath, 'utf-8'));

      expect(loadedConfig.version).toBe(1);
      expect(loadedConfig.flowsDir).toBe('./flows');
      expect(loadedConfig.reportsDir).toBe('./reports');
    });

    it('should initialize project structure correctly', () => {
      // Simulate init command
      const config = {
        version: 1,
        flowsDir: './flows',
        reportsDir: './reports',
      };

      // Create config
      fs.writeFileSync(
        path.join(testDir, 'flowguard.config.json'),
        JSON.stringify(config, null, 2)
      );

      // Create directories
      validateOutputDirectory(path.join(testDir, config.flowsDir), { baseDir: testDir });
      validateOutputDirectory(path.join(testDir, config.reportsDir), { baseDir: testDir });

      // Create example flow
      const exampleFlow = `name: example
intent: "Example flow"
url: https://example.com
steps:
  - action: screenshot
    assert: "Page loads"
`;
      fs.writeFileSync(
        path.join(testDir, config.flowsDir, 'example.yaml'),
        exampleFlow
      );

      // Verify structure
      expect(fs.existsSync(path.join(testDir, 'flowguard.config.json'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, config.flowsDir))).toBe(true);
      expect(fs.existsSync(path.join(testDir, config.reportsDir))).toBe(true);
      expect(fs.existsSync(path.join(testDir, config.flowsDir, 'example.yaml'))).toBe(true);
    });
  });

  describe('Flow Parsing and Validation', () => {
    it('should parse complex flow with multiple steps', () => {
      const complexFlow = `name: complex-flow
intent: "Test complex user journey"
url: https://example.com
viewport:
  width: 1920
  height: 1080
steps:
  - action: screenshot
    assert: "Homepage loads correctly"
  - action: click
    target: "#login-button"
  - action: type
    target: "#username"
    value: "testuser"
  - action: type
    target: "#password"
    value: "testpass"
  - action: click
    target: "#submit"
  - action: screenshot
    assert: "User is logged in and dashboard is visible"
`;

      const flowPath = path.join(flowsDir, 'complex.yaml');
      fs.writeFileSync(flowPath, complexFlow);

      const parseResult = parseFlowFile(flowPath, testDir);

      expect(parseResult.success).toBe(true);
      if (parseResult.success) {
        const flow = parseResult.data;
        expect(flow.steps).toHaveLength(6);
        expect(flow.steps[0].action).toBe('screenshot');
        expect(flow.steps[1].action).toBe('click');
        expect(flow.steps[2].action).toBe('type');
        expect(flow.steps[2].value).toBe('testuser');
        expect(flow.viewport?.width).toBe(1920);
        expect(flow.viewport?.height).toBe(1080);
      }
    });

    it('should detect invalid flow files', () => {
      const invalidFlow = `name: invalid
this is not valid yaml
  bad indentation
    wrong structure
`;

      const flowPath = path.join(flowsDir, 'invalid.yaml');
      fs.writeFileSync(flowPath, invalidFlow);

      const parseResult = parseFlowFile(flowPath, testDir);

      expect(parseResult.success).toBe(false);
      if (!parseResult.success) {
        expect(parseResult.error).toBeTruthy();
      }
    });

    it('should validate required flow fields', () => {
      const missingFieldsFlow = `name: incomplete
# Missing intent and url
steps:
  - action: screenshot
`;

      const flowPath = path.join(flowsDir, 'incomplete.yaml');
      fs.writeFileSync(flowPath, missingFieldsFlow);

      const parseResult = parseFlowFile(flowPath, testDir);

      expect(parseResult.success).toBe(false);
      if (!parseResult.success) {
        expect(parseResult.error).toContain('intent');
      }
    });
  });

  describe('Security and Path Validation', () => {
    it('should prevent directory traversal attacks', () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '../../secret.txt',
        './foo/../../../bar',
      ];

      for (const maliciousPath of maliciousPaths) {
        expect(() => {
          validatePath(maliciousPath, { baseDir: testDir });
        }).toThrow();
      }
    });

    it('should allow safe paths within project', () => {
      const safePaths = [
        './flows/test.yaml',
        './reports/output.html',
        './nested/deep/file.txt',
      ];

      for (const safePath of safePaths) {
        const validated = validatePath(safePath, {
          baseDir: testDir,
          allowNonExistent: true
        });

        expect(validated).toContain(testDir);
      }
    });

    it('should create nested directories safely', () => {
      const nestedPath = './deeply/nested/output/directory';

      const validatedPath = validateOutputDirectory(nestedPath, {
        baseDir: testDir
      });

      expect(fs.existsSync(validatedPath)).toBe(true);
      expect(validatedPath).toContain(testDir);
    });
  });

  describe('Metrics Integration', () => {
    it('should fetch CrUX metrics in mock mode', async () => {
      const metrics = await getCruxMetrics('https://example.com', true);

      expect(metrics).toBeDefined();
      expect(metrics?.lcp).toBeDefined();
      expect(metrics?.cls).toBeDefined();
      expect(metrics?.inp).toBeDefined();
      expect(metrics?.lcp.rating).toMatch(/good|needs-improvement|poor/);
    });

    it('should handle WoodWide analysis in mock mode', async () => {
      const mockMetrics = {
        lcp: { p75: 2.1, rating: 'needs-improvement' as const },
        cls: { p75: 0.12, rating: 'good' as const },
        inp: { p75: 180, rating: 'needs-improvement' as const },
      };

      const analysis = await getWoodWideAnalysis(mockMetrics, true);

      expect(analysis).toBeDefined();
      expect(analysis?.significant).toBeDefined();
      expect(analysis?.confidence).toBeGreaterThanOrEqual(0);
      expect(analysis?.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle missing API keys gracefully', async () => {
      // Ensure API keys are not set
      delete process.env.CRUX_API_KEY;
      delete process.env.WOOD_WIDE_API_KEY;

      const metrics = await getCruxMetrics('https://example.com', false);
      expect(metrics).toBeNull();

      const mockMetrics = {
        lcp: { p75: 2.1, rating: 'good' as const },
        cls: { p75: 0.1, rating: 'good' as const },
        inp: { p75: 200, rating: 'good' as const },
      };

      const analysis = await getWoodWideAnalysis(mockMetrics, false);
      expect(analysis).toBeNull();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing flow files', () => {
      const nonexistentPath = path.join(flowsDir, 'nonexistent.yaml');

      expect(() => {
        validatePath(nonexistentPath, {
          baseDir: testDir,
          allowNonExistent: false
        });
      }).toThrow();
    });

    it('should handle empty flow directory', () => {
      const emptyDir = path.join(testDir, 'empty-flows');
      fs.mkdirSync(emptyDir);

      const files = fs.readdirSync(emptyDir)
        .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

      expect(files).toHaveLength(0);
    });

    it('should handle corrupted flow files', () => {
      const corruptedFlow = '\x00\x01\x02invalid binary data\xFF\xFE';
      const flowPath = path.join(flowsDir, 'corrupted.yaml');
      fs.writeFileSync(flowPath, corruptedFlow);

      const parseResult = parseFlowFile(flowPath, testDir);

      expect(parseResult.success).toBe(false);
    });
  });

  describe('Report Generation Workflow', () => {
    it('should create report directory structure', () => {
      const timestamp = new Date().toISOString().split('T')[0];
      const reportPath = path.join(reportsDir, `test-flow-${timestamp}.html`);

      // Simulate report generation
      const reportContent = `<!DOCTYPE html>
<html>
<head><title>FlowGuard Report</title></head>
<body>
  <h1>Test Report</h1>
  <p>Verdict: PASS</p>
</body>
</html>`;

      fs.writeFileSync(reportPath, reportContent);

      expect(fs.existsSync(reportPath)).toBe(true);

      const content = fs.readFileSync(reportPath, 'utf-8');
      expect(content).toContain('FlowGuard Report');
      expect(content).toContain('PASS');
    });

    it('should list and sort reports by timestamp', () => {
      // Create multiple reports
      const reports = [
        'test-2024-01-01.html',
        'test-2024-01-03.html',
        'test-2024-01-02.html',
      ];

      for (const report of reports) {
        fs.writeFileSync(
          path.join(reportsDir, report),
          '<html>Report</html>'
        );
      }

      const foundReports = fs.readdirSync(reportsDir)
        .filter(f => f.endsWith('.html'))
        .map(f => ({
          name: f,
          path: path.join(reportsDir, f),
          mtime: fs.statSync(path.join(reportsDir, f)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      expect(foundReports).toHaveLength(3);
      expect(foundReports.every(r => r.name.endsWith('.html'))).toBe(true);
    });
  });

  describe('Full Workflow Integration', () => {
    it('should execute complete workflow from init to report', async () => {
      // Step 1: Initialize project
      const config = {
        version: 1,
        flowsDir: './flows',
        reportsDir: './reports',
      };

      fs.writeFileSync(
        path.join(testDir, 'flowguard.config.json'),
        JSON.stringify(config, null, 2)
      );

      // Step 2: Create flow file
      const flowDef = `name: end-to-end-test
intent: "Complete workflow test"
url: https://example.com
viewport:
  width: 1280
  height: 720
steps:
  - action: screenshot
    assert: "Page loads successfully"
`;

      const flowPath = path.join(flowsDir, 'e2e-test.yaml');
      fs.writeFileSync(flowPath, flowDef);

      // Step 3: Validate and parse flow
      const validatedFlowPath = validatePath(flowPath, {
        baseDir: testDir,
        allowNonExistent: false
      });

      const parseResult = parseFlowFile(validatedFlowPath, testDir);

      expect(parseResult.success).toBe(true);

      // Step 4: Prepare output directory
      const validatedReportsDir = validateOutputDirectory(reportsDir, {
        baseDir: testDir
      });

      expect(fs.existsSync(validatedReportsDir)).toBe(true);

      // Step 5: Simulate metrics fetch (mock mode)
      const metrics = await getCruxMetrics('https://example.com', true);
      expect(metrics).toBeDefined();

      // Step 6: Simulate report generation
      const reportPath = path.join(validatedReportsDir, 'e2e-test.html');
      fs.writeFileSync(reportPath, '<html>E2E Test Report</html>');

      // Verify complete workflow
      expect(fs.existsSync(path.join(testDir, 'flowguard.config.json'))).toBe(true);
      expect(fs.existsSync(validatedFlowPath)).toBe(true);
      expect(fs.existsSync(reportPath)).toBe(true);
      expect(metrics).toBeDefined();
    });
  });
});
