import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validatePath, validateOutputDirectory, validateInputFile, PathSecurityError } from './security.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

describe('Path Security Validation', () => {
  let testDir: string;

  beforeEach(() => {
    // Create temporary test directory
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flowguard-security-test-'));
  });

  afterEach(() => {
    // Clean up temporary test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('validatePath', () => {
    it('should accept valid relative paths', () => {
      const validPath = validatePath('./test.txt', { baseDir: testDir, allowNonExistent: true });
      expect(validPath).toContain(testDir);
    });

    it('should accept valid absolute paths within base directory', () => {
      const testFile = path.join(testDir, 'test.txt');
      const validPath = validatePath(testFile, { baseDir: testDir, allowNonExistent: true });
      expect(validPath).toBe(testFile);
    });

    it('should reject paths with null bytes', () => {
      expect(() => {
        validatePath('test\0.txt', { baseDir: testDir });
      }).toThrow(PathSecurityError);

      expect(() => {
        validatePath('test\0.txt', { baseDir: testDir });
      }).toThrow('illegal characters');
    });

    it('should reject empty paths', () => {
      expect(() => {
        validatePath('', { baseDir: testDir });
      }).toThrow(PathSecurityError);

      expect(() => {
        validatePath('', { baseDir: testDir });
      }).toThrow('cannot be empty');
    });

    it('should reject whitespace-only paths', () => {
      expect(() => {
        validatePath('   ', { baseDir: testDir });
      }).toThrow(PathSecurityError);
    });

    it('should reject directory traversal with ..', () => {
      expect(() => {
        validatePath('../secret.txt', { baseDir: testDir });
      }).toThrow(PathSecurityError);

      expect(() => {
        validatePath('../secret.txt', { baseDir: testDir });
      }).toThrow('directory traversal');
    });

    it('should reject complex directory traversal patterns', () => {
      expect(() => {
        validatePath('./foo/../../../etc/passwd', { baseDir: testDir });
      }).toThrow(PathSecurityError);
    });

    it('should reject paths with .. in the middle', () => {
      expect(() => {
        validatePath('foo/../../../bar', { baseDir: testDir });
      }).toThrow(PathSecurityError);
    });

    it('should reject paths outside base directory', () => {
      const outsidePath = '/tmp/outside.txt';
      expect(() => {
        validatePath(outsidePath, { baseDir: testDir, allowNonExistent: true });
      }).toThrow(PathSecurityError);

      expect(() => {
        validatePath(outsidePath, { baseDir: testDir, allowNonExistent: true });
      }).toThrow('outside allowed directory');
    });

    it('should reject non-existent paths when allowNonExistent is false', () => {
      expect(() => {
        validatePath('./nonexistent.txt', { baseDir: testDir, allowNonExistent: false });
      }).toThrow(PathSecurityError);

      expect(() => {
        validatePath('./nonexistent.txt', { baseDir: testDir, allowNonExistent: false });
      }).toThrow('does not exist');
    });

    it('should accept non-existent paths when allowNonExistent is true', () => {
      const validPath = validatePath('./nonexistent.txt', { baseDir: testDir, allowNonExistent: true });
      expect(validPath).toContain(testDir);
    });

    it('should accept existing paths', () => {
      const testFile = path.join(testDir, 'existing.txt');
      fs.writeFileSync(testFile, 'test content');

      const validPath = validatePath('./existing.txt', { baseDir: testDir, allowNonExistent: false });
      expect(validPath).toBe(testFile);
    });

    it('should create parent directories when createParents is true', () => {
      const nestedPath = './nested/deep/file.txt';
      const validPath = validatePath(nestedPath, { baseDir: testDir, createParents: true, allowNonExistent: true });

      expect(validPath).toContain(testDir);
      expect(fs.existsSync(path.dirname(validPath))).toBe(true);
    });

    it('should not create directories when createParents is false', () => {
      const nestedPath = './nested/deep/file.txt';
      const validPath = validatePath(nestedPath, { baseDir: testDir, createParents: false, allowNonExistent: true });

      expect(validPath).toContain(testDir);
      expect(fs.existsSync(path.dirname(validPath))).toBe(false);
    });

    it('should normalize paths correctly', () => {
      const weirdPath = './foo/./bar//baz.txt';
      const validPath = validatePath(weirdPath, { baseDir: testDir, allowNonExistent: true });

      expect(validPath).toBe(path.join(testDir, 'foo', 'bar', 'baz.txt'));
    });

    it('should handle Windows-style backslashes', () => {
      const windowsPath = '.\\foo\\bar.txt';
      const validPath = validatePath(windowsPath, { baseDir: testDir, allowNonExistent: true });

      expect(validPath).toContain(testDir);
      expect(validPath).toContain('foo');
      expect(validPath).toContain('bar.txt');
    });

    it('should prevent partial directory name bypass', () => {
      // If testDir is /app, this should reject /app-secret
      const parentDir = path.dirname(testDir);
      const similarName = testDir + '-secret';

      // Create the similar directory
      if (!fs.existsSync(similarName)) {
        fs.mkdirSync(similarName, { recursive: true });
      }

      const maliciousPath = path.join(similarName, 'secret.txt');

      expect(() => {
        validatePath(maliciousPath, { baseDir: testDir, allowNonExistent: true });
      }).toThrow(PathSecurityError);

      // Clean up
      if (fs.existsSync(similarName)) {
        fs.rmSync(similarName, { recursive: true, force: true });
      }
    });

    it('should allow base directory itself', () => {
      const validPath = validatePath(testDir, { baseDir: testDir, allowNonExistent: false });
      expect(validPath).toBe(testDir);
    });

    it('should handle symlinks correctly', () => {
      // Create a file and a symlink to it
      const realFile = path.join(testDir, 'real.txt');
      const symlinkFile = path.join(testDir, 'symlink.txt');

      fs.writeFileSync(realFile, 'content');

      // Skip this test on Windows if symlinks aren't supported
      try {
        fs.symlinkSync(realFile, symlinkFile);

        const validPath = validatePath('./symlink.txt', { baseDir: testDir, allowNonExistent: false });
        expect(validPath).toContain(testDir);
      } catch (e) {
        // Skip test if symlinks aren't supported (e.g., Windows without admin)
        console.log('Skipping symlink test - not supported on this platform');
      }
    });
  });

  describe('validateOutputDirectory', () => {
    it('should create directory if it does not exist', () => {
      const newDir = path.join(testDir, 'output');

      expect(fs.existsSync(newDir)).toBe(false);

      const validPath = validateOutputDirectory(newDir, { baseDir: testDir });

      expect(fs.existsSync(validPath)).toBe(true);
      expect(fs.statSync(validPath).isDirectory()).toBe(true);
    });

    it('should create nested directories', () => {
      const nestedDir = path.join(testDir, 'deeply', 'nested', 'output');

      const validPath = validateOutputDirectory(nestedDir, { baseDir: testDir });

      expect(fs.existsSync(validPath)).toBe(true);
      expect(fs.statSync(validPath).isDirectory()).toBe(true);
    });

    it('should accept existing directories', () => {
      const existingDir = path.join(testDir, 'existing');
      fs.mkdirSync(existingDir);

      const validPath = validateOutputDirectory(existingDir, { baseDir: testDir });

      expect(validPath).toBe(existingDir);
    });

    it('should reject directory traversal attempts', () => {
      expect(() => {
        validateOutputDirectory('../malicious', { baseDir: testDir });
      }).toThrow(PathSecurityError);
    });

    it('should reject paths outside base directory', () => {
      expect(() => {
        validateOutputDirectory('/tmp/outside', { baseDir: testDir });
      }).toThrow(PathSecurityError);
    });
  });

  describe('validateInputFile', () => {
    it('should accept existing files', () => {
      const testFile = path.join(testDir, 'input.txt');
      fs.writeFileSync(testFile, 'test content');

      const validPath = validateInputFile(testFile, { baseDir: testDir });

      expect(validPath).toBe(testFile);
    });

    it('should reject non-existent files', () => {
      expect(() => {
        validateInputFile('./nonexistent.txt', { baseDir: testDir });
      }).toThrow(PathSecurityError);

      expect(() => {
        validateInputFile('./nonexistent.txt', { baseDir: testDir });
      }).toThrow('does not exist');
    });

    it('should accept existing files with relative paths', () => {
      const testFile = path.join(testDir, 'relative-input.txt');
      fs.writeFileSync(testFile, 'test content');

      const validPath = validateInputFile('./relative-input.txt', { baseDir: testDir });

      expect(validPath).toBe(testFile);
    });

    it('should reject directory traversal attempts', () => {
      expect(() => {
        validateInputFile('../../../etc/passwd', { baseDir: testDir });
      }).toThrow(PathSecurityError);
    });

    it('should accept directories as input', () => {
      const testSubDir = path.join(testDir, 'subdir');
      fs.mkdirSync(testSubDir);

      const validPath = validateInputFile(testSubDir, { baseDir: testDir });

      expect(validPath).toBe(testSubDir);
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle unicode characters safely', () => {
      const unicodePath = './test-文件.txt';
      const validPath = validatePath(unicodePath, { baseDir: testDir, allowNonExistent: true });

      expect(validPath).toContain(testDir);
    });

    it('should handle very long paths', () => {
      const longName = 'a'.repeat(200);
      const longPath = `./${longName}.txt`;

      const validPath = validatePath(longPath, { baseDir: testDir, allowNonExistent: true });

      expect(validPath).toContain(testDir);
    });

    it('should handle special characters in filenames', () => {
      const specialPath = './test-file@#$%^&()_+.txt';
      const validPath = validatePath(specialPath, { baseDir: testDir, allowNonExistent: true });

      expect(validPath).toContain(testDir);
    });

    it('should handle paths with multiple slashes', () => {
      const multiSlashPath = './foo///bar////baz.txt';
      const validPath = validatePath(multiSlashPath, { baseDir: testDir, allowNonExistent: true });

      expect(validPath).toBe(path.join(testDir, 'foo', 'bar', 'baz.txt'));
    });
  });
});
