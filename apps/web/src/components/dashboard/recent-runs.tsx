'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, ArrowRight, GitBranch } from 'lucide-react';
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.4, 0.25, 1],
    },
  },
};

function RunSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-xl border-2 border-gray-100 dark:border-gray-800 p-4">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div>
          <div className="h-5 w-32 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="mt-1.5 h-4 w-24 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="h-7 w-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-4 w-20 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 mb-4">
        <GitBranch className="h-8 w-8 text-purple-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No test runs yet</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        Run your first flow to see results here. Test runs show pass/fail status and execution details.
      </p>
      <Link
        href="/flows"
        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
      >
        Go to Flows
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export function RecentRuns() {
  const [runs, setRuns] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        const response = await fetch('/api/reports');
        if (response.ok) {
          const data = await response.json();
          setRuns(data.reports?.slice(0, 5) || []);
        }
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="group relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white dark:border-gray-800 dark:bg-gray-900"
    >
      {/* Gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Header */}
      <div className="relative p-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Test Runs</h3>
          </div>
          <Link
            href="/reports"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Latest test execution results</p>
      </div>

      {/* Runs List */}
      <div className="relative px-6 pb-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <RunSkeleton key={i} />
            ))}
          </div>
        ) : runs.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {runs.map((run) => (
              <motion.div key={run.id} variants={itemVariants}>
                <Link
                  href={`/reports/${run.id}`}
                  className="flex items-center justify-between rounded-xl border-2 border-gray-100 dark:border-gray-800 p-4 hover:border-indigo-200 dark:hover:border-indigo-900 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 dark:hover:from-indigo-950/20 dark:hover:to-purple-950/20 transition-all duration-200 group/item"
                >
                  <div className="flex items-center gap-4">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      className={`rounded-full p-2.5 ${
                        run.status === 'pass'
                          ? 'bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-500/25'
                          : 'bg-gradient-to-br from-red-400 to-red-600 shadow-lg shadow-red-500/25'
                      }`}
                    >
                      {run.status === 'pass' ? (
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      ) : (
                        <XCircle className="h-5 w-5 text-white" />
                      )}
                    </motion.div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors">
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
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
