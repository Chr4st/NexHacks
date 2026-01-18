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
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
          Activity Feed
        </CardTitle>
        <CardDescription>Recent activity across your flows</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            const isLast = index === activities.length - 1;
            return (
              <div key={index} className="relative">
                <div className="flex items-start gap-4 group">
                  <div
                    className={`mt-1 rounded-full p-2.5 ring-4 ring-white dark:ring-gray-900 ${
                      activity.status === 'success'
                        ? 'bg-gradient-to-br from-green-400 to-green-600 text-white'
                        : activity.status === 'error'
                        ? 'bg-gradient-to-br from-red-400 to-red-600 text-white'
                        : 'bg-gradient-to-br from-blue-400 to-blue-600 text-white'
                    } group-hover:scale-110 transition-transform duration-200`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                {!isLast && (
                  <div className="absolute left-5 top-12 bottom-0 w-px bg-gradient-to-b from-gray-200 to-transparent dark:from-gray-700" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

