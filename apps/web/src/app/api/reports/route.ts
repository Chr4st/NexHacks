import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Replace with real MongoDB queries
    const mockReports = [
      {
        id: '1',
        flowName: 'Checkout Flow',
        status: 'pass',
        completedAt: new Date(Date.now() - 3600000).toISOString(),
        duration: 3200,
        steps: { total: 5, passed: 5, failed: 0 },
      },
      {
        id: '2',
        flowName: 'Login Flow',
        status: 'fail',
        completedAt: new Date(Date.now() - 7200000).toISOString(),
        duration: 1800,
        steps: { total: 3, passed: 2, failed: 1 },
      },
    ];

    return NextResponse.json({ reports: mockReports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

