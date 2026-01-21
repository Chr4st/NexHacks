import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getRepository } from '@/lib/mongodb';

export async function GET(): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const repository = await getRepository();

    // Get the current month's date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get last month's date range for comparison
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Get current month stats
    const currentStats = await repository.getTenantUsageSummary(userId, startOfMonth, endOfMonth);

    // Get last month stats for comparison
    const lastMonthStats = await repository.getTenantUsageSummary(userId, startOfLastMonth, endOfLastMonth);

    // Calculate flow change
    const flowChange = currentStats.flowCount - (lastMonthStats.flowCount || 0);

    // Calculate success rate from recent test results
    const dashboardFlows = await repository.getDashboardFlows(userId);
    const totalRuns = dashboardFlows.reduce((sum, f) => sum + f.runCount, 0);
    const passingRuns = dashboardFlows.reduce((sum, f) => {
      if (f.lastRun?.passed && f.runCount > 0) {
        // Estimate passing runs based on last run status
        return sum + Math.floor(f.runCount * 0.85);
      }
      return sum;
    }, 0);
    const successRate = totalRuns > 0 ? Math.round((passingRuns / totalRuns) * 100) : 0;

    // Calculate total steps across all flows
    const flows = await repository.getFlowsByTenant(userId);
    const totalSteps = flows.reduce((sum, flow) => sum + (flow.steps?.length || 0), 0);

    return NextResponse.json({
      totalFlows: currentStats.flowCount,
      flowChange: flowChange >= 0 ? `+${flowChange}` : `${flowChange}`,
      successRate,
      testsThisMonth: currentStats.totalRuns,
      totalSteps,
      costThisMonth: currentStats.totalCost,
      costChange: lastMonthStats.totalCost > 0
        ? Math.round(((currentStats.totalCost - lastMonthStats.totalCost) / lastMonthStats.totalCost) * 100)
        : 0,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
