'use client';

import useSWR from 'swr';
import { getReports, getReport, type Report } from '@/lib/api';

export function useReports() {
  const { data, error, isLoading, mutate } = useSWR<Report[]>('reports', getReports, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  return {
    reports: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useReport(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Report | null>(
    id ? `report-${id}` : null,
    () => (id ? getReport(id) : null),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    report: data,
    isLoading,
    isError: error,
    mutate,
  };
}

