'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const costData = [
  { date: 'Jan 12', cost: 2.5 },
  { date: 'Jan 13', cost: 3.2 },
  { date: 'Jan 14', cost: 2.8 },
  { date: 'Jan 15', cost: 3.5 },
  { date: 'Jan 16', cost: 2.9 },
  { date: 'Jan 17', cost: 3.1 },
  { date: 'Jan 18', cost: 2.7 },
];

export function CostChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Costs Over Time</CardTitle>
        <CardDescription>Daily AI API costs for the last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={costData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="cost" stroke="#6366f1" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

