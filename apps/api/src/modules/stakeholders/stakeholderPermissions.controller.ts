/**
 * Stakeholder Permissions Controller
 * Handles HTTP requests for stakeholder permission management
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { stakeholderPermissionsService } from './stakeholderPermissions.service';
import { updateStakeholderPermissionSchema, stakeholderTypeSchema } from '@altsui/shared';
import type { StakeholderType, StakeholderPermissionUpdateInput } from '@altsui/shared';

interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    fundId: string;
    role: string;
  };
}

interface StakeholderTypeParams {
  stakeholderType: string;
}

export class StakeholderPermissionsController {
  /**
   * Get all permission configurations for the fund
   */
  async getAllPermissions(
    request: AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.user?.fundId) {
        reply.status(400).send({ success: false, error: 'Fund ID not found for user' });
        return;
      }
      const permissions = await stakeholderPermissionsService.getAllPermissionsForFund(
        request.user.fundId
      );
      reply.send({ success: true, data: permissions });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch permissions';
      console.error('[StakeholderPermissions] getAllPermissions error:', message);
      reply.status(500).send({ success: false, error: message });
    }
  }

  /**
   * Seed default permissions for all stakeholder types
   */
  async seedPermissions(
    request: AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.user?.fundId) {
        reply.status(400).send({ success: false, error: 'Fund ID not found for user' });
        return;
      }
      const permissions = await stakeholderPermissionsService.seedDefaultPermissions(
        request.user.fundId
      );
      reply.send({ success: true, data: permissions });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to seed permissions';
      console.error('[StakeholderPermissions] seedPermissions error:', message);
      reply.status(500).send({ success: false, error: message });
    }
  }

  /**
   * Update permission configuration for a specific stakeholder type
   */
  async updatePermissions(
    request: AuthenticatedRequest & { params: StakeholderTypeParams },
    reply: FastifyReply
  ): Promise<void> {
    try {
      const stakeholderTypeResult = stakeholderTypeSchema.safeParse(request.params.stakeholderType);
      
      if (!stakeholderTypeResult.success) {
        reply.status(400).send({ success: false, error: 'Invalid stakeholder type' });
        return;
      }

      const bodyResult = updateStakeholderPermissionSchema.safeParse(request.body);
      
      if (!bodyResult.success) {
        reply.status(400).send({ success: false, error: 'Invalid request body', details: bodyResult.error.errors });
        return;
      }

      const permission = await stakeholderPermissionsService.updatePermissions(
        request.user.fundId,
        stakeholderTypeResult.data,
        bodyResult.data
      );

      reply.send({ success: true, data: permission });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update permissions';
      console.error('[StakeholderPermissions] updatePermissions error:', message);
      reply.status(500).send({ success: false, error: message });
    }
  }

  /**
   * Get current user's effective permissions
   */
  async getMyPermissions(
    request: AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const permissions = await stakeholderPermissionsService.getPermissionsForUser(
        request.user.id
      );

      if (!permissions) {
        reply.status(404).send({ success: false, error: 'No stakeholder type assigned to user' });
        return;
      }

      reply.send({ success: true, data: permissions });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get user permissions';
      console.error('[StakeholderPermissions] getMyPermissions error:', message);
      reply.status(500).send({ success: false, error: message });
    }
  }
}

export const stakeholderPermissionsController = new StakeholderPermissionsController();

