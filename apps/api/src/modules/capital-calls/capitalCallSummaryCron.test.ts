/**
 * Capital Call Summary Cron Tests
 * Tests for the daily/weekly capital call summary email job
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('../../common/database/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

vi.mock('../email/email.service', () => ({
  emailService: {
    sendInternalCapitalCallSummary: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock('../team-invites/getManagerEmailsForFund', () => ({
  getManagerEmailsForFund: vi.fn().mockResolvedValue(['manager1@fund.com', 'manager2@fund.com']),
}));

// Import after mocks
import { runCapitalCallSummaryCron } from './capitalCallSummaryCron';
import { supabaseAdmin } from '../../common/database/supabase';
import { emailService } from '../email/email.service';
import { getManagerEmailsForFund } from '../team-invites/getManagerEmailsForFund';

// Test fixtures
const mockActiveCapitalCalls = [
  {
    id: 'cc-1',
    fund_id: 'fund-1',
    deal_id: 'deal-1',
    total_amount: '1000000.00',
    deadline: '2026-01-20',
    status: 'sent',
    call_number: 1,
    funds: { name: 'Acme Fund I', platform_name: 'Altsui' },
    deals: { name: 'Miami Tower' },
  },
  {
    id: 'cc-2',
    fund_id: 'fund-2',
    deal_id: 'deal-2',
    total_amount: '2000000.00',
    deadline: '2026-01-25',
    status: 'partial',
    call_number: 2,
    funds: { name: 'Beta Fund', platform_name: 'LionShare' },
    deals: { name: 'Dallas Office' },
  },
];

const mockCapitalCallItems = [
  { amount_due: '100000.00', amount_received: '75000.00', status: 'partial' },
  { amount_due: '200000.00', amount_received: '200000.00', status: 'complete' },
  { amount_due: '150000.00', amount_received: '0.00', status: 'pending' },
];

// Helper to set up mock database responses
function setupMocks(options: {
  activeCalls?: typeof mockActiveCapitalCalls;
  callItems?: typeof mockCapitalCallItems;
  fundFrequency?: string;
} = {}) {
  const {
    activeCalls = mockActiveCapitalCalls,
    callItems = mockCapitalCallItems,
    fundFrequency = 'daily',
  } = options;

  const mockFromReturn = vi.fn().mockImplementation((table: string) => {
    if (table === 'capital_calls') {
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: activeCalls,
            error: null,
          }),
        }),
      };
    }
    if (table === 'capital_call_items') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: callItems,
            error: null,
          }),
        }),
      };
    }
    if (table === 'funds') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { capital_call_summary_frequency: fundFrequency },
              error: null,
            }),
          }),
        }),
      };
    }
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    };
  });

  vi.mocked(supabaseAdmin.from).mockImplementation(mockFromReturn);
}

describe('Capital Call Summary Cron', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FRONTEND_URL = 'https://app.altsui.com';
  });

  describe('runCapitalCallSummaryCron', () => {
    it('should send summary emails for active capital calls on daily frequency', async () => {
      setupMocks({ fundFrequency: 'daily' });
      const timestamp = new Date('2026-01-15T08:00:00Z'); // Wednesday

      await runCapitalCallSummaryCron(timestamp);

      // Should send to managers of both funds (2 managers each)
      expect(emailService.sendInternalCapitalCallSummary).toHaveBeenCalled();
    });

    it('should skip funds with weekly frequency on non-Monday', async () => {
      setupMocks({
        activeCalls: [mockActiveCapitalCalls[0]],
        fundFrequency: 'weekly',
      });
      vi.mocked(getManagerEmailsForFund).mockResolvedValue(['manager@fund.com']);
      const wednesday = new Date('2026-01-15T08:00:00Z'); // Wednesday (day 3)

      await runCapitalCallSummaryCron(wednesday);

      // Weekly frequency should skip on Wednesday
      expect(emailService.sendInternalCapitalCallSummary).not.toHaveBeenCalled();
    });

    it('should send for weekly frequency on Monday', async () => {
      vi.clearAllMocks();
      setupMocks({
        activeCalls: [mockActiveCapitalCalls[0]],
        fundFrequency: 'weekly',
      });
      vi.mocked(getManagerEmailsForFund).mockResolvedValue(['manager@fund.com']);
      const monday = new Date('2026-01-12T08:00:00Z'); // Monday (day 1)

      await runCapitalCallSummaryCron(monday);

      // Weekly frequency should send on Monday
      expect(emailService.sendInternalCapitalCallSummary).toHaveBeenCalled();
    });

    it('should skip funds with none frequency', async () => {
      setupMocks({ fundFrequency: 'none' });
      const timestamp = new Date('2026-01-15T08:00:00Z');

      await runCapitalCallSummaryCron(timestamp);

      expect(emailService.sendInternalCapitalCallSummary).not.toHaveBeenCalled();
    });

    it('should not send emails when no active capital calls', async () => {
      setupMocks({ activeCalls: [] });
      const timestamp = new Date('2026-01-15T08:00:00Z');

      await runCapitalCallSummaryCron(timestamp);

      expect(emailService.sendInternalCapitalCallSummary).not.toHaveBeenCalled();
    });

    it('should calculate stats correctly', async () => {
      setupMocks({
        activeCalls: [mockActiveCapitalCalls[0]],
        callItems: mockCapitalCallItems,
        fundFrequency: 'daily',
      });
      const timestamp = new Date('2026-01-15T08:00:00Z');

      await runCapitalCallSummaryCron(timestamp);

      // Total called: 100000 + 200000 + 150000 = 450000
      // Total received: 75000 + 200000 + 0 = 275000
      // Percent: 61%
      // Outstanding: 175000
      expect(emailService.sendInternalCapitalCallSummary).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          totalCalled: expect.stringMatching(/450.*000/),
          totalReceived: expect.stringMatching(/275.*000/),
          percentReceived: '61',
        })
      );
    });

    it('should include deal name and call number', async () => {
      setupMocks({
        activeCalls: [mockActiveCapitalCalls[0]],
        fundFrequency: 'daily',
      });
      const timestamp = new Date('2026-01-15T08:00:00Z');

      await runCapitalCallSummaryCron(timestamp);

      expect(emailService.sendInternalCapitalCallSummary).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          capitalCallNumber: '1',
          dealName: 'Miami Tower',
          fundName: 'Acme Fund I',
        })
      );
    });

    it('should send to all managers of a fund', async () => {
      setupMocks({
        activeCalls: [mockActiveCapitalCalls[0]],
        fundFrequency: 'daily',
      });
      vi.mocked(getManagerEmailsForFund).mockResolvedValueOnce([
        'manager1@fund.com',
        'manager2@fund.com',
        'manager3@fund.com',
      ]);

      const timestamp = new Date('2026-01-15T08:00:00Z');
      await runCapitalCallSummaryCron(timestamp);

      // Should call sendInternalCapitalCallSummary once for each manager
      expect(emailService.sendInternalCapitalCallSummary).toHaveBeenCalledTimes(3);
      expect(emailService.sendInternalCapitalCallSummary).toHaveBeenCalledWith(
        'manager1@fund.com',
        expect.any(Object)
      );
      expect(emailService.sendInternalCapitalCallSummary).toHaveBeenCalledWith(
        'manager2@fund.com',
        expect.any(Object)
      );
      expect(emailService.sendInternalCapitalCallSummary).toHaveBeenCalledWith(
        'manager3@fund.com',
        expect.any(Object)
      );
    });

    it('should skip fund if no managers found', async () => {
      setupMocks({
        activeCalls: [mockActiveCapitalCalls[0]],
        fundFrequency: 'daily',
      });
      vi.mocked(getManagerEmailsForFund).mockResolvedValueOnce([]);

      const timestamp = new Date('2026-01-15T08:00:00Z');
      await runCapitalCallSummaryCron(timestamp);

      expect(emailService.sendInternalCapitalCallSummary).not.toHaveBeenCalled();
    });

    it('should include correct view report URL', async () => {
      setupMocks({
        activeCalls: [mockActiveCapitalCalls[0]],
        fundFrequency: 'daily',
      });
      vi.mocked(getManagerEmailsForFund).mockResolvedValueOnce(['manager@fund.com']);

      const timestamp = new Date('2026-01-15T08:00:00Z');
      await runCapitalCallSummaryCron(timestamp);

      expect(emailService.sendInternalCapitalCallSummary).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          viewReportUrl: 'https://app.altsui.com/manager/capital-calls/cc-1',
        })
      );
    });

    it('should handle email send failures gracefully', async () => {
      setupMocks({
        activeCalls: [mockActiveCapitalCalls[0]],
        fundFrequency: 'daily',
      });
      vi.mocked(getManagerEmailsForFund).mockResolvedValueOnce(['manager@fund.com']);
      vi.mocked(emailService.sendInternalCapitalCallSummary).mockResolvedValueOnce({
        success: false,
        error: 'SMTP error',
      });

      const consoleSpy = vi.spyOn(console, 'error');
      const timestamp = new Date('2026-01-15T08:00:00Z');

      // Should not throw
      await runCapitalCallSummaryCron(timestamp);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send summary')
      );
    });

    it('should log start and no active calls message', async () => {
      setupMocks({ activeCalls: [] });
      const consoleSpy = vi.spyOn(console, 'log');
      const timestamp = new Date('2026-01-15T08:00:00Z');

      await runCapitalCallSummaryCron(timestamp);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Starting')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No active capital calls found')
      );
    });

    it('should log completion when emails are sent', async () => {
      setupMocks({
        activeCalls: [mockActiveCapitalCalls[0]],
        fundFrequency: 'daily',
      });
      vi.mocked(getManagerEmailsForFund).mockResolvedValueOnce(['manager@fund.com']);
      const consoleSpy = vi.spyOn(console, 'log');
      const timestamp = new Date('2026-01-15T08:00:00Z');

      await runCapitalCallSummaryCron(timestamp);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Completed')
      );
    });
  });

  describe('Past Due Calculation', () => {
    it('should calculate past due amount when deadline has passed', async () => {
      const pastDeadlineCall = {
        ...mockActiveCapitalCalls[0],
        deadline: '2026-01-10', // Past deadline
      };

      setupMocks({
        activeCalls: [pastDeadlineCall],
        callItems: [
          { amount_due: '100000.00', amount_received: '0.00', status: 'pending' },
          { amount_due: '50000.00', amount_received: '25000.00', status: 'partial' },
        ],
        fundFrequency: 'daily',
      });
      vi.mocked(getManagerEmailsForFund).mockResolvedValueOnce(['manager@fund.com']);

      const timestamp = new Date('2026-01-15T08:00:00Z'); // After deadline

      await runCapitalCallSummaryCron(timestamp);

      // Past due should be: 100000 + (50000 - 25000) = 125000
      expect(emailService.sendInternalCapitalCallSummary).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          totalPastDue: expect.stringMatching(/125.*000/),
        })
      );
    });

    it('should have zero past due when deadline is in future', async () => {
      const futureDeadlineCall = {
        ...mockActiveCapitalCalls[0],
        deadline: '2026-02-01', // Future deadline
      };

      setupMocks({
        activeCalls: [futureDeadlineCall],
        callItems: [
          { amount_due: '100000.00', amount_received: '0.00', status: 'pending' },
        ],
        fundFrequency: 'daily',
      });
      vi.mocked(getManagerEmailsForFund).mockResolvedValueOnce(['manager@fund.com']);

      const timestamp = new Date('2026-01-15T08:00:00Z'); // Before deadline

      await runCapitalCallSummaryCron(timestamp);

      expect(emailService.sendInternalCapitalCallSummary).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          totalPastDue: '0.00',
        })
      );
    });
  });

  describe('Frequency Day Logic', () => {
    const testCases = [
      { dayOfWeek: 0, dayName: 'Sunday', weeklyExpected: false },
      { dayOfWeek: 1, dayName: 'Monday', weeklyExpected: true },
      { dayOfWeek: 2, dayName: 'Tuesday', weeklyExpected: false },
      { dayOfWeek: 3, dayName: 'Wednesday', weeklyExpected: false },
      { dayOfWeek: 4, dayName: 'Thursday', weeklyExpected: false },
      { dayOfWeek: 5, dayName: 'Friday', weeklyExpected: false },
      { dayOfWeek: 6, dayName: 'Saturday', weeklyExpected: false },
    ];

    testCases.forEach(({ dayOfWeek, dayName, weeklyExpected }) => {
      it(`weekly frequency ${weeklyExpected ? 'sends' : 'skips'} on ${dayName}`, async () => {
        setupMocks({ fundFrequency: 'weekly' });
        vi.mocked(getManagerEmailsForFund).mockResolvedValue(['manager@fund.com']);

        // Create a date for the specific day of week
        // Jan 2026: 1st is Thursday, so we adjust accordingly
        const baseDate = new Date('2026-01-05T08:00:00Z'); // Monday
        const targetDate = new Date(baseDate);
        targetDate.setDate(baseDate.getDate() + ((dayOfWeek - 1 + 7) % 7));

        await runCapitalCallSummaryCron(targetDate);

        if (weeklyExpected) {
          expect(emailService.sendInternalCapitalCallSummary).toHaveBeenCalled();
        } else {
          expect(emailService.sendInternalCapitalCallSummary).not.toHaveBeenCalled();
        }

        vi.clearAllMocks();
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw and log error when database query fails', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      } as unknown as ReturnType<typeof supabaseAdmin.from>);

      const timestamp = new Date('2026-01-15T08:00:00Z');

      await expect(runCapitalCallSummaryCron(timestamp)).rejects.toThrow(
        'Failed to fetch active capital calls'
      );
    });

    it('should use injected timestamp (determinism)', async () => {
      setupMocks({ activeCalls: [] });
      const specificTimestamp = new Date('2026-06-15T14:30:00.000Z');

      const consoleSpy = vi.spyOn(console, 'log');
      await runCapitalCallSummaryCron(specificTimestamp);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('2026-06-15T14:30:00.000Z')
      );
    });
  });

  describe('Multiple Funds Processing', () => {
    it('should process multiple funds independently', async () => {
      // Setup for multiple funds with different frequencies
      const multiFromMock = vi.fn().mockImplementation((table: string) => {
        if (table === 'capital_calls') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: mockActiveCapitalCalls, // 2 calls from different funds
                error: null,
              }),
            }),
          };
        }
        if (table === 'capital_call_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: mockCapitalCallItems,
                error: null,
              }),
            }),
          };
        }
        if (table === 'funds') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { capital_call_summary_frequency: 'daily' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      vi.mocked(supabaseAdmin.from).mockImplementation(multiFromMock);
      vi.mocked(getManagerEmailsForFund).mockResolvedValue(['manager@fund.com']);

      const timestamp = new Date('2026-01-15T08:00:00Z');
      await runCapitalCallSummaryCron(timestamp);

      // Should send 2 emails (1 per capital call, 1 manager each)
      expect(emailService.sendInternalCapitalCallSummary).toHaveBeenCalledTimes(2);
    });
  });
});

describe('Format Amount Helper', () => {
  it('should format amounts with commas and two decimal places', async () => {
    setupMocks({
      activeCalls: [mockActiveCapitalCalls[0]],
      callItems: [
        { amount_due: '1234567.89', amount_received: '1234567.89', status: 'complete' },
      ],
      fundFrequency: 'daily',
    });
    vi.mocked(getManagerEmailsForFund).mockResolvedValueOnce(['manager@fund.com']);

    const timestamp = new Date('2026-01-15T08:00:00Z');
    await runCapitalCallSummaryCron(timestamp);

    expect(emailService.sendInternalCapitalCallSummary).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        totalCalled: expect.stringMatching(/1.*234.*567.*89/),
      })
    );
  });
});
