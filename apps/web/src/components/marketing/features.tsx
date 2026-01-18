'use client';

import { Sparkles, Zap, Shield, BarChart3, GitBranch, FileText } from 'lucide-react';

const features = [
  {
    name: 'AI-Powered Analysis',
    description: 'Claude Vision AI analyzes screenshots to understand context and catch UX issues that traditional tests miss.',
    icon: Sparkles,
    color: 'text-blue-600',
  },
  {
    name: 'Real User Metrics',
    description: 'Integrate Chrome UX Report and Wood Wide AI for statistical analysis of UX improvements.',
    icon: Zap,
    color: 'text-purple-600',
  },
  {
    name: 'Production Ready',
    description: 'Beautiful HTML reports, CI/CD integration, and cloud-native storage for all your test artifacts.',
    icon: Shield,
    color: 'text-pink-600',
  },
  {
    name: 'Analytics Dashboard',
    description: 'Track success rates, costs, and trends over time with beautiful visualizations.',
    icon: BarChart3,
    color: 'text-indigo-600',
  },
  {
    name: 'Flow Management',
    description: 'Create, edit, and run test flows with an intuitive interface. Version control and collaboration built-in.',
    icon: GitBranch,
    color: 'text-green-600',
  },
  {
    name: 'Detailed Reports',
    description: 'Comprehensive HTML reports with screenshots, analysis, and recommendations for every test run.',
    icon: FileText,
    color: 'text-orange-600',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 sm:py-32 bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Everything you need to test UX
          </h2>
          <p className="mt-2 text-lg leading-8 text-gray-600 dark:text-gray-400">
            Powered by Claude Vision AI and real user metrics
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.name}
                className="flex flex-col gap-4 rounded-xl bg-white dark:bg-gray-800 p-8 shadow-sm ring-1 ring-gray-900/10 dark:ring-gray-700"
              >
                <Icon className={`h-8 w-8 ${feature.color}`} />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{feature.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

