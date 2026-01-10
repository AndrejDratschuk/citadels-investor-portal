/**
 * Permission Row Formatter
 * Pure function for DB row to DTO transformation
 */

import type { StakeholderType, KpiDetailLevel, StakeholderTypePermission } from '@altsui/shared';

/** Database row shape for stakeholder_type_permissions table */
export interface PermissionDbRow {
  id: string;
  fund_id: string;
  stakeholder_type: string;
  can_view_detailed_financials: boolean;
  can_view_outliers: boolean;
  can_view_other_investors: boolean;
  can_view_pipeline: boolean;
  can_view_fund_documents: boolean;
  can_view_deal_documents: boolean;
  can_view_other_investor_docs: boolean;
  can_view_all_communications: boolean;
  kpi_detail_level: string;
  created_at: string;
  updated_at: string;
}

/**
 * Transform a database row to a StakeholderTypePermission DTO
 * Pure function - no side effects
 */
export function formatPermissionRow(row: PermissionDbRow): StakeholderTypePermission {
  return {
    id: row.id,
    fundId: row.fund_id,
    stakeholderType: row.stakeholder_type as StakeholderType,
    canViewDetailedFinancials: row.can_view_detailed_financials,
    canViewOutliers: row.can_view_outliers,
    canViewOtherInvestors: row.can_view_other_investors,
    canViewPipeline: row.can_view_pipeline,
    canViewFundDocuments: row.can_view_fund_documents,
    canViewDealDocuments: row.can_view_deal_documents,
    canViewOtherInvestorDocs: row.can_view_other_investor_docs,
    canViewAllCommunications: row.can_view_all_communications,
    kpiDetailLevel: row.kpi_detail_level as KpiDetailLevel,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Transform multiple database rows to DTOs
 * Pure function - no side effects
 */
export function formatPermissionRows(rows: PermissionDbRow[]): StakeholderTypePermission[] {
  return rows.map(formatPermissionRow);
}

