/**
 * Capital Call Email Triggers Tests
 * Tests the email orchestration layer for capital call workflows
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing the module
vi.mock('../../common/database/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    })),
  },
}));

vi.mock('../email/email.service', () => ({
  emailService: {
    sendCapitalCallRequest: vi.fn().mockResolvedValue({ success: true, messageId: 'msg-123' }),
    sendWireConfirmation: vi.fn().mockResolvedValue({ success: true, messageId: 'msg-456' }),
    sendWireIssue: vi.fn().mockResolvedValue({ success: true, messageId: 'msg-789' }),
    sendCapitalCallReminder7: vi.fn().mockResolvedValue({ success: true }),
    sendCapitalCallReminder3: vi.fn().mockResolvedValue({ success: true }),
    sendCapitalCallReminder1: vi.fn().mockResolvedValue({ success: true }),
    sendCapitalCallPastDue: vi.fn().mockResolvedValue({ success: true }),
    sendCapitalCallPastDue7: vi.fn().mockResolvedValue({ success: true }),
    sendCapitalCallDefault: vi.fn().mockResolvedValue({ success: true }),
    sendDistributionNotice: vi.fn().mockResolvedValue({ success: true }),
    sendDistributionSent: vi.fn().mockResolvedValue({ success: true }),
    sendDistributionElection: vi.fn().mockResolvedValue({ success: true }),
    sendRefinanceNotice: vi.fn().mockResolvedValue({ success: true }),
  },
  EmailService: vi.fn(),
}));

vi.mock('../email/emailLogger', () => ({
  emailLogger: {
    log: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('./capitalCallJobScheduler', () => ({
  capitalCallJobScheduler: {
    scheduleCapitalCallReminders: vi.fn().mockResolvedValue(undefined),
    schedulePastDueEmails: vi.fn().mockResolvedValue(undefined),
    cancelCapitalCallReminders: vi.fn().mockResolvedValue(undefined),
    cancelPastDueEmails: vi.fn().mockResolvedValue(undefined),
    cancelAllCapitalCallEmails: vi.fn().mockResolvedValue(undefined),
    handleStatusChange: vi.fn().mockResolvedValue(undefined),
  },
}));

// Import after mocks are set up
import {
  CapitalCallEmailTriggers,
  capitalCallEmailTriggers,
  CapitalCallContext,
  InvestorContext,
  FundContext,
  CapitalCallItemContext,
  DistributionContext,
  DistributionElectionContext,
  RefinanceContext,
} from './capitalCallEmailTriggers';
import { emailService } from '../email/email.service';
import { capitalCallJobScheduler } from './capitalCallJobScheduler';
import { emailLogger } from '../email/emailLogger';

// Test fixtures
const createMockCapitalCall = (overrides: Partial<CapitalCallContext> = {}): CapitalCallContext => ({
  id: 'cc-123',
  dealName: 'Downtown Office Building',
  totalAmount: 500000,
  deadline: '2026-02-15',
  callNumber: '2026-001',
  ...overrides,
});

const createMockInvestor = (overrides: Partial<InvestorContext> = {}): InvestorContext => ({
  id: 'investor-456',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  ...overrides,
});

const createMockFund = (overrides: Partial<FundContext> = {}): FundContext => ({
  id: 'fund-789',
  name: 'Acme Fund I',
  wireInstructions: {
    bankName: 'First National Bank',
    routingNumber: '123456789',
    accountNumber: '987654321',
  },
  defaultSection: 'Section 4.2',
  ...overrides,
});

const createMockCapitalCallItem = (overrides: Partial<CapitalCallItemContext> = {}): CapitalCallItemContext => ({
  id: 'item-001',
  amountDue: 50000,
  capitalCallId: 'cc-123',
  ...overrides,
});

describe('CapitalCallEmailTriggers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('onCapitalCallCreated', () => {
    it('should send capital call emails to all investors', async () => {
      const capitalCall = createMockCapitalCall();
      const fund = createMockFund();
      const investors = [
        { ...createMockInvestor(), amountDue: 50000, capitalCallItemId: 'item-001' },
        { ...createMockInvestor({ id: 'investor-789', email: 'jane@example.com', firstName: 'Jane' }), amountDue: 75000, capitalCallItemId: 'item-002' },
      ];
      const timestamp = new Date('2026-01-15T10:00:00Z');

      const results = await capitalCallEmailTriggers.onCapitalCallCreated(
        capitalCall,
        investors,
        fund,
        timestamp
      );

      expect(results.total).toBe(2);
      expect(results.sent).toBe(2);
      expect(results.failed).toBe(0);
      expect(emailService.sendCapitalCallRequest).toHaveBeenCalledTimes(2);
    });

    it('should schedule reminders for each investor', async () => {
      const capitalCall = createMockCapitalCall();
      const fund = createMockFund();
      const investors = [
        { ...createMockInvestor(), amountDue: 50000, capitalCallItemId: 'item-001' },
      ];
      const timestamp = new Date('2026-01-15T10:00:00Z');

      await capitalCallEmailTriggers.onCapitalCallCreated(
        capitalCall,
        investors,
        fund,
        timestamp
      );

      expect(capitalCallJobScheduler.scheduleCapitalCallReminders).toHaveBeenCalledWith(
        'item-001',
        'investor-456',
        'fund-789',
        expect.any(Date),
        timestamp
      );
      expect(capitalCallJobScheduler.schedulePastDueEmails).toHaveBeenCalledWith(
        'item-001',
        'investor-456',
        'fund-789',
        expect.any(Date),
        timestamp
      );
    });

    it('should log email sends', async () => {
      const capitalCall = createMockCapitalCall();
      const fund = createMockFund();
      const investors = [
        { ...createMockInvestor(), amountDue: 50000, capitalCallItemId: 'item-001' },
      ];
      const timestamp = new Date('2026-01-15T10:00:00Z');

      await capitalCallEmailTriggers.onCapitalCallCreated(
        capitalCall,
        investors,
        fund,
        timestamp
      );

      expect(emailLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          emailType: 'capital_call_request',
          recipientEmail: 'john@example.com',
          status: 'sent',
        })
      );
    });
  });

  describe('onWireConfirmed', () => {
    it('should cancel all pending emails and send confirmation', async () => {
      const item = createMockCapitalCallItem();
      const investor = createMockInvestor();
      const fund = createMockFund();
      const timestamp = new Date('2026-01-20T10:00:00Z');

      const result = await capitalCallEmailTriggers.onWireConfirmed(
        item,
        investor,
        fund,
        50000,
        '2026-001',
        timestamp
      );

      expect(capitalCallJobScheduler.cancelAllCapitalCallEmails).toHaveBeenCalledWith('item-001');
      expect(emailService.sendWireConfirmation).toHaveBeenCalledWith(
        'john@example.com',
        expect.objectContaining({
          recipientName: 'John Doe',
          fundName: 'Acme Fund I',
          amountReceived: expect.stringMatching(/50[,.]?000/),
          capitalCallNumber: '2026-001',
        })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('onWireIssue', () => {
    it('should send wire issue notification', async () => {
      const item = createMockCapitalCallItem();
      const investor = createMockInvestor();
      const fund = createMockFund();
      const timestamp = new Date('2026-01-20T10:00:00Z');

      const result = await capitalCallEmailTriggers.onWireIssue(
        item,
        investor,
        fund,
        'Amount mismatch',
        '2026-001',
        50000,
        45000,
        timestamp
      );

      expect(emailService.sendWireIssue).toHaveBeenCalledWith(
        'john@example.com',
        expect.objectContaining({
          issueDescription: 'Amount mismatch',
          expectedAmount: expect.stringMatching(/50[,.]?000/),
          receivedAmount: expect.stringMatching(/45[,.]?000/),
        })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('onDefaultInitiated', () => {
    it('should cancel past due emails and send default notice', async () => {
      const item = createMockCapitalCallItem();
      const investor = createMockInvestor();
      const fund = createMockFund({
        legalDefaultNoticeContent: '<p>Per the Operating Agreement, you are in default.</p>',
      });
      const timestamp = new Date('2026-02-28T10:00:00Z');

      const result = await capitalCallEmailTriggers.onDefaultInitiated(
        item,
        investor,
        fund,
        '2026-001',
        timestamp
      );

      expect(capitalCallJobScheduler.cancelPastDueEmails).toHaveBeenCalledWith('item-001');
      expect(emailService.sendCapitalCallDefault).toHaveBeenCalledWith(
        'john@example.com',
        expect.objectContaining({
          capitalCallNumber: '2026-001',
          defaultSection: 'Section 4.2',
        })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('Distribution Triggers', () => {
    it('should send distribution notice when approved', async () => {
      const distribution: DistributionContext = {
        id: 'dist-123',
        fundId: 'fund-789',
        amount: 15000,
        distributionType: 'Quarterly Distribution',
        paymentDate: '2026-03-01',
        paymentMethod: 'Wire',
      };
      const investor = createMockInvestor();
      const fund = createMockFund();
      const timestamp = new Date('2026-02-15T10:00:00Z');

      const result = await capitalCallEmailTriggers.onDistributionApproved(
        distribution,
        investor,
        fund,
        timestamp
      );

      expect(emailService.sendDistributionNotice).toHaveBeenCalledWith(
        'john@example.com',
        expect.objectContaining({
          distributionAmount: expect.stringMatching(/15[,.]?000/),
          distributionType: 'Quarterly Distribution',
          paymentMethod: 'Wire',
        })
      );
      expect(result.success).toBe(true);
    });

    it('should send distribution sent notification', async () => {
      const distribution: DistributionContext = {
        id: 'dist-123',
        fundId: 'fund-789',
        amount: 15000,
        distributionType: 'Quarterly Distribution',
        paymentDate: '2026-03-01',
        paymentMethod: 'ACH',
        confirmationNumber: 'DIST-XYZ789',
        arrivalTimeframe: '2-3 business days',
      };
      const investor = createMockInvestor();
      const fund = createMockFund();
      const timestamp = new Date('2026-03-01T10:00:00Z');

      const result = await capitalCallEmailTriggers.onDistributionSent(
        distribution,
        investor,
        fund,
        timestamp
      );

      expect(emailService.sendDistributionSent).toHaveBeenCalledWith(
        'john@example.com',
        expect.objectContaining({
          distributionAmount: expect.stringMatching(/15[,.]?000/),
          paymentMethod: 'ACH',
          confirmationNumber: 'DIST-XYZ789',
          arrivalTimeframe: '2-3 business days',
        })
      );
      expect(result.success).toBe(true);
    });

    it('should send distribution election request', async () => {
      const election: DistributionElectionContext = {
        id: 'election-123',
        fundId: 'fund-789',
        eligibleAmount: 50000,
        source: 'Property Sale Proceeds',
        electionDeadline: '2026-03-15',
      };
      const investor = createMockInvestor();
      const fund = createMockFund();
      const timestamp = new Date('2026-02-15T10:00:00Z');

      const result = await capitalCallEmailTriggers.onDistributionElectionRequired(
        election,
        investor,
        fund,
        timestamp
      );

      expect(emailService.sendDistributionElection).toHaveBeenCalledWith(
        'john@example.com',
        expect.objectContaining({
          eligibleAmount: expect.stringMatching(/50[,.]?000/),
          source: 'Property Sale Proceeds',
          electionDeadline: '2026-03-15',
        })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('Refinance Triggers', () => {
    it('should send refinance notice when completed', async () => {
      const refinance: RefinanceContext = {
        id: 'refi-123',
        fundId: 'fund-789',
        propertyName: 'Downtown Office Complex',
        refinanceSummary: '<p>New loan: $5M at 5.5% for 10 years</p>',
      };
      const investor = createMockInvestor();
      const fund = createMockFund();
      const timestamp = new Date('2026-02-01T10:00:00Z');

      const result = await capitalCallEmailTriggers.onRefinanceCompleted(
        refinance,
        investor,
        fund,
        timestamp
      );

      expect(emailService.sendRefinanceNotice).toHaveBeenCalledWith(
        'john@example.com',
        expect.objectContaining({
          propertyName: 'Downtown Office Complex',
          refinanceSummary: '<p>New loan: $5M at 5.5% for 10 years</p>',
        })
      );
      expect(result.success).toBe(true);
    });
  });
});

describe('Helper Functions', () => {
  it('should format name correctly with first and last name', async () => {
    const investor = createMockInvestor({ firstName: 'Alice', lastName: 'Brown' });
    const fund = createMockFund();
    const capitalCall = createMockCapitalCall();
    const timestamp = new Date();

    await capitalCallEmailTriggers.sendCapitalCallRequest(
      capitalCall,
      investor,
      50000,
      fund,
      timestamp
    );

    expect(emailService.sendCapitalCallRequest).toHaveBeenCalledWith(
      'john@example.com',
      expect.objectContaining({
        recipientName: 'Alice Brown',
      })
    );
  });

  it('should handle missing last name', async () => {
    const investor = createMockInvestor({ firstName: 'Bob', lastName: '' });
    const fund = createMockFund();
    const capitalCall = createMockCapitalCall();
    const timestamp = new Date();

    await capitalCallEmailTriggers.sendCapitalCallRequest(
      capitalCall,
      investor,
      50000,
      fund,
      timestamp
    );

    expect(emailService.sendCapitalCallRequest).toHaveBeenCalledWith(
      'john@example.com',
      expect.objectContaining({
        recipientName: 'Bob',
      })
    );
  });

  it('should fallback to "Investor" when no name provided', async () => {
    const investor = createMockInvestor({ firstName: '', lastName: '' });
    const fund = createMockFund();
    const capitalCall = createMockCapitalCall();
    const timestamp = new Date();

    await capitalCallEmailTriggers.sendCapitalCallRequest(
      capitalCall,
      investor,
      50000,
      fund,
      timestamp
    );

    expect(emailService.sendCapitalCallRequest).toHaveBeenCalledWith(
      'john@example.com',
      expect.objectContaining({
        recipientName: 'Investor',
      })
    );
  });
});

describe('URL Generation', () => {
  beforeEach(() => {
    vi.stubEnv('FRONTEND_URL', 'https://app.example.com');
  });

  it('should generate correct wire instructions URL', async () => {
    const investor = createMockInvestor();
    const fund = createMockFund();
    const capitalCall = createMockCapitalCall({ id: 'cc-abc123' });
    const timestamp = new Date();

    await capitalCallEmailTriggers.sendCapitalCallRequest(
      capitalCall,
      investor,
      50000,
      fund,
      timestamp
    );

    expect(emailService.sendCapitalCallRequest).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        wireInstructionsUrl: expect.stringContaining('/investor/capital-calls/cc-abc123'),
      })
    );
  });
});

describe('Reference Code Generation', () => {
  it('should generate reference code with capital call number and investor ID prefix', async () => {
    const investor = createMockInvestor({ id: 'investor-12345678-abcd' });
    const fund = createMockFund();
    const capitalCall = createMockCapitalCall({ callNumber: '2026-005' });
    const timestamp = new Date();

    await capitalCallEmailTriggers.sendCapitalCallRequest(
      capitalCall,
      investor,
      50000,
      fund,
      timestamp
    );

    expect(emailService.sendCapitalCallRequest).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        wireInstructions: expect.objectContaining({
          referenceCode: expect.stringContaining('CC-2026-005'),
        }),
      })
    );
  });
});

describe('Singleton Instance', () => {
  it('should export a singleton instance', () => {
    expect(capitalCallEmailTriggers).toBeInstanceOf(CapitalCallEmailTriggers);
  });
});
