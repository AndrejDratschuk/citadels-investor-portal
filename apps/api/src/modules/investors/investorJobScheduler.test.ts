/**
 * Investor Job Scheduler Tests
 * Tests for scheduling and cancellation of investor onboarding email jobs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the email queue module
vi.mock('../../common/queue/emailQueue', () => ({
  scheduleInvestorEmail: vi.fn().mockResolvedValue('job-id'),
  cancelInvestorEmail: vi.fn().mockResolvedValue(true),
  cancelInvestorEmailsByPattern: vi.fn().mockResolvedValue(3),
  isRedisAvailable: vi.fn().mockReturnValue(true),
}));

// Import after mocks
import {
  InvestorJobScheduler,
  investorJobScheduler,
  ONBOARDING_DELAYS,
  SIGNATURE_DELAYS,
} from './investorJobScheduler';

import {
  scheduleInvestorEmail,
  cancelInvestorEmail,
  cancelInvestorEmailsByPattern,
  isRedisAvailable,
} from '../../common/queue/emailQueue';

describe('InvestorJobScheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ONBOARDING_DELAYS', () => {
    it('should have correct delay values', () => {
      const HOURS = 60 * 60 * 1000;
      expect(ONBOARDING_DELAYS.REMINDER_1).toBe(48 * HOURS);
      expect(ONBOARDING_DELAYS.REMINDER_2).toBe(96 * HOURS);
      expect(ONBOARDING_DELAYS.REMINDER_3).toBe(144 * HOURS);
    });
  });

  describe('SIGNATURE_DELAYS', () => {
    it('should have correct delay values', () => {
      const HOURS = 60 * 60 * 1000;
      expect(SIGNATURE_DELAYS.REMINDER_1).toBe(48 * HOURS);
      expect(SIGNATURE_DELAYS.REMINDER_2).toBe(96 * HOURS);
    });
  });

  describe('scheduleOnboardingReminders', () => {
    it('should schedule all three onboarding reminders', async () => {
      const timestamp = new Date('2026-01-18T10:00:00Z');

      await investorJobScheduler.scheduleOnboardingReminders(
        'investor-123',
        'fund-456',
        timestamp
      );

      expect(scheduleInvestorEmail).toHaveBeenCalledTimes(3);

      // Verify reminder 1
      expect(scheduleInvestorEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'onboarding_reminder_1',
          investorId: 'investor-123',
          fundId: 'fund-456',
          scheduledAt: timestamp.toISOString(),
        }),
        ONBOARDING_DELAYS.REMINDER_1
      );

      // Verify reminder 2
      expect(scheduleInvestorEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'onboarding_reminder_2',
          investorId: 'investor-123',
          fundId: 'fund-456',
        }),
        ONBOARDING_DELAYS.REMINDER_2
      );

      // Verify reminder 3
      expect(scheduleInvestorEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'onboarding_reminder_3',
          investorId: 'investor-123',
          fundId: 'fund-456',
        }),
        ONBOARDING_DELAYS.REMINDER_3
      );
    });

    it('should not schedule if Redis is unavailable', async () => {
      vi.mocked(isRedisAvailable).mockReturnValueOnce(false);

      await investorJobScheduler.scheduleOnboardingReminders(
        'investor-123',
        'fund-456',
        new Date()
      );

      expect(scheduleInvestorEmail).not.toHaveBeenCalled();
    });
  });

  describe('cancelOnboardingReminders', () => {
    it('should cancel all onboarding reminder types', async () => {
      await investorJobScheduler.cancelOnboardingReminders('investor-123');

      expect(cancelInvestorEmailsByPattern).toHaveBeenCalledWith(
        [
          'onboarding_reminder_1',
          'onboarding_reminder_2',
          'onboarding_reminder_3',
        ],
        'investor-123'
      );
    });

    it('should not cancel if Redis is unavailable', async () => {
      vi.mocked(isRedisAvailable).mockReturnValueOnce(false);

      await investorJobScheduler.cancelOnboardingReminders('investor-123');

      expect(cancelInvestorEmailsByPattern).not.toHaveBeenCalled();
    });
  });

  describe('scheduleSignatureReminders', () => {
    it('should schedule both signature reminders', async () => {
      const timestamp = new Date('2026-01-18T14:00:00Z');

      await investorJobScheduler.scheduleSignatureReminders(
        'investor-123',
        'fund-456',
        timestamp
      );

      expect(scheduleInvestorEmail).toHaveBeenCalledTimes(2);

      // Verify reminder 1
      expect(scheduleInvestorEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'signature_reminder_1',
          investorId: 'investor-123',
          fundId: 'fund-456',
          scheduledAt: timestamp.toISOString(),
        }),
        SIGNATURE_DELAYS.REMINDER_1
      );

      // Verify reminder 2
      expect(scheduleInvestorEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'signature_reminder_2',
          investorId: 'investor-123',
          fundId: 'fund-456',
        }),
        SIGNATURE_DELAYS.REMINDER_2
      );
    });

    it('should not schedule if Redis is unavailable', async () => {
      vi.mocked(isRedisAvailable).mockReturnValueOnce(false);

      await investorJobScheduler.scheduleSignatureReminders(
        'investor-123',
        'fund-456',
        new Date()
      );

      expect(scheduleInvestorEmail).not.toHaveBeenCalled();
    });
  });

  describe('cancelSignatureReminders', () => {
    it('should cancel all signature reminder types', async () => {
      await investorJobScheduler.cancelSignatureReminders('investor-123');

      expect(cancelInvestorEmailsByPattern).toHaveBeenCalledWith(
        ['signature_reminder_1', 'signature_reminder_2'],
        'investor-123'
      );
    });

    it('should not cancel if Redis is unavailable', async () => {
      vi.mocked(isRedisAvailable).mockReturnValueOnce(false);

      await investorJobScheduler.cancelSignatureReminders('investor-123');

      expect(cancelInvestorEmailsByPattern).not.toHaveBeenCalled();
    });
  });

  describe('cancelAllInvestorEmails', () => {
    it('should cancel all investor email job types', async () => {
      await investorJobScheduler.cancelAllInvestorEmails('investor-123');

      expect(cancelInvestorEmailsByPattern).toHaveBeenCalledWith(
        [
          'onboarding_reminder_1',
          'onboarding_reminder_2',
          'onboarding_reminder_3',
          'signature_reminder_1',
          'signature_reminder_2',
        ],
        'investor-123'
      );
    });

    it('should not cancel if Redis is unavailable', async () => {
      vi.mocked(isRedisAvailable).mockReturnValueOnce(false);

      await investorJobScheduler.cancelAllInvestorEmails('investor-123');

      expect(cancelInvestorEmailsByPattern).not.toHaveBeenCalled();
    });
  });

  describe('handleStatusChange', () => {
    it('should cancel onboarding reminders when profile is completed', async () => {
      await investorJobScheduler.handleStatusChange(
        'investor-123',
        'documents_pending',
        'account_created'
      );

      expect(cancelInvestorEmailsByPattern).toHaveBeenCalledWith(
        [
          'onboarding_reminder_1',
          'onboarding_reminder_2',
          'onboarding_reminder_3',
        ],
        'investor-123'
      );
    });

    it('should cancel signature reminders when documents are signed', async () => {
      await investorJobScheduler.handleStatusChange(
        'investor-123',
        'documents_signed',
        'documents_sent'
      );

      expect(cancelInvestorEmailsByPattern).toHaveBeenCalledWith(
        ['signature_reminder_1', 'signature_reminder_2'],
        'investor-123'
      );
    });

    it('should cancel all emails when status becomes inactive', async () => {
      await investorJobScheduler.handleStatusChange(
        'investor-123',
        'inactive',
        'documents_pending'
      );

      expect(cancelInvestorEmailsByPattern).toHaveBeenCalledWith(
        [
          'onboarding_reminder_1',
          'onboarding_reminder_2',
          'onboarding_reminder_3',
          'signature_reminder_1',
          'signature_reminder_2',
        ],
        'investor-123'
      );
    });

    it('should cancel all emails when status becomes active (converted)', async () => {
      await investorJobScheduler.handleStatusChange(
        'investor-123',
        'active',
        'documents_signed'
      );

      expect(cancelInvestorEmailsByPattern).toHaveBeenCalledWith(
        [
          'onboarding_reminder_1',
          'onboarding_reminder_2',
          'onboarding_reminder_3',
          'signature_reminder_1',
          'signature_reminder_2',
        ],
        'investor-123'
      );
    });

    it('should not cancel anything for unrelated status changes', async () => {
      await investorJobScheduler.handleStatusChange(
        'investor-123',
        'documents_approved',
        'documents_pending'
      );

      expect(cancelInvestorEmailsByPattern).not.toHaveBeenCalled();
    });
  });
});

describe('Delay Calculations', () => {
  it('reminder 1 should be 48 hours', () => {
    const expectedMs = 48 * 60 * 60 * 1000;
    expect(ONBOARDING_DELAYS.REMINDER_1).toBe(expectedMs);
  });

  it('reminder 2 should be 96 hours (4 days)', () => {
    const expectedMs = 96 * 60 * 60 * 1000;
    expect(ONBOARDING_DELAYS.REMINDER_2).toBe(expectedMs);
  });

  it('reminder 3 should be 144 hours (6 days)', () => {
    const expectedMs = 144 * 60 * 60 * 1000;
    expect(ONBOARDING_DELAYS.REMINDER_3).toBe(expectedMs);
  });

  it('signature reminder 1 should be 48 hours', () => {
    const expectedMs = 48 * 60 * 60 * 1000;
    expect(SIGNATURE_DELAYS.REMINDER_1).toBe(expectedMs);
  });

  it('signature reminder 2 should be 96 hours', () => {
    const expectedMs = 96 * 60 * 60 * 1000;
    expect(SIGNATURE_DELAYS.REMINDER_2).toBe(expectedMs);
  });
});

describe('Singleton Instance', () => {
  it('should export a singleton instance', () => {
    expect(investorJobScheduler).toBeInstanceOf(InvestorJobScheduler);
  });

  it('should be the same instance across imports', async () => {
    const { investorJobScheduler: anotherImport } = await import('./investorJobScheduler');
    expect(investorJobScheduler).toBe(anotherImport);
  });
});
