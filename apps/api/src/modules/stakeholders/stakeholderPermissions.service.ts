/**
 * Stakeholder Permissions Service
 * Orchestrator - handles errors, calls repository and pure functions
 */

import type {
  StakeholderType,
  StakeholderTypePermission,
  StakeholderPermissions,
  StakeholderPermissionUpdateInput,
  STAKEHOLDER_TYPE_ARRAY,
} from '@altsui/shared';
import { stakeholderPermissionsRepository } from './stakeholderPermissions.repository';
import { getDefaultStakeholderPermissions, getAllDefaultPermissions } from './getDefaultStakeholderPermissions';

export class StakeholderPermissionsService {
  /**
   * Get all permission configurations for a fund
   */
  async getAllPermissionsForFund(fundId: string): Promise<StakeholderTypePermission[]> {
    try {
      return await stakeholderPermissionsRepository.findAllByFundId(fundId);
    } catch (error) {
      console.error('[StakeholderPermissionsService] Error fetching permissions:', error);
      throw new Error('Failed to fetch stakeholder type permissions');
    }
  }

  /**
   * Get permission configuration for a specific stakeholder type in a fund
   */
  async getPermissionsForType(
    fundId: string,
    stakeholderType: StakeholderType
  ): Promise<StakeholderTypePermission | null> {
    try {
      return await stakeholderPermissionsRepository.findByFundAndType(fundId, stakeholderType);
    } catch (error) {
      console.error('[StakeholderPermissionsService] Error fetching permission:', error);
      throw new Error('Failed to fetch stakeholder type permission');
    }
  }

  /**
   * Get effective permissions for an investor based on their type
   * Falls back to defaults if no custom configuration exists
   */
  async getPermissionsForInvestor(investorId: string): Promise<StakeholderPermissions> {
    try {
      const { fundId, investorType } = await stakeholderPermissionsRepository.getInvestorType(investorId);
      return this.resolvePermissions(fundId, investorType);
    } catch (error) {
      console.error('[StakeholderPermissionsService] Error fetching investor permissions:', error);
      throw new Error('Failed to fetch investor permissions');
    }
  }

  /**
   * Get effective permissions for a user based on their stakeholder type
   * Falls back to defaults if no custom configuration exists
   */
  async getPermissionsForUser(userId: string): Promise<StakeholderPermissions | null> {
    try {
      const { fundId, stakeholderType } = await stakeholderPermissionsRepository.getUserStakeholderType(userId);
      
      if (!stakeholderType) {
        return null;
      }

      return this.resolvePermissions(fundId, stakeholderType);
    } catch (error) {
      console.error('[StakeholderPermissionsService] Error fetching user permissions:', error);
      throw new Error('Failed to fetch user permissions');
    }
  }

  /**
   * Update permission configuration for a stakeholder type in a fund
   */
  async updatePermissions(
    fundId: string,
    stakeholderType: StakeholderType,
    updates: StakeholderPermissionUpdateInput
  ): Promise<StakeholderTypePermission> {
    try {
      return await stakeholderPermissionsRepository.upsert(fundId, stakeholderType, updates);
    } catch (error) {
      console.error('[StakeholderPermissionsService] Error updating permissions:', error);
      throw new Error('Failed to update stakeholder type permissions');
    }
  }

  /**
   * Seed default permissions for all stakeholder types in a fund
   */
  async seedDefaultPermissions(fundId: string): Promise<StakeholderTypePermission[]> {
    try {
      const allDefaults = getAllDefaultPermissions();
      const stakeholderTypes = Object.keys(allDefaults) as StakeholderType[];

      const rows = stakeholderTypes.map((stakeholderType) => ({
        fundId,
        stakeholderType,
        permissions: allDefaults[stakeholderType],
      }));

      await stakeholderPermissionsRepository.bulkInsert(rows);

      return this.getAllPermissionsForFund(fundId);
    } catch (error) {
      console.error('[StakeholderPermissionsService] Error seeding permissions:', error);
      throw new Error('Failed to seed default permissions');
    }
  }

  /**
   * Get default permissions for a stakeholder type (static, no DB lookup)
   */
  getDefaultPermissions(stakeholderType: StakeholderType): StakeholderPermissions {
    const defaults = getDefaultStakeholderPermissions(stakeholderType);
    return {
      stakeholderType,
      ...defaults,
    };
  }

  /**
   * Resolve permissions for a stakeholder type, using DB config or defaults
   */
  private async resolvePermissions(
    fundId: string,
    stakeholderType: StakeholderType
  ): Promise<StakeholderPermissions> {
    const customPermission = await stakeholderPermissionsRepository.findByFundAndType(fundId, stakeholderType);

    if (customPermission) {
      return {
        stakeholderType,
        canViewDetailedFinancials: customPermission.canViewDetailedFinancials,
        canViewOutliers: customPermission.canViewOutliers,
        canViewOtherInvestors: customPermission.canViewOtherInvestors,
        canViewPipeline: customPermission.canViewPipeline,
        canViewFundDocuments: customPermission.canViewFundDocuments,
        canViewDealDocuments: customPermission.canViewDealDocuments,
        canViewOtherInvestorDocs: customPermission.canViewOtherInvestorDocs,
        canViewAllCommunications: customPermission.canViewAllCommunications,
        kpiDetailLevel: customPermission.kpiDetailLevel,
      };
    }

    return this.getDefaultPermissions(stakeholderType);
  }
}

export const stakeholderPermissionsService = new StakeholderPermissionsService();

