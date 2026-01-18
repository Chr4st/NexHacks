'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface CruxMetrics {
  lcp: { p75: number; rating: 'good' | 'needs-improvement' | 'poor' };
  cls: { p75: number; rating: 'good' | 'needs-improvement' | 'poor' };
  inp: { p75: number; rating: 'good' | 'needs-improvement' | 'poor' };
}

interface CruxMetricsCardProps {
  metrics?: CruxMetrics;
}

function getRatingIcon(rating: string) {
  switch (rating) {
    case 'good':
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case 'needs-improvement':
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    case 'poor':
      return <XCircle className="h-5 w-5 text-red-600" />;
    default:
      return null;
  }
}

function getRatingColor(rating: string) {
  switch (rating) {
    case 'good':
      return 'text-green-600';
    case 'needs-improvement':
      return 'text-yellow-600';
    case 'poor':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

export function CruxMetricsCard({ metrics }: CruxMetricsCardProps) {
  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chrome UX Report</CardTitle>
          <CardDescription>Real user metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No CrUX data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chrome UX Report</CardTitle>
        <CardDescription>Real user metrics from Chrome users</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">LCP (Largest Contentful Paint)</div>
              <div className="text-sm text-muted-foreground">{metrics.lcp.p75}ms</div>
            </div>
            <div className={`flex items-center gap-2 ${getRatingColor(metrics.lcp.rating)}`}>
              {getRatingIcon(metrics.lcp.rating)}
              <span className="capitalize">{metrics.lcp.rating.replace('-', ' ')}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">CLS (Cumulative Layout Shift)</div>
              <div className="text-sm text-muted-foreground">{metrics.cls.p75}</div>
            </div>
            <div className={`flex items-center gap-2 ${getRatingColor(metrics.cls.rating)}`}>
              {getRatingIcon(metrics.cls.rating)}
              <span className="capitalize">{metrics.cls.rating.replace('-', ' ')}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">INP (Interaction to Next Paint)</div>
              <div className="text-sm text-muted-foreground">{metrics.inp.p75}ms</div>
            </div>
            <div className={`flex items-center gap-2 ${getRatingColor(metrics.inp.rating)}`}>
              {getRatingIcon(metrics.inp.rating)}
              <span className="capitalize">{metrics.inp.rating.replace('-', ' ')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

