'use client';

import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentRuns } from '@/components/dashboard/recent-runs';
import { CostChart } from '@/components/analytics/cost-chart';
import { SuccessRateChart } from '@/components/dashboard/success-rate-chart';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { staggerContainer, fadeInUp } from '@/lib/animations';

function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-gray-100/50 to-transparent dark:via-gray-800/50" />
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 rounded-md bg-gray-200 dark:bg-gray-700" />
            <div className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="mt-4">
            <div className="h-8 w-16 rounded-md bg-gray-200 dark:bg-gray-700" />
            <div className="mt-2 flex items-center gap-2">
              <div className="h-4 w-12 rounded-md bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-20 rounded-md bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-gray-100/50 to-transparent dark:via-gray-800/50" />
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="h-6 w-32 rounded-md bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="mt-1 h-4 w-48 rounded-md bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="px-6 pb-6">
        <div className="h-[300px] rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900" />
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-gray-100/50 to-transparent dark:via-gray-800/50" />
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="h-6 w-28 rounded-md bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="mt-1 h-4 w-40 rounded-md bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="px-6 pb-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-4">
            <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1">
              <div className="h-4 w-full rounded-md bg-gray-200 dark:bg-gray-700" />
              <div className="mt-2 h-3 w-24 rounded-md bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-gray-100/50 to-transparent dark:via-gray-800/50" />
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="h-6 w-32 rounded-md bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="mt-1 h-4 w-44 rounded-md bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="px-6 pb-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl border border-gray-100 p-4 dark:border-gray-800"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div>
                <div className="h-5 w-32 rounded-md bg-gray-200 dark:bg-gray-700" />
                <div className="mt-1.5 h-3 w-24 rounded-md bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-7 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-20 rounded-md bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <motion.div
      className="space-y-6"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* Animated Header */}
      <motion.div variants={fadeInUp} className="relative">
        {/* Decorative gradient orbs */}
        <div className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl" />
        <div className="absolute -top-10 right-20 h-32 w-32 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-500/10 blur-2xl" />

        <div className="relative">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent dark:from-white dark:via-gray-200 dark:to-white">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Welcome back! Here's what's happening with your flows.
          </p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={fadeInUp}>
        <Suspense fallback={<StatsCardsSkeleton />}>
          <StatsCards />
        </Suspense>
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={fadeInUp} className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <SuccessRateChart />
        </Suspense>

        <Suspense fallback={<ChartSkeleton />}>
          <CostChart />
        </Suspense>
      </motion.div>

      {/* Recent Runs & Activity */}
      <motion.div variants={fadeInUp} className="grid gap-6 lg:grid-cols-3">
        <Suspense fallback={<TableSkeleton />}>
          <div className="lg:col-span-2">
            <RecentRuns />
          </div>
        </Suspense>

        <Suspense fallback={<ActivitySkeleton />}>
          <ActivityFeed />
        </Suspense>
      </motion.div>
    </motion.div>
  );
}
