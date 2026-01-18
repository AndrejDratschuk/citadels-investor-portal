/**
 * Team Invite Email Triggers
 * Handles sending team invite reminder emails
 * Follows the Operator pattern - bubbles errors up, no try/catch
 */

import { supabaseAdmin } from '../../common/database/supabase';
import { emailService } from '../email/email.service';
import type { TeamInviteReminderTemplateData } from '../email/templates';

// Default platform name
const DEFAULT_PLATFORM_NAME = 'Altsui';

/**
 * Get invite details for sending reminder
 */
async function getInviteDetails(inviteId: string): Promise<{
  email: string;
  role: string;
  fundName: string;
  platformName: string;
  inviterName: string;
  acceptInviteUrl: string;
} | null> {
  const { data: invite, error } = await supabaseAdmin
    .from('team_invites')
    .select(`
      email,
      role,
      token,
      status,
      fund:funds(name, platform_name),
      inviter:users!team_invites_invited_by_fkey(first_name, last_name)
    `)
    .eq('id', inviteId)
    .single();

  if (error || !invite) {
    console.error(`[TeamInviteEmailTriggers] Invite not found: ${inviteId}`);
    return null;
  }

  // Don't send if invite is no longer pending
  if (invite.status !== 'pending') {
    console.log(`[TeamInviteEmailTriggers] Invite ${inviteId} is ${invite.status}, skipping reminder`);
    return null;
  }

  const fundData = invite.fund as { name: string; platform_name?: string } | null;
  const inviterData = invite.inviter as { first_name?: string; last_name?: string } | null;

  const fundName = fundData?.name || 'Unknown Fund';
  const platformName = fundData?.platform_name || DEFAULT_PLATFORM_NAME;
  const inviterName = inviterData 
    ? `${inviterData.first_name || ''} ${inviterData.last_name || ''}`.trim() || 'A team member'
    : 'A team member';

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const acceptInviteUrl = `${baseUrl}/invite/accept?token=${invite.token}`;

  return {
    email: invite.email,
    role: invite.role,
    fundName,
    platformName,
    inviterName,
    acceptInviteUrl,
  };
}

export class TeamInviteEmailTriggers {
  /**
   * Send a scheduled reminder email for a team invite
   * Called by the email worker for Day 3 and Day 5 reminders
   * @param inviteId - The team invite ID
   * @param fundId - The fund ID (for logging)
   * @param daysRemaining - Days until invite expires
   * @param timestamp - Injected timestamp from orchestrator
   */
  async sendScheduledReminder(
    inviteId: string,
    fundId: string,
    daysRemaining: number,
    timestamp: Date
  ): Promise<void> {
    const details = await getInviteDetails(inviteId);
    
    if (!details) {
      // Invite not found or no longer pending - silently skip
      return;
    }

    const templateData: TeamInviteReminderTemplateData = {
      recipientEmail: details.email,
      fundName: details.fundName,
      platformName: details.platformName,
      role: details.role,
      inviterName: details.inviterName,
      acceptInviteUrl: details.acceptInviteUrl,
      daysRemaining,
    };

    const result = await emailService.sendTeamInviteReminder(details.email, templateData);

    if (result.success) {
      console.log(
        `[TeamInviteEmailTriggers] Sent reminder for invite ${inviteId} ` +
        `(${daysRemaining} days remaining)`
      );
    } else {
      console.error(
        `[TeamInviteEmailTriggers] Failed to send reminder for invite ${inviteId}: ${result.error}`
      );
      throw new Error(`Failed to send team invite reminder: ${result.error}`);
    }
  }
}

// Export singleton instance
export const teamInviteEmailTriggers = new TeamInviteEmailTriggers();
