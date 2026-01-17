/**
 * Stakeholder Roles Service
 * Orchestrator - handles permission inheritance, role management, and default presets
 */

import type {
  StakeholderRole,
  RolePermission,
  PermissionGrant,
  StakeholderType,
  PermissionType,
  RolePermissionsResponse,
  PermissionTreeState,
  EffectivePermissions,
} from '@altsui/shared';
import { getParentPath } from '@altsui/shared';
import { stakeholderRolesRepository } from './stakeholderRoles.repository';
import { getDefaultPermissionsForType } from './defaultPermissionPresets';

export class StakeholderRolesService {
  // ----------------------------------------
  // Role Management
  // ----------------------------------------

  async getAllRolesForFund(fundId: string): Promise<StakeholderRole[]> {
    try {
      return await stakeholderRolesRepository.findAllRolesByFundId(fundId);
    } catch (error) {
      console.error('[StakeholderRolesService] Error fetching roles:', error);
      throw new Error('Failed to fetch stakeholder roles');
    }
  }

  async getRoleById(roleId: string): Promise<StakeholderRole | null> {
    try {
      return await stakeholderRolesRepository.findRoleById(roleId);
    } catch (error) {
      console.error('[StakeholderRolesService] Error fetching role:', error);
      throw new Error('Failed to fetch role');
    }
  }

  async createRole(
    fundId: string,
    roleName: string,
    copyFromRoleId?: string,
    baseStakeholderType?: StakeholderType
  ): Promise<StakeholderRole> {
    try {
      // Create the role
      const role = await stakeholderRolesRepository.createRole(
        fundId,
        roleName,
        'custom',
        baseStakeholderType
      );

      // Copy permissions if specified
      if (copyFromRoleId) {
        await stakeholderRolesRepository.copyPermissions(copyFromRoleId, role.id);
      } else if (baseStakeholderType) {
        // Seed default permissions for the base type
        const defaults = getDefaultPermissionsForType(baseStakeholderType);
        await stakeholderRolesRepository.bulkUpsertPermissions(role.id, defaults);
      }

      return role;
    } catch (error) {
      console.error('[StakeholderRolesService] Error creating role:', error);
      throw new Error('Failed to create role');
    }
  }

  async updateRole(roleId: string, roleName: string): Promise<StakeholderRole> {
    try {
      // Check if role exists and is custom
      const role = await stakeholderRolesRepository.findRoleById(roleId);
      if (!role) {
        throw new Error('Role not found');
      }
      if (role.roleType === 'system') {
        throw new Error('Cannot rename system roles');
      }

      return await stakeholderRolesRepository.updateRole(roleId, roleName);
    } catch (error) {
      console.error('[StakeholderRolesService] Error updating role:', error);
      throw error;
    }
  }

  async deleteRole(roleId: string): Promise<void> {
    try {
      // Check if role exists and is custom
      const role = await stakeholderRolesRepository.findRoleById(roleId);
      if (!role) {
        throw new Error('Role not found');
      }
      if (role.roleType === 'system') {
        throw new Error('Cannot delete system roles');
      }

      await stakeholderRolesRepository.deleteRole(roleId);
    } catch (error) {
      console.error('[StakeholderRolesService] Error deleting role:', error);
      throw error;
    }
  }

  // ----------------------------------------
  // Permission Management
  // ----------------------------------------

  async getRolePermissions(roleId: string): Promise<RolePermissionsResponse> {
    try {
      const role = await stakeholderRolesRepository.findRoleById(roleId);
      if (!role) {
        throw new Error('Role not found');
      }

      const permissions = await stakeholderRolesRepository.findPermissionsByRoleId(roleId);
      
      const grants: PermissionGrant[] = permissions.map((p) => ({
        path: p.permissionPath,
        type: p.permissionType,
        granted: p.isGranted,
      }));

      return {
        roleId: role.id,
        roleName: role.roleName,
        roleType: role.roleType,
        baseStakeholderType: role.baseStakeholderType,
        permissions: grants,
      };
    } catch (error) {
      console.error('[StakeholderRolesService] Error fetching permissions:', error);
      throw new Error('Failed to fetch role permissions');
    }
  }

