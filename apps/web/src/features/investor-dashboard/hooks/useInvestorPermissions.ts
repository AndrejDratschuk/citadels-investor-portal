import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { InvestorPermissions } from '@altsui/shared';

interface PermissionsResponse {
  success: boolean;
  data: InvestorPermissions;
}

async function fetchInvestorPermissions(): Promise<InvestorPermissions> {
  const response = await apiClient.get<PermissionsResponse>('/investors/me/permissions');
  if (!response.success || !response.data) {
    throw new Error('Failed to fetch permissions');
  }
  return response.data;
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

