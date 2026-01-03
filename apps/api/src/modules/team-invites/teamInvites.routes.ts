import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../common/middleware/auth.middleware';
import {
  createTeamInviteHandler,
  listTeamHandler,
  verifyTokenHandler,
  acceptInviteHandler,
  resendInviteHandler,
  cancelInviteHandler,
  updateMemberRoleHandler,
  removeMemberHandler,
} from './teamInvites.controller';

export async function teamInvitesRoutes(fastify: FastifyInstance): Promise<void> {
  // Public routes (no auth required)
  fastify.get('/verify', verifyTokenHandler);
  fastify.post('/accept', acceptInviteHandler);

  // Protected routes (auth required)
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('preHandler', authMiddleware);

    // List team members and pending invites
    protectedRoutes.get('/team', listTeamHandler);

    // Create new invite
    protectedRoutes.post('/', createTeamInviteHandler);

    // Resend invite
    protectedRoutes.post('/:inviteId/resend', resendInviteHandler);

    // Cancel invite
    protectedRoutes.post('/:inviteId/cancel', cancelInviteHandler);

    // Update team member role
    protectedRoutes.patch('/members/:userId/role', updateMemberRoleHandler);

    // Remove team member
    protectedRoutes.delete('/members/:userId', removeMemberHandler);
  });
}

