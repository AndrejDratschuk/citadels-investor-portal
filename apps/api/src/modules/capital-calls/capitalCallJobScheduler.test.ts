/**
 * Capital Call Job Scheduler Tests
 * Tests for scheduling and cancellation of capital call reminder emails
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the email queue module
vi.mock('../../common/queue/emailQueue', () => ({
  scheduleCapitalCallEmail: vi.fn().mockResolvedValue('job-id'),
  cancelCapitalCallEmail: vi.fn().mockResolvedValue(true),
  cancelCapitalCallEmailsByPattern: vi.fn().mockResolvedValue(3),
  isRedisAvailable: vi.fn().mockReturnValue(true),
}));

// Import after mocks
import {
  CapitalCallJobScheduler,
  capitalCallJobScheduler,
  CAPITAL_CALL_DELAYS,
} from './capitalCallJobScheduler';

import {
  scheduleCapitalCallEmail,
  cancelCapitalCallEmail,
  cancelCapitalCallEmailsByPattern,
  isRedisAvailable,
} from '../../common/queue/emailQueue';

describe('CapitalCallJobScheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CAPITAL_CALL_DELAYS', () => {
    it('should have correct delay values', () => {
      const DAYS = 24 * 60 * 60 * 1000;
      expect(CAPITAL_CALL_DELAYS.REMINDER_7D).toBe(7 * DAYS);
      expect(CAPITAL_CALL_DELAYS.REMINDER_3D).toBe(3 * DAYS);
      expect(CAPITAL_CALL_DELAYS.REMINDER_1D).toBe(1 * DAYS);
      expect(CAPITAL_CALL_DELAYS.PAST_DUE).toBe(0);
      expect(CAPITAL_CALL_DELAYS.PAST_DUE_7).toBe(7 * DAYS);
    });
  });

  describe('scheduleCapitalCallReminders', () => {
    it('should schedule all three reminders when deadline is far in the future', async () => {
      const now = new Date('2026-01-01T10:00:00Z');
      const deadline = new Date('2026-01-20T10:00:00Z'); // 19 days away

      await capitalCallJobScheduler.scheduleCapitalCallReminders(
        'item-123',
        'investor-456',
        'fund-789',
        deadline,
        now
      );

      expect(scheduleCapitalCallEmail).toHaveBeenCalledTimes(3);

      // Verify 7-day reminder
      expect(scheduleCapitalCallEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'capital_call_reminder_7d',
          capitalCallItemId: 'item-123',
          investorId: 'investor-456',
          fundId: 'fund-789',
        }),
        expect.any(Number)
      );

      // Verify 3-day reminder
      expect(scheduleCapitalCallEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'capital_call_reminder_3d',
        }),
        expect.any(Number)
      );

      // Verify 1-day reminder
      expect(scheduleCapitalCallEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'capital_call_reminder_1d',
        }),
        expect.any(Number)
      );
    });

    it('should skip reminders when deadline is too close', async () => {
      const now = new Date('2026-01-15T10:00:00Z');
      const deadline = new Date('2026-01-17T10:00:00Z'); // 2 days away

      await capitalCallJobScheduler.scheduleCapitalCallReminders(
        'item-123',
        'investor-456',
        'fund-789',
        deadline,
        now
      );

      // Should only schedule 1-day reminder
      expect(scheduleCapitalCallEmail).toHaveBeenCalledTimes(1);
      expect(scheduleCapitalCallEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'capital_call_reminder_1d',
        }),
        expect.any(Number)
      );
    });

    it('should not schedule if Redis is unavailable', async () => {
      vi.mocked(isRedisAvailable).mockReturnValueOnce(false);

      await capitalCallJobScheduler.scheduleCapitalCallReminders(
        'item-123',
        'investor-456',
        'fund-789',
        new Date('2026-02-01'),
        new Date('2026-01-01')
      );

      expect(scheduleCapitalCallEmail).not.toHaveBeenCalled();
    });

    it('should schedule nothing when deadline is in the past', async () => {
      const now = new Date('2026-01-20T10:00:00Z');
      const deadline = new Date('2026-01-15T10:00:00Z'); // 5 days ago

      await capitalCallJobScheduler.scheduleCapitalCallReminders(
        'item-123',
        'investor-456',
        'fund-789',
        deadline,
        now
      );

      expect(scheduleCapitalCallEmail).not.toHaveBeenCalled();
    });
  });

  describe('schedulePastDueEmails', () => {
    it('should schedule past due and +7 emails when deadline is in the future', async () => {
      const now = new Date('2026-01-01T10:00:00Z');
      const deadline = new Date('2026-01-10T10:00:00Z');

      await capitalCallJobScheduler.schedulePastDueEmails(
        'item-123',
        'investor-456',
        'fund-789',
        deadline,
        now
      );

      expect(scheduleCapitalCallEmail).toHaveBeenCalledTimes(2);

      // Verify past due email
      expect(scheduleCapitalCallEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'capital_call_past_due',
          capitalCallItemId: 'item-123',
        }),
        expect.any(Number)
      );

      // Verify +7 past due email
      expect(scheduleCapitalCallEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'capital_call_past_due_7',
          capitalCallItemId: 'item-123',
        }),
        expect.any(Number)
      );
    });

    it('should only schedule +7 past due when deadline has passed', async () => {
      const now = new Date('2026-01-15T10:00:00Z');
      const deadline = new Date('2026-01-10T10:00:00Z'); // 5 days ago

      await capitalCallJobScheduler.schedulePastDueEmails(
        'item-123',
        'investor-456',
        'fund-789',
        deadline,
        now
      );

      // Past due is in the past, but +7 is still in the future
      expect(scheduleCapitalCallEmail).toHaveBeenCalledTimes(1);
      expect(scheduleCapitalCallEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'capital_call_past_due_7',
        }),
        expect.any(Number)
      );
    });

    it('should not schedule if Redis is unavailable', async () => {
      vi.mocked(isRedisAvailable).mockReturnValueOnce(false);

      await capitalCallJobScheduler.schedulePastDueEmails(
        'item-123',
        'investor-456',
        'fund-789',
        new Date('2026-02-01'),
        new Date('2026-01-01')
      );

      expect(scheduleCapitalCallEmail).not.toHaveBeenCalled();
    });
  });

  describe('cancelCapitalCallReminders', () => {
    it('should cancel all reminder types', async () => {
      await capitalCallJobScheduler.cancelCapitalCallReminders('item-123');

      expect(cancelCapitalCallEmailsByPattern).toHaveBeenCalledWith(
        [
          'capital_call_reminder_7d',
          'capital_call_reminder_3d',
          'capital_call_reminder_1d',
        ],
        'item-123'
      );
    });

    it('should not cancel if Redis is unavailable', async () => {
      vi.mocked(isRedisAvailable).mockReturnValueOnce(false);

      await capitalCallJobScheduler.cancelCapitalCallReminders('item-123');

      expect(cancelCapitalCallEmailsByPattern).not.toHaveBeenCalled();
    });
  });

  describe('cancelPastDueEmails', () => {
    it('should cancel all past due types', async () => {
      await capitalCallJobScheduler.cancelPastDueEmails('item-123');

      expect(cancelCapitalCallEmailsByPattern).toHaveBeenCalledWith(
        ['capital_call_past_due', 'capital_call_past_due_7'],
        'item-123'
      );
    });

    it('should not cancel if Redis is unavailable', async () => {
      vi.mocked(isRedisAvailable).mockReturnValueOnce(false);

      await capitalCallJobScheduler.cancelPastDueEmails('item-123');

      expect(cancelCapitalCallEmailsByPattern).not.toHaveBeenCalled();
    });
  });

  describe('cancelAllCapitalCallEmails', () => {
    it('should cancel all capital call email types', async () => {
      await capitalCallJobScheduler.cancelAllCapitalCallEmails('item-123');

      expect(cancelCapitalCallEmailsByPattern).toHaveBeenCalledWith(
        [
          'capital_call_reminder_7d',
          'capital_call_reminder_3d',
          'capital_call_reminder_1d',
          'capital_call_past_due',
          'capital_call_past_due_7',
        ],
        'item-123'
      );
    });

    it('should not cancel if Redis is unavailable', async () => {
      vi.mocked(isRedisAvailable).mockReturnValueOnce(false);

      await capitalCallJobScheduler.cancelAllCapitalCallEmails('item-123');

      expect(cancelCapitalCallEmailsByPattern).not.toHaveBeenCalled();
    });
  });

  describe('handleStatusChange', () => {
    it('should cancel all emails when status changes to paid', async () => {
      await capitalCallJobScheduler.handleStatusChange(
        'item-123',
        'paid',
        'pending'
      );

      expect(cancelCapitalCallEmailsByPattern).toHaveBeenCalledWith(
        expect.arrayContaining([
          'capital_call_reminder_7d',
          'capital_call_past_due',
        ]),
        'item-123'
      );
    });

    it('should cancel past due emails when status changes to defaulted', async () => {
      await capitalCallJobScheduler.handleStatusChange(
        'item-123',
        'defaulted',
        'past_due'
      );

      expect(cancelCapitalCallEmailsByPattern).toHaveBeenCalledWith(
        ['capital_call_past_due', 'capital_call_past_due_7'],
        'item-123'
      );
    });

    it('should cancel all emails when status changes to cancelled', async () => {
      await capitalCallJobScheduler.handleStatusChange(
        'item-123',
        'cancelled',
        'pending'
      );

      expect(cancelCapitalCallEmailsByPattern).toHaveBeenCalledWith(
        expect.arrayContaining([
          'capital_call_reminder_7d',
          'capital_call_past_due',
        ]),
        'item-123'
      );
    });

    it('should not cancel anything for unrelated status changes', async () => {
      await capitalCallJobScheduler.handleStatusChange(
        'item-123',
        'pending',
        'new'
      );

      expect(cancelCapitalCallEmailsByPattern).not.toHaveBeenCalled();
    });
  });
});

describe('Delay Calculations', () => {
  it('7-day reminder should be 7 days in milliseconds', () => {
    const expectedMs = 7 * 24 * 60 * 60 * 1000;
    expect(CAPITAL_CALL_DELAYS.REMINDER_7D).toBe(expectedMs);
  });

  it('3-day reminder should be 3 days in milliseconds', () => {
    const expectedMs = 3 * 24 * 60 * 60 * 1000;
    expect(CAPITAL_CALL_DELAYS.REMINDER_3D).toBe(expectedMs);
  });

  it('1-day reminder should be 1 day in milliseconds', () => {
    const expectedMs = 1 * 24 * 60 * 60 * 1000;
    expect(CAPITAL_CALL_DELAYS.REMINDER_1D).toBe(expectedMs);
  });

  it('past due should be 0 (trigger on deadline)', () => {
    expect(CAPITAL_CALL_DELAYS.PAST_DUE).toBe(0);
  });

  it('+7 days past due should be 7 days after deadline', () => {
    const expectedMs = 7 * 24 * 60 * 60 * 1000;
    expect(CAPITAL_CALL_DELAYS.PAST_DUE_7).toBe(expectedMs);
  });
});

describe('Singleton Instance', () => {
  it('should export a singleton instance', () => {
    expect(capitalCallJobScheduler).toBeInstanceOf(CapitalCallJobScheduler);
  });

  it('should be the same instance across imports', async () => {
    const { capitalCallJobScheduler: anotherImport } = await import('./capitalCallJobScheduler');
    expect(capitalCallJobScheduler).toBe(anotherImport);
  });
});
