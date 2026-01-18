import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/card';
import { FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';

async function getReports() {
  // TODO: Replace with real API call
  return [
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
    {
      id: '3',
      flowName: 'Signup Flow',
      status: 'pass',
      completedAt: new Date(Date.now() - 1800000).toISOString(),
      duration: 4500,
      steps: { total: 6, passed: 6, failed: 0 },
    },
  ];
}

export default async function ReportsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  const reports = await getReports();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
      </div>

      <div className="grid gap-4">
        {reports.map((report) => (
          <Link key={report.id} href={`/reports/${report.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle>{report.flowName}</CardTitle>
                      <CardDescription>
                        {new Date(report.completedAt).toLocaleString()}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {report.status === 'pass' ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Steps:</span>
                    <span className="font-medium">
                      {report.steps.passed}/{report.steps.total} passed
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {(report.duration / 1000).toFixed(1)}s
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

