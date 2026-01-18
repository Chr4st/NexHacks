'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { CheckCircle2, XCircle, Clock, Play, MoreVertical, GitBranch, TrendingUp, Zap } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Flow {
  id: string;
  name: string;
  intent: string;
  status: 'passing' | 'failing';
  lastRun: string;
  successRate: number;
  totalRuns: number;
}

async function fetchFlows(): Promise<Flow[]> {
  const response = await fetch('/api/flows');
  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  return data.flows || [];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
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

function FlowSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-gray-100/50 to-transparent dark:via-gray-800/50" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div>
            <div className="h-5 w-40 rounded-md bg-gray-200 dark:bg-gray-700" />
            <div className="mt-2 h-4 w-64 rounded-md bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-10 w-20 rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="h-10 w-24 rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    </div>
  );
}

export function FlowsTable() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlows().then((data) => {
      setFlows(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <FlowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (flows.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white dark:border-gray-800 dark:bg-gray-900"
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5" />

        <div className="relative">
          <EmptyState
            icon={<GitBranch className="h-10 w-10" />}
            title="No flows yet"
            description="Create your first flow to start testing your user journeys. Flows help you validate that users can accomplish their goals."
            actionLabel="Create Your First Flow"
            actionHref="/flows/new"
          />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white dark:border-gray-800 dark:bg-gray-900"
    >
      {/* Gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Header */}
      <div className="relative p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Flows</h3>
            <span className="ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              {flows.length}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span>{Math.round(flows.filter(f => f.status === 'passing').length / flows.length * 100)}% passing</span>
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and monitor your test flows</p>
      </div>

      {/* Flows List */}
      <div className="relative p-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {flows.map((flow) => (
            <motion.div
              key={flow.id}
              variants={itemVariants}
              className="group/item"
            >
              <div className="flex items-center justify-between rounded-xl border-2 border-gray-100 dark:border-gray-800 p-4 hover:border-indigo-200 dark:hover:border-indigo-900 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 dark:hover:from-indigo-950/20 dark:hover:to-purple-950/20 transition-all duration-200">
                <div className="flex items-center gap-4 flex-1">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className={`rounded-full p-2.5 ${
                      flow.status === 'passing'
                        ? 'bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-500/25'
                        : 'bg-gradient-to-br from-red-400 to-red-600 shadow-lg shadow-red-500/25'
                    }`}
                  >
                    {flow.status === 'passing' ? (
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    ) : (
                      <XCircle className="h-5 w-5 text-white" />
                    )}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/flows/${flow.id}`}
                      className="font-semibold text-gray-900 dark:text-white group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors"
                    >
                      {flow.name}
                    </Link>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {flow.intent}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Success Rate */}
                  <div className="text-right">
                    <div className={`text-sm font-bold ${flow.successRate >= 80 ? 'text-green-600 dark:text-green-400' : flow.successRate >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                      {flow.successRate}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{flow.totalRuns} runs</div>
                  </div>

                  {/* Last Run */}
                  <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{new Date(flow.lastRun).toLocaleDateString()}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-500/20"
                      >
                        <Zap className="mr-1.5 h-3.5 w-3.5" />
                        Run
                      </Button>
                    </motion.div>
                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
