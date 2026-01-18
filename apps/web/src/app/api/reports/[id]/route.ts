import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // TODO: Replace with real MongoDB query
    const mockReport = {
      id,
      flowName: 'Checkout Flow',
      status: 'pass',
      completedAt: new Date().toISOString(),
      duration: 3200,
      steps: [
        {
          index: 0,
          action: 'navigate',
          target: 'https://example.com/checkout',
          assertion: 'Page loads successfully',
          status: 'pass',
          screenshot: null,
        },
        {
          index: 1,
          action: 'click',
          target: 'button[data-testid="add-to-cart"]',
          assertion: 'Item added to cart',
          status: 'pass',
          screenshot: null,
        },
      ],
      metrics: {
        successRate: 100,
        avgConfidence: 92,
        totalCost: 0.024,
      },
    };

    return NextResponse.json({ report: mockReport });
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

