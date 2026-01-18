import { z } from 'zod';

/**
 * Schema for flow step actions
 */
const FlowStepActionSchema = z.enum([
  'navigate',
  'click',
  'type',
  'screenshot',
  'wait',
  'scroll'
]);

/**
 * Schema for a single flow step
 */
export const FlowStepSchema = z.object({
  action: FlowStepActionSchema,
  target: z.string().optional(),
  value: z.string().optional(),
  assert: z.string().optional(),
  timeout: z.number().positive().optional()
});

/**
 * Schema for creating a new flow
 */
const CreateFlowSchemaBase = z.object({
  name: z.string()
    .min(1, 'Flow name is required')
    .max(100, 'Flow name must be at most 100 characters')
    .regex(/^[a-zA-Z0-9\s_-]+$/, 'Flow name can only contain letters, numbers, spaces, underscores, and hyphens'),
  intent: z.string()
    .min(1, 'Intent is required')
    .max(500, 'Intent must be at most 500 characters'),
  url: z.string()
    .url('Must be a valid URL'),
  viewport: z.object({
    width: z.number().int().positive().max(10000),
    height: z.number().int().positive().max(10000)
  }).optional(),
  steps: z.array(FlowStepSchema)
    .min(1, 'At least one step is required')
    .max(100, 'Maximum 100 steps allowed'),
  tags: z.array(z.string().max(50)).max(20).default([]),
  critical: z.boolean().default(false)
});

export const CreateFlowSchema = CreateFlowSchemaBase.transform((data) => ({
  ...data,
  tags: data.tags as string[],
  critical: data.critical as boolean
}));

export interface CreateFlowInput {
  name: string;
  intent: string;
  url: string;
  viewport?: { width: number; height: number };
  steps: Array<{
    action: 'navigate' | 'click' | 'type' | 'screenshot' | 'wait' | 'scroll';
    target?: string;
    value?: string;
    assert?: string;
    timeout?: number;
  }>;
  tags: string[];
  critical: boolean;
}

/**
 * Schema for updating an existing flow
 */
export const UpdateFlowSchema = z.object({
  intent: z.string()
    .min(1)
    .max(500)
    .optional(),
  url: z.string()
    .url()
    .optional(),
  viewport: z.object({
    width: z.number().int().positive().max(10000),
    height: z.number().int().positive().max(10000)
  }).optional(),
  steps: z.array(FlowStepSchema)
    .min(1)
    .max(100)
    .optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  critical: z.boolean().optional()
});

export type UpdateFlowInput = z.infer<typeof UpdateFlowSchema>;

/**
 * Schema for analytics query parameters
 */
export const AnalyticsQuerySchema = z.object({
  days: z.coerce.number()
    .int()
    .positive()
    .max(365)
    .default(7),
  flowName: z.string()
    .max(100)
    .optional()
});

export type AnalyticsQueryInput = z.infer<typeof AnalyticsQuerySchema>;

/**
 * Schema for reports query parameters
 */
export const ReportsQuerySchema = z.object({
  limit: z.coerce.number()
    .int()
    .positive()
    .max(100)
    .default(20),
  flowName: z.string()
    .max(100)
    .optional()
});

export type ReportsQueryInput = z.infer<typeof ReportsQuerySchema>;

/**
 * Parse and validate input with a Zod schema, returning a Result type
 */
export function parseInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(input);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format Zod errors into a readable message
  const errorMessages = result.error.errors
    .map(err => `${err.path.join('.')}: ${err.message}`)
    .join('; ');

  return { success: false, error: errorMessages };
}

/**
 * Parse query parameters from URLSearchParams
 */
export function parseQueryParams<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): { success: true; data: T } | { success: false; error: string } {
  const params: Record<string, string> = {};

  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return parseInput(schema, params);
}
