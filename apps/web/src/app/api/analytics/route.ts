import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getRepository } from '@/lib/mongodb';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const repository = await getRepository();

    // Get tenant usage summary
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const summary = await repository.getTenantUsageSummary(userId, startDate, endDate);

    // Get success rate trends (last 7 days)
    const trends = await repository.getSuccessRateTrendByTenant(userId, 7);

    const analytics = {
      totalRuns: summary.totalRuns,
      successRate: Math.round(summary.successRate),
      totalCost: summary.totalCost,
      avgConfidence: summary.avgConfidence,
      trends: trends.map(t => ({
        date: t.date,
        successRate: Math.round(t.successRate),
        runs: t.totalRuns,
      })),
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

