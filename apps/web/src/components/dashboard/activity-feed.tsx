'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, FileText, XCircle, CheckCircle2, Activity } from 'lucide-react';
import Link from 'next/link';

interface Report {
  id: string;
  flowName: string;
  status: 'pass' | 'fail';
  completedAt: string;
  duration: number;
  steps: {
    total: number;
    passed: number;
    failed: number;
  };
}

interface ActivityItem {
  type: string;
  message: string;
  timestamp: string;
  icon: typeof CheckCircle2;
  status: 'success' | 'error' | 'info';
  link?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.4, 0.25, 1],
    },
  },
};

const statusColors = {
  success: 'from-green-400 to-emerald-600',
  error: 'from-red-400 to-red-600',
  info: 'from-blue-400 to-blue-600',
};

const statusShadows = {
  success: 'shadow-green-500/30',
  error: 'shadow-red-500/30',
  info: 'shadow-blue-500/30',
};

function ActivitySkeleton() {
  return (
    <div className="flex items-start gap-4">
      <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
      <div className="flex-1 pt-1">
        <div className="h-4 w-full rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="mt-2 h-3 w-24 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-500/10 mb-3">
        <Activity className="h-6 w-6 text-blue-500" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">No activity yet</h3>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Activity will appear as you run tests
      </p>
    </div>
  );
}

function transformReportsToActivities(reports: Report[]): ActivityItem[] {
  return reports.slice(0, 5).map((report) => ({
    type: 'flow_run',
    message: report.status === 'pass'
      ? `${report.flowName} completed successfully`
      : `${report.flowName} failed - ${report.steps.failed} step${report.steps.failed !== 1 ? 's' : ''} failed`,
    timestamp: report.completedAt,
    icon: report.status === 'pass' ? CheckCircle2 : XCircle,
    status: report.status === 'pass' ? 'success' : 'error',
    link: `/reports/${report.id}`,
  }));
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const response = await fetch('/api/reports');
        if (response.ok) {
          const data = await response.json();
          const activityItems = transformReportsToActivities(data.reports || []);
          setActivities(activityItems);
        }
      } catch (error) {
        console.error('Failed to fetch activity:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchActivity();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="group relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white dark:border-gray-800 dark:bg-gray-900"
    >
      {/* Gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Header */}
      <div className="relative p-6 pb-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Feed</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Recent activity across your flows</p>
      </div>

      {/* Activity List */}
      <div className="relative px-6 pb-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <ActivitySkeleton key={i} />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {activities.map((activity, index) => {
              const Icon = activity.icon;
              const isLast = index === activities.length - 1;
              const statusColor = statusColors[activity.status];
              const statusShadow = statusShadows[activity.status];

              const content = (
                <div className="flex items-start gap-4">
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: 10 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className={`mt-0.5 rounded-full p-2.5 bg-gradient-to-br ${statusColor} shadow-lg ${statusShadow} ring-4 ring-white dark:ring-gray-900`}
                  >
                    <Icon className="h-4 w-4 text-white" />
                  </motion.div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              );

              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="relative group/item"
                >
                  {activity.link ? (
                    <Link href={activity.link} className="block hover:opacity-80 transition-opacity">
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                  {!isLast && (
                    <div className="absolute left-5 top-12 bottom-0 w-px bg-gradient-to-b from-gray-200 to-transparent dark:from-gray-700" style={{ height: '24px' }} />
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
