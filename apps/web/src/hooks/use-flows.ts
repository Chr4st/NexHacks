'use client';

import useSWR from 'swr';
import { getFlows, getFlow, type Flow } from '@/lib/api';

export function useFlows() {
  const { data, error, isLoading, mutate } = useSWR<Flow[]>('flows', getFlows, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  return {
    flows: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useFlow(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Flow | null>(
    id ? `flow-${id}` : null,
    () => (id ? getFlow(id) : null),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    flow: data,
    isLoading,
    isError: error,
    mutate,
  };
}

