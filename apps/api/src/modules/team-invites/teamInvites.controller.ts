import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  createTeamInviteSchema,
  acceptTeamInviteSchema,
  verifyTeamInviteTokenSchema,
  cancelTeamInviteSchema,
  resendTeamInviteSchema,
  updateTeamMemberRoleSchema,
  removeTeamMemberSchema,
} from '@altsui/shared';
import { createTeamInvite } from './createTeamInvite.service';
import { listTeamMembers, verifyInviteToken } from './listTeamInvites.service';
import { acceptTeamInvite } from './acceptTeamInvite.service';
import { 
  cancelTeamInvite, 
  resendTeamInvite, 
  updateTeamMemberRole,
  removeTeamMember,
} from './cancelTeamInvite.service';
import { generateInviteToken } from './generateInviteToken';
import { emailService } from '../email/email.service';

interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    email: string;
    role: string;
    fundId: string;
  };
}

/**
 * Create team invite - Orchestrator
 * Handles errors, injects dependencies (timestamp, tokenGenerator)
 */
export async function createTeamInviteHandler(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const input = createTeamInviteSchema.parse(request.body);
    const timestamp = new Date();

    if (request.user.role !== 'manager') {
      reply.status(403).send({ error: 'Only managers can invite team members' });
      return;
    }

    const invite = await createTeamInvite({
      input,
      fundId: request.user.fundId,
      invitedByUserId: request.user.id,
      timestamp,
      tokenGenerator: generateInviteToken,
    });

    // Get fund name for email
    const { data: fund } = await import('../../common/database/supabase')
      .then(m => m.supabaseAdmin.from('funds').select('name').eq('id', request.user.fundId).single());

    // Send invite email - use the actual token, not the invite id
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/accept?token=${invite.token}`;
    
    // Use Resend to send invite email
    await emailService.sendEmail({
      to: invite.email,
      subject: `You've been invited to join ${fund?.name || 'a fund'} on Altsui`,
      body: `You've been invited to join ${fund?.name || 'a fund'} as a ${invite.role}. Click here to accept: ${inviteUrl}`,
    });

    reply.send({ success: true, invite });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create invite';
    reply.status(400).send({ error: message });
  }
}

/**
 * List team members - Orchestrator
 */
export async function listTeamHandler(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const result = await listTeamMembers(request.user.fundId);
    reply.send(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list team';
    reply.status(500).send({ error: message });
  }
}

/**
 * Verify invite token - Orchestrator (public endpoint)
 */
export async function verifyTokenHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const { token } = verifyTeamInviteTokenSchema.parse(request.query);
    const timestamp = new Date();
    
    const result = await verifyInviteToken(token, timestamp);
    reply.send(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to verify token';
    reply.status(400).send({ error: message });
  }
}

/**
 * Accept invite - Orchestrator (public endpoint)
 */
export async function acceptInviteHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const input = acceptTeamInviteSchema.parse(request.body);
    const timestamp = new Date();

    const result = await acceptTeamInvite({ input, timestamp });
    reply.send({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to accept invite';
    reply.status(400).send({ error: message });
  }
}

/**
 * Resend invite - Orchestrator
 */
export async function resendInviteHandler(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const { inviteId } = request.params as { inviteId: string };
    const timestamp = new Date();

    if (request.user.role !== 'manager') {
      reply.status(403).send({ error: 'Only managers can resend invites' });
      return;
    }

    const { email, fundName, token } = await resendTeamInvite(
      inviteId,
      request.user.fundId,
      timestamp
    );

    // Send invite email again
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/accept?token=${token}`;
    
    await emailService.sendEmail({
      to: email,
      subject: `Reminder: You've been invited to join ${fundName} on Altsui`,
      body: `You've been invited to join ${fundName}. Click here to accept: ${inviteUrl}`,
    });

    reply.send({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to resend invite';
    reply.status(400).send({ error: message });
  }
}

/**
 * Cancel invite - Orchestrator
 */
export async function cancelInviteHandler(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const { inviteId } = request.params as { inviteId: string };
    const timestamp = new Date();

    if (request.user.role !== 'manager') {
      reply.status(403).send({ error: 'Only managers can cancel invites' });
      return;
    }

    await cancelTeamInvite(inviteId, request.user.fundId, timestamp);
    reply.send({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel invite';
    reply.status(400).send({ error: message });
  }
}

/**
 * Update team member role - Orchestrator
 */
export async function updateMemberRoleHandler(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const { userId } = request.params as { userId: string };
    const { role } = updateTeamMemberRoleSchema.parse({ ...request.body, userId });

    if (request.user.role !== 'manager') {
      reply.status(403).send({ error: 'Only managers can update roles' });
      return;
    }

    if (userId === request.user.id) {
      reply.status(400).send({ error: 'You cannot change your own role' });
      return;
    }

    await updateTeamMemberRole(userId, request.user.fundId, role);
    reply.send({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update role';
    reply.status(400).send({ error: message });
  }
}

/**
 * Remove team member - Orchestrator
 */
export async function removeMemberHandler(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const { userId } = request.params as { userId: string };

    if (request.user.role !== 'manager') {
      reply.status(403).send({ error: 'Only managers can remove members' });
      return;
    }

    if (userId === request.user.id) {
      reply.status(400).send({ error: 'You cannot remove yourself' });
      return;
    }

    await removeTeamMember(userId, request.user.fundId);
    reply.send({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove member';
    reply.status(400).send({ error: message });
  }
}

