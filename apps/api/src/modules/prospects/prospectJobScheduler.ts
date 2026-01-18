/**
 * Prospect Job Scheduler
 * Schedules delayed email jobs using BullMQ
 * Handles scheduling and cancellation of prospect pipeline emails
 */

import {
  scheduleProspectEmail,
  cancelProspectEmail,
  cancelProspectEmailsByPattern,
  ProspectEmailJobType,
} from '../../common/queue/emailQueue';

// Time constants in milliseconds
const HOURS = 60 * 60 * 1000;
const DAYS = 24 * HOURS;
const MINUTES = 60 * 1000;

// KYC reminder delays
const KYC_REMINDER_1_DELAY = 48 * HOURS; // +48 hours
const KYC_REMINDER_2_DELAY = 5 * DAYS; // +5 days
const KYC_REMINDER_3_DELAY = 10 * DAYS; // +10 days

// Nurture sequence delays (from "considering" status)
const NURTURE_DAY_15_DELAY = 15 * DAYS;
const NURTURE_DAY_23_DELAY = 23 * DAYS;
const NURTURE_DAY_30_DELAY = 30 * DAYS;
const DORMANT_CLOSEOUT_DELAY = 31 * DAYS;

// Meeting reminder offsets (before meeting time)
const MEETING_REMINDER_24HR = 24 * HOURS;
const MEETING_REMINDER_15MIN = 15 * MINUTES;
const MEETING_NOSHOW_DELAY = 30 * MINUTES; // After meeting was supposed to end

export class ProspectJobScheduler {
  /**
   * Check if Redis/BullMQ is available
   */
  private isQueueAvailable(): boolean {
    return !!process.env.REDIS_URL;
  }

  /**
   * Schedule KYC reminder sequence when KYC form is sent
   * Schedules reminders at 48hr, 5 days, and 10 days
   */
  async scheduleKYCReminders(
    prospectId: string,
    fundId: string,
    timestamp: Date
  ): Promise<void> {
    if (!this.isQueueAvailable()) {
      console.warn('[ProspectJobScheduler] Redis not available - KYC reminders not scheduled');
      return;
    }

    const scheduledAt = timestamp.toISOString();

    // Schedule all 3 reminders
    await Promise.all([
      scheduleProspectEmail(
        {
          type: 'kyc_reminder_1',
          prospectId,
          fundId,
          scheduledAt,
        },
        KYC_REMINDER_1_DELAY
      ),
      scheduleProspectEmail(
        {
          type: 'kyc_reminder_2',
          prospectId,
          fundId,
          scheduledAt,
        },
        KYC_REMINDER_2_DELAY
      ),
      scheduleProspectEmail(
        {
          type: 'kyc_reminder_3',
          prospectId,
          fundId,
          scheduledAt,
        },
        KYC_REMINDER_3_DELAY
      ),
    ]);

    console.log(`[ProspectJobScheduler] Scheduled KYC reminders for prospect ${prospectId}`);
  }

  /**
   * Cancel all KYC reminders when prospect completes or is rejected
   */
  async cancelKYCReminders(prospectId: string): Promise<void> {
    if (!this.isQueueAvailable()) return;

    const kycReminderTypes: ProspectEmailJobType[] = [
      'kyc_reminder_1',
      'kyc_reminder_2',
      'kyc_reminder_3',
    ];

    const cancelled = await cancelProspectEmailsByPattern(kycReminderTypes, prospectId);
    console.log(`[ProspectJobScheduler] Cancelled ${cancelled} KYC reminder(s) for prospect ${prospectId}`);
  }

  /**
   * Schedule meeting reminders when meeting is booked
   * @param meetingTime The scheduled meeting time
   */
  async scheduleMeetingReminders(
    prospectId: string,
    fundId: string,
    meetingTime: Date,
    timestamp: Date
  ): Promise<void> {
    if (!this.isQueueAvailable()) {
      console.warn('[ProspectJobScheduler] Redis not available - meeting reminders not scheduled');
      return;
    }

    const scheduledAt = timestamp.toISOString();
    const now = timestamp.getTime();
    const meetingMs = meetingTime.getTime();

    // Calculate delays (time until reminder should fire)
    const delay24hr = meetingMs - MEETING_REMINDER_24HR - now;
    const delay15min = meetingMs - MEETING_REMINDER_15MIN - now;
    const delayNoShow = meetingMs + MEETING_NOSHOW_DELAY - now;

    const jobs: Promise<string>[] = [];

    // Only schedule if the time hasn't passed
    if (delay24hr > 0) {
      jobs.push(
        scheduleProspectEmail(
          {
            type: 'meeting_reminder_24hr',
            prospectId,
            fundId,
            scheduledAt,
            metadata: { meetingTime: meetingTime.toISOString() },
          },
          delay24hr
        )
      );
    }

    if (delay15min > 0) {
      jobs.push(
        scheduleProspectEmail(
          {
            type: 'meeting_reminder_15min',
            prospectId,
            fundId,
            scheduledAt,
            metadata: { meetingTime: meetingTime.toISOString() },
          },
          delay15min
        )
      );
    }

    // Schedule no-show email (will be cancelled if meeting happens)
    if (delayNoShow > 0) {
      jobs.push(
        scheduleProspectEmail(
          {
            type: 'meeting_noshow',
            prospectId,
            fundId,
            scheduledAt,
            metadata: { meetingTime: meetingTime.toISOString() },
          },
          delayNoShow
        )
      );
    }

    await Promise.all(jobs);
    console.log(`[ProspectJobScheduler] Scheduled ${jobs.length} meeting reminder(s) for prospect ${prospectId}`);
  }

