/**
 * Team Invite Job Scheduler
 * Schedules delayed email jobs using BullMQ for team invite reminders
 * Follows the pattern from prospectJobScheduler.ts
 */

import {
  scheduleTeamInviteEmail,
  cancelTeamInviteEmail,
  cancelTeamInviteEmailsByPattern,
  TeamInviteEmailJobType,
  isRedisAvailable,
} from '../../common/queue/emailQueue';

// Time constants in milliseconds
const DAYS = 24 * 60 * 60 * 1000;

// Team invite reminder delays (from invite creation)
const REMINDER_DAY_3_DELAY = 3 * DAYS;
const REMINDER_DAY_5_DELAY = 5 * DAYS;

export class TeamInviteJobScheduler {
  /**
   * Check if Redis/BullMQ is available
   */
  private isQueueAvailable(): boolean {
    return isRedisAvailable();
  }

  /**
   * Schedule team invite reminder sequence when invite is created
   * Schedules reminders at Day 3 and Day 5
   * @param inviteId - The team invite ID
   * @param fundId - The fund ID
   * @param timestamp - Injected timestamp (orchestrator provides this)
   */
  async scheduleInviteReminders(
    inviteId: string,
    fundId: string,
    timestamp: Date
  ): Promise<void> {
    if (!this.isQueueAvailable()) {
      console.warn('[TeamInviteJobScheduler] Redis not available - invite reminders not scheduled');
      return;
    }

    const scheduledAt = timestamp.toISOString();

    // Schedule both reminders
    await Promise.all([
      scheduleTeamInviteEmail(
        {
          type: 'team_invite_reminder_3d',
          inviteId,
          fundId,
          scheduledAt,
        },
        REMINDER_DAY_3_DELAY
      ),
      scheduleTeamInviteEmail(
        {
          type: 'team_invite_reminder_5d',
          inviteId,
          fundId,
          scheduledAt,
        },
        REMINDER_DAY_5_DELAY
      ),
    ]);

    console.log(`[TeamInviteJobScheduler] Scheduled invite reminders for invite ${inviteId}`);
  }

  /**
   * Cancel all pending reminders for an invite
   * Called when invite is accepted, cancelled, or manually resent
   */
  async cancelInviteReminders(inviteId: string): Promise<void> {
    if (!this.isQueueAvailable()) return;

    const reminderTypes: TeamInviteEmailJobType[] = [
      'team_invite_reminder_3d',
      'team_invite_reminder_5d',
    ];

    const cancelled = await cancelTeamInviteEmailsByPattern(reminderTypes, inviteId);
    console.log(`[TeamInviteJobScheduler] Cancelled ${cancelled} reminder(s) for invite ${inviteId}`);
  }

  /**
   * Cancel a specific reminder type
   */
  async cancelSpecificReminder(inviteId: string, type: TeamInviteEmailJobType): Promise<boolean> {
    if (!this.isQueueAvailable()) return false;

    return cancelTeamInviteEmail(type, inviteId);
  }
}

// Export singleton instance
export const teamInviteJobScheduler = new TeamInviteJobScheduler();
