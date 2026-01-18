import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GitBranch, FileText, CheckCircle2, XCircle } from 'lucide-react';

async function getActivity() {
  // TODO: Replace with real API call
  return [
    {
      type: 'flow_run',
      message: 'Checkout Flow completed successfully',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      icon: GitBranch,
      status: 'success',
    },
    {
      type: 'report',
      message: 'New report generated for Login Flow',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      icon: FileText,
      status: 'info',
    },
    {
      type: 'flow_run',
      message: 'Signup Flow failed - 1 step failed',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      icon: XCircle,
      status: 'error',
    },
  ];
}

export async function ActivityFeed() {
  const activities = await getActivity();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Feed</CardTitle>
        <CardDescription>Recent activity across your flows</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div key={index} className="flex items-start gap-4">
                <div
                  className={`mt-1 rounded-full p-2 ${
                    activity.status === 'success'
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                      : activity.status === 'error'
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

