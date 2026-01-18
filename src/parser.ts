import * as yaml from 'yaml';
import * as fs from 'node:fs';
import { FlowSchema, type Flow } from './types.js';

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
 * @returns ParseResult with either validated Flow or error message
 */
export function parseFlowFile(filePath: string): ParseResult<Flow> {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, error: `Flow file not found: ${filePath}` };
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return parseFlow(content);
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: `Failed to read file: ${error.message}` };
    }
    return { success: false, error: 'Failed to read flow file' };
  }
}

/**
 * Discovers all flow files in a directory.
 *
 * @param directory - Directory to search for .yaml and .yml files
 * @returns Array of file paths
 */
export function discoverFlows(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const entries = fs.readdirSync(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .filter((entry) => entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))
    .map((entry) => `${directory}/${entry.name}`);
}
