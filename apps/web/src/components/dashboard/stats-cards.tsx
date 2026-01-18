'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, CheckCircle2, DollarSign, GitBranch, BarChart3 } from 'lucide-react';
import { staggerContainer, fadeInUp } from '@/lib/animations';

interface Analytics {
  totalRuns: number;
  successRate: number;
  totalCost: number;
  flowCount: number;
}

function AnimatedNumber({ value }: { value: string | number }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
    >
      {value}
    </motion.span>
  );
}

function MiniSparkline({ trending }: { trending: 'up' | 'down' | 'neutral' }) {
  const points = trending === 'up'
    ? 'M0,20 L5,18 L10,15 L15,17 L20,12 L25,10 L30,8 L35,5'
    : trending === 'down'
    ? 'M0,5 L5,8 L10,6 L15,10 L20,12 L25,15 L30,18 L35,20'
    : 'M0,12 L5,14 L10,11 L15,13 L20,12 L25,14 L30,11 L35,12';

  const color = trending === 'up' ? '#22c55e' : trending === 'down' ? '#22c55e' : '#6b7280';

  return (
    <svg width="40" height="24" viewBox="0 0 40 24" className="opacity-60">
      <motion.path
        d={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </svg>
  );
}

function StatsCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
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
  );
}

export function StatsCards() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch('/api/analytics');
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Flows',
      value: analytics?.flowCount ?? 0,
      change: analytics?.flowCount ? `${analytics.flowCount} active` : 'No flows',
      changeLabel: '',
      trending: 'neutral' as const,
      icon: GitBranch,
      gradient: 'from-blue-500 via-blue-600 to-cyan-500',
      bgGradient: 'from-blue-500/10 to-cyan-500/10',
      shadowColor: 'shadow-blue-500/25',
    },
    {
      title: 'Success Rate',
      value: `${analytics?.successRate ?? 0}%`,
      change: (analytics?.successRate ?? 0) >= 80 ? 'Healthy' : 'Needs attention',
      changeLabel: '',
      trending: (analytics?.successRate ?? 0) >= 80 ? 'up' as const : 'down' as const,
      icon: CheckCircle2,
      gradient: 'from-emerald-500 via-green-500 to-teal-500',
      bgGradient: 'from-emerald-500/10 to-teal-500/10',
      shadowColor: 'shadow-emerald-500/25',
    },
    {
      title: 'Total Runs',
      value: analytics?.totalRuns ?? 0,
      change: 'All time',
      changeLabel: '',
      trending: 'neutral' as const,
      icon: BarChart3,
      gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
      bgGradient: 'from-violet-500/10 to-fuchsia-500/10',
      shadowColor: 'shadow-violet-500/25',
    },
    {
      title: 'AI Costs',
      value: `$${(analytics?.totalCost ?? 0).toFixed(2)}`,
      change: 'This month',
      changeLabel: '',
      trending: 'down' as const,
      icon: DollarSign,
      gradient: 'from-amber-500 via-orange-500 to-red-500',
      bgGradient: 'from-amber-500/10 to-red-500/10',
      shadowColor: 'shadow-amber-500/25',
    },
  ];

  return (
    <motion.div
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {statCards.map((stat) => {
        const Icon = stat.icon;
        const TrendIcon = stat.trending === 'up' ? TrendingUp : stat.trending === 'down' ? TrendingDown : null;
        const trendColor = stat.trending === 'down' ? 'text-green-500' : stat.trending === 'up' ? 'text-green-500' : 'text-gray-500';

        return (
          <motion.div
            key={stat.title}
            variants={fadeInUp}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group"
          >
            <div className={`relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:${stat.shadowColor} dark:border-gray-800 dark:bg-gray-900`}>
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />

              {/* Decorative gradient orb */}
              <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${stat.gradient} opacity-10 blur-2xl transition-all duration-300 group-hover:opacity-20 group-hover:scale-150`} />

              <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {stat.title}
                  </span>
                  <motion.div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg ${stat.shadowColor}`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </motion.div>
                </div>

                {/* Value */}
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      <AnimatedNumber value={stat.value} />
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      {TrendIcon && (
                        <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                      )}
                      <span className={`text-sm font-medium ${trendColor}`}>
                        {stat.change}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {stat.changeLabel}
                      </span>
                    </div>
                  </div>
                  <MiniSparkline trending={stat.trending} />
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
