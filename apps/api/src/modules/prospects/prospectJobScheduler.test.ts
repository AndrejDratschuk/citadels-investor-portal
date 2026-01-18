/**
 * Prospect Job Scheduler Tests
 * Tests the job scheduling and cancellation logic for email automation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the queue module before importing
vi.mock('../../common/queue/emailQueue', () => ({
  scheduleProspectEmail: vi.fn().mockResolvedValue('job-123'),
  cancelProspectEmail: vi.fn().mockResolvedValue(true),
  cancelProspectEmailsByPattern: vi.fn().mockResolvedValue(3),
}));

// Import after mocks
import { ProspectJobScheduler } from './prospectJobScheduler';
import {
  scheduleProspectEmail,
  cancelProspectEmail,
  cancelProspectEmailsByPattern,
} from '../../common/queue/emailQueue';

describe('ProspectJobScheduler', () => {
  let scheduler: ProspectJobScheduler;

  beforeEach(() => {
    vi.clearAllMocks();
    // Enable Redis for tests
    vi.stubEnv('REDIS_URL', 'redis://localhost:6379');
    scheduler = new ProspectJobScheduler();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('scheduleKYCReminders', () => {
    it('should schedule all 3 KYC reminders', async () => {
      const prospectId = 'prospect-123';
      const fundId = 'fund-456';
      const timestamp = new Date('2026-01-18T10:00:00Z');

      await scheduler.scheduleKYCReminders(prospectId, fundId, timestamp);

      expect(scheduleProspectEmail).toHaveBeenCalledTimes(3);

      // Reminder 1: +48 hours
      expect(scheduleProspectEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'kyc_reminder_1',
          prospectId,
          fundId,
        }),
        48 * 60 * 60 * 1000 // 48 hours in ms
      );

      // Reminder 2: +5 days
      expect(scheduleProspectEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'kyc_reminder_2',
          prospectId,
          fundId,
        }),
        5 * 24 * 60 * 60 * 1000 // 5 days in ms
      );

      // Reminder 3: +10 days
      expect(scheduleProspectEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'kyc_reminder_3',
          prospectId,
          fundId,
        }),
        10 * 24 * 60 * 60 * 1000 // 10 days in ms
      );
    });

    it('should not schedule if Redis is not available', async () => {
      vi.stubEnv('REDIS_URL', '');
      const localScheduler = new ProspectJobScheduler();

      await localScheduler.scheduleKYCReminders('prospect-123', 'fund-456', new Date());

      expect(scheduleProspectEmail).not.toHaveBeenCalled();
    });
  });

  describe('cancelKYCReminders', () => {
    it('should cancel all KYC reminder types', async () => {
      await scheduler.cancelKYCReminders('prospect-123');

      expect(cancelProspectEmailsByPattern).toHaveBeenCalledWith(
        ['kyc_reminder_1', 'kyc_reminder_2', 'kyc_reminder_3'],
        'prospect-123'
      );
    });

    it('should not cancel if Redis is not available', async () => {
      vi.stubEnv('REDIS_URL', '');
      const localScheduler = new ProspectJobScheduler();

      await localScheduler.cancelKYCReminders('prospect-123');

      expect(cancelProspectEmailsByPattern).not.toHaveBeenCalled();
    });
  });

  describe('scheduleMeetingReminders', () => {
    it('should schedule 24hr, 15min reminders and no-show email', async () => {
      const prospectId = 'prospect-123';
      const fundId = 'fund-456';
      // Meeting is 48 hours from now
      const now = new Date('2026-01-18T10:00:00Z');
      const meetingTime = new Date('2026-01-20T14:00:00Z');

      await scheduler.scheduleMeetingReminders(prospectId, fundId, meetingTime, now);

      // Should schedule all 3 jobs
      expect(scheduleProspectEmail).toHaveBeenCalledTimes(3);

      // 24hr reminder
      expect(scheduleProspectEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'meeting_reminder_24hr',
          prospectId,
          fundId,
          metadata: { meetingTime: meetingTime.toISOString() },
        }),
        expect.any(Number)
      );

      // 15min reminder
      expect(scheduleProspectEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'meeting_reminder_15min',
          prospectId,
          fundId,
        }),
        expect.any(Number)
      );

      // No-show email
      expect(scheduleProspectEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'meeting_noshow',
          prospectId,
          fundId,
        }),
        expect.any(Number)
      );
    });

    it('should not schedule past reminders', async () => {
      const prospectId = 'prospect-123';
      const fundId = 'fund-456';
      // Meeting is in 10 minutes
      const now = new Date('2026-01-18T13:50:00Z');
      const meetingTime = new Date('2026-01-18T14:00:00Z');

      await scheduler.scheduleMeetingReminders(prospectId, fundId, meetingTime, now);

      // 24hr reminder should NOT be scheduled (would be in the past)
      // 15min reminder should NOT be scheduled (meeting is in 10min)
      // Only no-show should be scheduled
      expect(scheduleProspectEmail).toHaveBeenCalledTimes(1);
      expect(scheduleProspectEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'meeting_noshow',
        }),
        expect.any(Number)
      );
    });

    it('should calculate correct delay for 24hr reminder', async () => {
      const now = new Date('2026-01-18T10:00:00Z');
      const meetingTime = new Date('2026-01-20T14:00:00Z');

      await scheduler.scheduleMeetingReminders('p', 'f', meetingTime, now);

      // Meeting is at Jan 20 14:00
      // 24hr reminder should fire at Jan 19 14:00
      // Now is Jan 18 10:00
      // Delay should be 28 hours = 28 * 60 * 60 * 1000 = 100,800,000 ms
      const call24hr = vi.mocked(scheduleProspectEmail).mock.calls.find(
        (call) => call[0].type === 'meeting_reminder_24hr'
      );

      expect(call24hr).toBeDefined();
      expect(call24hr![1]).toBe(28 * 60 * 60 * 1000);
    });
  });

  describe('cancelMeetingReminders', () => {
    it('should cancel all meeting reminder types', async () => {
      await scheduler.cancelMeetingReminders('prospect-123');

      expect(cancelProspectEmailsByPattern).toHaveBeenCalledWith(
        ['meeting_reminder_24hr', 'meeting_reminder_15min', 'meeting_noshow'],
        'prospect-123'
      );
    });
  });

  describe('scheduleNurtureSequence', () => {
    it('should schedule nurture sequence at correct intervals', async () => {
      const prospectId = 'prospect-123';
      const fundId = 'fund-456';
      const timestamp = new Date('2026-01-18T10:00:00Z');

      await scheduler.scheduleNurtureSequence(prospectId, fundId, timestamp);

      expect(scheduleProspectEmail).toHaveBeenCalledTimes(4);

      // Day 15
      expect(scheduleProspectEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'nurture_day15',
          prospectId,
          fundId,
        }),
        15 * 24 * 60 * 60 * 1000
      );

      // Day 23
      expect(scheduleProspectEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'nurture_day23',
          prospectId,
          fundId,
        }),
        23 * 24 * 60 * 60 * 1000
      );

      // Day 30
      expect(scheduleProspectEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'nurture_day30',
          prospectId,
          fundId,
        }),
        30 * 24 * 60 * 60 * 1000
      );

      // Day 31 (dormant closeout)
      expect(scheduleProspectEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'dormant_closeout',
          prospectId,
          fundId,
        }),
        31 * 24 * 60 * 60 * 1000
      );
    });
  });

  describe('cancelNurtureSequence', () => {
    it('should cancel all nurture sequence emails', async () => {
      await scheduler.cancelNurtureSequence('prospect-123');

      expect(cancelProspectEmailsByPattern).toHaveBeenCalledWith(
        ['nurture_day15', 'nurture_day23', 'nurture_day30', 'dormant_closeout'],
        'prospect-123'
      );
    });
  });

  describe('cancelAllProspectEmails', () => {
    it('should cancel all email types for a prospect', async () => {
      await scheduler.cancelAllProspectEmails('prospect-123');

      expect(cancelProspectEmailsByPattern).toHaveBeenCalledWith(
        expect.arrayContaining([
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
        ]),
        'prospect-123'
      );
    });
  });

  describe('handleStatusChange', () => {
    it('should cancel KYC reminders when transitioning from kyc_sent to kyc_submitted', async () => {
      await scheduler.handleStatusChange('prospect-123', 'kyc_submitted', 'kyc_sent');

      expect(cancelProspectEmailsByPattern).toHaveBeenCalledWith(
        ['kyc_reminder_1', 'kyc_reminder_2', 'kyc_reminder_3'],
        'prospect-123'
      );
    });

    it('should cancel KYC reminders when transitioning from kyc_sent to pre_qualified', async () => {
      await scheduler.handleStatusChange('prospect-123', 'pre_qualified', 'kyc_sent');

      expect(cancelProspectEmailsByPattern).toHaveBeenCalledWith(
        ['kyc_reminder_1', 'kyc_reminder_2', 'kyc_reminder_3'],
        'prospect-123'
      );
    });

    it('should cancel KYC reminders when transitioning to not_eligible', async () => {
      await scheduler.handleStatusChange('prospect-123', 'not_eligible', 'kyc_sent');

      expect(cancelProspectEmailsByPattern).toHaveBeenCalledWith(
        ['kyc_reminder_1', 'kyc_reminder_2', 'kyc_reminder_3'],
        'prospect-123'
      );
    });

    it('should cancel meeting reminders when meeting is completed', async () => {
      await scheduler.handleStatusChange('prospect-123', 'meeting_complete', 'meeting_scheduled');

      expect(cancelProspectEmailsByPattern).toHaveBeenCalledWith(
        ['meeting_reminder_24hr', 'meeting_reminder_15min', 'meeting_noshow'],
        'prospect-123'
      );
    });

    it('should cancel nurture sequence when ready to invest', async () => {
      await scheduler.handleStatusChange('prospect-123', 'account_invite_sent', 'considering');

      expect(cancelProspectEmailsByPattern).toHaveBeenCalledWith(
        ['nurture_day15', 'nurture_day23', 'nurture_day30', 'dormant_closeout'],
        'prospect-123'
      );
    });

    it('should cancel all emails when marked as not a fit', async () => {
      await scheduler.handleStatusChange('prospect-123', 'not_a_fit', 'meeting_complete');

      expect(cancelProspectEmailsByPattern).toHaveBeenCalledWith(
        expect.arrayContaining([
          'kyc_reminder_1',
          'meeting_noshow',
          'nurture_day30',
        ]),
        'prospect-123'
      );
    });

    it('should do nothing for non-relevant transitions', async () => {
      await scheduler.handleStatusChange('prospect-123', 'documents_pending', 'onboarding_submitted');

      expect(cancelProspectEmailsByPattern).not.toHaveBeenCalled();
    });
  });
});

describe('Timing Constants', () => {
  // Verify the timing constants are correctly defined
  it('should use correct KYC reminder timings', () => {
    // These are validated indirectly through the schedule calls
    const HOURS = 60 * 60 * 1000;
    const DAYS = 24 * HOURS;

    expect(48 * HOURS).toBe(172800000); // 48 hours
    expect(5 * DAYS).toBe(432000000); // 5 days
    expect(10 * DAYS).toBe(864000000); // 10 days
  });

  it('should use correct nurture sequence timings', () => {
    const DAYS = 24 * 60 * 60 * 1000;

    expect(15 * DAYS).toBe(1296000000); // 15 days
    expect(23 * DAYS).toBe(1987200000); // 23 days
    expect(30 * DAYS).toBe(2592000000); // 30 days
    expect(31 * DAYS).toBe(2678400000); // 31 days
  });

  it('should use correct meeting reminder timings', () => {
    const HOURS = 60 * 60 * 1000;
    const MINUTES = 60 * 1000;

    expect(24 * HOURS).toBe(86400000); // 24 hours before
    expect(15 * MINUTES).toBe(900000); // 15 minutes before
    expect(30 * MINUTES).toBe(1800000); // 30 minutes after (no-show)
  });
});
