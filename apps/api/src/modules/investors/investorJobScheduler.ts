/**
 * Investor Job Scheduler
 * Manages scheduling and cancellation of delayed investor onboarding emails using BullMQ
 */

import {
  scheduleInvestorEmail,
  cancelInvestorEmail,
  cancelInvestorEmailsByPattern,
  InvestorEmailJobType,
  isRedisAvailable,
} from '../../common/queue/emailQueue';

// Delay constants in milliseconds
const HOURS = 60 * 60 * 1000;

export const ONBOARDING_DELAYS = {
  REMINDER_1: 48 * HOURS,  // +48 hours after account created
  REMINDER_2: 96 * HOURS,  // +96 hours after account created
  REMINDER_3: 144 * HOURS, // +144 hours (6 days) after account created
} as const;

export const SIGNATURE_DELAYS = {
  REMINDER_1: 48 * HOURS, // +48 hours after docs sent for signature
  REMINDER_2: 96 * HOURS, // +96 hours after docs sent for signature
} as const;

// Job types for onboarding reminders
const ONBOARDING_REMINDER_TYPES: InvestorEmailJobType[] = [
  'onboarding_reminder_1',
  'onboarding_reminder_2',
  'onboarding_reminder_3',
];

// Job types for signature reminders
const SIGNATURE_REMINDER_TYPES: InvestorEmailJobType[] = [
  'signature_reminder_1',
  'signature_reminder_2',
];

// All investor email job types
const ALL_INVESTOR_JOB_TYPES: InvestorEmailJobType[] = [
  ...ONBOARDING_REMINDER_TYPES,
  ...SIGNATURE_REMINDER_TYPES,
];

export class InvestorJobScheduler {
  /**
   * Schedule all onboarding reminder emails
   * Called when investor account is created
   */
  async scheduleOnboardingReminders(
    investorId: string,
    fundId: string,
    timestamp: Date
  ): Promise<void> {
    if (!isRedisAvailable()) {
      console.warn('[InvestorJobScheduler] Redis not available - skipping reminder scheduling');
      return;
    }

    const scheduledAt = timestamp.toISOString();

    await Promise.all([
      scheduleInvestorEmail(
        {
          type: 'onboarding_reminder_1',
          investorId,
          fundId,
          scheduledAt,
        },
        ONBOARDING_DELAYS.REMINDER_1
      ),
      scheduleInvestorEmail(
        {
          type: 'onboarding_reminder_2',
          investorId,
          fundId,
          scheduledAt,
        },
        ONBOARDING_DELAYS.REMINDER_2
      ),
      scheduleInvestorEmail(
        {
          type: 'onboarding_reminder_3',
          investorId,
          fundId,
          scheduledAt,
        },
        ONBOARDING_DELAYS.REMINDER_3
      ),
    ]);

    console.log(
      `[InvestorJobScheduler] Scheduled onboarding reminders for investor ${investorId}`
    );
  }

  /**
   * Cancel all onboarding reminder emails
   * Called when investor completes profile or is deactivated
   */
  async cancelOnboardingReminders(investorId: string): Promise<void> {
    if (!isRedisAvailable()) {
      return;
    }

    const cancelled = await cancelInvestorEmailsByPattern(
      ONBOARDING_REMINDER_TYPES,
      investorId
    );

    if (cancelled > 0) {
      console.log(
        `[InvestorJobScheduler] Cancelled ${cancelled} onboarding reminders for investor ${investorId}`
      );
    }
  }

  /**
   * Schedule signature reminder emails
   * Called when documents are sent for signature
   */
  async scheduleSignatureReminders(
    investorId: string,
    fundId: string,
    timestamp: Date
  ): Promise<void> {
    if (!isRedisAvailable()) {
      console.warn('[InvestorJobScheduler] Redis not available - skipping reminder scheduling');
      return;
    }

    const scheduledAt = timestamp.toISOString();

    await Promise.all([
      scheduleInvestorEmail(
        {
          type: 'signature_reminder_1',
          investorId,
          fundId,
          scheduledAt,
        },
        SIGNATURE_DELAYS.REMINDER_1
      ),
      scheduleInvestorEmail(
        {
          type: 'signature_reminder_2',
          investorId,
          fundId,
          scheduledAt,
        },
        SIGNATURE_DELAYS.REMINDER_2
      ),
    ]);

    console.log(
      `[InvestorJobScheduler] Scheduled signature reminders for investor ${investorId}`
    );
  }

  /**
   * Cancel all signature reminder emails
   * Called when investor signs documents
   */
  async cancelSignatureReminders(investorId: string): Promise<void> {
    if (!isRedisAvailable()) {
      return;
    }

    const cancelled = await cancelInvestorEmailsByPattern(
      SIGNATURE_REMINDER_TYPES,
      investorId
    );

    if (cancelled > 0) {
      console.log(
        `[InvestorJobScheduler] Cancelled ${cancelled} signature reminders for investor ${investorId}`
      );
    }
  }

  /**
   * Cancel all pending investor emails
   * Called when investor is converted or deactivated
   */
  async cancelAllInvestorEmails(investorId: string): Promise<void> {
    if (!isRedisAvailable()) {
      return;
    }

    const cancelled = await cancelInvestorEmailsByPattern(
      ALL_INVESTOR_JOB_TYPES,
      investorId
    );

    if (cancelled > 0) {
      console.log(
        `[InvestorJobScheduler] Cancelled ${cancelled} investor emails for investor ${investorId}`
      );
    }
  }

  /**
   * Handle investor status change - suppress relevant emails
   * @param investorId - The investor ID
   * @param newStatus - The new investor status
   * @param oldStatus - The previous investor status
   */
  async handleStatusChange(
    investorId: string,
    newStatus: string,
    oldStatus: string
  ): Promise<void> {
    // Suppress onboarding reminders when profile is completed
    if (newStatus === 'documents_pending' && oldStatus === 'account_created') {
      await this.cancelOnboardingReminders(investorId);
    }

    // Suppress signature reminders when documents are signed
    if (newStatus === 'documents_signed' && oldStatus === 'documents_sent') {
      await this.cancelSignatureReminders(investorId);
    }

    // Cancel all emails when investor becomes inactive or is converted
    if (newStatus === 'inactive' || newStatus === 'active') {
      await this.cancelAllInvestorEmails(investorId);
    }
  }
}

// Singleton instance
export const investorJobScheduler = new InvestorJobScheduler();
