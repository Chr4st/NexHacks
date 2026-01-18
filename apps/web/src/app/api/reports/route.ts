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
    // Pass flowName as undefined to get all flows, and 20 as the limit
    const results = await repository.getRecentResultsByTenant(userId, undefined, 20);

    const reports = results.map(result => ({
      id: (result as any)._id?.toString() || crypto.randomUUID(),
      flowName: result.metadata.flowName,
      status: result.measurements.passed ? 'pass' : 'fail',
      completedAt: result.timestamp.toISOString(),
      duration: result.measurements.duration,
      steps: {
        total: result.measurements.totalSteps || 0,
        passed: (result.measurements.totalSteps || 0) - (result.measurements.failedSteps || 0),
        failed: result.measurements.failedSteps || 0,
      },
    }));

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
