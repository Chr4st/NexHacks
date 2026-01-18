'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  GitBranch,
  FileText,
  BarChart3,
  Settings,
  Key,
  Plus,
  Play,
  Search,
  Moon,
  Sun,
  Zap,
  Plug,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, shortcut: 'G D' },
  { name: 'Flows', href: '/flows', icon: GitBranch, shortcut: 'G F' },
  { name: 'Reports', href: '/reports', icon: FileText, shortcut: 'G R' },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, shortcut: 'G A' },
  { name: 'API Keys', href: '/api-keys', icon: Key, shortcut: 'G K' },
  { name: 'Settings', href: '/settings', icon: Settings, shortcut: 'G S' },
  { name: 'Integrations', href: '/settings/integrations', icon: Plug, shortcut: 'G I' },
];

const actions = [
  { name: 'Create New Flow', action: 'new-flow', icon: Plus, shortcut: 'C' },
  { name: 'Run All Flows', action: 'run-all', icon: Play, shortcut: 'R' },
  { name: 'Quick Test', action: 'quick-test', icon: Zap, shortcut: 'T' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Command Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.25, 0.4, 0.25, 1] }}
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-xl -translate-x-1/2"
          >
            <Command
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
              loop
            >
              <div className="flex items-center border-b border-gray-200 px-4 dark:border-gray-700">
                <Search className="mr-3 h-5 w-5 text-gray-400" />
                <Command.Input
                  placeholder="Type a command or search..."
                  className="flex h-14 w-full bg-transparent text-base text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white"
                />
                <kbd className="ml-2 hidden rounded-md border border-gray-200 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 sm:inline-block">
                  ESC
                </kbd>
              </div>

              <Command.List className="max-h-[400px] overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-sm text-gray-500">
                  No results found.
                </Command.Empty>

                {/* Navigation */}
                <Command.Group
                  heading="Navigation"
                  className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400"
                >
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Command.Item
                        key={item.href}
                        value={item.name}
                        onSelect={() => runCommand(() => router.push(item.href))}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none aria-selected:bg-indigo-50 aria-selected:text-indigo-600 dark:text-gray-300 dark:aria-selected:bg-indigo-900/30 dark:aria-selected:text-indigo-400"
                      >
                        <Icon className="h-4 w-4" />
                        <span className="flex-1">{item.name}</span>
                        <kbd className="ml-auto hidden rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:border-gray-700 dark:bg-gray-800 sm:inline-block">
                          {item.shortcut}
                        </kbd>
                      </Command.Item>
                    );
                  })}
                </Command.Group>

                {/* Actions */}
                <Command.Group
                  heading="Actions"
                  className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400"
                >
                  {actions.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Command.Item
                        key={item.action}
                        value={item.name}
                        onSelect={() => runCommand(() => {
                          if (item.action === 'new-flow') {
                            router.push('/flows/new');
                          }
                          // TODO: Implement other actions
                        })}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none aria-selected:bg-indigo-50 aria-selected:text-indigo-600 dark:text-gray-300 dark:aria-selected:bg-indigo-900/30 dark:aria-selected:text-indigo-400"
                      >
                        <Icon className="h-4 w-4" />
                        <span className="flex-1">{item.name}</span>
                        <kbd className="ml-auto hidden rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:border-gray-700 dark:bg-gray-800 sm:inline-block">
                          {item.shortcut}
                        </kbd>
                      </Command.Item>
                    );
                  })}
                </Command.Group>

                {/* Quick Flows (mock) */}
                <Command.Group
                  heading="Recent Flows"
                  className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400"
                >
                  {['checkout-flow', 'login-flow', 'signup-flow'].map((flow) => (
                    <Command.Item
                      key={flow}
                      value={`run ${flow}`}
                      onSelect={() => runCommand(() => router.push(`/flows/${flow}`))}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none aria-selected:bg-indigo-50 aria-selected:text-indigo-600 dark:text-gray-300 dark:aria-selected:bg-indigo-900/30 dark:aria-selected:text-indigo-400"
                    >
                      <GitBranch className="h-4 w-4" />
                      <span className="flex-1">{flow}</span>
                      <span className="text-xs text-gray-400">Flow</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>

              <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2 dark:border-gray-700">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-gray-200 bg-gray-50 px-1 dark:border-gray-700 dark:bg-gray-800">↑↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-gray-200 bg-gray-50 px-1 dark:border-gray-700 dark:bg-gray-800">↵</kbd>
                    Select
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  Powered by FlowGuard
                </span>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Export a button to trigger the command palette
export function CommandPaletteButton() {
  return (
    <button
      onClick={() => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          metaKey: true,
          bubbles: true,
        });
        document.dispatchEvent(event);
      }}
      className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
    >
      <Search className="h-4 w-4" />
      <span className="hidden sm:inline">Search...</span>
      <kbd className="ml-2 rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-900">
        ⌘K
      </kbd>
    </button>
  );
}
