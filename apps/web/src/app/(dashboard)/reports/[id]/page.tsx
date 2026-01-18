import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';
import Link from 'next/link';

async function getReport(id: string) {
  // TODO: Replace with real API call
  return {
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
      {
        index: 2,
        action: 'type',
        target: 'input[name="email"]',
        assertion: 'Email field filled',
        status: 'pass',
        screenshot: null,
      },
      {
        index: 3,
        action: 'click',
        target: 'button[type="submit"]',
        assertion: 'Checkout completed',
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
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  const { id } = await params;
  const report = await getReport(id);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Link href="/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">{report.flowName}</h2>
          <p className="text-muted-foreground">
            Completed {new Date(report.completedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="outline">
            <ExternalLink className="mr-2 h-4 w-4" />
            View Full Report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {report.status === 'pass' ? 'Passed' : 'Failed'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.metrics.successRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(report.duration / 1000).toFixed(1)}s
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Step-by-Step Results</CardTitle>
          <CardDescription>
            {report.steps.length} steps executed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {report.steps.map((step) => (
              <div
                key={step.index}
                className={`rounded-lg border p-4 ${
                  step.status === 'pass' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Step {step.index + 1}</span>
                      <span className="text-sm text-muted-foreground">
                        {step.action}
                      </span>
                    </div>
                    <div className="mt-2 text-sm">
                      <div className="text-muted-foreground">Target: {step.target}</div>
                      <div className="text-muted-foreground">Assert: {step.assertion}</div>
                    </div>
                  </div>
                  <div
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      step.status === 'pass'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {step.status === 'pass' ? 'Passed' : 'Failed'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

