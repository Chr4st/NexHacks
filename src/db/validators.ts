/**
 * Runtime input validation helpers for MongoDB repository
 * Prevents NoSQL injection and ensures type safety at runtime
 */

export function validateString(value: unknown, name: string): string {
  if (typeof value !== 'string' || !value) {
    throw new Error(`Invalid ${name}: must be non-empty string`);
  }
  return value;
}

export function validateNumber(
  value: unknown,
  name: string,
  min?: number,
  max?: number
): number {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error(`Invalid ${name}: must be a number`);
  }
  if (min !== undefined && value < min) {
    throw new Error(`${name} must be >= ${min}`);
  }
  if (max !== undefined && value > max) {
    throw new Error(`${name} must be <= ${max}`);
  }
  return value;
}

export function escapeRegex(value: string): string {
  // Escape all regex special characters to prevent ReDoS
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function validateSearchQuery(query: string): string {
  const MAX_QUERY_LENGTH = 100;

  if (!query || typeof query !== 'string') {
    throw new Error('Invalid query: must be non-empty string');
  }

  if (query.length > MAX_QUERY_LENGTH) {
    throw new Error(`Invalid query: must be ≤${MAX_QUERY_LENGTH} characters`);
  }

  return query;
}
