'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  GitBranch,
  FileText,
  BarChart3,
  Settings,
  Key,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Flows', href: '/flows', icon: GitBranch },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'API Keys', href: '/api-keys', icon: Key },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="relative hidden w-64 overflow-y-auto border-r border-gray-200/80 bg-gradient-to-b from-white to-gray-50/50 dark:border-gray-800 dark:from-gray-900 dark:to-gray-900/95 lg:block">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-200/80 px-6 dark:border-gray-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-white dark:via-indigo-400 dark:to-purple-400">
          FlowGuard
        </h1>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative block"
            >
              <motion.div
                className={cn(
                  'flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                )}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Active background indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/40 dark:to-purple-900/40"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}

                {/* Icon */}
                <div
                  className={cn(
                    'relative z-10 mr-3 flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </div>

                {/* Label */}
                <span className="relative z-10 flex-1">{item.name}</span>

                {/* Active indicator arrow */}
                {isActive && (
                  <ChevronRight className="relative z-10 h-4 w-4 text-indigo-400" />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200/80 p-4 dark:border-gray-800">
        <div className="rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-4 dark:from-indigo-500/20 dark:to-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
              AI
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">AI Analysis</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">145 tests this month</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">Usage</span>
            <span className="font-medium text-indigo-600 dark:text-indigo-400">$12.45</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"
              initial={{ width: 0 }}
              animate={{ width: '42%' }}
              transition={{ duration: 1, ease: [0.25, 0.4, 0.25, 1] }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
