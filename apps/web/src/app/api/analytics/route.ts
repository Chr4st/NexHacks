import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDatabase, getRepository } from '@/lib/mongodb';
import { apiError, apiSuccess } from '@/lib/api-utils';
import { AnalyticsQuerySchema, parseQueryParams } from '@/lib/validation';
import type { TestResult, SuccessRateTrendPoint } from '@/types';

interface AnalyticsResponse {
  totalRuns: number;
  successRate: number;
  totalCost: number;
  avgConfidence: number;
  trends: Array<{
    date: string;
    successRate: number;
    runs: number;
  }>;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return apiError('Unauthorized', 401);
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const validation = parseQueryParams(AnalyticsQuerySchema, searchParams);

    if (!validation.success) {
      return apiError(validation.error, 400);
    }

    const { days = 7, flowName } = validation.data;

    const repository = await getRepository();
    const db = await getDatabase();
    const testResults = db.collection<TestResult>('test_results');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get usage summary for the period
    const usageSummary = await repository.getTenantUsageSummary(userId, startDate, endDate);

    // Get success rate trend - either for a specific flow or all flows
    let trends: SuccessRateTrendPoint[];

    if (flowName) {
      // Get trend for specific flow
      trends = await repository.getSuccessRateTrendByTenant(userId, flowName, days);
    } else {
      // Get overall trend across all flows for this tenant
      trends = await testResults.aggregate<SuccessRateTrendPoint>([
        {
          $match: {
            'metadata.tenantId': userId,
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            totalRuns: { $sum: 1 },
            successfulRuns: { $sum: { $cond: ['$measurements.passed', 1, 0] } },
            avgConfidence: { $avg: '$measurements.avgConfidence' },
            avgDuration: { $avg: '$measurements.duration' }
          }
        },
        {
          $project: {
            date: '$_id',
            successRate: { $multiply: [{ $divide: ['$successfulRuns', '$totalRuns'] }, 100] },
            avgConfidence: 1,
            avgDuration: 1,
            totalRuns: 1
          }
        },
        { $sort: { date: 1 } }
      ]).toArray();
    }

    // Calculate overall metrics from the trend data
    const totalRunsFromTrend = trends.reduce((sum, t) => sum + t.totalRuns, 0);
    const weightedSuccessRate = trends.length > 0
      ? trends.reduce((sum, t) => sum + (t.successRate * t.totalRuns), 0) / totalRunsFromTrend
      : 0;
    const avgConfidence = trends.length > 0
      ? trends.reduce((sum, t) => sum + (t.avgConfidence * t.totalRuns), 0) / totalRunsFromTrend
      : 0;

    const analytics: AnalyticsResponse = {
      totalRuns: usageSummary.totalRuns || totalRunsFromTrend,
      successRate: Math.round(weightedSuccessRate),
      totalCost: usageSummary.totalCost,
      avgConfidence: Math.round(avgConfidence),
      trends: trends.map(t => ({
        date: t.date,
        successRate: Math.round(t.successRate),
        runs: t.totalRuns
      }))
    };

    return apiSuccess(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);

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
