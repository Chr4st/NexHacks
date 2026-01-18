'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface TrendPoint {
  date: string;
  successRate: number;
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
        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
          {payload[0].value}% success
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
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/10 to-teal-500/10 mb-4">
        <BarChart3 className="h-8 w-8 text-emerald-500" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">No data yet</h3>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-[200px]">
        Run some tests to see your success rate trend over time
      </p>
    </div>
  );
}

export function SuccessRateChart() {
  const [data, setData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrends() {
      try {
        const response = await fetch('/api/analytics');
        if (response.ok) {
          const analytics = await response.json();
          setData(analytics.trends || []);
        }
      } catch (error) {
        console.error('Failed to fetch trends:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchTrends();
  }, []);

  if (loading) {
    return <ChartSkeleton />;
  }

  const hasData = data.length > 0;
  const currentRate = hasData ? data[data.length - 1].successRate : 0;
  const previousRate = hasData && data.length > 1 ? data[data.length - 2].successRate : currentRate;
  const trend = currentRate - previousRate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="group relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white dark:border-gray-800 dark:bg-gray-900"
    >
      {/* Gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Decorative gradient orb */}
      <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Success Rate Trend</h3>
          </div>
          {hasData && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                trend >= 0
                  ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-gradient-to-r from-red-500/10 to-orange-500/10 text-red-600 dark:text-red-400'
              }`}
            >
              {trend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="text-sm font-semibold">{trend >= 0 ? '+' : ''}{trend}%</span>
            </motion.div>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Test pass rate over the last 7 days</p>
      </div>

      <div className="px-6 pb-6">
        {!hasData ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="50%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="successStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10b981"/>
                  <stop offset="100%" stopColor="#14b8a6"/>
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
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                axisLine={false}
                tickLine={false}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area
                type="monotone"
                dataKey="successRate"
                stroke="url(#successStroke)"
                strokeWidth={3}
                fill="url(#successGradient)"
                activeDot={{
                  r: 8,
                  fill: '#10b981',
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