  async updateRolePermissions(
    roleId: string,
    permissions: PermissionGrant[]
  ): Promise<RolePermissionsResponse> {
    try {
      await stakeholderRolesRepository.bulkUpsertPermissions(roleId, permissions);
      return this.getRolePermissions(roleId);
    } catch (error) {
      console.error('[StakeholderRolesService] Error updating permissions:', error);
      throw new Error('Failed to update permissions');
    }
  }

  async copyPermissions(sourceRoleId: string, targetRoleId: string): Promise<void> {
    try {
      await stakeholderRolesRepository.copyPermissions(sourceRoleId, targetRoleId);
    } catch (error) {
      console.error('[StakeholderRolesService] Error copying permissions:', error);
      throw new Error('Failed to copy permissions');
    }
  }

  async resetRoleToDefaults(roleId: string): Promise<RolePermissionsResponse> {
    try {
      const role = await stakeholderRolesRepository.findRoleById(roleId);
      if (!role) {
        throw new Error('Role not found');
      }

      // Get defaults for the base type (or limited_partner as fallback)
      const baseType = role.baseStakeholderType || 'limited_partner';
      const defaults = getDefaultPermissionsForType(baseType as StakeholderType);

      // Clear and reset permissions
      await stakeholderRolesRepository.deleteAllPermissions(roleId);
      await stakeholderRolesRepository.bulkUpsertPermissions(roleId, defaults);

      return this.getRolePermissions(roleId);
    } catch (error) {
      console.error('[StakeholderRolesService] Error resetting permissions:', error);
      throw new Error('Failed to reset permissions');
    }
  }

  // ----------------------------------------
  // Deal Override Management
  // ----------------------------------------

  async getDealOverrides(roleId: string, dealId: string): Promise<PermissionGrant[]> {
    try {
      const overrides = await stakeholderRolesRepository.findOverridesByRoleAndDeal(
        roleId,
        dealId
      );
      
      return overrides.map((o) => ({
        path: o.permissionPath,
        type: o.permissionType,
        granted: o.isGranted,
      }));
    } catch (error) {
      console.error('[StakeholderRolesService] Error fetching overrides:', error);
      throw new Error('Failed to fetch deal overrides');
    }
  }

  async updateDealOverrides(
    roleId: string,
    dealId: string,
    permissions: PermissionGrant[]
  ): Promise<PermissionGrant[]> {
    try {
      await stakeholderRolesRepository.bulkUpsertOverrides(roleId, dealId, permissions);
      return this.getDealOverrides(roleId, dealId);
    } catch (error) {
      console.error('[StakeholderRolesService] Error updating overrides:', error);
      throw new Error('Failed to update deal overrides');
    }
  }

  async clearDealOverrides(roleId: string, dealId: string): Promise<void> {
    try {
      await stakeholderRolesRepository.deleteAllOverridesForDeal(roleId, dealId);
    } catch (error) {
      console.error('[StakeholderRolesService] Error clearing overrides:', error);
      throw new Error('Failed to clear deal overrides');
    }
  }

  // ----------------------------------------
  // Permission Checking (with Inheritance)
  // ----------------------------------------

  /**
   * Check if a role has a specific permission, following inheritance rules:
   * 1. Check deal-specific override first (if dealId provided)
   * 2. Check exact path match
   * 3. Walk up the path tree - if any parent is OFF, permission is OFF
   * 4. If parent is ON and no explicit child setting, child inherits ON
   */
  async hasPermission(
    roleId: string,
    path: string,
    type: PermissionType = 'view',
    dealId?: string
  ): Promise<boolean> {
    try {
      // Check deal override first
      if (dealId) {
        const override = await stakeholderRolesRepository.findOverride(
          roleId,
          dealId,
          path,
          type
        );
        if (override) {
          return override.isGranted;
        }
      }

      // Get all permissions for this role
      const permissions = await stakeholderRolesRepository.findPermissionsByRoleId(roleId);
      
      // Build a map for quick lookup
      const permMap = new Map<string, boolean>();
      for (const p of permissions) {
        if (p.permissionType === type) {
          permMap.set(p.permissionPath, p.isGranted);
        }
      }

      // Check exact path
      if (permMap.has(path)) {
        return permMap.get(path) === true;
      }

      // Walk up the path tree
      let currentPath = path;
      while (true) {
        const parent = getParentPath(currentPath);
        if (!parent) break;
        
        if (permMap.has(parent)) {
          // If parent is explicitly set, inherit that value
          return permMap.get(parent) === true;
        }
        
        currentPath = parent;
      }

      // Default to false if no permission found
      return false;
    } catch (error) {
      console.error('[StakeholderRolesService] Error checking permission:', error);
      return false;
    }
  }

