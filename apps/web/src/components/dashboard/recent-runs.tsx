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
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
          Recent Test Runs
        </CardTitle>
        <CardDescription>Latest test execution results</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {runs.map((run) => (
            <Link
              key={run.id}
              href={`/reports/${run.id}`}
              className="flex items-center justify-between rounded-xl border-2 border-gray-100 dark:border-gray-800 p-4 hover:border-indigo-200 dark:hover:border-indigo-900 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 dark:hover:from-indigo-950/20 dark:hover:to-purple-950/20 transition-all duration-200 group"
            >
              <div className="flex items-center gap-4">
                <div className={`rounded-full p-2.5 ${
                  run.status === 'pass'
                    ? 'bg-gradient-to-br from-green-400 to-green-600'
                    : 'bg-gradient-to-br from-red-400 to-red-600'
                } group-hover:scale-110 transition-transform duration-200`}>
                  {run.status === 'pass' ? (
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  ) : (
                    <XCircle className="h-5 w-5 text-white" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {run.flowName}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <span className={run.status === 'pass' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      {run.steps.passed}/{run.steps.total} steps passed
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="font-medium">{(run.duration / 1000).toFixed(1)}s</span>
                </div>
                <div className="text-xs">{new Date(run.completedAt).toLocaleDateString()}</div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

