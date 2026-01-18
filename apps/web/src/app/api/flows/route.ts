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
    const flows = await repository.getDashboardFlows(userId);

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
      tenantId: userId,
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

