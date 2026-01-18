'use client';

import { UserButton } from '@clerk/nextjs';
import { Bell, Search, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export function Navbar() {
  const openCommandPalette = () => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  return (
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex h-16 items-center justify-between border-b border-gray-200/60 bg-white/80 px-4 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/80 sm:px-6 lg:px-8"
    >
      <div className="flex flex-1 items-center gap-4">
        {/* Command Palette Trigger */}
        <button
          onClick={openCommandPalette}
          className="group flex w-full max-w-md items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-500 transition-all hover:border-gray-300 hover:bg-gray-100/50 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-800"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search flows, reports...</span>
          <div className="flex items-center gap-1">
            <kbd className="flex h-5 items-center rounded border border-gray-300 bg-white px-1.5 text-[10px] font-medium text-gray-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-400">
              <Command className="mr-0.5 h-3 w-3" />K
            </kbd>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="absolute right-2 top-2 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
            </span>
          </Button>
        </motion.div>

        {/* Divider */}
        <div className="mx-2 h-6 w-px bg-gray-200 dark:bg-gray-700" />

        {/* User Button */}
        <div className="flex items-center gap-3">
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-9 h-9 ring-2 ring-white dark:ring-gray-800 shadow-lg',
              },
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
