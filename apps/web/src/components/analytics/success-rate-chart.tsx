'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const trendData = [
  { date: 'Jan 12', successRate: 85 },
  { date: 'Jan 13', successRate: 87 },
  { date: 'Jan 14', successRate: 88 },
  { date: 'Jan 15', successRate: 86 },
  { date: 'Jan 16', successRate: 89 },
  { date: 'Jan 17', successRate: 87 },
  { date: 'Jan 18', successRate: 90 },
];

export function SuccessRateChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Success Rate Trend</CardTitle>
        <CardDescription>Last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="successRate" stroke="#10b981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

