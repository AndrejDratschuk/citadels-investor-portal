/**
 * Prospect Email Triggers Tests
 * Tests the email orchestration layer for the prospect pipeline
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Prospect, ProspectStatus } from '@altsui/shared';

// Mock dependencies before importing the module
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
    sendKYCInvite: vi.fn().mockResolvedValue({ success: true }),
    sendKYCAutoSend: vi.fn().mockResolvedValue({ success: true }),
    sendMeetingInvite: vi.fn().mockResolvedValue({ success: true }),
    sendKYCNotEligible: vi.fn().mockResolvedValue({ success: true }),
    sendKYCReminder1: vi.fn().mockResolvedValue({ success: true }),
    sendKYCReminder2: vi.fn().mockResolvedValue({ success: true }),
    sendKYCReminder3: vi.fn().mockResolvedValue({ success: true }),
    sendMeetingReminder24hr: vi.fn().mockResolvedValue({ success: true }),
    sendMeetingReminder15min: vi.fn().mockResolvedValue({ success: true }),
    sendMeetingNoShow: vi.fn().mockResolvedValue({ success: true }),
    sendPostMeetingProceed: vi.fn().mockResolvedValue({ success: true }),
    sendPostMeetingConsidering: vi.fn().mockResolvedValue({ success: true }),
    sendPostMeetingNotFit: vi.fn().mockResolvedValue({ success: true }),
    sendNurtureDay15: vi.fn().mockResolvedValue({ success: true }),
    sendNurtureDay23: vi.fn().mockResolvedValue({ success: true }),
    sendNurtureDay30: vi.fn().mockResolvedValue({ success: true }),
    sendDormantCloseout: vi.fn().mockResolvedValue({ success: true }),
    sendOnboardingReminder: vi.fn().mockResolvedValue({ success: true }),
    sendWelcomeInvestor: vi.fn().mockResolvedValue({ success: true }),
  },
  EmailService: vi.fn(),
}));

vi.mock('./prospectJobScheduler', () => ({
  prospectJobScheduler: {
    scheduleKYCReminders: vi.fn().mockResolvedValue(undefined),
    cancelKYCReminders: vi.fn().mockResolvedValue(undefined),
    scheduleMeetingReminders: vi.fn().mockResolvedValue(undefined),
    cancelMeetingReminders: vi.fn().mockResolvedValue(undefined),
    scheduleNurtureSequence: vi.fn().mockResolvedValue(undefined),
    cancelNurtureSequence: vi.fn().mockResolvedValue(undefined),
    cancelAllProspectEmails: vi.fn().mockResolvedValue(undefined),
    handleStatusChange: vi.fn().mockResolvedValue(undefined),
  },
}));

// Import after mocks are set up
import { ProspectEmailTriggers, prospectEmailTriggers } from './prospectEmailTriggers';
import { emailService } from '../email/email.service';
import { prospectJobScheduler } from './prospectJobScheduler';

// Test fixture
const createMockProspect = (overrides: Partial<Prospect> = {}): Prospect => ({
  id: 'prospect-123',
  fundId: 'fund-456',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
  status: 'kyc_sent' as ProspectStatus,
  source: 'manual',
  investorCategory: 'individual',
  investorType: null,
  country: 'US',
  state: 'FL',
  city: 'Miami',
  entityLegalName: null,
  countryOfFormation: null,
  stateOfFormation: null,
  authorizedSignerFirstName: null,
  authorizedSignerLastName: null,
  authorizedSignerTitle: null,
  accreditationBases: ['income', 'net_worth'],
  indicativeCommitment: 100000,
  timeline: '1_3_months',
  investmentGoals: ['income', 'appreciation'],
  likelihood: 'high',
  questionsForManager: null,
  preferredContact: 'email',
  consentGiven: true,
  kycLinkToken: 'token-abc123',
  calendlyEventUrl: 'https://calendly.com/event/123',
  sentBy: 'manager-789',
  notes: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  meetingScheduledAt: null,
  meetingCompletedAt: null,
  consideringAt: null,
  onboardingStartedAt: null,
  onboardingSubmittedAt: null,
  documentsApprovedAt: null,
  documentsRejectedAt: null,
  documentRejectionReason: null,
  meetingRecapBullets: null,
  docusignEnvelopeId: null,
  docusignSentAt: null,
  docusignSignedAt: null,
  convertedToInvestor: false,
  convertedAt: null,
  investorId: null,
  ...overrides,
});

describe('ProspectEmailTriggers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('onKYCSent', () => {
    it('should send KYC invite email', async () => {
      const prospect = createMockProspect();

      await prospectEmailTriggers.onKYCSent(
        prospect,
        'Acme Fund',
        'Jane Smith',
        'Managing Partner',
        'CAIA'
      );

      expect(emailService.sendKYCInvite).toHaveBeenCalledWith(
        'john@example.com',
        expect.objectContaining({
          recipientName: 'John Doe',
          fundName: 'Acme Fund',
          managerName: 'Jane Smith',
          managerTitle: 'Managing Partner',
          managerNameWithCredentials: 'Jane Smith, CAIA',
        })
      );
    });

    it('should schedule KYC reminders after sending', async () => {
      const prospect = createMockProspect();
      const timestamp = new Date();

      await prospectEmailTriggers.onKYCSent(
        prospect,
        'Acme Fund',
        'Jane Smith',
        undefined,
        undefined,
        undefined,
        timestamp
      );

      expect(prospectJobScheduler.scheduleKYCReminders).toHaveBeenCalledWith(
        'prospect-123',
        'fund-456',
        timestamp
      );
    });

    it('should not send if no KYC token available', async () => {
      const prospect = createMockProspect({ kycLinkToken: null });

      await prospectEmailTriggers.onKYCSent(prospect, 'Acme Fund', 'Jane Smith');

      expect(emailService.sendKYCInvite).not.toHaveBeenCalled();
    });

    it('should use first name only when no last name', async () => {
      const prospect = createMockProspect({ lastName: null });

      await prospectEmailTriggers.onKYCSent(prospect, 'Fund', 'Manager');

      expect(emailService.sendKYCInvite).toHaveBeenCalledWith(
        'john@example.com',
        expect.objectContaining({
          recipientName: 'John',
        })
      );
    });

    it('should use entity name for entity prospects', async () => {
      const prospect = createMockProspect({
        firstName: null,
        lastName: null,
        entityLegalName: 'Doe Family Trust',
      });

      await prospectEmailTriggers.onKYCSent(prospect, 'Fund', 'Manager');

      expect(emailService.sendKYCInvite).toHaveBeenCalledWith(
        'john@example.com',
        expect.objectContaining({
          recipientName: 'Doe Family Trust',
        })
      );
    });
  });

  describe('onInterestFormSubmitted', () => {
    it('should send KYC auto-send email', async () => {
      const prospect = createMockProspect({ source: 'interest_form' });

      await prospectEmailTriggers.onInterestFormSubmitted(prospect, 'Acme Fund');

      expect(emailService.sendKYCAutoSend).toHaveBeenCalledWith(
        'john@example.com',
        expect.objectContaining({
          recipientName: 'John Doe',
          fundName: 'Acme Fund',
        })
      );
    });

    it('should schedule KYC reminders', async () => {
      const prospect = createMockProspect();
      const timestamp = new Date();

      await prospectEmailTriggers.onInterestFormSubmitted(prospect, 'Fund', timestamp);

      expect(prospectJobScheduler.scheduleKYCReminders).toHaveBeenCalledWith(
        'prospect-123',
        'fund-456',
        timestamp
      );
    });
  });

  describe('onKYCApproved', () => {
    it('should cancel KYC reminders and send meeting invite', async () => {
      const prospect = createMockProspect({ status: 'pre_qualified' as ProspectStatus });

      await prospectEmailTriggers.onKYCApproved(
        prospect,
        'Acme Fund',
        'https://calendly.com/acme',
        'Jane Smith, CAIA'
      );

      expect(prospectJobScheduler.cancelKYCReminders).toHaveBeenCalledWith('prospect-123');
      expect(emailService.sendMeetingInvite).toHaveBeenCalledWith(
        'john@example.com',
        expect.objectContaining({
          recipientName: 'John Doe',
          fundName: 'Acme Fund',
          calendlyUrl: 'https://calendly.com/acme',
          managerNameWithCredentials: 'Jane Smith, CAIA',
        })
      );
    });
  });

  describe('onKYCNotEligible', () => {
    it('should cancel KYC reminders and send not eligible email', async () => {
      const prospect = createMockProspect({ status: 'not_eligible' as ProspectStatus });

      await prospectEmailTriggers.onKYCNotEligible(
        prospect,
        'Acme Fund',
        'Learn about accreditation at sec.gov'
      );

      expect(prospectJobScheduler.cancelKYCReminders).toHaveBeenCalledWith('prospect-123');
      expect(emailService.sendKYCNotEligible).toHaveBeenCalledWith(
        'john@example.com',
        expect.objectContaining({
          recipientName: 'John Doe',
          fundName: 'Acme Fund',
          accreditationEducationContent: 'Learn about accreditation at sec.gov',
        })
      );
    });
  });

  describe('onMeetingScheduled', () => {
    it('should schedule meeting reminders', async () => {
      const prospect = createMockProspect({ status: 'meeting_scheduled' as ProspectStatus });
      const meetingTime = new Date('2026-01-20T14:00:00Z');
      const timestamp = new Date();

      await prospectEmailTriggers.onMeetingScheduled(prospect, meetingTime, timestamp);

      expect(prospectJobScheduler.scheduleMeetingReminders).toHaveBeenCalledWith(
        'prospect-123',
        'fund-456',
        meetingTime,
        timestamp
      );
    });
  });

  describe('onMeetingCompleted', () => {
    it('should cancel meeting reminders', async () => {
      const prospect = createMockProspect({ status: 'meeting_complete' as ProspectStatus });

      await prospectEmailTriggers.onMeetingCompleted(prospect);

      expect(prospectJobScheduler.cancelMeetingReminders).toHaveBeenCalledWith('prospect-123');
    });
  });

  describe('onMarkedProceed', () => {
    it('should send post-meeting proceed email with account creation link', async () => {
      const prospect = createMockProspect({ status: 'account_invite_sent' as ProspectStatus });

      await prospectEmailTriggers.onMarkedProceed(
        prospect,
        'Acme Fund',
        'Jane Smith',
        'Managing Partner',
        'Lionshare Portal',
        'It was great discussing your investment goals.',
        'account-token-xyz'
      );

      expect(emailService.sendPostMeetingProceed).toHaveBeenCalledWith(
        'john@example.com',
        expect.objectContaining({
          recipientName: 'John Doe',
          fundName: 'Acme Fund',
          managerName: 'Jane Smith',
          managerTitle: 'Managing Partner',
          platformName: 'Lionshare Portal',
          postMeetingRecap: 'It was great discussing your investment goals.',
        })
      );
    });
  });

  describe('onMarkedConsidering', () => {
    it('should send considering email and schedule nurture sequence', async () => {
      const prospect = createMockProspect({ status: 'considering' as ProspectStatus });
      const timestamp = new Date();

      await prospectEmailTriggers.onMarkedConsidering(
        prospect,
        'Acme Fund',
        'Jane Smith',
        'Managing Partner',
        'Key points: 8% target, 5-year hold',
        'https://deck.com',
        'https://ppm.com',
        "I'm here to help with any questions.",
        timestamp
      );

      expect(emailService.sendPostMeetingConsidering).toHaveBeenCalledWith(
        'john@example.com',
        expect.objectContaining({
          recipientName: 'John Doe',
          fundName: 'Acme Fund',
          meetingRecapBullets: 'Key points: 8% target, 5-year hold',
          deckLink: 'https://deck.com',
          ppmPreviewLink: 'https://ppm.com',
        })
      );

      expect(prospectJobScheduler.scheduleNurtureSequence).toHaveBeenCalledWith(
        'prospect-123',
        'fund-456',
        timestamp
      );
    });
  });

  describe('onMarkedNotFit', () => {
    it('should cancel all pending emails and send not fit email', async () => {
      const prospect = createMockProspect({ status: 'not_a_fit' as ProspectStatus });

      await prospectEmailTriggers.onMarkedNotFit(
        prospect,
        'Acme Fund',
        'Jane Smith',
        'South Florida multifamily'
      );

      expect(prospectJobScheduler.cancelAllProspectEmails).toHaveBeenCalledWith('prospect-123');
      expect(emailService.sendPostMeetingNotFit).toHaveBeenCalledWith(
        'john@example.com',
        expect.objectContaining({
          recipientName: 'John Doe',
          fundName: 'Acme Fund',
          managerName: 'Jane Smith',
          investmentBriefDescriptor: 'South Florida multifamily',
        })
      );
    });
  });

  describe('onReadyToInvest', () => {
    it('should cancel nurture sequence', async () => {
      const prospect = createMockProspect({ status: 'account_invite_sent' as ProspectStatus });

      await prospectEmailTriggers.onReadyToInvest(prospect);

      expect(prospectJobScheduler.cancelNurtureSequence).toHaveBeenCalledWith('prospect-123');
    });
  });

  describe('onConvertedToInvestor', () => {
    it('should cancel all pending emails and send welcome email', async () => {
      const prospect = createMockProspect({ status: 'converted' as ProspectStatus });
      const timestamp = new Date();

      await prospectEmailTriggers.onConvertedToInvestor(
        prospect,
        'Acme Fund',
        250000,
        timestamp,
        'Jane Smith',
        'jane@acme.com'
      );

      expect(prospectJobScheduler.cancelAllProspectEmails).toHaveBeenCalledWith('prospect-123');
      expect(emailService.sendWelcomeInvestor).toHaveBeenCalledWith(
        'john@example.com',
        expect.objectContaining({
          recipientName: 'John Doe',
          fundName: 'Acme Fund',
          // Note: Number formatting is locale-dependent, so we just check it's a string
          investmentAmount: expect.stringMatching(/250[,.]?000/),
          managerName: 'Jane Smith',
        })
      );
    });
  });

  describe('onStatusChanged', () => {
    it('should delegate to job scheduler for suppression', async () => {
      const prospect = createMockProspect({ status: 'pre_qualified' as ProspectStatus });

      await prospectEmailTriggers.onStatusChanged(
        prospect,
        'kyc_sent' as ProspectStatus,
        'Acme Fund',
        'https://calendly.com/acme'
      );

      expect(prospectJobScheduler.handleStatusChange).toHaveBeenCalledWith(
        'prospect-123',
        'pre_qualified',
        'kyc_sent'
      );
    });

    it('should trigger meeting completed actions when status is meeting_complete', async () => {
      const prospect = createMockProspect({ status: 'meeting_complete' as ProspectStatus });

      await prospectEmailTriggers.onStatusChanged(
        prospect,
        'meeting_scheduled' as ProspectStatus,
        'Acme Fund'
      );

      expect(prospectJobScheduler.cancelMeetingReminders).toHaveBeenCalledWith('prospect-123');
    });
  });
});

describe('Email Address Resolution', () => {
  it('should use prospect email for all emails', async () => {
    const prospect = createMockProspect({ email: 'custom@email.com' });

    await prospectEmailTriggers.onKYCSent(prospect, 'Fund', 'Manager');

    expect(emailService.sendKYCInvite).toHaveBeenCalledWith(
      'custom@email.com',
      expect.any(Object)
    );
  });
});

describe('URL Generation', () => {
  beforeEach(() => {
    vi.stubEnv('FRONTEND_URL', 'https://app.example.com');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should generate correct KYC URL with token', async () => {
    const prospect = createMockProspect({ kycLinkToken: 'my-token-123' });

    await prospectEmailTriggers.onKYCSent(prospect, 'Fund', 'Manager');

    expect(emailService.sendKYCInvite).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        kycUrl: expect.stringContaining('/kyc/token/my-token-123'),
      })
    );
  });
});
