/**
 * Investor Email Triggers Tests
 * Tests the email orchestration layer for investor onboarding (Stage 02)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing the module
vi.mock('../../common/database/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          limit: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
    })),
  },
}));

vi.mock('../email/email.service', () => ({
  emailService: {
    sendAccountInvitationEnhanced: vi.fn().mockResolvedValue({ success: true }),
    sendVerificationCode: vi.fn().mockResolvedValue({ success: true }),
    sendAccountCreated: vi.fn().mockResolvedValue({ success: true }),
    sendOnboardingReminder1: vi.fn().mockResolvedValue({ success: true }),
    sendOnboardingReminder2: vi.fn().mockResolvedValue({ success: true }),
    sendOnboardingReminder3: vi.fn().mockResolvedValue({ success: true }),
    sendDocumentUploadedPending: vi.fn().mockResolvedValue({ success: true }),
    sendDocumentApproved: vi.fn().mockResolvedValue({ success: true }),
    sendDocumentRejection: vi.fn().mockResolvedValue({ success: true }),
    sendDocumentsReadySignature: vi.fn().mockResolvedValue({ success: true }),
    sendSignatureReminder1: vi.fn().mockResolvedValue({ success: true }),
    sendSignatureReminder2: vi.fn().mockResolvedValue({ success: true }),
    sendDocumentsFullyExecuted: vi.fn().mockResolvedValue({ success: true }),
    sendFundingInstructions: vi.fn().mockResolvedValue({ success: true }),
    sendFundingDiscrepancy: vi.fn().mockResolvedValue({ success: true }),
    sendWelcomeInvestorEnhanced: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock('./investorJobScheduler', () => ({
  investorJobScheduler: {
    scheduleOnboardingReminders: vi.fn().mockResolvedValue(undefined),
    cancelOnboardingReminders: vi.fn().mockResolvedValue(undefined),
    scheduleSignatureReminders: vi.fn().mockResolvedValue(undefined),
    cancelSignatureReminders: vi.fn().mockResolvedValue(undefined),
    cancelAllInvestorEmails: vi.fn().mockResolvedValue(undefined),
    handleStatusChange: vi.fn().mockResolvedValue(undefined),
  },
}));

// Import after mocks are set up
import { InvestorEmailTriggers, investorEmailTriggers } from './investorEmailTriggers';
import { emailService } from '../email/email.service';
import { investorJobScheduler } from './investorJobScheduler';
import { supabaseAdmin } from '../../common/database/supabase';

// Helper to mock database responses
function mockDatabaseResponses(
  investor: Record<string, unknown> | null,
  fund: Record<string, unknown> | null,
  manager: Record<string, unknown> | null
) {
  const mockFrom = vi.mocked(supabaseAdmin.from);

  mockFrom.mockImplementation((table: string) => {
    if (table === 'investors') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: investor,
              error: investor ? null : { message: 'Not found' },
            }),
          }),
        }),
      } as unknown as ReturnType<typeof supabaseAdmin.from>;
    }
    if (table === 'funds') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: fund,
              error: fund ? null : { message: 'Not found' },
            }),
          }),
        }),
      } as unknown as ReturnType<typeof supabaseAdmin.from>;
    }
    if (table === 'users') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: manager,
                  error: manager ? null : { message: 'Not found' },
                }),
              }),
            }),
            limit: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: manager,
                error: manager ? null : { message: 'Not found' },
              }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof supabaseAdmin.from>;
    }
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
        }),
      }),
    } as unknown as ReturnType<typeof supabaseAdmin.from>;
  });
}

// Test fixtures
const mockInvestor = {
  id: 'investor-123',
  email: 'john@example.com',
  first_name: 'John',
  last_name: 'Doe',
  entity_name: null,
  fund_id: 'fund-456',
  status: 'account_created',
  commitment_amount: 250000,
};

const mockFund = {
  id: 'fund-456',
  name: 'Acme Growth Fund',
  platform_name: 'Lionshare Portal',
  document_review_timeframe: '1-2 business days',
  welcome_message: 'Welcome to our fund family!',
  calendly_url: 'https://calendly.com/acme',
};

const mockManager = {
  id: 'manager-789',
  first_name: 'Sarah',
  last_name: 'Manager',
  email: 'sarah@acme.com',
  title: 'Managing Partner',
};

describe('InvestorEmailTriggers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('onAccountInviteSent', () => {
    it('should send account invitation and schedule reminders', async () => {
      mockDatabaseResponses(mockInvestor, mockFund, mockManager);
      const timestamp = new Date();

      await investorEmailTriggers.onAccountInviteSent(
        'investor-123',
        'fund-456',
        'https://portal.example.com/create-account/token123',
        'We discussed the 8% target return.',
        timestamp
      );

      expect(emailService.sendAccountInvitationEnhanced).toHaveBeenCalledWith(
        'john@example.com',
        expect.objectContaining({
          recipientName: 'John Doe',
          fundName: 'Acme Growth Fund',
          accountCreationUrl: 'https://portal.example.com/create-account/token123',
          postMeetingRecap: 'We discussed the 8% target return.',
          platformName: 'Lionshare Portal',
          managerName: 'Sarah Manager',
          managerTitle: 'Managing Partner',
        })
      );

      expect(investorJobScheduler.scheduleOnboardingReminders).toHaveBeenCalledWith(
        'investor-123',
        'fund-456',
        timestamp
      );
    });
  });

  describe('onVerificationCodeRequested', () => {
    it('should send verification code email', async () => {
      await investorEmailTriggers.onVerificationCodeRequested(
        'john@example.com',
        'John Doe',
        '123456',
        15
      );

      expect(emailService.sendVerificationCode).toHaveBeenCalledWith(
        'john@example.com',
        {
          recipientName: 'John Doe',
          verificationCode: '123456',
          expiresInMinutes: 15,
        }
      );
    });
  });

  describe('onAccountCreated', () => {
    it('should send account created confirmation', async () => {
      mockDatabaseResponses(mockInvestor, mockFund, mockManager);

      await investorEmailTriggers.onAccountCreated('investor-123', 'fund-456');

      expect(emailService.sendAccountCreated).toHaveBeenCalledWith(
        'john@example.com',
        expect.objectContaining({
          recipientName: 'John Doe',
          fundName: 'Acme Growth Fund',
        })
      );
    });
  });

  describe('onProfileCompleted', () => {
    it('should cancel onboarding reminders', async () => {
      await investorEmailTriggers.onProfileCompleted('investor-123');

      expect(investorJobScheduler.cancelOnboardingReminders).toHaveBeenCalledWith('investor-123');
    });
  });

  describe('onDocumentUploaded', () => {
    it('should send document pending confirmation', async () => {
      mockDatabaseResponses(mockInvestor, mockFund, mockManager);

      await investorEmailTriggers.onDocumentUploaded(
        'investor-123',
        'fund-456',
        'Driver License'
      );

      expect(emailService.sendDocumentUploadedPending).toHaveBeenCalledWith(
        'john@example.com',
        expect.objectContaining({
          recipientName: 'John Doe',
          fundName: 'Acme Growth Fund',
          documentType: 'Driver License',
          reviewTimeframe: '1-2 business days',
        })
      );
    });
  });

  describe('onDocumentApproved', () => {
    it('should send document approved notification', async () => {
      mockDatabaseResponses(mockInvestor, mockFund, mockManager);

      await investorEmailTriggers.onDocumentApproved(
        'investor-123',
        'fund-456',
        'license.pdf',
        'Driver License'
      );

      expect(emailService.sendDocumentApproved).toHaveBeenCalledWith(
        'john@example.com',
        expect.objectContaining({
          recipientName: 'John Doe',
          fundName: 'Acme Growth Fund',
          documentName: 'license.pdf',
          documentType: 'Driver License',
        })
      );
    });
  });

  describe('onDocumentRejected', () => {
    it('should send document rejected notification', async () => {
      mockDatabaseResponses(mockInvestor, mockFund, mockManager);

      await investorEmailTriggers.onDocumentRejected(
        'investor-123',
        'fund-456',
        'license.pdf',
        'Driver License',
        'Image is blurry, please resubmit.'
      );

      expect(emailService.sendDocumentRejection).toHaveBeenCalledWith(
        'john@example.com',
        expect.objectContaining({
          recipientName: 'John Doe',
          fundName: 'Acme Growth Fund',
          documentName: 'license.pdf',
          documentType: 'Driver License',
          rejectionReason: 'Image is blurry, please resubmit.',
        })
      );
    });
  });

  describe('onAllDocumentsApproved', () => {
    it('should cancel onboarding reminders, send docs ready, and schedule signature reminders', async () => {
      mockDatabaseResponses(mockInvestor, mockFund, mockManager);
      const timestamp = new Date();

      await investorEmailTriggers.onAllDocumentsApproved(
        'investor-123',
        'fund-456',
        'https://docusign.example.com/sign/abc123',
        timestamp
      );

      expect(investorJobScheduler.cancelOnboardingReminders).toHaveBeenCalledWith('investor-123');
      expect(emailService.sendDocumentsReadySignature).toHaveBeenCalledWith(
        'john@example.com',
        expect.objectContaining({
          recipientName: 'John Doe',
          fundName: 'Acme Growth Fund',
          docusignUrl: 'https://docusign.example.com/sign/abc123',
        })
      );
      expect(investorJobScheduler.scheduleSignatureReminders).toHaveBeenCalledWith(
        'investor-123',
        'fund-456',
        timestamp
      );
    });
  });

  describe('onDocumentsSigned', () => {
    it('should cancel signature reminders', async () => {
      await investorEmailTriggers.onDocumentsSigned('investor-123');

      expect(investorJobScheduler.cancelSignatureReminders).toHaveBeenCalledWith('investor-123');
    });
  });

  describe('onDocumentsFullyExecuted', () => {
    it('should cancel signature reminders and send executed email', async () => {
      mockDatabaseResponses(mockInvestor, mockFund, mockManager);

      await investorEmailTriggers.onDocumentsFullyExecuted('investor-123', 'fund-456');

      expect(investorJobScheduler.cancelSignatureReminders).toHaveBeenCalledWith('investor-123');
      expect(emailService.sendDocumentsFullyExecuted).toHaveBeenCalledWith(
        'john@example.com',
        expect.objectContaining({
          recipientName: 'John Doe',
          fundName: 'Acme Growth Fund',
        })
      );
    });
  });

  describe('onSendFundingInstructions', () => {
    it('should send funding instructions with wire details', async () => {
      mockDatabaseResponses(mockInvestor, mockFund, mockManager);

      await investorEmailTriggers.onSendFundingInstructions(
        'investor-123',
        'fund-456',
        'January 31, 2026',
        {
          bankName: 'First National Bank',
          routingNumber: '123456789',
          accountNumber: '987654321',
          referenceCode: 'INV-JD-2026',
        }
      );

      expect(emailService.sendFundingInstructions).toHaveBeenCalledWith(
        'john@example.com',
        expect.objectContaining({
          recipientName: 'John Doe',
          fundName: 'Acme Growth Fund',
          commitmentAmount: '250,000',
          fundingDeadline: 'January 31, 2026',
          bankName: 'First National Bank',
          routingNumber: '123456789',
          accountNumber: '987654321',
          referenceCode: 'INV-JD-2026',
        })
      );
    });
  });

  describe('onFundingDiscrepancy', () => {
    it('should send funding discrepancy notification', async () => {
      mockDatabaseResponses(mockInvestor, mockFund, mockManager);

      await investorEmailTriggers.onFundingDiscrepancy(
        'investor-123',
        'fund-456',
        200000,
        -50000
      );

      expect(emailService.sendFundingDiscrepancy).toHaveBeenCalledWith(
        'john@example.com',
        expect.objectContaining({
          recipientName: 'John Doe',
          fundName: 'Acme Growth Fund',
          commitmentAmount: '250,000',
          receivedAmount: '200,000',
          varianceAmount: '50,000',
          managerName: 'Sarah Manager',
          managerTitle: 'Managing Partner',
        })
      );
    });
  });

  describe('onFundingReceived', () => {
    it('should cancel all emails and send welcome email', async () => {
      mockDatabaseResponses(mockInvestor, mockFund, mockManager);

      await investorEmailTriggers.onFundingReceived(
        'investor-123',
        'fund-456',
        250000,
        'January 15, 2026'
      );

      expect(investorJobScheduler.cancelAllInvestorEmails).toHaveBeenCalledWith('investor-123');
      expect(emailService.sendWelcomeInvestorEnhanced).toHaveBeenCalledWith(
        'john@example.com',
        expect.objectContaining({
          recipientName: 'John Doe',
          fundName: 'Acme Growth Fund',
          investmentAmount: '250,000',
          investmentDate: 'January 15, 2026',
          platformName: 'Lionshare Portal',
          welcomeMessage: 'Welcome to our fund family!',
          managerName: 'Sarah Manager',
          managerTitle: 'Managing Partner',
        })
      );
    });
  });

  describe('onStatusChanged', () => {
    it('should delegate to job scheduler', async () => {
      await investorEmailTriggers.onStatusChanged(
        'investor-123',
        'documents_pending',
        'account_created'
      );

      expect(investorJobScheduler.handleStatusChange).toHaveBeenCalledWith(
        'investor-123',
        'documents_pending',
        'account_created'
      );
    });
  });

  describe('sendScheduledOnboardingReminder', () => {
    it('should send reminder 1 when investor status is account_created', async () => {
      mockDatabaseResponses(mockInvestor, mockFund, mockManager);

      await investorEmailTriggers.sendScheduledOnboardingReminder(
        'investor-123',
        'fund-456',
        1
      );

      expect(emailService.sendOnboardingReminder1).toHaveBeenCalledWith(
        'john@example.com',
        expect.objectContaining({
          recipientName: 'John Doe',
          fundName: 'Acme Growth Fund',
        })
      );
    });

    it('should send reminder 2', async () => {
      mockDatabaseResponses(mockInvestor, mockFund, mockManager);

      await investorEmailTriggers.sendScheduledOnboardingReminder(
        'investor-123',
        'fund-456',
        2
      );

      expect(emailService.sendOnboardingReminder2).toHaveBeenCalled();
    });

    it('should send reminder 3', async () => {
      mockDatabaseResponses(mockInvestor, mockFund, mockManager);

      await investorEmailTriggers.sendScheduledOnboardingReminder(
        'investor-123',
        'fund-456',
        3
      );

      expect(emailService.sendOnboardingReminder3).toHaveBeenCalled();
    });

    it('should skip reminder if investor status has progressed', async () => {
      const progressedInvestor = { ...mockInvestor, status: 'documents_approved' };
      mockDatabaseResponses(progressedInvestor, mockFund, mockManager);

      await investorEmailTriggers.sendScheduledOnboardingReminder(
        'investor-123',
        'fund-456',
        1
      );

      expect(emailService.sendOnboardingReminder1).not.toHaveBeenCalled();
    });
  });

  describe('sendScheduledSignatureReminder', () => {
    it('should send signature reminder 1 when documents_sent status', async () => {
      const awaitingSignatureInvestor = { ...mockInvestor, status: 'documents_sent' };
      mockDatabaseResponses(awaitingSignatureInvestor, mockFund, mockManager);

      await investorEmailTriggers.sendScheduledSignatureReminder(
        'investor-123',
        'fund-456',
        1
      );

      expect(emailService.sendSignatureReminder1).toHaveBeenCalledWith(
        'john@example.com',
        expect.objectContaining({
          recipientName: 'John Doe',
          fundName: 'Acme Growth Fund',
        })
      );
    });

    it('should send signature reminder 2', async () => {
      const awaitingSignatureInvestor = { ...mockInvestor, status: 'awaiting_signature' };
      mockDatabaseResponses(awaitingSignatureInvestor, mockFund, mockManager);

      await investorEmailTriggers.sendScheduledSignatureReminder(
        'investor-123',
        'fund-456',
        2
      );

      expect(emailService.sendSignatureReminder2).toHaveBeenCalled();
    });

    it('should skip reminder if documents already signed', async () => {
      const signedInvestor = { ...mockInvestor, status: 'documents_signed' };
      mockDatabaseResponses(signedInvestor, mockFund, mockManager);

      await investorEmailTriggers.sendScheduledSignatureReminder(
        'investor-123',
        'fund-456',
        1
      );

      expect(emailService.sendSignatureReminder1).not.toHaveBeenCalled();
    });
  });
});

describe('Display Name Resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use first and last name when available', async () => {
    mockDatabaseResponses(mockInvestor, mockFund, mockManager);

    await investorEmailTriggers.onAccountCreated('investor-123', 'fund-456');

    expect(emailService.sendAccountCreated).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        recipientName: 'John Doe',
      })
    );
  });

  it('should use first name only when no last name', async () => {
    const noLastName = { ...mockInvestor, last_name: null };
    mockDatabaseResponses(noLastName, mockFund, mockManager);

    await investorEmailTriggers.onAccountCreated('investor-123', 'fund-456');

    expect(emailService.sendAccountCreated).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        recipientName: 'John',
      })
    );
  });

  it('should use entity name when no individual name', async () => {
    const entityInvestor = {
      ...mockInvestor,
      first_name: null,
      last_name: null,
      entity_name: 'Smith Family Trust',
    };
    mockDatabaseResponses(entityInvestor, mockFund, mockManager);

    await investorEmailTriggers.onAccountCreated('investor-123', 'fund-456');

    expect(emailService.sendAccountCreated).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        recipientName: 'Smith Family Trust',
      })
    );
  });

  it('should fall back to "Investor" when no name available', async () => {
    const noNameInvestor = {
      ...mockInvestor,
      first_name: null,
      last_name: null,
      entity_name: null,
    };
    mockDatabaseResponses(noNameInvestor, mockFund, mockManager);

    await investorEmailTriggers.onAccountCreated('investor-123', 'fund-456');

    expect(emailService.sendAccountCreated).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        recipientName: 'Investor',
      })
    );
  });
});
