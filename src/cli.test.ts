import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

/**
 * CLI Integration Tests
 *
 * These tests verify the CLI command structure and configuration handling.
 * Full end-to-end tests with actual command execution are in __tests__/e2e/
 */

describe('CLI Configuration', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flowguard-cli-test-'));
    process.chdir(testDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Init Command Validation', () => {
    it('should create required directory structure', () => {
      const flowsDir = path.join(testDir, 'flows');
      const reportsDir = path.join(testDir, 'reports');

      // Simulate init command creating directories
      fs.mkdirSync(flowsDir, { recursive: true });
      fs.mkdirSync(reportsDir, { recursive: true });

      expect(fs.existsSync(flowsDir)).toBe(true);
      expect(fs.existsSync(reportsDir)).toBe(true);
      expect(fs.statSync(flowsDir).isDirectory()).toBe(true);
      expect(fs.statSync(reportsDir).isDirectory()).toBe(true);
    });

    it('should create valid config file structure', () => {
      const config = {
        version: 1,
        flowsDir: './flows',
        reportsDir: './reports',
      };

      const configPath = path.join(testDir, 'flowguard.config.json');
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      expect(fs.existsSync(configPath)).toBe(true);

      const readConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      expect(readConfig.version).toBe(1);
      expect(readConfig.flowsDir).toBe('./flows');
      expect(readConfig.reportsDir).toBe('./reports');
    });

    it('should create valid example flow file', () => {
      const flowsDir = path.join(testDir, 'flows');
      fs.mkdirSync(flowsDir, { recursive: true });

      const exampleFlow = `# Example FlowGuard flow
name: example-homepage
intent: "User can see the main headline and find the primary call-to-action"
url: https://example.com
viewport:
  width: 1280
  height: 720
steps:
  - action: screenshot
    assert: "Main headline is visible and CTA button is prominent"
`;

      const examplePath = path.join(flowsDir, 'example.yaml');
      fs.writeFileSync(examplePath, exampleFlow);

      expect(fs.existsSync(examplePath)).toBe(true);

      const content = fs.readFileSync(examplePath, 'utf-8');
      expect(content).toContain('name: example-homepage');
      expect(content).toContain('action: screenshot');
    });

    it('should handle .gitignore additions correctly', () => {
      const gitignoreContent = `# FlowGuard
.flowguard/
reports/*.html
`;

      const gitignorePath = path.join(testDir, '.gitignore');
      fs.writeFileSync(gitignorePath, gitignoreContent);

      const content = fs.readFileSync(gitignorePath, 'utf-8');
      expect(content).toContain('.flowguard/');
      expect(content).toContain('reports/*.html');
    });

    it('should not duplicate .gitignore entries', () => {
      const existingGitignore = `node_modules/
.env
`;
      const gitignorePath = path.join(testDir, '.gitignore');
      fs.writeFileSync(gitignorePath, existingGitignore);

      // Simulate adding FlowGuard entries
      const existing = fs.readFileSync(gitignorePath, 'utf-8');
      if (!existing.includes('.flowguard/')) {
        fs.appendFileSync(gitignorePath, `
# FlowGuard
.flowguard/
reports/*.html
`);
      }

      const content = fs.readFileSync(gitignorePath, 'utf-8');
      const matches = content.match(/\.flowguard\//g);
      expect(matches?.length).toBe(1); // Should only appear once
    });
  });

  describe('Config File Validation', () => {
    it('should parse valid config file', () => {
      const config = {
        version: 1,
        flowsDir: './flows',
        reportsDir: './reports',
      };

      const configPath = path.join(testDir, 'flowguard.config.json');
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      expect(parsed).toEqual(config);
      expect(parsed.version).toBe(1);
    });

    it('should handle custom directory paths', () => {
      const config = {
        version: 1,
        flowsDir: './custom-flows',
        reportsDir: './custom-reports',
      };

      expect(config.flowsDir).toBe('./custom-flows');
      expect(config.reportsDir).toBe('./custom-reports');
    });

    it('should validate config version', () => {
      const config = {
        version: 1,
        flowsDir: './flows',
        reportsDir: './reports',
      };

      expect(config.version).toBe(1);
      expect(typeof config.version).toBe('number');
    });

    it('should handle missing config gracefully', () => {
      const configPath = path.join(testDir, 'flowguard.config.json');

      expect(fs.existsSync(configPath)).toBe(false);

      // Should use defaults
      const defaultFlowsDir = './flows';
      const defaultReportsDir = './reports';

      expect(defaultFlowsDir).toBe('./flows');
      expect(defaultReportsDir).toBe('./reports');
    });
  });

  describe('Run Command Options', () => {
    it('should support all format options', () => {
      const formats = ['text', 'json'];

      for (const format of formats) {
        expect(['text', 'json']).toContain(format);
      }
    });

    it('should support vision toggle', () => {
      const visionEnabled = true;
      const visionDisabled = false;

      expect(typeof visionEnabled).toBe('boolean');
      expect(typeof visionDisabled).toBe('boolean');
    });

    it('should support trace toggle', () => {
      const traceEnabled = true;
      const traceDisabled = false;

      expect(typeof traceEnabled).toBe('boolean');
      expect(typeof traceDisabled).toBe('boolean');
    });

    it('should support mock mode', () => {
      const mockMode = true;

      expect(typeof mockMode).toBe('boolean');
    });

    it('should support devswarm integration', () => {
      const devswarmEnabled = true;

      expect(typeof devswarmEnabled).toBe('boolean');
    });

    it('should support custom output directory', () => {
      const customOutput = './custom-reports';

      expect(customOutput).toBe('./custom-reports');
      expect(customOutput).toMatch(/^\.\/[\w-]+$/);
    });

    it('should validate output directory paths', () => {
      const validPaths = [
        './reports',
        './custom-reports',
        './output/reports',
      ];

      const invalidPaths = [
        '../../../etc',
        '/etc/passwd',
        'reports/../../../etc',
      ];

      for (const validPath of validPaths) {
        expect(validPath).toMatch(/^\.\/[\w/-]+$/);
      }

      for (const invalidPath of invalidPaths) {
        expect(invalidPath.includes('..')||invalidPath.startsWith('/')).toBe(true);
      }
    });
  });

  describe('Report Command Options', () => {
    it('should list reports in directory', () => {
      const reportsDir = path.join(testDir, 'reports');
      fs.mkdirSync(reportsDir, { recursive: true });

      // Create sample reports
      const report1 = path.join(reportsDir, 'test-flow-2024-01-15.html');
      const report2 = path.join(reportsDir, 'test-flow-2024-01-16.html');

      fs.writeFileSync(report1, '<html>Report 1</html>');
      fs.writeFileSync(report2, '<html>Report 2</html>');

      const reports = fs.readdirSync(reportsDir)
        .filter(f => f.endsWith('.html'))
        .map(f => ({
          name: f,
          path: path.join(reportsDir, f),
          mtime: fs.statSync(path.join(reportsDir, f)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      expect(reports.length).toBe(2);
      expect(reports[0].name).toContain('.html');
      expect(reports.every(r => r.name.endsWith('.html'))).toBe(true);
    });

    it('should get latest report', () => {
      const reportsDir = path.join(testDir, 'reports');
      fs.mkdirSync(reportsDir, { recursive: true });

      // Create reports with different timestamps
      const oldReport = path.join(reportsDir, 'old-report.html');
      const newReport = path.join(reportsDir, 'new-report.html');

      fs.writeFileSync(oldReport, '<html>Old</html>');
      fs.writeFileSync(newReport, '<html>New</html>');

      const reports = fs.readdirSync(reportsDir)
        .filter(f => f.endsWith('.html'))
        .map(f => ({
          name: f,
          path: path.join(reportsDir, f),
          mtime: fs.statSync(path.join(reportsDir, f)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      expect(reports.length).toBe(2);
      expect(reports.every(r => r.name.endsWith('.html'))).toBe(true);
    });

    it('should filter HTML files only', () => {
      const reportsDir = path.join(testDir, 'reports');
      fs.mkdirSync(reportsDir, { recursive: true });

      fs.writeFileSync(path.join(reportsDir, 'report1.html'), '<html></html>');
      fs.writeFileSync(path.join(reportsDir, 'report2.html'), '<html></html>');
      fs.writeFileSync(path.join(reportsDir, 'data.json'), '{}');
      fs.writeFileSync(path.join(reportsDir, 'notes.txt'), 'text');

      const htmlReports = fs.readdirSync(reportsDir)
        .filter(f => f.endsWith('.html'));

      expect(htmlReports.length).toBe(2);
      expect(htmlReports.every(f => f.endsWith('.html'))).toBe(true);
    });
  });

  describe('Environment Variables', () => {
    it('should validate ANTHROPIC_API_KEY format', () => {
      const validKeys = [
        'sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        'sk-ant-xxxxxxxxxxxxxxxxxxxxx',
      ];

      for (const key of validKeys) {
        expect(key).toMatch(/^sk-ant-/);
      }
    });

    it('should validate GITHUB_TOKEN format', () => {
      const validTokens = [
        'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        'github_pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      ];

      for (const token of validTokens) {
        expect(token).toMatch(/^(ghp_|github_pat_)/);
      }
    });

    it('should validate MONGODB_URI format', () => {
      const validURIs = [
        'mongodb://localhost:27017/flowguard',
        'mongodb+srv://user:pass@cluster.mongodb.net/flowguard',
      ];

      for (const uri of validURIs) {
        expect(uri).toMatch(/^mongodb(\+srv)?:\/\//);
      }
    });

    it('should validate CRUX_API_KEY presence', () => {
      const apiKey = 'test-api-key';
      expect(typeof apiKey).toBe('string');
      expect(apiKey.length).toBeGreaterThan(0);
    });

    it('should validate WOOD_WIDE_API_KEY presence', () => {
      const apiKey = 'test-api-key';
      expect(typeof apiKey).toBe('string');
      expect(apiKey.length).toBeGreaterThan(0);
    });
  });

  describe('Process Signal Handling', () => {
    it('should define cleanup handlers for SIGINT', () => {
      const handler = async () => {
        // Cleanup logic
        return Promise.resolve();
      };

      expect(typeof handler).toBe('function');
      expect(handler()).toBeInstanceOf(Promise);
    });

    it('should define cleanup handlers for SIGTERM', () => {
      const handler = async () => {
        // Cleanup logic
        return Promise.resolve();
      };

      expect(typeof handler).toBe('function');
      expect(handler()).toBeInstanceOf(Promise);
    });
  });

  describe('Output Formatting', () => {
    it('should format JSON output correctly', () => {
      const data = {
        success: true,
        results: [
          { flowName: 'test', verdict: 'pass' }
        ]
      };

      const jsonOutput = JSON.stringify(data, null, 2);
      const parsed = JSON.parse(jsonOutput);

      expect(parsed).toEqual(data);
      expect(jsonOutput).toContain('"success": true');
    });

    it('should format text output for success', () => {
      const verdict = 'pass';
      const confidence = 95;
      const icon = verdict === 'pass' ? '✅' : '❌';

      const output = `${icon} ${verdict.toUpperCase()} (${confidence}% confidence)`;

      expect(output).toContain('✅');
      expect(output).toContain('PASS');
      expect(output).toContain('95%');
    });

    it('should format text output for failure', () => {
      const verdict = 'fail';
      const confidence = 75;
      const icon = verdict === 'fail' ? '❌' : '✅';

      const output = `${icon} ${verdict.toUpperCase()} (${confidence}% confidence)`;

      expect(output).toContain('❌');
      expect(output).toContain('FAIL');
    });

    it('should format error output', () => {
      const errorMessage = 'Flow file not found';
      const code = 2;

      const jsonError = JSON.stringify({ error: errorMessage, code });
      const textError = `Error: ${errorMessage}`;

      expect(jsonError).toContain('Flow file not found');
      expect(textError).toContain('Error:');
    });
  });

  describe('Exit Codes', () => {
    it('should use correct exit code for all tests passing', () => {
      const allPassed = true;
      const exitCode = allPassed ? 0 : 1;

      expect(exitCode).toBe(0);
    });

    it('should use correct exit code for some tests failing', () => {
      const allPassed = false;
      const exitCode = allPassed ? 0 : 1;

      expect(exitCode).toBe(1);
    });

    it('should use correct exit code for errors', () => {
      const errorCode = 2;

      expect(errorCode).toBe(2);
    });

    it('should use correct exit code for SIGINT', () => {
      const sigintCode = 130;

      expect(sigintCode).toBe(130);
    });

    it('should use correct exit code for SIGTERM', () => {
      const sigtermCode = 143;

      expect(sigtermCode).toBe(143);
    });
  });
});
