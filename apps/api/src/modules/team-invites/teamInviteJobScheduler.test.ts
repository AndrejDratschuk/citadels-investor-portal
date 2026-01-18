/**
 * Team Invite Job Scheduler Tests
 * Tests for scheduling and cancellation of team invite reminder emails
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the email queue module
vi.mock('../../common/queue/emailQueue', () => ({
  scheduleTeamInviteEmail: vi.fn().mockResolvedValue('job-id'),
  cancelTeamInviteEmail: vi.fn().mockResolvedValue(true),
  cancelTeamInviteEmailsByPattern: vi.fn().mockResolvedValue(2),
  isRedisAvailable: vi.fn().mockReturnValue(true),
}));

// Import after mocks
import {
  TeamInviteJobScheduler,
  teamInviteJobScheduler,
} from './teamInviteJobScheduler';

import {
  scheduleTeamInviteEmail,
  cancelTeamInviteEmail,
  cancelTeamInviteEmailsByPattern,
  isRedisAvailable,
} from '../../common/queue/emailQueue';

describe('TeamInviteJobScheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('scheduleInviteReminders', () => {
    it('should schedule Day 3 and Day 5 reminders', async () => {
      const timestamp = new Date('2026-01-10T10:00:00Z');

      await teamInviteJobScheduler.scheduleInviteReminders(
        'invite-123',
        'fund-456',
        timestamp
      );

      expect(scheduleTeamInviteEmail).toHaveBeenCalledTimes(2);

      // Verify Day 3 reminder
      expect(scheduleTeamInviteEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'team_invite_reminder_3d',
          inviteId: 'invite-123',
          fundId: 'fund-456',
          scheduledAt: timestamp.toISOString(),
        }),
        3 * 24 * 60 * 60 * 1000 // 3 days in ms
      );

      // Verify Day 5 reminder
      expect(scheduleTeamInviteEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'team_invite_reminder_5d',
          inviteId: 'invite-123',
          fundId: 'fund-456',
          scheduledAt: timestamp.toISOString(),
        }),
        5 * 24 * 60 * 60 * 1000 // 5 days in ms
      );
    });

    it('should not schedule if Redis is unavailable', async () => {
      vi.mocked(isRedisAvailable).mockReturnValueOnce(false);

      await teamInviteJobScheduler.scheduleInviteReminders(
        'invite-123',
        'fund-456',
        new Date()
      );

      expect(scheduleTeamInviteEmail).not.toHaveBeenCalled();
    });

    it('should use the exact timestamp provided', async () => {
      const specificTimestamp = new Date('2026-06-15T14:30:00Z');

      await teamInviteJobScheduler.scheduleInviteReminders(
        'invite-123',
        'fund-456',
        specificTimestamp
      );

      expect(scheduleTeamInviteEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          scheduledAt: '2026-06-15T14:30:00.000Z',
        }),
        expect.any(Number)
      );
    });
  });

  describe('cancelInviteReminders', () => {
    it('should cancel both reminder types', async () => {
      await teamInviteJobScheduler.cancelInviteReminders('invite-123');

      expect(cancelTeamInviteEmailsByPattern).toHaveBeenCalledWith(
        ['team_invite_reminder_3d', 'team_invite_reminder_5d'],
        'invite-123'
      );
    });

    it('should not cancel if Redis is unavailable', async () => {
      vi.mocked(isRedisAvailable).mockReturnValueOnce(false);

      await teamInviteJobScheduler.cancelInviteReminders('invite-123');

      expect(cancelTeamInviteEmailsByPattern).not.toHaveBeenCalled();
    });

    it('should log the number of cancelled reminders', async () => {
      const consoleSpy = vi.spyOn(console, 'log');

      await teamInviteJobScheduler.cancelInviteReminders('invite-123');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cancelled 2 reminder(s)')
      );
    });
  });

  describe('cancelSpecificReminder', () => {
    it('should cancel a specific reminder type', async () => {
      const result = await teamInviteJobScheduler.cancelSpecificReminder(
        'invite-123',
        'team_invite_reminder_3d'
      );

      expect(cancelTeamInviteEmail).toHaveBeenCalledWith(
        'team_invite_reminder_3d',
        'invite-123'
      );
      expect(result).toBe(true);
    });

    it('should return false if Redis is unavailable', async () => {
      vi.mocked(isRedisAvailable).mockReturnValueOnce(false);

      const result = await teamInviteJobScheduler.cancelSpecificReminder(
        'invite-123',
        'team_invite_reminder_5d'
      );

      expect(result).toBe(false);
      expect(cancelTeamInviteEmail).not.toHaveBeenCalled();
    });
  });
});

describe('Delay Calculations', () => {
  it('Day 3 reminder should be 3 days in milliseconds', () => {
    const DAYS = 24 * 60 * 60 * 1000;
    const expectedDelay = 3 * DAYS;

    // We can verify this by checking the call to scheduleTeamInviteEmail
    teamInviteJobScheduler.scheduleInviteReminders('invite-1', 'fund-1', new Date());

    expect(scheduleTeamInviteEmail).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'team_invite_reminder_3d' }),
      expectedDelay
    );
  });

  it('Day 5 reminder should be 5 days in milliseconds', () => {
    const DAYS = 24 * 60 * 60 * 1000;
    const expectedDelay = 5 * DAYS;

    teamInviteJobScheduler.scheduleInviteReminders('invite-1', 'fund-1', new Date());

    expect(scheduleTeamInviteEmail).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'team_invite_reminder_5d' }),
      expectedDelay
    );
  });
});

describe('Singleton Instance', () => {
  it('should export a singleton instance', () => {
    expect(teamInviteJobScheduler).toBeInstanceOf(TeamInviteJobScheduler);
  });

  it('should be the same instance across imports', async () => {
    const { teamInviteJobScheduler: anotherImport } = await import('./teamInviteJobScheduler');
    expect(teamInviteJobScheduler).toBe(anotherImport);
  });
});

describe('Reminder Timing Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isRedisAvailable).mockReturnValue(true);
  });

  it('should schedule both reminders at correct intervals from creation time', async () => {
    const creationTime = new Date('2026-01-01T09:00:00Z');

    await teamInviteJobScheduler.scheduleInviteReminders(
      'invite-test',
      'fund-test',
      creationTime
    );

    const calls = vi.mocked(scheduleTeamInviteEmail).mock.calls;

    // Day 3 reminder: 3 * 24 * 60 * 60 * 1000 = 259200000 ms
    const day3Call = calls.find((c) => c[0].type === 'team_invite_reminder_3d');
    expect(day3Call?.[1]).toBe(259200000);

    // Day 5 reminder: 5 * 24 * 60 * 60 * 1000 = 432000000 ms
    const day5Call = calls.find((c) => c[0].type === 'team_invite_reminder_5d');
    expect(day5Call?.[1]).toBe(432000000);
  });
});

describe('Error Handling', () => {
  it('should handle schedule errors gracefully', async () => {
    vi.mocked(scheduleTeamInviteEmail).mockRejectedValueOnce(new Error('Redis error'));

    // Should not throw, but promise should reject
    await expect(
      teamInviteJobScheduler.scheduleInviteReminders('invite-1', 'fund-1', new Date())
    ).rejects.toThrow('Redis error');
  });

  it('should handle cancel errors gracefully', async () => {
    vi.mocked(cancelTeamInviteEmailsByPattern).mockRejectedValueOnce(
      new Error('Cancel failed')
    );

    await expect(
      teamInviteJobScheduler.cancelInviteReminders('invite-1')
    ).rejects.toThrow('Cancel failed');
  });
});

describe('Integration Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isRedisAvailable).mockReturnValue(true);
  });

  it('scenario: invite created, then cancelled before any reminders sent', async () => {
    // 1. Create invite and schedule reminders
    await teamInviteJobScheduler.scheduleInviteReminders(
      'invite-flow-test',
      'fund-1',
      new Date()
    );

    expect(scheduleTeamInviteEmail).toHaveBeenCalledTimes(2);

    // 2. Cancel the invite (should cancel all reminders)
    await teamInviteJobScheduler.cancelInviteReminders('invite-flow-test');

    expect(cancelTeamInviteEmailsByPattern).toHaveBeenCalledWith(
      ['team_invite_reminder_3d', 'team_invite_reminder_5d'],
      'invite-flow-test'
    );
  });

  it('scenario: invite created, then accepted after Day 3 reminder', async () => {
    // 1. Create invite
    await teamInviteJobScheduler.scheduleInviteReminders(
      'invite-accepted',
      'fund-1',
      new Date()
    );

    // 2. Simulate Day 3 reminder already sent, Day 5 still pending
    // User accepts invite - cancel remaining reminders
    await teamInviteJobScheduler.cancelInviteReminders('invite-accepted');

    // Both types should be cancelled (even if 3d already fired, it's a no-op)
    expect(cancelTeamInviteEmailsByPattern).toHaveBeenCalledWith(
      ['team_invite_reminder_3d', 'team_invite_reminder_5d'],
      'invite-accepted'
    );
  });

  it('scenario: invite resent (cancel old reminders, schedule new ones)', async () => {
    const originalTime = new Date('2026-01-01T10:00:00Z');
    const resendTime = new Date('2026-01-03T10:00:00Z');

    // 1. Original invite
    await teamInviteJobScheduler.scheduleInviteReminders(
      'invite-resend',
      'fund-1',
      originalTime
    );

    expect(scheduleTeamInviteEmail).toHaveBeenCalledTimes(2);

    // 2. Manager resends - cancel old reminders
    await teamInviteJobScheduler.cancelInviteReminders('invite-resend');

    // 3. Schedule new reminders with new timestamp
    await teamInviteJobScheduler.scheduleInviteReminders(
      'invite-resend',
      'fund-1',
      resendTime
    );

    // Should have 4 total schedule calls (2 original + 2 new)
    expect(scheduleTeamInviteEmail).toHaveBeenCalledTimes(4);

    // New reminders should use the resend timestamp
    const lastTwoCalls = vi.mocked(scheduleTeamInviteEmail).mock.calls.slice(-2);
    lastTwoCalls.forEach((call) => {
      expect(call[0].scheduledAt).toBe(resendTime.toISOString());
    });
  });
});
