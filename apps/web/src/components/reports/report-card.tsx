'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Clock, FileText } from 'lucide-react';
import Link from 'next/link';

interface ReportCardProps {
  id: string;
  flowName: string;
  status: 'pass' | 'fail';
  completedAt: string;
  duration: number;
  steps: { total: number; passed: number; failed: number };
}

export function ReportCard({ id, flowName, status, completedAt, duration, steps }: ReportCardProps) {
  return (
    <Link href={`/reports/${id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>{flowName}</CardTitle>
                <CardDescription>
                  {new Date(completedAt).toLocaleString()}
                </CardDescription>
              </div>
            </div>
            {status === 'pass' ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Steps:</span>
              <span className="font-medium">
                {steps.passed}/{steps.total} passed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {(duration / 1000).toFixed(1)}s
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

