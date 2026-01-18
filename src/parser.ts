import * as yaml from 'yaml';
import * as fs from 'node:fs';
import { FlowSchema, type Flow } from './types.js';
import { validateInputFile, validatePath, PathSecurityError } from './security.js';

// Dangerous YAML constructs that could enable code execution
const DANGEROUS_PATTERNS = ['!!python', '!!js', '!<tag:', '!!ruby', '!!perl'];

/**
 * Validates YAML content for potentially dangerous constructs.
 * Prevents YAML injection attacks by rejecting custom tags.
 */
export function validateYamlSafety(content: string): void {
  for (const pattern of DANGEROUS_PATTERNS) {
    if (content.includes(pattern)) {
      throw new Error(`Unsafe YAML: custom tags like "${pattern}" are not allowed`);
    }
  }
}

/**
 * Parse result type - discriminated union for type-safe error handling
 */
export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Parses a YAML string into a validated Flow object.
 *
 * @param content - YAML string containing flow definition
 * @returns ParseResult with either validated Flow or error message
 */
export function parseFlow(content: string): ParseResult<Flow> {
  try {
    // Security check first
    validateYamlSafety(content);

    // Parse YAML
    const parsed = yaml.parse(content);

    // Validate against schema
    const result = FlowSchema.safeParse(parsed);

    if (result.success) {
      return { success: true, data: result.data };
    }

    // Format Zod errors into readable message
    const errors = result.error.errors.map((e) => {
      const path = e.path.join('.');
      return path ? `${path}: ${e.message}` : e.message;
    });

    return { success: false, error: errors.join('; ') };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown parsing error' };
  }
}

/**
 * Reads and parses a flow from a YAML file.
 *
 * @param filePath - Path to the YAML flow file
 * @param baseDir - Optional base directory for path validation (defaults to cwd)
 * @returns ParseResult with either validated Flow or error message
 */
export function parseFlowFile(filePath: string, baseDir?: string): ParseResult<Flow> {
  try {
    // Validate path is within allowed directory
    const validatedPath = validateInputFile(filePath, { baseDir });

    const content = fs.readFileSync(validatedPath, 'utf-8');
    return parseFlow(content);
  } catch (error) {
    if (error instanceof PathSecurityError) {
      return { success: false, error: 'Invalid file path' };
    }
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        return { success: false, error: 'Flow file not found' };
      }
      return { success: false, error: `Failed to read file: ${error.message}` };
    }
    return { success: false, error: 'Failed to read flow file' };
  }
}

/**
 * Discovers all flow files in a directory.
 *
 * @param directory - Directory to search for .yaml and .yml files
 * @param baseDir - Optional base directory for path validation (defaults to cwd)
 * @returns Array of file paths
 */
export function discoverFlows(directory: string, baseDir?: string): string[] {
  try {
    // Validate directory path is within allowed directory
    const validatedDir = validatePath(directory, { baseDir, allowNonExistent: false });

    if (!fs.existsSync(validatedDir)) {
      return [];
    }

    const entries = fs.readdirSync(validatedDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .filter((entry) => entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))
      .map((entry) => `${validatedDir}/${entry.name}`);
  } catch (error) {
    if (error instanceof PathSecurityError) {
      // Return empty array for invalid paths - don't expose path info
      return [];
    }
    throw error;
  }
}
