import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, CheckCircle2, DollarSign, GitBranch, BarChart3 } from 'lucide-react';

async function getStats() {
  // TODO: Replace with real API call
  return {
    totalFlows: 12,
    successRate: 87,
    testsThisMonth: 145,
    totalSteps: 580,
    costThisMonth: 12.45,
  };
}

export async function StatsCards() {
  const stats = await getStats();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Flows</CardTitle>
          <GitBranch className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalFlows}</div>
          <p className="text-xs text-muted-foreground">
            <TrendingUp className="mr-1 inline h-3 w-3 text-green-600" />
            +3 from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.successRate}%</div>
          <p className="text-xs text-muted-foreground">
            <TrendingUp className="mr-1 inline h-3 w-3 text-green-600" />
            +2.5% from last week
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tests This Month</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.testsThisMonth}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalSteps} total steps
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">AI Costs</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.costThisMonth.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            <TrendingDown className="mr-1 inline h-3 w-3 text-green-600" />
            -15% vs last month
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

