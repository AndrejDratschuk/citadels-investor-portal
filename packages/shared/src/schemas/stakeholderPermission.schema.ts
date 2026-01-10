/**
 * Stakeholder Permission Schemas
 * Zod validation for API boundary validation only
 */

import { z } from 'zod';
import { STAKEHOLDER_TYPE } from '../constants/stakeholderType.constants';
import { KPI_DETAIL_LEVEL } from '../constants/status';

/** Stakeholder type validation */
export const stakeholderTypeSchema = z.enum(
  Object.values(STAKEHOLDER_TYPE) as [string, ...string[]]
);

/** KPI detail level validation */
export const kpiDetailLevelSchema = z.enum(
  Object.values(KPI_DETAIL_LEVEL) as [string, ...string[]]
);

/** Schema for updating stakeholder type permissions */
export const updateStakeholderPermissionSchema = z.object({
  canViewDetailedFinancials: z.boolean().optional(),
  canViewOutliers: z.boolean().optional(),
  canViewOtherInvestors: z.boolean().optional(),
  canViewPipeline: z.boolean().optional(),
  canViewFundDocuments: z.boolean().optional(),
  canViewDealDocuments: z.boolean().optional(),
  canViewOtherInvestorDocs: z.boolean().optional(),
  canViewAllCommunications: z.boolean().optional(),
  kpiDetailLevel: kpiDetailLevelSchema.optional(),
});

/** Schema for stakeholder type route parameter */
export const stakeholderTypeParamSchema = z.object({
  stakeholderType: stakeholderTypeSchema,
});

export type UpdateStakeholderPermissionInput = z.infer<typeof updateStakeholderPermissionSchema>;
export type StakeholderTypeParam = z.infer<typeof stakeholderTypeParamSchema>;

