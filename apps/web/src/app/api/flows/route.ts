import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getRepository } from '@/lib/mongodb';
import { apiError, apiSuccess } from '@/lib/api-utils';
import { CreateFlowSchema, parseInput, type CreateFlowInput } from '@/lib/validation';
import { mapFlowDefinitionToListItem, mapCreateFlowToDefinition, type FlowListItem } from '@/lib/mappers';

export async function GET(): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return apiError('Unauthorized', 401);
    }

    const repository = await getRepository();
    const dashboardFlows = await repository.getDashboardFlows(userId);

    const flows: FlowListItem[] = dashboardFlows.map(({ flow, lastRun, runCount }) => {
      // Calculate success rate from recent results if we have run data
      // For now, use a simple heuristic based on lastRun status
      const successRate = runCount > 0 && lastRun
        ? (lastRun.passed ? 85 : 50) // Simplified - in production, aggregate real stats
        : 0;

      return mapFlowDefinitionToListItem(flow, {
        lastRun: lastRun?.timestamp,
        successRate,
        totalRuns: runCount
      });
    });

    return apiSuccess({ flows });
  } catch (error) {
    console.error('Error fetching flows:', error);

    if (error instanceof Error && error.message.includes('MONGODB_URI')) {
      return apiError('Database connection error', 503);
    }

    return apiError('Internal server error', 500);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return apiError('Unauthorized', 401);
    }

    const body = await request.json();

    // Validate request body
    const validation = parseInput(CreateFlowSchema, body);
    if (!validation.success) {
      return apiError(validation.error, 400);
    }

    const repository = await getRepository();

    // Check if flow with this name already exists for this tenant
    const existingFlow = await repository.getFlowByTenant(userId, validation.data.name);
    if (existingFlow) {
      return apiError('A flow with this name already exists', 409);
    }

    // Map to database format and save
    // Cast to ensure tags/critical are properly typed after Zod defaults are applied
    const validatedData = validation.data as CreateFlowInput;
    const flowData = mapCreateFlowToDefinition(validatedData);
    const flowId = await repository.saveFlowForTenant(userId, flowData);

    return apiSuccess({
      id: validation.data.name, // Use name as ID per plan
      name: validation.data.name,
      _mongoId: flowId
    }, 201);
  } catch (error) {
    console.error('Error creating flow:', error);

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
