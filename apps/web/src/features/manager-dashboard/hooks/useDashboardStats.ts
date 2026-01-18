/**
 * Dashboard Stats Hook
 * React Query hook for fetching dashboard statistics
 */

import { useQuery } from '@tanstack/react-query';
import { dashboardApi, FundDashboardStats, DashboardStatsOptions } from '@/lib/api/dashboard';

export function useDashboardStats(options?: DashboardStatsOptions) {
  return useQuery<FundDashboardStats, Error>({
    queryKey: ['dashboard', 'stats', options],
    queryFn: () => dashboardApi.getStats(options),
    staleTime: 30_000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}









