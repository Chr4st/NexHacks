import * as path from 'node:path';
import * as fs from 'node:fs';

/**
 * Security error class for path validation failures.
 * Does not leak actual path information in error messages.
 */
export class PathSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PathSecurityError';
  }
}

/**
 * Options for path validation.
 */
export interface ValidatePathOptions {
  /** Base directory that paths must be within. Defaults to process.cwd() */
  baseDir?: string;
  /** Whether to allow paths that don't exist yet. Defaults to true */
  allowNonExistent?: boolean;
  /** Whether to create parent directories if they don't exist. Defaults to false */
  createParents?: boolean;
}

/**
 * Validates that a file path is safe and within allowed boundaries.
 *
 * Security checks performed:
 * 1. Resolves path to absolute
 * 2. Rejects paths with ".." traversal components
 * 3. Ensures path is within the allowed base directory
 * 4. Normalizes path to prevent bypass attacks
 *
 * @param filePath - The path to validate
 * @param options - Validation options
 * @returns The validated, absolute path
 * @throws PathSecurityError if path validation fails
 */
export function validatePath(filePath: string, options: ValidatePathOptions = {}): string {
  const baseDir = options.baseDir ?? process.cwd();
  const allowNonExistent = options.allowNonExistent ?? true;
  const createParents = options.createParents ?? false;

  // Check for null bytes (common bypass technique)
  if (filePath.includes('\0')) {
    throw new PathSecurityError('Invalid path: path contains illegal characters');
  }

  // Check for empty path
  if (!filePath || filePath.trim() === '') {
    throw new PathSecurityError('Invalid path: path cannot be empty');
  }

  // Reject paths with explicit traversal patterns before resolution
  // This catches attempts to use ".." even if they would resolve to a valid path
  const normalizedInput = filePath.replace(/\\/g, '/');
  if (normalizedInput.includes('..')) {
    throw new PathSecurityError('Invalid path: directory traversal is not allowed');
  }

  // Resolve to absolute path
  const absolutePath = path.resolve(baseDir, filePath);

  // Resolve base directory to absolute as well
  const absoluteBase = path.resolve(baseDir);

  // Normalize both paths to handle any edge cases
  const normalizedPath = path.normalize(absolutePath);
  const normalizedBase = path.normalize(absoluteBase);

  // Ensure the path is within the base directory
  // Add path separator to prevent partial directory name matches
  // e.g., /app-secret should not match base /app
  const pathWithSep = normalizedPath + path.sep;
  const baseWithSep = normalizedBase + path.sep;

  if (!pathWithSep.startsWith(baseWithSep) && normalizedPath !== normalizedBase) {
    throw new PathSecurityError('Invalid path: path is outside allowed directory');
  }

  // Check if path exists (if required)
  if (!allowNonExistent && !fs.existsSync(normalizedPath)) {
    throw new PathSecurityError('Invalid path: file or directory does not exist');
  }

  // Create parent directories if requested
  if (createParents) {
    const parentDir = path.dirname(normalizedPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
  }

  return normalizedPath;
}

/**
 * Validates a directory path specifically for output operations.
 * Ensures the directory is within allowed boundaries and creates it if needed.
 *
 * @param dirPath - The directory path to validate
 * @param options - Validation options
 * @returns The validated, absolute directory path
 * @throws PathSecurityError if path validation fails
 */
export function validateOutputDirectory(dirPath: string, options: ValidatePathOptions = {}): string {
  const validatedPath = validatePath(dirPath, {
    ...options,
    allowNonExistent: true,
    createParents: true,
  });

  // Create directory if it doesn't exist
  if (!fs.existsSync(validatedPath)) {
    fs.mkdirSync(validatedPath, { recursive: true });
  }

  return validatedPath;
}

/**
 * Validates a file path for read operations.
 * Ensures the file exists and is within allowed boundaries.
 *
 * @param filePath - The file path to validate
 * @param options - Validation options
 * @returns The validated, absolute file path
 * @throws PathSecurityError if path validation fails
 */
export function validateInputFile(filePath: string, options: ValidatePathOptions = {}): string {
  return validatePath(filePath, {
    ...options,
    allowNonExistent: false,
  });
}
