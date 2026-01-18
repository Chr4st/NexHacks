import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/mongodb';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, use mock data until MongoDB is fully integrated
    // TODO: Replace with real MongoDB queries
    const mockFlows = [
      {
        id: '1',
        name: 'Checkout Flow',
        intent: 'User can successfully complete checkout',
        status: 'passing',
        lastRun: new Date().toISOString(),
        successRate: 95,
        totalRuns: 20,
      },
      {
        id: '2',
        name: 'Login Flow',
        intent: 'User can log in successfully',
        status: 'failing',
        lastRun: new Date().toISOString(),
        successRate: 70,
        totalRuns: 15,
      },
    ];

    return NextResponse.json({ flows: mockFlows });
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
    
    // TODO: Validate with Zod schema
    // TODO: Save to MongoDB
    
    return NextResponse.json({ id: 'new-flow-id', ...body });
  } catch (error) {
    console.error('Error creating flow:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

