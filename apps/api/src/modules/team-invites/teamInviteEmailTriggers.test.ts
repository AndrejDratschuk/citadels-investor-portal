/**
 * Team Invite Email Triggers Tests
 * Tests for the team invite reminder email orchestration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../../common/database/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

vi.mock('../email/email.service', () => ({
  emailService: {
    sendTeamInviteReminder: vi.fn().mockResolvedValue({ success: true }),
  },
}));

// Import after mocks
import { TeamInviteEmailTriggers, teamInviteEmailTriggers } from './teamInviteEmailTriggers';
import { supabaseAdmin } from '../../common/database/supabase';
import { emailService } from '../email/email.service';

// Helper to set up mock responses
function mockInviteData(status: string = 'pending', overrides: Record<string, unknown> = {}) {
  const mockChain = {
    single: vi.fn().mockResolvedValue({
      data: {
        email: 'invitee@example.com',
        role: 'accountant',
        token: 'token-abc123',
        status,
        fund: { name: 'Acme Fund', platform_name: 'Altsui' },
        inviter: { first_name: 'Jane', last_name: 'Smith' },
        ...overrides,
      },
      error: null,
    }),
  };

  const selectChain = {
    eq: vi.fn().mockReturnValue(mockChain),
  };

  vi.mocked(supabaseAdmin.from).mockReturnValue({
    select: vi.fn().mockReturnValue(selectChain),
  } as unknown as ReturnType<typeof supabaseAdmin.from>);
}

function mockInviteNotFound() {
  const mockChain = {
    single: vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Not found' },
    }),
  };

  vi.mocked(supabaseAdmin.from).mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue(mockChain),
    }),
  } as unknown as ReturnType<typeof supabaseAdmin.from>);
}

describe('TeamInviteEmailTriggers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FRONTEND_URL = 'https://app.altsui.com';
  });

  describe('sendScheduledReminder', () => {
    it('should send reminder email for pending invite', async () => {
      mockInviteData('pending');
      const timestamp = new Date('2026-01-10T10:00:00Z');

      await teamInviteEmailTriggers.sendScheduledReminder(
        'invite-123',
        'fund-456',
        4, // 4 days remaining
        timestamp
      );

      expect(emailService.sendTeamInviteReminder).toHaveBeenCalledWith(
        'invitee@example.com',
        expect.objectContaining({
          recipientEmail: 'invitee@example.com',
          fundName: 'Acme Fund',
          platformName: 'Altsui',
          role: 'accountant',
          inviterName: 'Jane Smith',
          daysRemaining: 4,
        })
      );
    });

    it('should include correct accept URL with token', async () => {
      mockInviteData('pending');

      await teamInviteEmailTriggers.sendScheduledReminder(
        'invite-123',
        'fund-456',
        4,
        new Date()
      );

      expect(emailService.sendTeamInviteReminder).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          acceptInviteUrl: 'https://app.altsui.com/invite/accept?token=token-abc123',
        })
      );
    });

    it('should skip reminder if invite is no longer pending', async () => {
      mockInviteData('accepted');

      await teamInviteEmailTriggers.sendScheduledReminder(
        'invite-123',
        'fund-456',
        4,
        new Date()
      );

      expect(emailService.sendTeamInviteReminder).not.toHaveBeenCalled();
    });

    it('should skip reminder if invite is cancelled', async () => {
      mockInviteData('cancelled');

      await teamInviteEmailTriggers.sendScheduledReminder(
        'invite-123',
        'fund-456',
        4,
        new Date()
      );

      expect(emailService.sendTeamInviteReminder).not.toHaveBeenCalled();
    });

    it('should skip reminder if invite is not found', async () => {
      mockInviteNotFound();

      await teamInviteEmailTriggers.sendScheduledReminder(
        'nonexistent-invite',
        'fund-456',
        4,
        new Date()
      );

      expect(emailService.sendTeamInviteReminder).not.toHaveBeenCalled();
    });

    it('should use default platform name if not set', async () => {
      const mockChain = {
        single: vi.fn().mockResolvedValue({
          data: {
            email: 'invitee@example.com',
            role: 'accountant',
            token: 'token-123',
            status: 'pending',
            fund: { name: 'Acme Fund', platform_name: null },
            inviter: { first_name: 'Jane', last_name: 'Smith' },
          },
          error: null,
        }),
      };

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue(mockChain),
        }),
      } as unknown as ReturnType<typeof supabaseAdmin.from>);

      await teamInviteEmailTriggers.sendScheduledReminder(
        'invite-123',
        'fund-456',
        4,
        new Date()
      );

      expect(emailService.sendTeamInviteReminder).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          platformName: 'Altsui', // Default
        })
      );
    });

    it('should handle missing inviter name gracefully', async () => {
      const mockChain = {
        single: vi.fn().mockResolvedValue({
          data: {
            email: 'invitee@example.com',
            role: 'attorney',
            token: 'token-123',
            status: 'pending',
            fund: { name: 'Test Fund' },
            inviter: null, // No inviter data
          },
          error: null,
        }),
      };

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue(mockChain),
        }),
      } as unknown as ReturnType<typeof supabaseAdmin.from>);

      await teamInviteEmailTriggers.sendScheduledReminder(
        'invite-123',
        'fund-456',
        2,
        new Date()
      );

      expect(emailService.sendTeamInviteReminder).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          inviterName: 'A team member', // Fallback
        })
      );
    });

    it('should throw error if email sending fails', async () => {
      mockInviteData('pending');
      vi.mocked(emailService.sendTeamInviteReminder).mockResolvedValueOnce({
        success: false,
        error: 'SMTP error',
      });

      await expect(
        teamInviteEmailTriggers.sendScheduledReminder(
          'invite-123',
          'fund-456',
          4,
          new Date()
        )
      ).rejects.toThrow('Failed to send team invite reminder');
    });

    it('should log success when email is sent', async () => {
      mockInviteData('pending');
      const consoleSpy = vi.spyOn(console, 'log');

      await teamInviteEmailTriggers.sendScheduledReminder(
        'invite-log-test',
        'fund-456',
        4,
        new Date()
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sent reminder for invite invite-log-test')
      );
    });
  });

  describe('Days Remaining Calculation', () => {
    it('should pass through the days remaining value', async () => {
      mockInviteData('pending');

      // Day 3 reminder (4 days remaining)
      await teamInviteEmailTriggers.sendScheduledReminder(
        'invite-1',
        'fund-1',
        4,
        new Date()
      );

      expect(emailService.sendTeamInviteReminder).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ daysRemaining: 4 })
      );

      vi.clearAllMocks();
      mockInviteData('pending');

      // Day 5 reminder (2 days remaining)
      await teamInviteEmailTriggers.sendScheduledReminder(
        'invite-2',
        'fund-1',
        2,
        new Date()
      );

      expect(emailService.sendTeamInviteReminder).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ daysRemaining: 2 })
      );
    });
  });
});

describe('Singleton Instance', () => {
  it('should export a singleton instance', () => {
    expect(teamInviteEmailTriggers).toBeInstanceOf(TeamInviteEmailTriggers);
  });
});

describe('URL Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use FRONTEND_URL environment variable', async () => {
    process.env.FRONTEND_URL = 'https://custom.domain.com';
    mockInviteData('pending');

    await teamInviteEmailTriggers.sendScheduledReminder(
      'invite-1',
      'fund-1',
      4,
      new Date()
    );

    expect(emailService.sendTeamInviteReminder).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        acceptInviteUrl: expect.stringContaining('https://custom.domain.com'),
      })
    );
  });

  it('should fallback to localhost if FRONTEND_URL not set', async () => {
    delete process.env.FRONTEND_URL;
    mockInviteData('pending');

    await teamInviteEmailTriggers.sendScheduledReminder(
      'invite-1',
      'fund-1',
      4,
      new Date()
    );

    expect(emailService.sendTeamInviteReminder).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        acceptInviteUrl: expect.stringContaining('http://localhost:5173'),
      })
    );
  });
});

describe('Role Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FRONTEND_URL = 'https://app.altsui.com';
  });

  it('should correctly pass manager role', async () => {
    const mockChain = {
      single: vi.fn().mockResolvedValue({
        data: {
          email: 'manager@example.com',
          role: 'manager',
          token: 'token-mgr',
          status: 'pending',
          fund: { name: 'Test Fund' },
          inviter: { first_name: 'Admin' },
        },
        error: null,
      }),
    };

    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue(mockChain),
      }),
    } as unknown as ReturnType<typeof supabaseAdmin.from>);

    await teamInviteEmailTriggers.sendScheduledReminder(
      'invite-mgr',
      'fund-1',
      4,
      new Date()
    );

    expect(emailService.sendTeamInviteReminder).toHaveBeenCalledWith(
      'manager@example.com',
      expect.objectContaining({ role: 'manager' })
    );
  });

  it('should correctly pass attorney role', async () => {
    const mockChain = {
      single: vi.fn().mockResolvedValue({
        data: {
          email: 'attorney@example.com',
          role: 'attorney',
          token: 'token-atty',
          status: 'pending',
          fund: { name: 'Test Fund' },
          inviter: { first_name: 'Admin' },
        },
        error: null,
      }),
    };

    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue(mockChain),
      }),
    } as unknown as ReturnType<typeof supabaseAdmin.from>);

    await teamInviteEmailTriggers.sendScheduledReminder(
      'invite-atty',
      'fund-1',
      4,
      new Date()
    );

    expect(emailService.sendTeamInviteReminder).toHaveBeenCalledWith(
      'attorney@example.com',
      expect.objectContaining({ role: 'attorney' })
    );
  });
});
