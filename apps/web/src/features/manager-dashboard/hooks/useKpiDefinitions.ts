/**
 * useKpiDefinitions Hook
 * Fetches and caches KPI definitions
 */

import { useQuery } from '@tanstack/react-query';
import { kpiDefinitionsApi } from '@/lib/api/kpis';
import type { KpiDefinition } from '@altsui/shared';

export function useKpiDefinitions(): {
  data: KpiDefinition[] | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  const query = useQuery({
    queryKey: ['kpi-definitions'],
    queryFn: kpiDefinitionsApi.getAll,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
