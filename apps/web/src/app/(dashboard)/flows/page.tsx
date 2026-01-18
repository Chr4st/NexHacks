'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { FlowsTable } from '@/components/flows/flows-table';
import { SearchFlows } from '@/components/flows/search-flows';
import { staggerContainer, fadeInUp } from '@/lib/animations';

export default function FlowsPage() {
  return (
    <motion.div
      className="space-y-6"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="relative">
        {/* Decorative gradient orbs */}
        <div className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl" />
        <div className="absolute -top-10 right-40 h-32 w-32 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-500/10 blur-2xl" />

        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent dark:from-white dark:via-gray-200 dark:to-white">
              Flows
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Manage and run your UX test flows
            </p>
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              asChild
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25 border-0"
            >
              <Link href="/flows/new">
                <Plus className="mr-2 h-4 w-4" />
                New Flow
              </Link>
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeInUp}>
        <SearchFlows />
      </motion.div>

      {/* Flows Table */}
      <motion.div variants={fadeInUp}>
        <FlowsTable />
      </motion.div>
    </motion.div>
  );
}
