import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { InvestorPermissions } from '@altsui/shared';

/**
 * Fetch investor permissions from API.
 * Note: api.get<T> already unwraps the { success, data } response and returns data directly.
 */
async function fetchInvestorPermissions(): Promise<InvestorPermissions> {
  return api.get<InvestorPermissions>('/investors/me/permissions');
}

export function useInvestorPermissions() {
  return useQuery({
    queryKey: ['investorPermissions'],
    queryFn: fetchInvestorPermissions,
    staleTime: 5 * 60 * 1000, // 5 minutes - permissions don't change often
    retry: 1,
  });
}

/** Helper to check if investor can view detailed financial KPIs */
export function canViewDetailedKpis(permissions: InvestorPermissions | undefined): boolean {
  if (!permissions) return false;
  return permissions.canViewDetailedFinancials || permissions.kpiDetailLevel !== 'summary';
}

/** Helper to check if investor can view outliers dashboard */
export function canViewOutliers(permissions: InvestorPermissions | undefined): boolean {
  if (!permissions) return false;
  return permissions.canViewOutliers;
}

/** Helper to determine KPI display level */
export function getKpiDisplayLevel(permissions: InvestorPermissions | undefined): 'summary' | 'detailed' | 'full' {
  if (!permissions) return 'summary';
  return permissions.kpiDetailLevel;
}

