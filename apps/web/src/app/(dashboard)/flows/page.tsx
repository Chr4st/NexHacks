import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { FlowsTable } from '@/components/flows/flows-table';
import { SearchFlows } from '@/components/flows/search-flows';

export default function FlowsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Flows
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage and run your UX test flows
          </p>
        </div>

        <Button asChild>
          <Link href="/flows/new">
            <Plus className="mr-2 h-4 w-4" />
            New Flow
          </Link>
        </Button>
      </div>

      <SearchFlows />

      <FlowsTable />
    </div>
  );
}

