/**
 * Tests for Reporting & Tax Email Triggers (Stage 04)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted to define mock functions that can be used in vi.mock factories
const {
  mockSupabaseFrom,
  mockLogEmail,
  mockSendQuarterlyReport,
  mockSendAnnualReport,
  mockSendAnnualMeetingInvite,
  mockSendPropertyAcquisition,
  mockSendPropertyDisposition,
  mockSendK1Available,
  mockSendK1Estimate,
  mockSendK1Amended,
} = vi.hoisted(() => ({
  mockSupabaseFrom: vi.fn(),
  mockLogEmail: vi.fn().mockResolvedValue(undefined),
  mockSendQuarterlyReport: vi.fn().mockResolvedValue({ success: true }),
  mockSendAnnualReport: vi.fn().mockResolvedValue({ success: true }),
  mockSendAnnualMeetingInvite: vi.fn().mockResolvedValue({ success: true }),
  mockSendPropertyAcquisition: vi.fn().mockResolvedValue({ success: true }),
  mockSendPropertyDisposition: vi.fn().mockResolvedValue({ success: true }),
  mockSendK1Available: vi.fn().mockResolvedValue({ success: true }),
  mockSendK1Estimate: vi.fn().mockResolvedValue({ success: true }),
  mockSendK1Amended: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock supabaseAdmin
vi.mock('../../common/database/supabase', () => ({
  supabaseAdmin: {
    from: mockSupabaseFrom,
  },
}));

// Mock emailLogger
vi.mock('../email/emailLogger', () => ({
  emailLogger: {
    logEmail: mockLogEmail,
  },
}));

// Mock emailService singleton
vi.mock('../email/email.service', () => ({
  emailService: {
    sendQuarterlyReport: mockSendQuarterlyReport,
    sendAnnualReport: mockSendAnnualReport,
    sendAnnualMeetingInvite: mockSendAnnualMeetingInvite,
    sendPropertyAcquisition: mockSendPropertyAcquisition,
    sendPropertyDisposition: mockSendPropertyDisposition,
    sendK1Available: mockSendK1Available,
    sendK1Estimate: mockSendK1Estimate,
    sendK1Amended: mockSendK1Amended,
  },
  EmailService: vi.fn(),
}));

import { reportingEmailTriggers } from './reportingEmailTriggers';
import type {
  FundReportContext,
  InvestorMeetingContext,
  K1DocumentContext,
  PropertyAnnouncementContext,
} from './reportingEmailTriggers';

// Helper to setup mock database responses
const setupMockDatabase = (config: {
  fund?: { id: string; name: string } | null;
  deal?: { id: string; name: string } | null;
  investor?: { id: string; email: string; first_name: string; last_name: string } | null;
  investors?: Array<{ id: string; email: string; first_name: string; last_name: string }>;
}) => {
  mockSupabaseFrom.mockImplementation((table: string) => {
    if (table === 'funds') {
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: config.fund ?? { id: 'fund-abc', name: 'Alpha Growth Fund' },
              error: config.fund === null ? { message: 'Not found' } : null,
            }),
          }),
        }),
      };
    }
    if (table === 'deals') {
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: config.deal ?? { id: 'deal-xyz', name: 'Test Property' },
              error: config.deal === null ? { message: 'Not found' } : null,
            }),
          }),
        }),
      };
    }
    if (table === 'investors') {
      // Check if single investor or multiple
      if (config.investor !== undefined) {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: config.investor,
                error: config.investor === null ? { message: 'Not found' } : null,
              }),
              eq: () => Promise.resolve({
                data: config.investors ?? [],
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            eq: () => Promise.resolve({
              data: config.investors ?? [],
              error: null,
            }),
            single: () => Promise.resolve({
              data: config.investor,
              error: config.investor === null ? { message: 'Not found' } : null,
            }),
          }),
        }),
      };
    }
    // Default: tracking tables
    return {
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          eq: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    };
  });
};

describe('ReportingEmailTriggers', () => {
  const timestamp = new Date('2026-01-18T12:00:00Z');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================
  // QUARTERLY REPORT TESTS
  // ============================================================

  describe('onQuarterlyReportPublished', () => {
    const mockReport: FundReportContext = {
      id: 'report-123',
      fundId: 'fund-abc',
      reportType: 'quarterly',
      periodYear: 2025,
      periodQuarter: 4,
      title: 'Q4 2025 Performance Report',
      summaryContent: '<p>Strong quarter performance.</p>',
    };

    it('sends quarterly report emails to all fund investors', async () => {
      setupMockDatabase({
        fund: { id: 'fund-abc', name: 'Alpha Growth Fund' },
        investors: [
          { id: 'inv-1', email: 'investor1@example.com', first_name: 'John', last_name: 'Smith' },
          { id: 'inv-2', email: 'investor2@example.com', first_name: 'Jane', last_name: 'Doe' },
        ],
      });

      const result = await reportingEmailTriggers.onQuarterlyReportPublished(mockReport, timestamp);

      expect(result.total).toBe(2);
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
      expect(mockSendQuarterlyReport).toHaveBeenCalledTimes(2);
    });

    it('passes correct template data to email service', async () => {
      setupMockDatabase({
        fund: { id: 'fund-abc', name: 'Alpha Growth Fund' },
        investors: [
          { id: 'inv-1', email: 'investor1@example.com', first_name: 'John', last_name: 'Smith' },
        ],
      });

      await reportingEmailTriggers.onQuarterlyReportPublished(mockReport, timestamp);

      expect(mockSendQuarterlyReport).toHaveBeenCalledWith(
        'investor1@example.com',
        expect.objectContaining({
          recipientName: 'John Smith',
          fundName: 'Alpha Growth Fund',
          quarter: '4',
          year: '2025',
          reportSummary: '<p>Strong quarter performance.</p>',
        })
      );
    });

    it('logs emails for successful sends', async () => {
      setupMockDatabase({
        fund: { id: 'fund-abc', name: 'Alpha Growth Fund' },
        investors: [
          { id: 'inv-1', email: 'investor1@example.com', first_name: 'John', last_name: 'Smith' },
        ],
      });

      await reportingEmailTriggers.onQuarterlyReportPublished(mockReport, timestamp);

      expect(mockLogEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          templateKey: 'quarterly_report',
          automationType: 'auto_trigger',
          triggerEvent: 'report_published',
        })
      );
    });

    it('handles partial failures', async () => {
      setupMockDatabase({
        fund: { id: 'fund-abc', name: 'Alpha Growth Fund' },
        investors: [
          { id: 'inv-1', email: 'investor1@example.com', first_name: 'John', last_name: 'Smith' },
          { id: 'inv-2', email: 'investor2@example.com', first_name: 'Jane', last_name: 'Doe' },
        ],
      });

      mockSendQuarterlyReport
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: false, error: 'Failed' });

      const result = await reportingEmailTriggers.onQuarterlyReportPublished(mockReport, timestamp);

      expect(result.sent).toBe(1);
      expect(result.failed).toBe(1);
    });

    it('returns empty results when fund not found', async () => {
      setupMockDatabase({ fund: null });

      const result = await reportingEmailTriggers.onQuarterlyReportPublished(mockReport, timestamp);

      expect(result.total).toBe(0);
      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
    });
  });

  // ============================================================
  // ANNUAL REPORT TESTS
  // ============================================================

  describe('onAnnualReportPublished', () => {
    const mockReport: FundReportContext = {
      id: 'report-456',
      fundId: 'fund-abc',
      reportType: 'annual',
      periodYear: 2025,
      title: '2025 Annual Report',
      summaryContent: '<p>Excellent year-end results.</p>',
    };

    it('sends annual report emails to all fund investors', async () => {
      setupMockDatabase({
        fund: { id: 'fund-abc', name: 'Alpha Growth Fund' },
        investors: [
          { id: 'inv-1', email: 'investor1@example.com', first_name: 'John', last_name: 'Smith' },
        ],
      });

      const result = await reportingEmailTriggers.onAnnualReportPublished(mockReport, timestamp);

      expect(result.total).toBe(1);
      expect(result.sent).toBe(1);
      expect(mockSendAnnualReport).toHaveBeenCalledWith(
        'investor1@example.com',
        expect.objectContaining({
          recipientName: 'John Smith',
          fundName: 'Alpha Growth Fund',
          year: '2025',
        })
      );
    });
  });

  // ============================================================
  // ANNUAL MEETING INVITE TESTS
  // ============================================================

  describe('onAnnualMeetingScheduled', () => {
    const mockMeeting: InvestorMeetingContext = {
      id: 'meeting-789',
      fundId: 'fund-abc',
      meetingYear: 2026,
      title: '2026 Annual Meeting',
      meetingDate: 'March 15, 2026',
      meetingTime: '2:00 PM',
      timezone: 'EST',
      meetingFormat: 'Virtual',
      agendaPreview: '<ol><li>Welcome</li><li>Performance Review</li></ol>',
      rsvpUrl: 'https://portal.example.com/meetings/789/rsvp',
    };

    it('sends meeting invites to all fund investors', async () => {
      setupMockDatabase({
        fund: { id: 'fund-abc', name: 'Alpha Growth Fund' },
        investors: [
          { id: 'inv-1', email: 'investor1@example.com', first_name: 'John', last_name: 'Smith' },
        ],
      });

      const result = await reportingEmailTriggers.onAnnualMeetingScheduled(mockMeeting, timestamp);

      expect(result.total).toBe(1);
      expect(result.sent).toBe(1);
      expect(mockSendAnnualMeetingInvite).toHaveBeenCalledWith(
        'investor1@example.com',
        expect.objectContaining({
          recipientName: 'John Smith',
          fundName: 'Alpha Growth Fund',
          year: '2026',
          meetingDate: 'March 15, 2026',
          meetingTime: '2:00 PM',
          timezone: 'EST',
          meetingFormat: 'Virtual',
        })
      );
    });
  });

  // ============================================================
  // PROPERTY ACQUISITION TESTS
  // ============================================================

  describe('onPropertyAcquired', () => {
    const mockAnnouncement: PropertyAnnouncementContext = {
      id: 'announce-123',
      fundId: 'fund-abc',
      dealId: 'deal-xyz',
      announcementType: 'acquisition',
      summaryContent: '<p>Purchase price: $25M</p>',
    };

    it('sends property acquisition emails to all fund investors', async () => {
      setupMockDatabase({
        fund: { id: 'fund-abc', name: 'Real Estate Fund I' },
        deal: { id: 'deal-xyz', name: '123 Main Street' },
        investors: [
          { id: 'inv-1', email: 'investor1@example.com', first_name: 'John', last_name: 'Smith' },
        ],
      });

      const result = await reportingEmailTriggers.onPropertyAcquired(mockAnnouncement, timestamp);

      expect(result.total).toBe(1);
      expect(result.sent).toBe(1);
      expect(mockSendPropertyAcquisition).toHaveBeenCalledWith(
        'investor1@example.com',
        expect.objectContaining({
          recipientName: 'John Smith',
          fundName: 'Real Estate Fund I',
          propertyName: '123 Main Street',
          acquisitionSummary: '<p>Purchase price: $25M</p>',
        })
      );
    });

    it('logs acquisition emails with correct trigger event', async () => {
      setupMockDatabase({
        fund: { id: 'fund-abc', name: 'Real Estate Fund I' },
        deal: { id: 'deal-xyz', name: '123 Main Street' },
        investors: [
          { id: 'inv-1', email: 'investor1@example.com', first_name: 'John', last_name: 'Smith' },
        ],
      });

      await reportingEmailTriggers.onPropertyAcquired(mockAnnouncement, timestamp);

      expect(mockLogEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          templateKey: 'property_acquisition',
          triggerEvent: 'acquisition_closed',
        })
      );
    });
  });

  // ============================================================
  // PROPERTY DISPOSITION TESTS
  // ============================================================

  describe('onPropertySold', () => {
    const mockAnnouncement: PropertyAnnouncementContext = {
      id: 'announce-456',
      fundId: 'fund-abc',
      dealId: 'deal-xyz',
      announcementType: 'disposition',
      summaryContent: '<p>Sale price: $35M, IRR: 22%</p>',
    };

    it('sends property disposition emails to all fund investors', async () => {
      setupMockDatabase({
        fund: { id: 'fund-abc', name: 'Real Estate Fund I' },
        deal: { id: 'deal-xyz', name: '456 Oak Avenue' },
        investors: [
          { id: 'inv-1', email: 'investor1@example.com', first_name: 'John', last_name: 'Smith' },
        ],
      });

      const result = await reportingEmailTriggers.onPropertySold(mockAnnouncement, timestamp);

      expect(result.total).toBe(1);
      expect(result.sent).toBe(1);
      expect(mockSendPropertyDisposition).toHaveBeenCalledWith(
        'investor1@example.com',
        expect.objectContaining({
          recipientName: 'John Smith',
          fundName: 'Real Estate Fund I',
          propertyName: '456 Oak Avenue',
          dispositionSummary: '<p>Sale price: $35M, IRR: 22%</p>',
        })
      );
    });
  });

  // ============================================================
  // K-1 AVAILABLE TESTS
  // ============================================================

  describe('onK1Uploaded', () => {
    const mockK1: K1DocumentContext = {
      id: 'k1-123',
      fundId: 'fund-abc',
      investorId: 'inv-1',
      taxYear: 2025,
      documentType: 'final',
      filePath: '/documents/k1/2025/inv-1.pdf',
    };

    it('sends K-1 available email to specific investor', async () => {
      setupMockDatabase({
        fund: { id: 'fund-abc', name: 'Alpha Growth Fund' },
        investor: { id: 'inv-1', email: 'investor1@example.com', first_name: 'John', last_name: 'Smith' },
      });

      const result = await reportingEmailTriggers.onK1Uploaded(mockK1, timestamp);

      expect(result.success).toBe(true);
      expect(mockSendK1Available).toHaveBeenCalledWith(
        'investor1@example.com',
        expect.objectContaining({
          recipientName: 'John Smith',
          fundName: 'Alpha Growth Fund',
          taxYear: '2025',
        })
      );
    });

    it('logs K-1 email with correct metadata', async () => {
      setupMockDatabase({
        fund: { id: 'fund-abc', name: 'Alpha Growth Fund' },
        investor: { id: 'inv-1', email: 'investor1@example.com', first_name: 'John', last_name: 'Smith' },
      });

      await reportingEmailTriggers.onK1Uploaded(mockK1, timestamp);

      expect(mockLogEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          investorId: 'inv-1',
          fundId: 'fund-abc',
          templateKey: 'k1_available',
          triggerEvent: 'k1_uploaded',
          metadata: expect.objectContaining({
            k1Id: 'k1-123',
            taxYear: 2025,
          }),
        })
      );
    });

    it('returns error when investor not found', async () => {
      setupMockDatabase({
        fund: { id: 'fund-abc', name: 'Alpha Growth Fund' },
        investor: null,
      });

      const result = await reportingEmailTriggers.onK1Uploaded(mockK1, timestamp);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Investor not found');
    });
  });

  // ============================================================
  // K-1 ESTIMATE TESTS
  // ============================================================

  describe('onK1EstimateReady', () => {
    const mockK1: K1DocumentContext = {
      id: 'k1-456',
      fundId: 'fund-abc',
      investorId: 'inv-1',
      taxYear: 2025,
      documentType: 'estimate',
      expectedFinalDate: 'March 15, 2026',
    };

    it('sends K-1 estimate email to specific investor', async () => {
      setupMockDatabase({
        fund: { id: 'fund-abc', name: 'Alpha Growth Fund' },
        investor: { id: 'inv-1', email: 'investor1@example.com', first_name: 'John', last_name: 'Smith' },
      });

      const result = await reportingEmailTriggers.onK1EstimateReady(mockK1, timestamp);

      expect(result.success).toBe(true);
      expect(mockSendK1Estimate).toHaveBeenCalledWith(
        'investor1@example.com',
        expect.objectContaining({
          recipientName: 'John Smith',
          fundName: 'Alpha Growth Fund',
          taxYear: '2025',
          expectedFinalDate: 'March 15, 2026',
        })
      );
    });
  });

  // ============================================================
  // K-1 AMENDED TESTS
  // ============================================================

  describe('onK1Amended', () => {
    const mockK1: K1DocumentContext = {
      id: 'k1-789',
      fundId: 'fund-abc',
      investorId: 'inv-1',
      taxYear: 2025,
      documentType: 'amended',
      amendmentReason: 'Correction to depreciation allocation',
    };

    it('sends K-1 amended email to specific investor', async () => {
      setupMockDatabase({
        fund: { id: 'fund-abc', name: 'Alpha Growth Fund' },
        investor: { id: 'inv-1', email: 'investor1@example.com', first_name: 'John', last_name: 'Smith' },
      });

      const result = await reportingEmailTriggers.onK1Amended(mockK1, timestamp);

      expect(result.success).toBe(true);
      expect(mockSendK1Amended).toHaveBeenCalledWith(
        'investor1@example.com',
        expect.objectContaining({
          recipientName: 'John Smith',
          fundName: 'Alpha Growth Fund',
          taxYear: '2025',
          amendmentReason: 'Correction to depreciation allocation',
        })
      );
    });

    it('provides default amendment reason when not specified', async () => {
      setupMockDatabase({
        fund: { id: 'fund-abc', name: 'Alpha Growth Fund' },
        investor: { id: 'inv-1', email: 'investor1@example.com', first_name: 'John', last_name: 'Smith' },
      });

      const k1WithoutReason: K1DocumentContext = { ...mockK1, amendmentReason: undefined };
      
      await reportingEmailTriggers.onK1Amended(k1WithoutReason, timestamp);

      expect(mockSendK1Amended).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          amendmentReason: 'Corrections to previously issued K-1',
        })
      );
    });
  });
});
