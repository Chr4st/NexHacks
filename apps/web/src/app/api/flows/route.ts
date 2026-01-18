import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/mongodb';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const repository = await getRepository();
    const dashboardFlows = await repository.getDashboardFlows(userId);

    // Transform to the format expected by the frontend
    // Also fetch success rates for each flow
    const flows = await Promise.all(
      dashboardFlows.map(async ({ flow, lastRun, runCount }) => {
        // Get success rate trend for this specific flow
        let successRate = 0;
        if (runCount > 0) {
          try {
            const trends = await repository.getSuccessRateTrendByTenant(userId, flow.name, 30);
            if (trends.length > 0) {
              const totalRuns = trends.reduce((sum, t) => sum + t.totalRuns, 0);
              const successfulRuns = trends.reduce((sum, t) => sum + Math.round(t.totalRuns * t.successRate / 100), 0);
              successRate = totalRuns > 0 ? Math.round(successfulRuns / totalRuns * 100) : 0;
            }
          } catch {
            // If we can't get trends, estimate from last run
            successRate = lastRun?.passed ? 100 : 0;
          }
        }

        const status = lastRun ? (lastRun.passed ? 'passing' : 'failing') : 'passing';

        return {
          id: (flow as any)._id?.toString() || flow.name,
          name: flow.name,
          intent: flow.intent,
          status,
          lastRun: lastRun?.timestamp?.toISOString() || flow.updatedAt?.toISOString() || new Date().toISOString(),
          successRate,
          totalRuns: runCount,
        };
      })
    );

    return NextResponse.json({ flows });
  } catch (error) {
    console.error('Error fetching flows:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, intent, url, viewport, steps } = body;

    // Basic validation
    if (!name || !intent || !steps || steps.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: name, intent, and steps' },
        { status: 400 }
      );
    }

    const repository = await getRepository();
    const flowId = await repository.saveFlowForTenant(userId, {
      name,
      intent,
      url: url || '',
      viewport,
      steps: steps.map((step: any) => ({
        action: step.action,
        target: step.target || '',
        value: step.value,
        assert: step.assert,
        timeout: step.timeout,
      })),
      tags: [],
      critical: false,
    });

    return NextResponse.json({ id: flowId, success: true });
  } catch (error) {
    console.error('Error creating flow:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

