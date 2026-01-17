/**
 * Stakeholder Roles Controller
 * HTTP layer - handles request/response for role and permission endpoints
 */

import type { FastifyReply } from 'fastify';
import type { AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { stakeholderRolesService } from './stakeholderRoles.service';
import {
  createRoleSchema,
  updateRoleSchema,
  permissionUpdateSchema,
  dealOverrideSchema,
  checkPermissionSchema,
} from '@altsui/shared';

interface RoleIdParams {
  roleId: string;
}

interface DealOverrideParams {
  roleId: string;
  dealId: string;
}

interface CopyFromParams {
  roleId: string;
  sourceRoleId: string;
}

export class StakeholderRolesController {
  // ----------------------------------------
  // Role Endpoints
  // ----------------------------------------

  /**
   * GET /stakeholders/roles
   * List all roles for the fund
   */
  async listRoles(req: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const fundId = req.user?.fundId;
      if (!fundId) {
        return reply.status(401).send({ success: false, error: 'Unauthorized' });
      }

      const roles = await stakeholderRolesService.getAllRolesForFund(fundId);
      return reply.send({ success: true, data: roles });
    } catch (error) {
      console.error('[StakeholderRolesController] Error listing roles:', error);
      return reply.status(500).send({ success: false, error: 'Failed to fetch roles' });
    }
  }

  /**
   * GET /stakeholders/roles/:roleId
   * Get a specific role
   */
  async getRole(
    req: AuthenticatedRequest & { params: RoleIdParams },
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { roleId } = req.params;
      const role = await stakeholderRolesService.getRoleById(roleId);
      
      if (!role) {
        return reply.status(404).send({ success: false, error: 'Role not found' });
      }

      return reply.send({ success: true, data: role });
    } catch (error) {
      console.error('[StakeholderRolesController] Error getting role:', error);
      return reply.status(500).send({ success: false, error: 'Failed to fetch role' });
    }
  }

  /**
   * POST /stakeholders/roles
   * Create a new custom role
   */
  async createRole(req: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const fundId = req.user?.fundId;
      if (!fundId) {
        return reply.status(401).send({ success: false, error: 'Unauthorized' });
      }

      const parsed = createRoleSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ 
          success: false, 
          error: 'Invalid input',
          details: parsed.error.errors 
        });
      }

      const { roleName, copyFromRoleId, baseStakeholderType } = parsed.data;
      const role = await stakeholderRolesService.createRole(
        fundId,
        roleName,
        copyFromRoleId,
        baseStakeholderType
      );

      return reply.status(201).send({ success: true, data: role });
    } catch (error) {
      console.error('[StakeholderRolesController] Error creating role:', error);
      return reply.status(500).send({ success: false, error: 'Failed to create role' });
    }
  }

  /**
   * PUT /stakeholders/roles/:roleId
   * Update a role (name only)
   */
  async updateRole(
    req: AuthenticatedRequest & { params: RoleIdParams },
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { roleId } = req.params;

      const parsed = updateRoleSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ 
          success: false, 
          error: 'Invalid input',
          details: parsed.error.errors 
        });
      }

      const { roleName } = parsed.data;
      if (!roleName) {
        return reply.status(400).send({ success: false, error: 'Role name is required' });
      }

      const role = await stakeholderRolesService.updateRole(roleId, roleName);
      return reply.send({ success: true, data: role });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update role';
      console.error('[StakeholderRolesController] Error updating role:', error);
      return reply.status(400).send({ success: false, error: message });
    }
  }

  /**
   * DELETE /stakeholders/roles/:roleId
   * Delete a custom role
   */
  async deleteRole(
    req: AuthenticatedRequest & { params: RoleIdParams },
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { roleId } = req.params;
      await stakeholderRolesService.deleteRole(roleId);
      return reply.send({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete role';
      console.error('[StakeholderRolesController] Error deleting role:', error);
      return reply.status(400).send({ success: false, error: message });
    }
  }

  // ----------------------------------------
  // Permission Endpoints
  // ----------------------------------------

  /**
   * GET /stakeholders/roles/:roleId/permissions
   * Get all permissions for a role
   */
  async getRolePermissions(
    req: AuthenticatedRequest & { params: RoleIdParams },
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { roleId } = req.params;
      const permissions = await stakeholderRolesService.getRolePermissions(roleId);
      return reply.send({ success: true, data: permissions });
    } catch (error) {
      console.error('[StakeholderRolesController] Error getting permissions:', error);
      return reply.status(500).send({ success: false, error: 'Failed to fetch permissions' });
    }
  }

  /**
   * PUT /stakeholders/roles/:roleId/permissions
   * Batch update permissions for a role
   */
  async updateRolePermissions(
    req: AuthenticatedRequest & { params: RoleIdParams },
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { roleId } = req.params;

      const parsed = permissionUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ 
          success: false, 
          error: 'Invalid input',
          details: parsed.error.errors 
        });
      }

      const permissions = await stakeholderRolesService.updateRolePermissions(
        roleId,
        parsed.data.permissions
      );
      return reply.send({ success: true, data: permissions });
    } catch (error) {
      console.error('[StakeholderRolesController] Error updating permissions:', error);
      return reply.status(500).send({ success: false, error: 'Failed to update permissions' });
    }
  }

  /**
   * POST /stakeholders/roles/:roleId/copy-from/:sourceRoleId
   * Copy permissions from another role
   */
  async copyPermissions(
    req: AuthenticatedRequest & { params: CopyFromParams },
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { roleId, sourceRoleId } = req.params;
      await stakeholderRolesService.copyPermissions(sourceRoleId, roleId);
      
      const permissions = await stakeholderRolesService.getRolePermissions(roleId);
      return reply.send({ success: true, data: permissions });
    } catch (error) {
      console.error('[StakeholderRolesController] Error copying permissions:', error);
      return reply.status(500).send({ success: false, error: 'Failed to copy permissions' });
    }
  }

  /**
   * POST /stakeholders/roles/:roleId/reset-defaults
   * Reset a role's permissions to defaults
   */
  async resetToDefaults(
    req: AuthenticatedRequest & { params: RoleIdParams },
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { roleId } = req.params;
      const permissions = await stakeholderRolesService.resetRoleToDefaults(roleId);
      return reply.send({ success: true, data: permissions });
    } catch (error) {
      console.error('[StakeholderRolesController] Error resetting permissions:', error);
      return reply.status(500).send({ success: false, error: 'Failed to reset permissions' });
    }
  }

  // ----------------------------------------
  // Deal Override Endpoints
  // ----------------------------------------

  /**
   * GET /stakeholders/roles/:roleId/deals/:dealId/overrides
   * Get deal-specific permission overrides
   */
  async getDealOverrides(
    req: AuthenticatedRequest & { params: DealOverrideParams },
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { roleId, dealId } = req.params;
      const overrides = await stakeholderRolesService.getDealOverrides(roleId, dealId);
      return reply.send({ success: true, data: overrides });
    } catch (error) {
      console.error('[StakeholderRolesController] Error getting overrides:', error);
      return reply.status(500).send({ success: false, error: 'Failed to fetch overrides' });
    }
  }

  /**
   * PUT /stakeholders/roles/:roleId/deals/:dealId/overrides
   * Set deal-specific permission overrides
   */
  async updateDealOverrides(
    req: AuthenticatedRequest & { params: DealOverrideParams },
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { roleId, dealId } = req.params;

      const parsed = dealOverrideSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ 
          success: false, 
          error: 'Invalid input',
          details: parsed.error.errors 
        });
      }

      const overrides = await stakeholderRolesService.updateDealOverrides(
        roleId,
        dealId,
        parsed.data.permissions
      );
      return reply.send({ success: true, data: overrides });
    } catch (error) {
      console.error('[StakeholderRolesController] Error updating overrides:', error);
      return reply.status(500).send({ success: false, error: 'Failed to update overrides' });
    }
  }

  /**
   * DELETE /stakeholders/roles/:roleId/deals/:dealId/overrides
   * Clear all deal-specific overrides
   */
  async clearDealOverrides(
    req: AuthenticatedRequest & { params: DealOverrideParams },
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { roleId, dealId } = req.params;
      await stakeholderRolesService.clearDealOverrides(roleId, dealId);
      return reply.send({ success: true });
    } catch (error) {
      console.error('[StakeholderRolesController] Error clearing overrides:', error);
      return reply.status(500).send({ success: false, error: 'Failed to clear overrides' });
    }
  }

  // ----------------------------------------
  // Permission Check Endpoints
  // ----------------------------------------

  /**
   * POST /stakeholders/check-permission
   * Check if current user has a specific permission
   */
  async checkPermission(req: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return reply.status(401).send({ success: false, error: 'Unauthorized' });
      }

      const parsed = checkPermissionSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ 
          success: false, 
          error: 'Invalid input',
          details: parsed.error.errors 
        });
      }

      const { path, type, dealId } = parsed.data;

      // Get user's effective permissions
      const permissions = await stakeholderRolesService.getPermissionsForUser(userId);
      if (!permissions) {
        return reply.send({ success: true, data: { granted: false } });
      }

      // Check the permission
      const granted = await stakeholderRolesService.hasPermission(
        permissions.roleId,
        path,
        type,
        dealId
      );

      return reply.send({ success: true, data: { path, type, granted } });
    } catch (error) {
      console.error('[StakeholderRolesController] Error checking permission:', error);
      return reply.status(500).send({ success: false, error: 'Failed to check permission' });
    }
  }

  /**
   * GET /stakeholders/my-permissions
   * Get effective permissions for current user
   */
  async getMyPermissions(req: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return reply.status(401).send({ success: false, error: 'Unauthorized' });
      }

      const permissions = await stakeholderRolesService.getPermissionsForUser(userId);
      return reply.send({ success: true, data: permissions });
    } catch (error) {
      console.error('[StakeholderRolesController] Error getting user permissions:', error);
      return reply.status(500).send({ success: false, error: 'Failed to fetch permissions' });
    }
  }

  // ----------------------------------------
  // Initialization Endpoints
  // ----------------------------------------

  /**
   * POST /stakeholders/initialize
   * Initialize system roles for the fund
   */
  async initializeRoles(req: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const fundId = req.user?.fundId;
      if (!fundId) {
        return reply.status(401).send({ success: false, error: 'Unauthorized' });
      }

      const roles = await stakeholderRolesService.initializeRolesForFund(fundId);
      return reply.send({ success: true, data: roles });
    } catch (error) {
      console.error('[StakeholderRolesController] Error initializing roles:', error);
      return reply.status(500).send({ success: false, error: 'Failed to initialize roles' });
    }
  }
}

export const stakeholderRolesController = new StakeholderRolesController();
