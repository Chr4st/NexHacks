'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { CheckCircle2, XCircle, Clock, Play, MoreVertical, GitBranch } from 'lucide-react';
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
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (flows.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            icon={<GitBranch className="h-10 w-10" />}
            title="No flows yet"
            description="Create your first flow to start testing your user journeys. Flows help you validate that users can accomplish their goals."
            actionLabel="Create Your First Flow"
            actionHref="/flows/new"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Flows</CardTitle>
        <CardDescription>Manage and monitor your test flows</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {flows.map((flow) => (
            <div
              key={flow.id}
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                {flow.status === 'passing' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <div className="flex-1">
                  <Link href={`/flows/${flow.id}`} className="font-medium hover:underline">
                    {flow.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">{flow.intent}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-sm">
                  <div className="font-medium">{flow.successRate}%</div>
                  <div className="text-muted-foreground">{flow.totalRuns} runs</div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {new Date(flow.lastRun).toLocaleDateString()}
                </div>
                <Button size="sm" variant="outline">
                  <Play className="mr-2 h-4 w-4" />
                  Run
                </Button>
                <Button size="sm" variant="ghost">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

