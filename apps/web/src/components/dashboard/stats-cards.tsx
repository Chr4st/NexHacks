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

  const statCards = [
    {
      title: 'Total Flows',
      value: stats.totalFlows,
      change: '+3 from last month',
      trending: 'up',
      icon: GitBranch,
      gradient: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate}%`,
      change: '+2.5% from last week',
      trending: 'up',
      icon: CheckCircle2,
      gradient: 'from-green-500 to-emerald-500',
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-500',
    },
    {
      title: 'Tests This Month',
      value: stats.testsThisMonth,
      change: `${stats.totalSteps} total steps`,
      trending: 'neutral',
      icon: BarChart3,
      gradient: 'from-purple-500 to-pink-500',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-500',
    },
    {
      title: 'AI Costs',
      value: `$${stats.costThisMonth.toFixed(2)}`,
      change: '-15% vs last month',
      trending: 'down',
      icon: DollarSign,
      gradient: 'from-orange-500 to-red-500',
      iconBg: 'bg-orange-500/10',
      iconColor: 'text-orange-500',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        const TrendIcon = stat.trending === 'up' ? TrendingUp : stat.trending === 'down' ? TrendingDown : null;

        return (
          <Card key={stat.title} className="overflow-hidden relative group hover:shadow-lg transition-shadow duration-200">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-200`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {stat.title}
              </CardTitle>
              <div className={`${stat.iconBg} p-2 rounded-lg`}>
                <Icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 flex items-center">
                {TrendIcon && (
                  <TrendIcon className={`mr-1 h-3 w-3 ${stat.trending === 'down' ? 'text-green-600' : 'text-green-600'}`} />
                )}
                {stat.change}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

