/**
 * Stakeholder Permissions Routes
 * API endpoints for stakeholder permission management
 */

import { FastifyInstance, FastifyRequest } from 'fastify';
import { stakeholderPermissionsController } from './stakeholderPermissions.controller';
import { authenticate, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { requireManager } from '../../common/middleware/rbac.middleware';

interface StakeholderTypeParams {
  stakeholderType: string;
}

export async function stakeholderPermissionsRoutes(fastify: FastifyInstance): Promise<void> {
  const managerPreHandler = [authenticate, requireManager];
  const authPreHandler = [authenticate];

  // Manager routes - require manager role

  // Get all permission configurations for the fund
  fastify.get(
    '/permissions',
    { preHandler: managerPreHandler },
    async (request: FastifyRequest, reply) => {
      return stakeholderPermissionsController.getAllPermissions(request as AuthenticatedRequest, reply);
    }
  );

  // Seed default permissions for all stakeholder types
  fastify.post(
    '/permissions/seed',
    { preHandler: managerPreHandler },
    async (request: FastifyRequest, reply) => {
      return stakeholderPermissionsController.seedPermissions(request as AuthenticatedRequest, reply);
    }
  );

  // Update permission configuration for a stakeholder type
  fastify.put<{ Params: StakeholderTypeParams }>(
    '/permissions/:stakeholderType',
    { preHandler: managerPreHandler },
    async (request, reply) => {
      return stakeholderPermissionsController.updatePermissions(
        request as AuthenticatedRequest & { params: StakeholderTypeParams },
        reply
      );
    }
  );

  // User routes - any authenticated user

  // Get current user's effective permissions
  fastify.get(
    '/me/permissions',
    { preHandler: authPreHandler },
    async (request: FastifyRequest, reply) => {
      return stakeholderPermissionsController.getMyPermissions(request as AuthenticatedRequest, reply);
    }
  );
}
