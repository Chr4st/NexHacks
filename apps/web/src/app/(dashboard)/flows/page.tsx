import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Play, CheckCircle2, XCircle, Clock } from 'lucide-react';

async function getFlows() {
  // TODO: Replace with real API call
  return [
    {
      id: '1',
      name: 'Checkout Flow',
      intent: 'User can successfully complete checkout',
      status: 'passing',
      lastRun: new Date(Date.now() - 3600000).toISOString(),
      successRate: 95,
      totalRuns: 20,
    },
    {
      id: '2',
      name: 'Login Flow',
      intent: 'User can log in successfully',
      status: 'failing',
      lastRun: new Date(Date.now() - 7200000).toISOString(),
      successRate: 70,
      totalRuns: 15,
    },
    {
      id: '3',
      name: 'Signup Flow',
      intent: 'User can create a new account',
      status: 'passing',
      lastRun: new Date(Date.now() - 1800000).toISOString(),
      successRate: 88,
      totalRuns: 12,
    },
  ];
}

export default async function FlowsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  const flows = await getFlows();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Flows</h2>
        <Link href="/flows/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Flow
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {flows.map((flow) => (
          <Card key={flow.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{flow.name}</CardTitle>
                {flow.status === 'passing' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <CardDescription>{flow.intent}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Success Rate</span>
                    <span className="font-medium">{flow.successRate}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full ${
                        flow.successRate >= 90
                          ? 'bg-green-600'
                          : flow.successRate >= 70
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                      }`}
                      style={{ width: `${flow.successRate}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Runs</span>
                  <span className="font-medium">{flow.totalRuns}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {new Date(flow.lastRun).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link href={`/flows/${flow.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Button variant="default" className="flex-1">
                    <Play className="mr-2 h-4 w-4" />
                    Run
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