  /**
   * Cancel meeting reminders when meeting is rescheduled or completed
   */
  async cancelMeetingReminders(prospectId: string): Promise<void> {
    if (!this.isQueueAvailable()) return;

    const meetingReminderTypes: ProspectEmailJobType[] = [
      'meeting_reminder_24hr',
      'meeting_reminder_15min',
      'meeting_noshow',
    ];

    const cancelled = await cancelProspectEmailsByPattern(meetingReminderTypes, prospectId);
    console.log(`[ProspectJobScheduler] Cancelled ${cancelled} meeting reminder(s) for prospect ${prospectId}`);
  }

  /**
   * Schedule nurture sequence when prospect is marked as "considering"
   * Schedules emails at day 15, 23, 30, and dormant closeout at day 31
   */
  async scheduleNurtureSequence(
    prospectId: string,
    fundId: string,
    timestamp: Date
  ): Promise<void> {
    if (!this.isQueueAvailable()) {
      console.warn('[ProspectJobScheduler] Redis not available - nurture sequence not scheduled');
      return;
    }

    const scheduledAt = timestamp.toISOString();

    await Promise.all([
      scheduleProspectEmail(
        {
          type: 'nurture_day15',
          prospectId,
          fundId,
          scheduledAt,
        },
        NURTURE_DAY_15_DELAY
      ),
      scheduleProspectEmail(
        {
          type: 'nurture_day23',
          prospectId,
          fundId,
          scheduledAt,
        },
        NURTURE_DAY_23_DELAY
      ),
      scheduleProspectEmail(
        {
          type: 'nurture_day30',
          prospectId,
          fundId,
          scheduledAt,
        },
        NURTURE_DAY_30_DELAY
      ),
      scheduleProspectEmail(
        {
          type: 'dormant_closeout',
          prospectId,
          fundId,
          scheduledAt,
        },
        DORMANT_CLOSEOUT_DELAY
      ),
    ]);

    console.log(`[ProspectJobScheduler] Scheduled nurture sequence for prospect ${prospectId}`);
  }

  /**
   * Cancel nurture sequence when prospect clicks "Ready to Invest" or is closed
   */
  async cancelNurtureSequence(prospectId: string): Promise<void> {
    if (!this.isQueueAvailable()) return;

    const nurtureTypes: ProspectEmailJobType[] = [
      'nurture_day15',
      'nurture_day23',
      'nurture_day30',
      'dormant_closeout',
    ];

    const cancelled = await cancelProspectEmailsByPattern(nurtureTypes, prospectId);
    console.log(`[ProspectJobScheduler] Cancelled ${cancelled} nurture email(s) for prospect ${prospectId}`);
  }

  /**
   * Cancel all pending emails for a prospect
   * Used when prospect is marked as "not a fit" or otherwise closed out
   */
  async cancelAllProspectEmails(prospectId: string): Promise<void> {
    if (!this.isQueueAvailable()) return;

    const allTypes: ProspectEmailJobType[] = [
      'kyc_reminder_1',
      'kyc_reminder_2',
      'kyc_reminder_3',
      'meeting_reminder_24hr',
      'meeting_reminder_15min',
      'meeting_noshow',
      'nurture_day15',
      'nurture_day23',
      'nurture_day30',
      'dormant_closeout',
    ];

    const cancelled = await cancelProspectEmailsByPattern(allTypes, prospectId);
    console.log(`[ProspectJobScheduler] Cancelled all ${cancelled} pending email(s) for prospect ${prospectId}`);
  }

  /**
   * Handle suppression rules based on status change
   */
  async handleStatusChange(
    prospectId: string,
    newStatus: string,
    previousStatus: string
  ): Promise<void> {
    if (!this.isQueueAvailable()) return;

    // KYC completed (approved or submitted) - cancel KYC reminders
    if (
      (newStatus === 'kyc_submitted' || newStatus === 'pre_qualified') &&
      previousStatus === 'kyc_sent'
    ) {
      await this.cancelKYCReminders(prospectId);
    }

    // KYC not eligible - cancel KYC reminders
    if (newStatus === 'not_eligible' && previousStatus === 'kyc_sent') {
      await this.cancelKYCReminders(prospectId);
    }

    // Meeting completed - cancel meeting reminders and no-show
    if (newStatus === 'meeting_complete' && previousStatus === 'meeting_scheduled') {
      await this.cancelMeetingReminders(prospectId);
    }

    // Ready to invest (from considering) - cancel nurture sequence
    if (newStatus === 'account_invite_sent' && previousStatus === 'considering') {
      await this.cancelNurtureSequence(prospectId);
    }

    // Marked as not a fit or dormant - cancel all pending emails
    if (newStatus === 'not_a_fit') {
      await this.cancelAllProspectEmails(prospectId);
    }
  }
}

// Export singleton instance
export const prospectJobScheduler = new ProspectJobScheduler();

