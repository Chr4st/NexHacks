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

    // Fetch all data in parallel for better performance
    const [summary, trends, costTrends] = await Promise.all([
      repository.getTenantUsageSummary(userId, startDate, endDate),
      repository.getSuccessRateTrendByTenant(userId, undefined, 7),
      repository.getCostTrendByTenant(userId, 7),
    ]);

    // Calculate success rate from trends
    const totalFromTrends = trends.reduce((sum, t) => sum + t.totalRuns, 0);
    const successfulFromTrends = trends.reduce((sum, t) => sum + Math.round(t.totalRuns * t.successRate / 100), 0);
    const overallSuccessRate = totalFromTrends > 0 ? Math.round(successfulFromTrends / totalFromTrends * 100) : 0;

    // Format cost trends with readable dates
    const formattedCostTrends = costTrends.map(t => ({
      date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      cost: t.cost,
      runs: t.runs,
    }));

    const analytics = {
      totalRuns: summary.totalRuns,
      successRate: overallSuccessRate,
      totalCost: summary.totalCost,
      flowCount: summary.flowCount,
      trends: trends.map(t => ({
        date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        successRate: Math.round(t.successRate),
        runs: t.totalRuns,
      })),
      costTrends: formattedCostTrends,
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
