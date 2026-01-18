'use client';

import useSWR from 'swr';
import { getStats, type Stats } from '@/lib/api';

export function useAnalytics() {
  const { data, error, isLoading, mutate } = useSWR<Stats>('analytics', getStats, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: 60000, // Refresh every minute
  });

  return {
    stats: data,
    isLoading,
    isError: error,
    mutate,
  };
}

