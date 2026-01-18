/**
 * Capital Call Job Scheduler
 * Manages scheduling and cancellation of delayed capital call emails using BullMQ
 */

import {
  scheduleCapitalCallEmail,
  cancelCapitalCallEmail,
  cancelCapitalCallEmailsByPattern,
  CapitalCallEmailJobType,
  isRedisAvailable,
} from '../../common/queue/emailQueue';

// Time constants
const DAYS = 24 * 60 * 60 * 1000;

/**
 * Delay constants for capital call reminders
 * Delays are calculated relative to the deadline
 */
export const CAPITAL_CALL_DELAYS = {
  REMINDER_7D: 7 * DAYS,   // Schedule to fire 7 days before deadline
  REMINDER_3D: 3 * DAYS,   // Schedule to fire 3 days before deadline
  REMINDER_1D: 1 * DAYS,   // Schedule to fire 1 day before deadline
  PAST_DUE: 0,             // Schedule to fire on deadline (handled by cron or immediate)
  PAST_DUE_7: 7 * DAYS,    // Schedule to fire 7 days after deadline
} as const;

// Job types for capital call reminders
const REMINDER_JOB_TYPES: CapitalCallEmailJobType[] = [
  'capital_call_reminder_7d',
  'capital_call_reminder_3d',
  'capital_call_reminder_1d',
];

// Job types for past due emails
const PAST_DUE_JOB_TYPES: CapitalCallEmailJobType[] = [
  'capital_call_past_due',
  'capital_call_past_due_7',
];

// All capital call job types
const ALL_CAPITAL_CALL_JOB_TYPES: CapitalCallEmailJobType[] = [
  ...REMINDER_JOB_TYPES,
  ...PAST_DUE_JOB_TYPES,
];

export class CapitalCallJobScheduler {
  /**
   * Schedule capital call reminder emails based on deadline
   * Called when a capital call is created
   * @param capitalCallItemId - The capital call item ID (investor-specific)
   * @param investorId - The investor ID
   * @param fundId - The fund ID
   * @param deadline - The capital call deadline
   * @param timestamp - Current timestamp (for scheduling calculations)
   */
  async scheduleCapitalCallReminders(
    capitalCallItemId: string,
    investorId: string,
    fundId: string,
    deadline: Date,
    timestamp: Date
  ): Promise<void> {
    if (!isRedisAvailable()) {
      console.warn('[CapitalCallJobScheduler] Redis not available - skipping reminder scheduling');
      return;
    }

    const scheduledAt = timestamp.toISOString();
    const deadlineTime = deadline.getTime();
    const now = timestamp.getTime();

    const schedulePromises: Promise<string>[] = [];

    // Schedule 7-day reminder if deadline is more than 7 days away
    const reminder7dTime = deadlineTime - CAPITAL_CALL_DELAYS.REMINDER_7D;
    if (reminder7dTime > now) {
      schedulePromises.push(
        scheduleCapitalCallEmail(
          {
            type: 'capital_call_reminder_7d',
            capitalCallItemId,
            investorId,
            fundId,
            scheduledAt,
          },
          reminder7dTime - now
        )
      );
    }

    // Schedule 3-day reminder if deadline is more than 3 days away
    const reminder3dTime = deadlineTime - CAPITAL_CALL_DELAYS.REMINDER_3D;
    if (reminder3dTime > now) {
      schedulePromises.push(
        scheduleCapitalCallEmail(
          {
            type: 'capital_call_reminder_3d',
            capitalCallItemId,
            investorId,
            fundId,
            scheduledAt,
          },
          reminder3dTime - now
        )
      );
    }

    // Schedule 1-day reminder if deadline is more than 1 day away
    const reminder1dTime = deadlineTime - CAPITAL_CALL_DELAYS.REMINDER_1D;
    if (reminder1dTime > now) {
      schedulePromises.push(
        scheduleCapitalCallEmail(
          {
            type: 'capital_call_reminder_1d',
            capitalCallItemId,
            investorId,
            fundId,
            scheduledAt,
          },
          reminder1dTime - now
        )
      );
    }

    await Promise.all(schedulePromises);

    console.log(
      `[CapitalCallJobScheduler] Scheduled ${schedulePromises.length} reminders for capital call item ${capitalCallItemId}`
    );
  }

