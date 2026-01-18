'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const successRateData = [
  { date: 'Jan 12', rate: 84 },
  { date: 'Jan 13', rate: 86 },
  { date: 'Jan 14', rate: 83 },
  { date: 'Jan 15', rate: 87 },
  { date: 'Jan 16', rate: 85 },
  { date: 'Jan 17', rate: 88 },
  { date: 'Jan 18', rate: 87 },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{payload[0].payload.date}</p>
        <p className="text-sm text-green-600 dark:text-green-400 font-bold">
          {payload[0].value}% success
        </p>
      </div>
    );
  }
  return null;
};

export function SuccessRateChart() {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500" />
          Success Rate Trend
        </CardTitle>
        <CardDescription>Test pass rate over the last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={successRateData}>
            <defs>
              <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="rate"
              stroke="#10b981"
              strokeWidth={3}
              fill="url(#successGradient)"
              activeDot={{ r: 6, fill: '#10b981' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
