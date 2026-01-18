import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { auth } from '@clerk/nextjs/server';
import { getDatabase } from '@/lib/mongodb';
import { apiError, apiSuccess } from '@/lib/api-utils';
import { mapTestResultToReport } from '@/lib/mappers';
import type { TestResult } from '@/types';

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

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return apiError('Invalid report ID format', 400);
    }

    const db = await getDatabase();
    const testResults = db.collection<TestResult & { _id: ObjectId }>('test_results');

    // Query by _id with tenant isolation
    const result = await testResults.findOne({
      _id: new ObjectId(id),
      'metadata.tenantId': userId
    });

    if (!result) {
      return apiError('Report not found', 404);
    }

    // Map to API format
    const report = mapTestResultToReport({
      ...result,
      _id: { toString: () => result._id.toString() }
    });

    return apiSuccess({ report });
  } catch (error) {
    console.error('Error fetching report:', error);

    if (error instanceof Error && error.message.includes('MONGODB_URI')) {
      return apiError('Database connection error', 503);
    }

    // Handle invalid ObjectId
    if (error instanceof Error && error.message.includes('ObjectId')) {
      return apiError('Invalid report ID format', 400);
    }

    return apiError('Internal server error', 500);
  }
}
