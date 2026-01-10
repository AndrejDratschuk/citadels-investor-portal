/**
 * Stakeholder Permission Types
 * Anemic data structures for stakeholder type permissions
 */

import type { StakeholderType } from '../constants/stakeholderType.constants';
import type { KpiDetailLevel } from '../constants/status';

/** Permission configuration for a stakeholder type within a fund */
export interface StakeholderTypePermission {
  id: string;
  fundId: string;
  stakeholderType: StakeholderType;
  canViewDetailedFinancials: boolean;
  canViewOutliers: boolean;
  canViewOtherInvestors: boolean;
  canViewPipeline: boolean;
  canViewFundDocuments: boolean;
  canViewDealDocuments: boolean;
  canViewOtherInvestorDocs: boolean;
  canViewAllCommunications: boolean;
  kpiDetailLevel: KpiDetailLevel;
  createdAt: string;
  updatedAt: string;
}

/** Effective permissions for a stakeholder (resolved from their type) */
export interface StakeholderPermissions {
  stakeholderType: StakeholderType;
  canViewDetailedFinancials: boolean;
  canViewOutliers: boolean;
  canViewOtherInvestors: boolean;
  canViewPipeline: boolean;
  canViewFundDocuments: boolean;
  canViewDealDocuments: boolean;
  canViewOtherInvestorDocs: boolean;
  canViewAllCommunications: boolean;
  kpiDetailLevel: KpiDetailLevel;
}

/** Default permission values for a stakeholder type (without metadata) */
export interface StakeholderPermissionDefaults {
  canViewDetailedFinancials: boolean;
  canViewOutliers: boolean;
  canViewOtherInvestors: boolean;
  canViewPipeline: boolean;
  canViewFundDocuments: boolean;
  canViewDealDocuments: boolean;
  canViewOtherInvestorDocs: boolean;
  canViewAllCommunications: boolean;
  kpiDetailLevel: KpiDetailLevel;
}

/** Input for updating permission configuration */
export interface StakeholderPermissionUpdateInput {
  canViewDetailedFinancials?: boolean;
  canViewOutliers?: boolean;
  canViewOtherInvestors?: boolean;
  canViewPipeline?: boolean;
  canViewFundDocuments?: boolean;
  canViewDealDocuments?: boolean;
  canViewOtherInvestorDocs?: boolean;
  canViewAllCommunications?: boolean;
  kpiDetailLevel?: KpiDetailLevel;
}

