import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

async function getFlow(id: string) {
  // TODO: Replace with real API call
  return {
    id,
    name: 'Checkout Flow',
    intent: 'User can successfully complete checkout',
    status: 'passing',
    steps: [
      { id: '1', action: 'navigate', target: 'https://example.com/checkout', assertion: 'Page loads successfully' },
      { id: '2', action: 'click', target: 'button[data-testid="add-to-cart"]', assertion: 'Item added to cart' },
      { id: '3', action: 'type', target: 'input[name="email"]', value: 'test@example.com', assertion: 'Email field filled' },
      { id: '4', action: 'click', target: 'button[type="submit"]', assertion: 'Checkout completed' },
    ],
    lastRun: new Date().toISOString(),
    successRate: 95,
    totalRuns: 20,
  };
}

export default async function FlowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  const { id } = await params;
  const flow = await getFlow(id);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Link href="/flows">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">{flow.name}</h2>
          <p className="text-muted-foreground">{flow.intent}</p>
        </div>
        <Button>
          <Play className="mr-2 h-4 w-4" />
          Run Flow
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Flow Status</CardTitle>
            <CardDescription>Current status and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <div className="flex items-center gap-2">
                  {flow.status === 'passing' ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-600">Passing</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="font-medium text-red-600">Failing</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <span className="font-medium">{flow.successRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Runs</span>
                <span className="font-medium">{flow.totalRuns}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Flow Steps</CardTitle>
            <CardDescription>{flow.steps.length} steps in this flow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {flow.steps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{step.action}</div>
                    <div className="text-sm text-muted-foreground">
                      {step.target}
                    </div>
                    {step.assertion && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Assert: {step.assertion}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

