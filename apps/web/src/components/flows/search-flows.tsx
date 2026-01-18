'use client';

import { motion } from 'framer-motion';
import { Search, Command, Filter } from 'lucide-react';
import { useState } from 'react';

export function SearchFlows() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <div
        className={`relative overflow-hidden rounded-xl border-2 transition-all duration-200 ${
          isFocused
            ? 'border-indigo-300 bg-white shadow-lg shadow-indigo-500/10 dark:border-indigo-500 dark:bg-gray-800'
            : 'border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/50'
        }`}
      >
        <div className="flex items-center">
          <Search className="ml-4 h-5 w-5 text-gray-400" />
          <input
            type="search"
            placeholder="Search flows by name or intent..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full bg-transparent py-3 pl-3 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white dark:placeholder:text-gray-500"
          />
          <div className="flex items-center gap-2 pr-3">
            <div className="hidden items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-400 dark:border-gray-600 dark:bg-gray-900 sm:flex">
              <Command className="h-3 w-3" />
              <span>K</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-gray-500"
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
