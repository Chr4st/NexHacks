import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getRepository } from './mongodb';
import type { FlowGuardRepository } from '../../../../src/db/repository.js';

/**
 * Standardized API error response
 */
export function apiError(
  message: string,
  status: number = 500,
  details?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    { error: message, ...details },
    { status }
  );
}

/**
 * Standardized API success response
 */
export function apiSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Authentication result with userId
 */
interface AuthResult {
  userId: string;
}

/**
 * Context provided to authenticated API handlers
 */
export interface ApiContext {
  userId: string;
  repository: FlowGuardRepository;
}

/**
 * Extract userId from Clerk auth, returning an error response if not authenticated
 */
export async function requireAuth(): Promise<AuthResult | NextResponse> {
  const { userId } = await auth();

  if (!userId) {
    return apiError('Unauthorized', 401);
  }

  return { userId };
}

/**
 * Higher-order function that wraps an API handler with authentication and repository access.
 * Handles common error patterns consistently.
 *
 * @example
 * export const GET = withAuth(async ({ userId, repository }) => {
 *   const flows = await repository.getFlowsByTenant(userId);
 *   return apiSuccess({ flows });
 * });
 */
export function withAuth<T>(
  handler: (ctx: ApiContext) => Promise<NextResponse<T>>
): () => Promise<NextResponse<T | { error: string }>> {
  return async (): Promise<NextResponse<T | { error: string }>> => {
    try {
      const authResult = await requireAuth();

      if (authResult instanceof NextResponse) {
        return authResult as NextResponse<{ error: string }>;
      }

      const repository = await getRepository();

      return await handler({
        userId: authResult.userId,
        repository
      });
    } catch (error) {
      console.error('API error:', error);

      // Handle MongoDB connection errors specifically
      if (error instanceof Error && error.message.includes('MONGODB_URI')) {
        return apiError('Database connection error', 503) as NextResponse<{ error: string }>;
      }

      // Handle validation errors from repository
      if (error instanceof Error && (
        error.message.includes('Invalid') ||
        error.message.includes('required')
      )) {
        return apiError(error.message, 400) as NextResponse<{ error: string }>;
      }

      return apiError('Internal server error', 500) as NextResponse<{ error: string }>;
    }
  };
}

/**
 * Version of withAuth that accepts request and params for dynamic routes.
 *
 * @example
 * export const GET = withAuthParams(async ({ userId, repository, params }) => {
 *   const flow = await repository.getFlowByTenant(userId, params.id);
 *   if (!flow) return apiError('Flow not found', 404);
 *   return apiSuccess({ flow });
 * });
 */
export function withAuthParams<T, P extends Record<string, string> = { id: string }>(
  handler: (ctx: ApiContext & { params: P; request: Request }) => Promise<NextResponse<T>>
): (request: Request, context: { params: Promise<P> }) => Promise<NextResponse<T | { error: string }>> {
  return async (request: Request, context: { params: Promise<P> }): Promise<NextResponse<T | { error: string }>> => {
    try {
      const authResult = await requireAuth();

      if (authResult instanceof NextResponse) {
        return authResult as NextResponse<{ error: string }>;
      }

      const repository = await getRepository();
      const params = await context.params;

      return await handler({
        userId: authResult.userId,
        repository,
        params,
        request
      });
    } catch (error) {
      console.error('API error:', error);

      if (error instanceof Error && error.message.includes('MONGODB_URI')) {
        return apiError('Database connection error', 503) as NextResponse<{ error: string }>;
      }

      if (error instanceof Error && (
        error.message.includes('Invalid') ||
        error.message.includes('required')
      )) {
        return apiError(error.message, 400) as NextResponse<{ error: string }>;
      }

      return apiError('Internal server error', 500) as NextResponse<{ error: string }>;
    }
  };
}

/**
 * Version of withAuth that accepts request body for POST/PUT handlers.
 *
 * @example
 * export const POST = withAuthBody(async ({ userId, repository, body }) => {
 *   const id = await repository.saveFlowForTenant(userId, body);
 *   return apiSuccess({ id }, 201);
 * });
 */
export function withAuthBody<T, B = unknown>(
  handler: (ctx: ApiContext & { body: B; request: Request }) => Promise<NextResponse<T>>
): (request: Request) => Promise<NextResponse<T | { error: string }>> {
  return async (request: Request): Promise<NextResponse<T | { error: string }>> => {
    try {
      const authResult = await requireAuth();

      if (authResult instanceof NextResponse) {
        return authResult as NextResponse<{ error: string }>;
      }

      const repository = await getRepository();
      const body = await request.json() as B;

      return await handler({
        userId: authResult.userId,
        repository,
        body,
        request
      });
    } catch (error) {
      console.error('API error:', error);

      // Handle JSON parsing errors
      if (error instanceof SyntaxError) {
        return apiError('Invalid JSON in request body', 400) as NextResponse<{ error: string }>;
      }

      if (error instanceof Error && error.message.includes('MONGODB_URI')) {
        return apiError('Database connection error', 503) as NextResponse<{ error: string }>;
      }

      if (error instanceof Error && (
        error.message.includes('Invalid') ||
        error.message.includes('required')
      )) {
        return apiError(error.message, 400) as NextResponse<{ error: string }>;
      }

      return apiError('Internal server error', 500) as NextResponse<{ error: string }>;
    }
  };
}
