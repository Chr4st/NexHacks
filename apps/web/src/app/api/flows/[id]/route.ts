import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getRepository } from '@/lib/mongodb';
import { apiError, apiSuccess } from '@/lib/api-utils';
import { UpdateFlowSchema, parseInput } from '@/lib/validation';
import { mapFlowDefinitionToFlow, mapUpdateFlowToDefinition } from '@/lib/mappers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return apiError('Unauthorized', 401);
    }

    const { id } = await params;
    const repository = await getRepository();

    // id is the flow name (per plan decision)
    const flow = await repository.getFlowByTenant(userId, id);

    if (!flow) {
      return apiError('Flow not found', 404);
    }

    // Get run statistics for this flow
    const recentResults = await repository.getRecentResultsByTenant(userId, id, 100);
    const successfulRuns = recentResults.filter(r => r.measurements.passed).length;
    const successRate = recentResults.length > 0
      ? (successfulRuns / recentResults.length) * 100
      : 0;

    const mappedFlow = mapFlowDefinitionToFlow(flow, {
      lastRun: recentResults[0]?.timestamp,
      successRate,
      totalRuns: recentResults.length
    });

    return apiSuccess({ flow: mappedFlow });
  } catch (error) {
    console.error('Error fetching flow:', error);

    if (error instanceof Error && error.message.includes('MONGODB_URI')) {
      return apiError('Database connection error', 503);
    }

    if (error instanceof Error && (
      error.message.includes('Invalid') ||
      error.message.includes('required')
    )) {
      return apiError(error.message, 400);
    }

    return apiError('Internal server error', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return apiError('Unauthorized', 401);
    }

    const { id } = await params;
    const body = await request.json();

    // Validate request body
    const validation = parseInput(UpdateFlowSchema, body);
    if (!validation.success) {
      return apiError(validation.error, 400);
    }

    const repository = await getRepository();

    // Check if flow exists
    const existingFlow = await repository.getFlowByTenant(userId, id);
    if (!existingFlow) {
      return apiError('Flow not found', 404);
    }

    // Map to database format and update
    const updates = mapUpdateFlowToDefinition(validation.data);
    const updated = await repository.updateFlowForTenant(userId, id, updates);

    if (!updated) {
      return apiError('Failed to update flow', 500);
    }

    // Fetch updated flow to return
    const updatedFlow = await repository.getFlowByTenant(userId, id);
    if (!updatedFlow) {
      return apiError('Flow not found after update', 500);
    }

    // Get run statistics
    const recentResults = await repository.getRecentResultsByTenant(userId, id, 100);
    const successfulRuns = recentResults.filter(r => r.measurements.passed).length;
    const successRate = recentResults.length > 0
      ? (successfulRuns / recentResults.length) * 100
      : 0;

    const mappedFlow = mapFlowDefinitionToFlow(updatedFlow, {
      lastRun: recentResults[0]?.timestamp,
      successRate,
      totalRuns: recentResults.length
    });

    return apiSuccess({ flow: mappedFlow });
  } catch (error) {
    console.error('Error updating flow:', error);

    if (error instanceof SyntaxError) {
      return apiError('Invalid JSON in request body', 400);
    }

    if (error instanceof Error && error.message.includes('MONGODB_URI')) {
      return apiError('Database connection error', 503);
    }

    if (error instanceof Error && (
      error.message.includes('Invalid') ||
      error.message.includes('required')
    )) {
      return apiError(error.message, 400);
    }

    return apiError('Internal server error', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return apiError('Unauthorized', 401);
    }

    const { id } = await params;
    const repository = await getRepository();

    // Check if flow exists first
    const existingFlow = await repository.getFlowByTenant(userId, id);
    if (!existingFlow) {
      return apiError('Flow not found', 404);
    }

    const deleted = await repository.deleteFlowForTenant(userId, id);

    if (!deleted) {
      return apiError('Failed to delete flow', 500);
    }

    return apiSuccess({ success: true, id });
  } catch (error) {
    console.error('Error deleting flow:', error);

    if (error instanceof Error && error.message.includes('MONGODB_URI')) {
      return apiError('Database connection error', 503);
    }

    if (error instanceof Error && (
      error.message.includes('Invalid') ||
      error.message.includes('required')
    )) {
      return apiError(error.message, 400);
    }

    return apiError('Internal server error', 500);
  }
}
