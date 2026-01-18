'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp, DollarSign } from 'lucide-react';

interface CostPoint {
  date: string;
  cost: number;
  runs: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm"
      >
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{payload[0].payload.date}</p>
        <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
          ${payload[0].value.toFixed(2)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {payload[0].payload.runs} runs
        </p>
      </motion.div>
    );
  }
  return null;
};

function ChartSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-gray-100/50 to-transparent dark:via-gray-800/50" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="h-6 w-40 rounded-md bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="h-8 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="h-4 w-48 rounded-md bg-gray-200 dark:bg-gray-700 mt-2" />
      </div>
      <div className="px-6 pb-6">
        <div className="h-[280px] rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[280px] text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/10 to-red-500/10 mb-4">
        <DollarSign className="h-8 w-8 text-orange-500" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">No cost data yet</h3>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-[200px]">
        Run some AI-powered tests to see your cost trends over time
      </p>
    </div>
  );
}

export function CostChart() {
  const [data, setData] = useState<CostPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCostTrends() {
      try {
        const response = await fetch('/api/analytics');
        if (response.ok) {
          const analytics = await response.json();
          setData(analytics.costTrends || []);
        }
      } catch (error) {
        console.error('Failed to fetch cost trends:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCostTrends();
  }, []);

  if (loading) {
    return <ChartSkeleton />;
  }

  const hasData = data.length > 0;
  const totalCost = hasData ? data.reduce((sum, day) => sum + day.cost, 0) : 0;
  const avgCost = hasData ? totalCost / data.length : 0;

  // Calculate trend (compare last day to previous day)
  const currentCost = hasData ? data[data.length - 1].cost : 0;
  const previousCost = hasData && data.length > 1 ? data[data.length - 2].cost : currentCost;
  const trend = previousCost > 0 ? Math.round(((currentCost - previousCost) / previousCost) * 100) : 0;
  const isTrendingDown = trend <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="group relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white dark:border-gray-800 dark:bg-gray-900"
    >
      {/* Gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Decorative gradient orb */}
      <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 animate-pulse" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Costs Over Time</h3>
          </div>
          {hasData && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                isTrendingDown
                  ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-600 dark:text-green-400'
                  : 'bg-gradient-to-r from-red-500/10 to-orange-500/10 text-red-600 dark:text-red-400'
              }`}
            >
              {isTrendingDown ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
              <span className="text-sm font-semibold">{trend >= 0 ? '+' : ''}{trend}%</span>
            </motion.div>
          )}
        </div>
        <div className="flex items-center gap-4 mt-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">Daily AI API costs</p>
          {hasData && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800">
              <DollarSign className="h-3 w-3 text-gray-500" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Avg: ${avgCost.toFixed(2)}/day
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-6">
        {!hasData ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.4}/>
                  <stop offset="50%" stopColor="#f97316" stopOpacity={0.1}/>
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="costStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f97316"/>
                  <stop offset="100%" stopColor="#ef4444"/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700/50" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `$${value}`}
                axisLine={false}
                tickLine={false}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#f97316', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area
                type="monotone"
                dataKey="cost"
                stroke="url(#costStroke)"
                strokeWidth={3}
                fill="url(#costGradient)"
                activeDot={{
                  r: 8,
                  fill: '#f97316',
                  strokeWidth: 3,
                  stroke: '#fff',
                  className: 'drop-shadow-lg'
                }}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