  /**
   * Get effective permissions for a user/investor resolved as a tree state
   */
  async getEffectivePermissions(roleId: string): Promise<EffectivePermissions | null> {
    try {
      const role = await stakeholderRolesRepository.findRoleById(roleId);
      if (!role) {
        return null;
      }

      const permissions = await stakeholderRolesRepository.findPermissionsByRoleId(roleId);
      
      // Build tree state
      const state: PermissionTreeState = {};
      for (const p of permissions) {
        if (!state[p.permissionPath]) {
          state[p.permissionPath] = {};
        }
        state[p.permissionPath][p.permissionType] = p.isGranted;
      }

      return {
        roleId: role.id,
        roleName: role.roleName,
        permissions: state,
      };
    } catch (error) {
      console.error('[StakeholderRolesService] Error getting effective permissions:', error);
      return null;
    }
  }

  /**
   * Get effective permissions for a user by their user ID
   */
  async getPermissionsForUser(userId: string): Promise<EffectivePermissions | null> {
    try {
      const roleId = await stakeholderRolesRepository.getUserRoleId(userId);
      if (!roleId) {
        return null;
      }
      return this.getEffectivePermissions(roleId);
    } catch (error) {
      console.error('[StakeholderRolesService] Error getting user permissions:', error);
      return null;
    }
  }

  /**
   * Get effective permissions for an investor by their investor ID
   */
  async getPermissionsForInvestor(investorId: string): Promise<EffectivePermissions | null> {
    try {
      const roleId = await stakeholderRolesRepository.getInvestorRoleId(investorId);
      if (!roleId) {
        return null;
      }
      return this.getEffectivePermissions(roleId);
    } catch (error) {
      console.error('[StakeholderRolesService] Error getting investor permissions:', error);
      return null;
    }
  }

  // ----------------------------------------
  // Initialization
  // ----------------------------------------

  /**
   * Initialize system roles for a new fund
   */
  async initializeRolesForFund(fundId: string): Promise<StakeholderRole[]> {
    try {
      // System role definitions
      const systemRoles: Array<{ name: string; type: StakeholderType }> = [
        { name: 'Limited Partner (LP)', type: 'limited_partner' },
        { name: 'General Partner (GP)', type: 'general_partner' },
        { name: 'Series A Investor', type: 'series_a' },
        { name: 'Series B Investor', type: 'series_b' },
        { name: 'Series C Investor', type: 'series_c' },
        { name: 'Institutional Investor', type: 'institutional' },
        { name: 'Individual Accredited', type: 'individual_accredited' },
        { name: 'Family Office', type: 'family_office' },
        { name: 'Accountant', type: 'accountant' },
        { name: 'Attorney', type: 'attorney' },
        { name: 'Property Manager', type: 'property_manager' },
        { name: 'Team Member', type: 'team_member' },
      ];

      const createdRoles: StakeholderRole[] = [];

      for (const def of systemRoles) {
        // Check if role already exists
        const existing = await stakeholderRolesRepository.findRoleByFundAndType(
          fundId,
          def.type
        );
        
        if (existing) {
          createdRoles.push(existing);
          continue;
        }

        // Create the role
        const role = await stakeholderRolesRepository.createRole(
          fundId,
          def.name,
          'system',
          def.type
        );

        // Seed default permissions
        const defaults = getDefaultPermissionsForType(def.type);
        await stakeholderRolesRepository.bulkUpsertPermissions(role.id, defaults);

        createdRoles.push(role);
      }

      return createdRoles;
    } catch (error) {
      console.error('[StakeholderRolesService] Error initializing roles:', error);
      throw new Error('Failed to initialize roles for fund');
    }
  }
}

export const stakeholderRolesService = new StakeholderRolesService();

