import { ReportCard } from '@/components/reports/report-card';

async function getReports() {
  // TODO: Replace with real API call
  return [
    {
      id: '1',
      flowName: 'Checkout Flow',
      status: 'pass' as const,
      completedAt: new Date(Date.now() - 3600000).toISOString(),
      duration: 3200,
      steps: { total: 5, passed: 5, failed: 0 },
    },
    {
      id: '2',
      flowName: 'Login Flow',
      status: 'fail' as const,
      completedAt: new Date(Date.now() - 7200000).toISOString(),
      duration: 1800,
      steps: { total: 3, passed: 2, failed: 1 },
    },
    {
      id: '3',
      flowName: 'Signup Flow',
      status: 'pass' as const,
      completedAt: new Date(Date.now() - 1800000).toISOString(),
      duration: 4500,
      steps: { total: 6, passed: 6, failed: 0 },
    },
  ];
}

export default async function ReportsPage() {
  const reports = await getReports();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Reports
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          View and analyze your test execution results
        </p>
      </div>

      <div className="grid gap-4">
        {reports.map((report) => (
          <ReportCard key={report.id} {...report} />
        ))}
      </div>
    </div>
  );
}

