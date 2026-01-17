/**
 * Deal KPI Hooks
 * React Query hooks for fetching deal-specific KPI data
 */

import { useQuery } from '@tanstack/react-query';
import { dealKpisApi } from '@/lib/api/kpis';
import type {
  KpiDataPoint,
  KpiCategory,
  KpiDataType,
  DealKpiSummary,
  DealKpiSummaryWithDimensions,
} from '@altsui/shared';

export interface UseDealKpisOptions {
  category?: KpiCategory;
  dataType?: KpiDataType;
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

/**
 * Fetch deal's KPI data with optional filters
 */
export function useDealKpiData(dealId: string | undefined, options?: UseDealKpisOptions) {
  return useQuery<KpiDataPoint[], Error>({
    queryKey: ['deal-kpi-data', dealId, options],
    queryFn: () => dealKpisApi.getData(dealId!, options),
    enabled: !!dealId && (options?.enabled !== false),
    staleTime: 30_000,
  });
}

/**
 * Fetch deal's KPI summary (featured + by category)
 */
export function useDealKpiSummary(
  dealId: string | undefined,
  dealName?: string,
  options?: { enabled?: boolean; startDate?: string; endDate?: string }
) {
  return useQuery<DealKpiSummary, Error>({
    queryKey: ['deal-kpi-summary', dealId, dealName, options?.startDate, options?.endDate],
    queryFn: () => dealKpisApi.getSummary(dealId!, dealName, options?.startDate, options?.endDate),
    enabled: !!dealId && (options?.enabled !== false),
    staleTime: 30_000,
  });
}

/**
 * Fetch deal's KPI summary with all dimensions (actual/forecast/budget) and variances.
 * Used for comparison views in the dashboard.
 */
export function useDealKpiSummaryWithDimensions(
  dealId: string | undefined,
  options?: {
    dealName?: string;
    startDate?: string;
    endDate?: string;
    enabled?: boolean;
  }
) {
  return useQuery<DealKpiSummaryWithDimensions, Error>({
    queryKey: ['deal-kpi-summary-dimensions', dealId, options?.dealName, options?.startDate, options?.endDate],
    queryFn: () => dealKpisApi.getSummaryWithDimensions(dealId!, {
      dealName: options?.dealName,
      startDate: options?.startDate,
      endDate: options?.endDate,
    }),
    enabled: !!dealId && (options?.enabled !== false),
    staleTime: 30_000,
  });
}

/**
 * Fetch deal's KPI data for a specific category
 */
export function useDealKpisByCategory(
  dealId: string | undefined,
  category: KpiCategory,
  options?: Omit<UseDealKpisOptions, 'category'>
) {
  return useQuery<KpiDataPoint[], Error>({
    queryKey: ['deal-kpi-category', dealId, category, options],
    queryFn: () => dealKpisApi.getByCategory(dealId!, category, options),
    enabled: !!dealId && (options?.enabled !== false),
    staleTime: 30_000,
  });
}