  /**
   * Schedule past due email notifications
   * Called when a capital call is created to pre-schedule past due alerts
   * @param capitalCallItemId - The capital call item ID
   * @param investorId - The investor ID
   * @param fundId - The fund ID
   * @param deadline - The capital call deadline
   * @param timestamp - Current timestamp
   */
  async schedulePastDueEmails(
    capitalCallItemId: string,
    investorId: string,
    fundId: string,
    deadline: Date,
    timestamp: Date
  ): Promise<void> {
    if (!isRedisAvailable()) {
      console.warn('[CapitalCallJobScheduler] Redis not available - skipping past due scheduling');
      return;
    }

    const scheduledAt = timestamp.toISOString();
    const deadlineTime = deadline.getTime();
    const now = timestamp.getTime();

    const schedulePromises: Promise<string>[] = [];

    // Schedule past due email for deadline day (if deadline is in the future)
    if (deadlineTime > now) {
      schedulePromises.push(
        scheduleCapitalCallEmail(
          {
            type: 'capital_call_past_due',
            capitalCallItemId,
            investorId,
            fundId,
            scheduledAt,
          },
          deadlineTime - now
        )
      );
    }

    // Schedule +7 days past due email
    const pastDue7Time = deadlineTime + CAPITAL_CALL_DELAYS.PAST_DUE_7;
    if (pastDue7Time > now) {
      schedulePromises.push(
        scheduleCapitalCallEmail(
          {
            type: 'capital_call_past_due_7',
            capitalCallItemId,
            investorId,
            fundId,
            scheduledAt,
          },
          pastDue7Time - now
        )
      );
    }

    await Promise.all(schedulePromises);

    console.log(
      `[CapitalCallJobScheduler] Scheduled ${schedulePromises.length} past due emails for capital call item ${capitalCallItemId}`
    );
  }

  /**
   * Cancel all reminder emails for a capital call item
   * Called when wire is received before deadline
   */
  async cancelCapitalCallReminders(capitalCallItemId: string): Promise<void> {
    if (!isRedisAvailable()) {
      return;
    }

    const cancelled = await cancelCapitalCallEmailsByPattern(
      REMINDER_JOB_TYPES,
      capitalCallItemId
    );

    if (cancelled > 0) {
      console.log(
        `[CapitalCallJobScheduler] Cancelled ${cancelled} reminders for capital call item ${capitalCallItemId}`
      );
    }
  }

  /**
   * Cancel all past due emails for a capital call item
   * Called when wire is received or default is initiated
   */
  async cancelPastDueEmails(capitalCallItemId: string): Promise<void> {
    if (!isRedisAvailable()) {
      return;
    }

    const cancelled = await cancelCapitalCallEmailsByPattern(
      PAST_DUE_JOB_TYPES,
      capitalCallItemId
    );

    if (cancelled > 0) {
      console.log(
        `[CapitalCallJobScheduler] Cancelled ${cancelled} past due emails for capital call item ${capitalCallItemId}`
      );
    }
  }

  /**
   * Cancel all pending capital call emails for an item
   * Called when wire is received or capital call is cancelled
   */
  async cancelAllCapitalCallEmails(capitalCallItemId: string): Promise<void> {
    if (!isRedisAvailable()) {
      return;
    }

    const cancelled = await cancelCapitalCallEmailsByPattern(
      ALL_CAPITAL_CALL_JOB_TYPES,
      capitalCallItemId
    );

    if (cancelled > 0) {
      console.log(
        `[CapitalCallJobScheduler] Cancelled ${cancelled} capital call emails for item ${capitalCallItemId}`
      );
    }
  }

  /**
   * Handle capital call item status change - suppress relevant emails
   * @param capitalCallItemId - The capital call item ID
   * @param newStatus - The new status
   * @param oldStatus - The previous status
   */
  async handleStatusChange(
    capitalCallItemId: string,
    newStatus: string,
    oldStatus: string
  ): Promise<void> {
    // Wire received (paid) - cancel all pending emails
    if (newStatus === 'paid' && oldStatus !== 'paid') {
      await this.cancelAllCapitalCallEmails(capitalCallItemId);
    }

    // Default initiated - cancel past due emails (default notice takes over)
    if (newStatus === 'defaulted') {
      await this.cancelPastDueEmails(capitalCallItemId);
    }

    // Cancelled - cancel all pending emails
    if (newStatus === 'cancelled') {
      await this.cancelAllCapitalCallEmails(capitalCallItemId);
    }
  }
}

// Singleton instance
export const capitalCallJobScheduler = new CapitalCallJobScheduler();
