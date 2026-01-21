import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, ArrowLeft, CheckCircle2, XCircle, Globe, Tag } from 'lucide-react';
import Link from 'next/link';
import { getRepository } from '@/lib/mongodb';

interface FlowStep {
  action: string;
  target?: string;
  value?: string;
  assert?: string;
  timeout?: number;
}

interface Flow {
  name: string;
  intent: string;
  url: string;
  viewport?: { width: number; height: number };
  steps: FlowStep[];
  tags?: string[];
  critical?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

async function getFlow(userId: string, flowName: string): Promise<{ flow: Flow; stats: { successRate: number; totalRuns: number; lastRun?: Date } } | null> {
  try {
    const repository = await getRepository();

    // Decode the flow name (it may be URL encoded)
    const decodedName = decodeURIComponent(flowName);

    const flowDef = await repository.getFlowByTenant(userId, decodedName);

    if (!flowDef) {
      return null;
    }

    // Get run statistics for this flow
    const recentResults = await repository.getRecentResultsByTenant(userId, decodedName, 100);
    const successfulRuns = recentResults.filter(r => r.measurements.passed).length;
    const successRate = recentResults.length > 0
      ? (successfulRuns / recentResults.length) * 100
      : 0;

    return {
      flow: {
        name: flowDef.name,
        intent: flowDef.intent,
        url: flowDef.url,
        viewport: flowDef.viewport,
        steps: flowDef.steps,
        tags: flowDef.tags,
        critical: flowDef.critical,
        createdAt: flowDef.createdAt,
        updatedAt: flowDef.updatedAt,
      },
      stats: {
        successRate,
        totalRuns: recentResults.length,
        lastRun: recentResults[0]?.timestamp,
      }
    };
  } catch (error) {
    console.error('Error fetching flow:', error);
    return null;
  }
}

export default async function FlowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const { id } = await params;
  const result = await getFlow(userId, id);

  if (!result) {
    notFound();
  }

  const { flow, stats } = result;
  const status = stats.successRate >= 80 || stats.totalRuns === 0 ? 'passing' : 'failing';

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Link href="/flows">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">{flow.name}</h2>
            {flow.critical && (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                Critical
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-1">{flow.intent}</p>
        </div>
        <Button>
          <Play className="mr-2 h-4 w-4" />
          Run Flow
        </Button>
      </div>

      {/* Tags */}
      {flow.tags && flow.tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Tag className="h-4 w-4 text-muted-foreground" />
          {flow.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Flow Status</CardTitle>
            <CardDescription>Current status and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <div className="flex items-center gap-2">
                  {status === 'passing' ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-600">Passing</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="font-medium text-red-600">Failing</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <span className="font-medium">{Math.round(stats.successRate)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Runs</span>
                <span className="font-medium">{stats.totalRuns}</span>
              </div>
              {stats.lastRun && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Run</span>
                  <span className="font-medium">{new Date(stats.lastRun).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Flow Details</CardTitle>
            <CardDescription>Configuration and target</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">Target URL</div>
                  <a
                    href={flow.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400 break-all"
                  >
                    {flow.url}
                  </a>
                </div>
              </div>
              {flow.viewport && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Viewport</span>
                  <span className="font-medium">{flow.viewport.width} x {flow.viewport.height}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Steps</span>
                <span className="font-medium">{flow.steps.length}</span>
              </div>
              {flow.createdAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="font-medium">{new Date(flow.createdAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Flow Steps</CardTitle>
          <CardDescription>{flow.steps.length} steps in this flow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {flow.steps.map((step, index) => (
              <div
                key={index}
                className="flex items-start gap-4 rounded-lg border p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{step.action}</span>
                    {step.action === 'navigate' && (
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        Navigation
                      </span>
                    )}
                    {step.action === 'click' && (
                      <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Interaction
                      </span>
                    )}
                    {step.action === 'type' && (
                      <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        Input
                      </span>
                    )}
                    {step.action === 'wait' && (
                      <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                        Wait
                      </span>
                    )}
                    {step.action === 'screenshot' && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                        Capture
                      </span>
                    )}
                  </div>
                  {step.target && (
                    <div className="text-sm text-muted-foreground mt-1 font-mono break-all">
                      {step.target}
                    </div>
                  )}
                  {step.value && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Value: <span className="font-medium">{step.value}</span>
                    </div>
                  )}
                  {step.assert && (
                    <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Assert: {step.assert}
                    </div>
                  )}
                  {step.timeout && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Timeout: {step.timeout}ms
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
