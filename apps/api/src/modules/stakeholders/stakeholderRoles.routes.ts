/**
 * Stakeholder Roles Routes
 * API routes for role and permission management
 */

import { FastifyInstance, FastifyRequest } from 'fastify';
import { stakeholderRolesController } from './stakeholderRoles.controller';
import { authenticate, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { requireManager } from '../../common/middleware/rbac.middleware';

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

export async function stakeholderRolesRoutes(fastify: FastifyInstance): Promise<void> {
  const managerPreHandler = [authenticate, requireManager];
  const authPreHandler = [authenticate];

  // ----------------------------------------
  // Role Management Routes (Manager only)
  // ----------------------------------------

  // List all roles for fund
  fastify.get(
    '/roles',
    { preHandler: managerPreHandler },
    async (request: FastifyRequest, reply) => {
      return stakeholderRolesController.listRoles(request as AuthenticatedRequest, reply);
    }
  );

  // Get specific role
  fastify.get<{ Params: RoleIdParams }>(
    '/roles/:roleId',
    { preHandler: managerPreHandler },
    async (request, reply) => {
      return stakeholderRolesController.getRole(
        request as AuthenticatedRequest & { params: RoleIdParams },
        reply
      );
    }
  );

  // Create new role
  fastify.post(
    '/roles',
    { preHandler: managerPreHandler },
    async (request: FastifyRequest, reply) => {
      return stakeholderRolesController.createRole(request as AuthenticatedRequest, reply);
    }
  );

  // Update role
  fastify.put<{ Params: RoleIdParams }>(
    '/roles/:roleId',
    { preHandler: managerPreHandler },
    async (request, reply) => {
      return stakeholderRolesController.updateRole(
        request as AuthenticatedRequest & { params: RoleIdParams },
        reply
      );
    }
  );

  // Delete role
  fastify.delete<{ Params: RoleIdParams }>(
    '/roles/:roleId',
    { preHandler: managerPreHandler },
    async (request, reply) => {
      return stakeholderRolesController.deleteRole(
        request as AuthenticatedRequest & { params: RoleIdParams },
        reply
      );
    }
  );

  // ----------------------------------------
  // Permission Management Routes (Manager only)
  // ----------------------------------------

  // Get role permissions
  fastify.get<{ Params: RoleIdParams }>(
    '/roles/:roleId/permissions',
    { preHandler: managerPreHandler },
    async (request, reply) => {
      return stakeholderRolesController.getRolePermissions(
        request as AuthenticatedRequest & { params: RoleIdParams },
        reply
      );
    }
  );

  // Update role permissions
  fastify.put<{ Params: RoleIdParams }>(
    '/roles/:roleId/permissions',
    { preHandler: managerPreHandler },
    async (request, reply) => {
      return stakeholderRolesController.updateRolePermissions(
        request as AuthenticatedRequest & { params: RoleIdParams },
        reply
      );
    }
  );

  // Copy permissions from another role
  fastify.post<{ Params: CopyFromParams }>(
    '/roles/:roleId/copy-from/:sourceRoleId',
    { preHandler: managerPreHandler },
    async (request, reply) => {
      return stakeholderRolesController.copyPermissions(
        request as AuthenticatedRequest & { params: CopyFromParams },
        reply
      );
    }
  );

  // Reset role to default permissions
  fastify.post<{ Params: RoleIdParams }>(
    '/roles/:roleId/reset-defaults',
    { preHandler: managerPreHandler },
    async (request, reply) => {
      return stakeholderRolesController.resetToDefaults(
        request as AuthenticatedRequest & { params: RoleIdParams },
        reply
      );
    }
  );

  // ----------------------------------------
  // Deal Override Routes (Manager only)
  // ----------------------------------------

  // Get deal overrides
  fastify.get<{ Params: DealOverrideParams }>(
    '/roles/:roleId/deals/:dealId/overrides',
    { preHandler: managerPreHandler },
    async (request, reply) => {
      return stakeholderRolesController.getDealOverrides(
        request as AuthenticatedRequest & { params: DealOverrideParams },
        reply
      );
    }
  );

  // Set deal overrides
  fastify.put<{ Params: DealOverrideParams }>(
    '/roles/:roleId/deals/:dealId/overrides',
    { preHandler: managerPreHandler },
    async (request, reply) => {
      return stakeholderRolesController.updateDealOverrides(
        request as AuthenticatedRequest & { params: DealOverrideParams },
        reply
      );
    }
  );

  // Clear deal overrides
  fastify.delete<{ Params: DealOverrideParams }>(
    '/roles/:roleId/deals/:dealId/overrides',
    { preHandler: managerPreHandler },
    async (request, reply) => {
      return stakeholderRolesController.clearDealOverrides(
        request as AuthenticatedRequest & { params: DealOverrideParams },
        reply
      );
    }
  );

  // ----------------------------------------
  // Permission Check Routes (Authenticated users)
  // ----------------------------------------

  // Check specific permission
  fastify.post(
    '/check-permission',
    { preHandler: authPreHandler },
    async (request: FastifyRequest, reply) => {
      return stakeholderRolesController.checkPermission(request as AuthenticatedRequest, reply);
    }
  );

  // Get current user's effective permissions
  fastify.get(
    '/my-permissions',
    { preHandler: authPreHandler },
    async (request: FastifyRequest, reply) => {
      return stakeholderRolesController.getMyPermissions(request as AuthenticatedRequest, reply);
    }
  );

  // ----------------------------------------
  // Initialization Routes (Manager only)
  // ----------------------------------------

  // Initialize system roles for fund
  fastify.post(
    '/initialize',
    { preHandler: managerPreHandler },
    async (request: FastifyRequest, reply) => {
      return stakeholderRolesController.initializeRoles(request as AuthenticatedRequest, reply);
    }
  );
}
