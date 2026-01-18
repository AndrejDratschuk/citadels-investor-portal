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
import { teamInviteJobScheduler } from './teamInviteJobScheduler';
import { supabaseAdmin } from '../../common/database/supabase';

// Default platform name
const DEFAULT_PLATFORM_NAME = 'Altsui';

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

    // Get fund details and inviter info for email
    const { data: fund } = await supabaseAdmin
      .from('funds')
      .select('name, platform_name')
      .eq('id', request.user.fundId)
      .single();

    const { data: inviter } = await supabaseAdmin
      .from('users')
      .select('first_name, last_name, email')
      .eq('id', request.user.id)
      .single();

    const fundName = fund?.name || 'a fund';
    const platformName = fund?.platform_name || DEFAULT_PLATFORM_NAME;
    const inviterName = inviter 
      ? `${inviter.first_name || ''} ${inviter.last_name || ''}`.trim() || 'A team member'
      : 'A team member';
    const inviterEmail = inviter?.email || request.user.email;

    // Send invite email using proper template (07.01.A1)
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/accept?token=${invite.token}`;
    
    const emailResult = await emailService.sendTeamInvite(invite.email, {
      recipientEmail: invite.email,
      fundName,
      platformName,
      role: invite.role,
      inviterName,
      inviterEmail,
      acceptInviteUrl: inviteUrl,
      expiresInDays: 7,
    });

    if (!emailResult.success) {
      console.error('[Team Invites] Failed to send invite email:', emailResult.error);
      // Still return success with invite - the invite was created, email just failed
      reply.send({ success: true, invite, emailError: emailResult.error });
      return;
    }

    // Schedule automated reminder emails (Day 3 and Day 5)
    try {
      await teamInviteJobScheduler.scheduleInviteReminders(invite.id, request.user.fundId, timestamp);
    } catch (schedulerError) {
      // Don't fail the request if scheduler fails (Redis might not be available)
      console.error('[Team Invites] Failed to schedule reminders:', schedulerError);
    }

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

    // Get the invite ID from the token before accepting
    const { data: invite } = await supabaseAdmin
      .from('team_invites')
      .select('id')
      .eq('token', input.token)
      .single();

    const result = await acceptTeamInvite({ input, timestamp });

    // Cancel scheduled reminders after successful acceptance
    if (invite) {
      try {
        await teamInviteJobScheduler.cancelInviteReminders(invite.id);
      } catch (schedulerError) {
        console.error('[Team Invites] Failed to cancel reminders:', schedulerError);
      }
    }

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

    // Get fund and inviter info
    const { data: fund } = await supabaseAdmin
      .from('funds')
      .select('platform_name')
      .eq('id', request.user.fundId)
      .single();

    const { data: inviter } = await supabaseAdmin
      .from('users')
      .select('first_name, last_name')
      .eq('id', request.user.id)
      .single();

    const platformName = fund?.platform_name || DEFAULT_PLATFORM_NAME;
    const inviterName = inviter 
      ? `${inviter.first_name || ''} ${inviter.last_name || ''}`.trim() || 'A team member'
      : 'A team member';

    // Get the invite role
    const { data: invite } = await supabaseAdmin
      .from('team_invites')
      .select('role')
      .eq('id', inviteId)
      .single();

    // Send reminder email using proper template (07.01.A2)
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/accept?token=${token}`;
    
    const emailResult = await emailService.sendTeamInviteReminder(email, {
      recipientEmail: email,
      fundName,
      platformName,
      role: invite?.role || 'team member',
      inviterName,
      acceptInviteUrl: inviteUrl,
      daysRemaining: 7, // Reset to 7 days on resend
    });

    if (!emailResult.success) {
      console.error('[Team Invites] Failed to send resend email:', emailResult.error);
      reply.status(500).send({ error: emailResult.error || 'Failed to send email' });
      return;
    }

    // Cancel old reminders and schedule new ones
    try {
      await teamInviteJobScheduler.cancelInviteReminders(inviteId);
      await teamInviteJobScheduler.scheduleInviteReminders(inviteId, request.user.fundId, timestamp);
    } catch (schedulerError) {
      console.error('[Team Invites] Failed to reschedule reminders:', schedulerError);
    }

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

    // Cancel scheduled reminders
    try {
      await teamInviteJobScheduler.cancelInviteReminders(inviteId);
    } catch (schedulerError) {
      console.error('[Team Invites] Failed to cancel reminders:', schedulerError);
    }

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

