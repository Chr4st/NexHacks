import { Suspense } from 'react';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentRuns } from '@/components/dashboard/recent-runs';
import { CostChart } from '@/components/analytics/cost-chart';
import { SuccessRateChart } from '@/components/dashboard/success-rate-chart';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { Card, CardContent } from '@/components/ui/card';

function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="h-20 animate-pulse bg-gray-200 dark:bg-gray-700 rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="h-[300px] animate-pulse bg-gray-200 dark:bg-gray-700 rounded" />
      </CardContent>
    </Card>
  );
}

function ActivitySkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="absolute inset-0 -z-10 overflow-hidden blur-3xl opacity-20">
          <div className="h-32 w-64 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 absolute -top-16 -left-16" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Welcome back! Here's what's happening with your flows.
        </p>
      </div>

      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <SuccessRateChart />
        </Suspense>

        <Suspense fallback={<ChartSkeleton />}>
          <CostChart />
        </Suspense>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Suspense fallback={<ActivitySkeleton />}>
          <div className="lg:col-span-2">
            <RecentRuns />
          </div>
        </Suspense>

        <Suspense fallback={<ActivitySkeleton />}>
          <ActivityFeed />
        </Suspense>
      </div>
    </div>
  );
}

