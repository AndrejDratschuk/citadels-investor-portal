import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { EffectivePermissions, PermissionType } from '@altsui/shared';
import { hasPermissionInState } from '@altsui/shared';

/**
 * Fetch investor permissions from API
 */
async function fetchInvestorPermissions(): Promise<EffectivePermissions | null> {
  return api.get<EffectivePermissions | null>('/stakeholders/my-permissions');
}

/**
 * Hook to fetch and use investor permissions
 */
export function useInvestorPermissions() {
  return useQuery({
    queryKey: ['investorPermissions'],
    queryFn: fetchInvestorPermissions,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Check if a specific permission is granted
 */
export function hasPermission(
  permissions: EffectivePermissions | null | undefined,
  path: string,
  type: PermissionType = 'view'
): boolean {
  if (!permissions) return false;
  return hasPermissionInState(permissions.permissions, path, type);
}

/** Check if investor can view detailed financial KPIs */
export function canViewDetailedKpis(
  permissions: EffectivePermissions | null | undefined
): boolean {
  if (!permissions) return false;
  return (
    hasPermission(permissions, 'deals.financials') ||
    hasPermission(permissions, 'deals.financials.debt_service') ||
    hasPermission(permissions, 'deals.financials.performance')
  );
}

/** Check if investor can view outliers dashboard */
export function canViewOutliers(
  permissions: EffectivePermissions | null | undefined
): boolean {
  return hasPermission(permissions, 'deals.outliers');
}

/** Check if investor can view pipeline */
export function canViewPipeline(
  permissions: EffectivePermissions | null | undefined
): boolean {
  return hasPermission(permissions, 'pipeline');
}

/** Check if investor can view other investors */
export function canViewOtherInvestors(
  permissions: EffectivePermissions | null | undefined
): boolean {
  return hasPermission(permissions, 'investors');
}

/** Check if investor can view fund documents */
export function canViewFundDocuments(
  permissions: EffectivePermissions | null | undefined
): boolean {
  return hasPermission(permissions, 'documents.fund_documents');
}

/** Check if investor can view deal documents */
export function canViewDealDocuments(
  permissions: EffectivePermissions | null | undefined
): boolean {
  return hasPermission(permissions, 'documents.deal_documents');
}

/** Check if investor can view all capital calls */
export function canViewAllCapitalCalls(
  permissions: EffectivePermissions | null | undefined
): boolean {
  return hasPermission(permissions, 'capital_calls.view_all');
}

/** Check if investor can view reports */
export function canViewReports(
  permissions: EffectivePermissions | null | undefined
): boolean {
  return hasPermission(permissions, 'reports');
}

/** Determine KPI display level based on permissions */
export function getKpiDisplayLevel(
  permissions: EffectivePermissions | null | undefined
): 'summary' | 'detailed' | 'full' {
  if (!permissions) return 'summary';
  
  const hasDebtService = hasPermission(permissions, 'deals.financials.debt_service');
  const hasPerformance = hasPermission(permissions, 'deals.financials.performance');
  const hasRentRevenue = hasPermission(permissions, 'deals.financials.rent_revenue');
  const hasOccupancy = hasPermission(permissions, 'deals.financials.occupancy');
  
  if (hasDebtService && hasPerformance && hasRentRevenue && hasOccupancy) {
    return 'full';
  }
  
  if (hasPerformance || hasRentRevenue) {
    return 'detailed';
  }
  
  return 'summary';
}
