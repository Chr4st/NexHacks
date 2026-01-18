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
    const results = await repository.getRecentResultsByTenant(userId, 20);

    const reports = results.map(result => ({
      id: result._id?.toString(),
      flowName: result.flowName,
      status: result.success ? 'pass' : 'fail',
      completedAt: result.timestamp.toISOString(),
      duration: result.duration,
      steps: {
        total: result.stepResults?.length || 0,
        passed: result.stepResults?.filter(s => s.success).length || 0,
        failed: result.stepResults?.filter(s => !s.success).length || 0,
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

