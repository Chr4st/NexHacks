import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getRepository } from '@/lib/mongodb';
import { apiError, apiSuccess } from '@/lib/api-utils';
import { ReportsQuerySchema, parseQueryParams } from '@/lib/validation';
import { mapTestResultToListItem, type ReportListItem } from '@/lib/mappers';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return apiError('Unauthorized', 401);
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const validation = parseQueryParams(ReportsQuerySchema, searchParams);

    if (!validation.success) {
      return apiError(validation.error, 400);
    }

    const { limit, flowName } = validation.data;

    const repository = await getRepository();
    const results = await repository.getRecentResultsByTenant(
      userId,
      flowName,
      limit
    );

    // Map to API format - cast to include _id which comes from MongoDB
    const reports: ReportListItem[] = results.map(result =>
      mapTestResultToListItem(result as typeof result & { _id?: { toString(): string } })
    );

    return apiSuccess({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);

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
