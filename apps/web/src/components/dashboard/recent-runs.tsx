import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';

async function getRecentRuns() {
  // TODO: Replace with real API call
  return [
    {
      id: '1',
      flowName: 'Checkout Flow',
      status: 'pass',
      completedAt: new Date(Date.now() - 3600000).toISOString(),
      duration: 3200,
      steps: { total: 5, passed: 5 },
    },
    {
      id: '2',
      flowName: 'Login Flow',
      status: 'fail',
      completedAt: new Date(Date.now() - 7200000).toISOString(),
      duration: 1800,
      steps: { total: 3, passed: 2 },
    },
    {
      id: '3',
      flowName: 'Signup Flow',
      status: 'pass',
      completedAt: new Date(Date.now() - 1800000).toISOString(),
      duration: 4500,
      steps: { total: 6, passed: 6 },
    },
  ];
}

export async function RecentRuns() {
  const runs = await getRecentRuns();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Test Runs</CardTitle>
        <CardDescription>Latest test execution results</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {runs.map((run) => (
            <Link
              key={run.id}
              href={`/reports/${run.id}`}
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-4">
                {run.status === 'pass' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <div>
                  <div className="font-medium">{run.flowName}</div>
                  <div className="text-sm text-muted-foreground">
                    {run.steps.passed}/{run.steps.total} steps passed
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {(run.duration / 1000).toFixed(1)}s
                </div>
                <div>{new Date(run.completedAt).toLocaleDateString()}</div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

