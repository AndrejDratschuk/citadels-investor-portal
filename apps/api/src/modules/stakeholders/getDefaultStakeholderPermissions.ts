/**
 * Default Stakeholder Permissions
 * Pure function - no side effects, no DB, no Date()
 */

import type { StakeholderType, KpiDetailLevel, StakeholderPermissionDefaults } from '@altsui/shared';

/** Default permissions indexed by stakeholder type */
const DEFAULT_PERMISSIONS: Record<StakeholderType, StakeholderPermissionDefaults> = {
  // Investors
  limited_partner: {
    canViewDetailedFinancials: false,
    canViewOutliers: false,
    canViewOtherInvestors: false,
    canViewPipeline: false,
    canViewFundDocuments: true,
    canViewDealDocuments: true,
    canViewOtherInvestorDocs: false,
    canViewAllCommunications: false,
    kpiDetailLevel: 'summary',
  },
  general_partner: {
    canViewDetailedFinancials: true,
    canViewOutliers: true,
    canViewOtherInvestors: false,
    canViewPipeline: false,
    canViewFundDocuments: true,
    canViewDealDocuments: true,
    canViewOtherInvestorDocs: false,
    canViewAllCommunications: false,
    kpiDetailLevel: 'detailed',
  },
  series_a: {
    canViewDetailedFinancials: false,
    canViewOutliers: false,
    canViewOtherInvestors: false,
    canViewPipeline: false,
    canViewFundDocuments: true,
    canViewDealDocuments: true,
    canViewOtherInvestorDocs: false,
    canViewAllCommunications: false,
    kpiDetailLevel: 'summary',
  },
  series_b: {
    canViewDetailedFinancials: false,
    canViewOutliers: false,
    canViewOtherInvestors: false,
    canViewPipeline: false,
    canViewFundDocuments: true,
    canViewDealDocuments: true,
    canViewOtherInvestorDocs: false,
    canViewAllCommunications: false,
    kpiDetailLevel: 'summary',
  },
  series_c: {
    canViewDetailedFinancials: false,
    canViewOutliers: false,
    canViewOtherInvestors: false,
    canViewPipeline: false,
    canViewFundDocuments: true,
    canViewDealDocuments: true,
    canViewOtherInvestorDocs: false,
    canViewAllCommunications: false,
    kpiDetailLevel: 'summary',
  },
  institutional: {
    canViewDetailedFinancials: true,
    canViewOutliers: true,
    canViewOtherInvestors: false,
    canViewPipeline: false,
    canViewFundDocuments: true,
    canViewDealDocuments: true,
    canViewOtherInvestorDocs: false,
    canViewAllCommunications: false,
    kpiDetailLevel: 'detailed',
  },
  individual_accredited: {
    canViewDetailedFinancials: false,
    canViewOutliers: false,
    canViewOtherInvestors: false,
    canViewPipeline: false,
    canViewFundDocuments: true,
    canViewDealDocuments: true,
    canViewOtherInvestorDocs: false,
    canViewAllCommunications: false,
    kpiDetailLevel: 'summary',
  },
  family_office: {
    canViewDetailedFinancials: true,
    canViewOutliers: true,
    canViewOtherInvestors: false,
    canViewPipeline: false,
    canViewFundDocuments: true,
    canViewDealDocuments: true,
    canViewOtherInvestorDocs: false,
    canViewAllCommunications: false,
    kpiDetailLevel: 'detailed',
  },
  // Service Providers
  accountant: {
    canViewDetailedFinancials: true,
    canViewOutliers: false,
    canViewOtherInvestors: false,
    canViewPipeline: false,
    canViewFundDocuments: true,
    canViewDealDocuments: true,
    canViewOtherInvestorDocs: false,
    canViewAllCommunications: false,
    kpiDetailLevel: 'full',
  },
  attorney: {
    canViewDetailedFinancials: false,
    canViewOutliers: false,
    canViewOtherInvestors: false,
    canViewPipeline: false,
    canViewFundDocuments: true,
    canViewDealDocuments: true,
    canViewOtherInvestorDocs: false,
    canViewAllCommunications: false,
    kpiDetailLevel: 'summary',
  },
  property_manager: {
    canViewDetailedFinancials: false,
    canViewOutliers: false,
    canViewOtherInvestors: false,
    canViewPipeline: false,
    canViewFundDocuments: true,
    canViewDealDocuments: true,
    canViewOtherInvestorDocs: false,
    canViewAllCommunications: false,
    kpiDetailLevel: 'detailed',
  },
  // Team
  team_member: {
    canViewDetailedFinancials: true,
    canViewOutliers: true,
    canViewOtherInvestors: true,
    canViewPipeline: true,
    canViewFundDocuments: true,
    canViewDealDocuments: true,
    canViewOtherInvestorDocs: true,
    canViewAllCommunications: true,
    kpiDetailLevel: 'full',
  },
  custom: {
    canViewDetailedFinancials: false,
    canViewOutliers: false,
    canViewOtherInvestors: false,
    canViewPipeline: false,
    canViewFundDocuments: true,
    canViewDealDocuments: true,
    canViewOtherInvestorDocs: false,
    canViewAllCommunications: false,
    kpiDetailLevel: 'summary',
  },
};

/**
 * Get default permissions for a stakeholder type
 * Pure function - no side effects
 */
export function getDefaultStakeholderPermissions(
  stakeholderType: StakeholderType
): StakeholderPermissionDefaults {
  return DEFAULT_PERMISSIONS[stakeholderType] ?? DEFAULT_PERMISSIONS.custom;
}

/**
 * Get all default permissions as a map
 * Pure function - returns immutable copy
 */
export function getAllDefaultPermissions(): Record<StakeholderType, StakeholderPermissionDefaults> {
  return { ...DEFAULT_PERMISSIONS };
}

