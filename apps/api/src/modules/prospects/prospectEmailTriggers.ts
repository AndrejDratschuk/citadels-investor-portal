/**
 * Prospect Email Triggers (Email Orchestration Layer)
 * Separates email logic from business logic
 * Single Level of Abstraction - only handles email decisions and data gathering
 */

import { supabaseAdmin } from '../../common/database/supabase';
import { EmailService, emailService } from '../email/email.service';
import { prospectJobScheduler } from './prospectJobScheduler';
import type { Prospect, ProspectStatus } from '@altsui/shared';

// Base URL for email links
const getBaseUrl = (): string => {
  const url = process.env.FRONTEND_URL || 'http://localhost:5173';
  return url;
};

// Format date in a specific timezone
function formatDateInTimezone(date: Date, timezone: string): { dateStr: string; timeStr: string; timezoneAbbr: string } {
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: timezone,
  });

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  });

  // Get timezone abbreviation (e.g., EST, PST)
  const timezoneAbbr = date.toLocaleTimeString('en-US', {
    timeZone: timezone,
    timeZoneName: 'short',
  }).split(' ').pop() || timezone;

  return { dateStr, timeStr, timezoneAbbr };
}

// Fund settings interface for email customization
interface FundEmailSettings {
  name: string;
  platformName: string;
  timezone: string;
  investmentBriefDescriptor: string | null;
  preMeetingMaterialsUrl: string | null;
  accreditationEducationContent: string | null;
  postMeetingRecapTemplate: string | null;
  consideringSupportMessage: string | null;
  calendlyUrl: string | null;
}

// Manager info interface
interface ManagerInfo {
  firstName: string;
  lastName: string;
  title: string | null;
  credentials: string | null;
  email: string;
}

export class ProspectEmailTriggers {
  constructor(private emailService: EmailService) {}

  // ============================================================
  // Data Fetching Helpers
  // ============================================================

  private async getProspect(prospectId: string): Promise<Prospect | null> {
    const { data, error } = await supabaseAdmin
      .from('kyc_applications')
      .select('*')
      .eq('id', prospectId)
      .single();

    if (error || !data) {
      console.error(`[ProspectEmailTriggers] Failed to fetch prospect ${prospectId}:`, error);
      return null;
    }

    return this.mapToProspect(data);
  }

  private async getFundSettings(fundId: string): Promise<FundEmailSettings | null> {
    const { data, error } = await supabaseAdmin
      .from('funds')
      .select(`
        name,
        platform_name,
        timezone,
        investment_brief_descriptor,
        pre_meeting_materials_url,
        accreditation_education_content,
        post_meeting_recap_template,
        considering_support_message,
        calendly_url
      `)
      .eq('id', fundId)
      .single();

    if (error || !data) {
      console.error(`[ProspectEmailTriggers] Failed to fetch fund ${fundId}:`, error);
      return null;
    }

    return {
      name: data.name,
      platformName: data.platform_name || 'Investor Portal',
      timezone: data.timezone || 'America/New_York',
      investmentBriefDescriptor: data.investment_brief_descriptor,
      preMeetingMaterialsUrl: data.pre_meeting_materials_url,
      accreditationEducationContent: data.accreditation_education_content,
      postMeetingRecapTemplate: data.post_meeting_recap_template,
      consideringSupportMessage: data.considering_support_message,
      calendlyUrl: data.calendly_url,
    };
  }

  private async getManager(managerId: string): Promise<ManagerInfo | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('email, first_name, last_name, title, credentials')
      .eq('id', managerId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      title: data.title,
      credentials: data.credentials,
      email: data.email,
    };
  }

  private getDisplayName(prospect: Prospect): string {
    if (prospect.firstName && prospect.lastName) {
      return `${prospect.firstName} ${prospect.lastName}`;
    }
    if (prospect.firstName) {
      return prospect.firstName;
    }
    if (prospect.entityLegalName) {
      return prospect.entityLegalName;
    }
    return 'Investor';
  }

  private getManagerNameWithCredentials(manager: ManagerInfo): string {
    const fullName = `${manager.firstName} ${manager.lastName}`.trim();
    if (manager.credentials) {
      return `${fullName}, ${manager.credentials}`;
    }
    return fullName || 'our team';
  }

  private mapToProspect(data: Record<string, unknown>): Prospect {
    return {
      id: data.id as string,
      fundId: data.fund_id as string,
      email: data.email as string,
      firstName: data.first_name as string | null,
      lastName: data.last_name as string | null,
      phone: data.phone as string | null,
      status: data.status as ProspectStatus,
      source: data.source as 'manual' | 'website' | 'interest_form',
      investorCategory: data.investor_category as 'individual' | 'entity' | null,
      investorType: data.investor_type as string | null,
      country: data.country as string | null,
      state: data.state as string | null,
      city: data.city as string | null,
      entityLegalName: data.entity_legal_name as string | null,
      countryOfFormation: data.country_of_formation as string | null,
      stateOfFormation: data.state_of_formation as string | null,
      authorizedSignerFirstName: data.authorized_signer_first_name as string | null,
      authorizedSignerLastName: data.authorized_signer_last_name as string | null,
      authorizedSignerTitle: data.authorized_signer_title as string | null,
      accreditationBases: (data.accreditation_bases as string[]) || [],
      indicativeCommitment: data.indicative_commitment as number | null,
      timeline: data.timeline as Prospect['timeline'],
      investmentGoals: (data.investment_goals as string[]) || [],
      likelihood: data.likelihood as Prospect['likelihood'],
      questionsForManager: data.questions_for_manager as string | null,
      preferredContact: data.preferred_contact as Prospect['preferredContact'],
      consentGiven: (data.consent_given as boolean) || false,
      kycLinkToken: data.kyc_link_token as string | null,
      calendlyEventUrl: data.calendly_event_url as string | null,
      sentBy: data.sent_by as string | null,
      notes: data.notes as string | null,
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
      meetingScheduledAt: data.meeting_scheduled_at as string | null,
      meetingCompletedAt: data.meeting_completed_at as string | null,
      consideringAt: data.considering_at as string | null,
      onboardingStartedAt: data.onboarding_started_at as string | null,
      onboardingSubmittedAt: data.onboarding_submitted_at as string | null,
      documentsApprovedAt: data.documents_approved_at as string | null,
      documentsRejectedAt: data.documents_rejected_at as string | null,
      documentRejectionReason: data.document_rejection_reason as string | null,
      meetingRecapBullets: data.meeting_recap_bullets as string | null,
      docusignEnvelopeId: data.docusign_envelope_id as string | null,
      docusignSentAt: data.docusign_sent_at as string | null,
      docusignSignedAt: data.docusign_signed_at as string | null,
      convertedToInvestor: (data.converted_to_investor as boolean) || false,
      convertedAt: data.converted_at as string | null,
      investorId: data.investor_id as string | null,
    };
  }

  // ============================================================
  // Immediate Email Triggers
  // ============================================================

  /**
   * 01.01.A1 - Send KYC invite (manual send)
   */
  async onKYCSent(
    prospect: Prospect,
    fundName: string,
    managerName: string,
    managerTitle?: string,
    managerCredentials?: string,
    investmentBriefDescriptor?: string,
    timestamp?: Date
  ): Promise<void> {
    if (!prospect.kycLinkToken) {
      console.warn('[ProspectEmailTriggers] Cannot send KYC invite - no token available');
      return;
    }

    const managerNameWithCredentials = managerCredentials
      ? `${managerName}, ${managerCredentials}`
      : managerName;

    const result = await this.emailService.sendKYCInvite(prospect.email, {
      recipientName: this.getDisplayName(prospect),
      fundName,
      kycUrl: `${getBaseUrl()}/kyc/token/${prospect.kycLinkToken}`,
      managerName,
      managerTitle,
      managerNameWithCredentials,
      investmentBriefDescriptor,
    });

    if (result.success) {
      console.log(`[ProspectEmailTriggers] KYC invite sent to ${prospect.email}`);
      // Schedule KYC reminders
      await prospectJobScheduler.scheduleKYCReminders(
        prospect.id,
        prospect.fundId,
        timestamp || new Date()
      );
    } else {
      console.error(`[ProspectEmailTriggers] Failed to send KYC invite: ${result.error}`);
    }
  }

  /**
   * 01.02.A1 - Send KYC auto-send (from interest form)
   */
  async onInterestFormSubmitted(
    prospect: Prospect,
    fundName: string,
    timestamp?: Date
  ): Promise<void> {
    if (!prospect.kycLinkToken) {
      console.warn('[ProspectEmailTriggers] Cannot send KYC auto-send - no token');
      return;
    }

    const result = await this.emailService.sendKYCAutoSend(prospect.email, {
      recipientName: this.getDisplayName(prospect),
      fundName,
      kycUrl: `${getBaseUrl()}/kyc/token/${prospect.kycLinkToken}`,
    });

    if (result.success) {
      // Schedule KYC reminders
      await prospectJobScheduler.scheduleKYCReminders(
        prospect.id,
        prospect.fundId,
        timestamp || new Date()
      );
    }
  }

  /**
   * 01.03.A1 - Send meeting invite (KYC approved)
   */
  async onKYCApproved(
    prospect: Prospect,
    fundName: string,
    calendlyUrl: string,
    managerNameWithCredentials?: string
  ): Promise<void> {
    // Cancel any pending KYC reminders
    await prospectJobScheduler.cancelKYCReminders(prospect.id);

    await this.emailService.sendMeetingInvite(prospect.email, {
      recipientName: this.getDisplayName(prospect),
      fundName,
      calendlyUrl,
      managerNameWithCredentials,
    });
  }

  /**
   * 01.03.C1 - Send KYC not eligible
   */
  async onKYCNotEligible(
    prospect: Prospect,
    fundName: string,
    accreditationEducationContent?: string
  ): Promise<void> {
    // Cancel any pending KYC reminders
    await prospectJobScheduler.cancelKYCReminders(prospect.id);

    await this.emailService.sendKYCNotEligible(prospect.email, {
      recipientName: this.getDisplayName(prospect),
      fundName,
      accreditationEducationContent,
    });
  }

  /**
   * Schedule meeting reminders when meeting is booked
   */
  async onMeetingScheduled(
    prospect: Prospect,
    meetingTime: Date,
    timestamp: Date
  ): Promise<void> {
    await prospectJobScheduler.scheduleMeetingReminders(
      prospect.id,
      prospect.fundId,
      meetingTime,
      timestamp
    );
  }

  /**
   * Cancel meeting reminders when meeting is completed
   */
  async onMeetingCompleted(prospect: Prospect): Promise<void> {
    await prospectJobScheduler.cancelMeetingReminders(prospect.id);
  }

  /**
   * 01.06.A1 - Post-meeting: Proceed (send account creation invite)
   */
  async onMarkedProceed(
    prospect: Prospect,
    fundName: string,
    managerName: string,
    managerTitle?: string,
    platformName?: string,
    postMeetingRecap?: string,
    accountCreationToken?: string
  ): Promise<void> {
    const accountUrl = accountCreationToken
      ? `${getBaseUrl()}/create-account/${accountCreationToken}`
      : `${getBaseUrl()}/onboard/${prospect.id}`;

    await this.emailService.sendPostMeetingProceed(prospect.email, {
      recipientName: this.getDisplayName(prospect),
      fundName,
      managerName,
      managerTitle,
      accountCreationUrl: accountUrl,
      platformName,
      postMeetingRecap,
    });
  }

  /**
   * 01.06.B1 - Post-meeting: Considering (start nurture sequence)
   */
  async onMarkedConsidering(
    prospect: Prospect,
    fundName: string,
    managerName: string,
    managerTitle?: string,
    meetingRecapBullets?: string,
    deckLink?: string,
    ppmPreviewLink?: string,
    consideringSupportMessage?: string,
    timestamp?: Date
  ): Promise<void> {
    const readyToInvestUrl = `${getBaseUrl()}/kyc/ready/${prospect.id}`;

    await this.emailService.sendPostMeetingConsidering(prospect.email, {
      recipientName: this.getDisplayName(prospect),
      fundName,
      managerName,
      managerTitle,
      readyToInvestUrl,
      meetingRecapBullets,
      deckLink,
      ppmPreviewLink,
      consideringSupportMessage,
    });

    // Schedule nurture sequence
    await prospectJobScheduler.scheduleNurtureSequence(
      prospect.id,
      prospect.fundId,
      timestamp || new Date()
    );
  }

  /**
   * 01.06.C1 - Post-meeting: Not a fit
   */
  async onMarkedNotFit(
    prospect: Prospect,
    fundName: string,
    managerName: string,
    investmentBriefDescriptor?: string
  ): Promise<void> {
    // Cancel all pending emails
    await prospectJobScheduler.cancelAllProspectEmails(prospect.id);

    const keepMeInformedUrl = `${getBaseUrl()}/subscribe/${prospect.fundId}`;

    await this.emailService.sendPostMeetingNotFit(prospect.email, {
      recipientName: this.getDisplayName(prospect),
      fundName,
      managerName,
      keepMeInformedUrl,
      investmentBriefDescriptor,
    });
  }

  /**
   * Handle "Ready to Invest" click from nurture emails
   */
  async onReadyToInvest(prospect: Prospect): Promise<void> {
    // Cancel nurture sequence
    await prospectJobScheduler.cancelNurtureSequence(prospect.id);
  }

  // ============================================================
  // Scheduled Email Handlers (called by worker)
  // ============================================================

  /**
   * Send scheduled KYC reminder (called by worker)
   */
  async sendScheduledKYCReminder(
    prospectId: string,
    fundId: string,
    reminderNumber: 1 | 2 | 3
  ): Promise<void> {
    const prospect = await this.getProspect(prospectId);
    if (!prospect) return;

    // Check if prospect is still in kyc_sent status
    if (prospect.status !== 'kyc_sent') {
      console.log(`[ProspectEmailTriggers] Skipping KYC reminder - prospect ${prospectId} is no longer in kyc_sent status`);
      return;
    }

    const fund = await this.getFundSettings(fundId);
    if (!fund) return;

    const kycUrl = prospect.kycLinkToken
      ? `${getBaseUrl()}/kyc/token/${prospect.kycLinkToken}`
      : `${getBaseUrl()}/kyc/${fundId}`;

    const keepMeUpdatedUrl = `${getBaseUrl()}/subscribe/${fundId}`;

    switch (reminderNumber) {
      case 1:
        await this.emailService.sendKYCReminder1(prospect.email, {
          recipientName: this.getDisplayName(prospect),
          fundName: fund.name,
          kycUrl,
        });
        break;
      case 2:
        await this.emailService.sendKYCReminder2(prospect.email, {
          recipientName: this.getDisplayName(prospect),
          fundName: fund.name,
          kycUrl,
        });
        break;
      case 3:
        await this.emailService.sendKYCReminder3(prospect.email, {
          recipientName: this.getDisplayName(prospect),
          fundName: fund.name,
          kycUrl,
          keepMeUpdatedUrl,
        });
        break;
    }
  }

  /**
   * Send KYC not eligible (called by worker)
   */
  async sendKYCNotEligible(prospectId: string, fundId: string): Promise<void> {
    const prospect = await this.getProspect(prospectId);
    if (!prospect) return;

    const fund = await this.getFundSettings(fundId);
    if (!fund) return;

    await this.emailService.sendKYCNotEligible(prospect.email, {
      recipientName: this.getDisplayName(prospect),
      fundName: fund.name,
      accreditationEducationContent: fund.accreditationEducationContent || undefined,
    });
  }

  /**
   * Send meeting reminder 24hr (called by worker)
   */
  async sendMeetingReminder24hr(prospectId: string, fundId: string): Promise<void> {
    const prospect = await this.getProspect(prospectId);
    if (!prospect) return;

    // Check if prospect is still in meeting_scheduled status
    if (prospect.status !== 'meeting_scheduled') {
      console.log(`[ProspectEmailTriggers] Skipping 24hr reminder - meeting status changed`);
      return;
    }

    const fund = await this.getFundSettings(fundId);
    if (!fund) return;

    const manager = prospect.sentBy ? await this.getManager(prospect.sentBy) : null;

    const meetingTime = prospect.meetingScheduledAt
      ? new Date(prospect.meetingScheduledAt)
      : new Date();

    const formatted = formatDateInTimezone(meetingTime, fund.timezone);

    await this.emailService.sendMeetingReminder24hr(prospect.email, {
      recipientName: this.getDisplayName(prospect),
      fundName: fund.name,
      managerName: manager ? `${manager.firstName} ${manager.lastName}`.trim() : fund.name,
      managerTitle: manager?.title || undefined,
      meetingDate: formatted.dateStr,
      meetingTime: formatted.timeStr,
      timezone: formatted.timezoneAbbr,
      meetingLink: prospect.calendlyEventUrl || '',
      preMeetingMaterials: fund.preMeetingMaterialsUrl || undefined,
    });
  }

  /**
   * Send meeting reminder 15min (called by worker)
   */
  async sendMeetingReminder15min(prospectId: string, fundId: string): Promise<void> {
    const prospect = await this.getProspect(prospectId);
    if (!prospect) return;

    if (prospect.status !== 'meeting_scheduled') {
      console.log(`[ProspectEmailTriggers] Skipping 15min reminder - meeting status changed`);
      return;
    }

    const manager = prospect.sentBy ? await this.getManager(prospect.sentBy) : null;

    await this.emailService.sendMeetingReminder15min(prospect.email, {
      recipientName: this.getDisplayName(prospect),
      managerName: manager ? `${manager.firstName} ${manager.lastName}`.trim() : 'our team',
      meetingLink: prospect.calendlyEventUrl || '',
    });
  }

  /**
   * Send meeting no-show (called by worker)
   */
  async sendMeetingNoShow(prospectId: string, fundId: string): Promise<void> {
    const prospect = await this.getProspect(prospectId);
    if (!prospect) return;

    // Only send if still in meeting_scheduled status
    if (prospect.status !== 'meeting_scheduled') {
      console.log(`[ProspectEmailTriggers] Skipping no-show - meeting was completed or cancelled`);
      return;
    }

    const fund = await this.getFundSettings(fundId);
    if (!fund) return;

    const manager = prospect.sentBy ? await this.getManager(prospect.sentBy) : null;

    await this.emailService.sendMeetingNoShow(prospect.email, {
      recipientName: this.getDisplayName(prospect),
      fundName: fund.name,
      managerName: manager ? `${manager.firstName} ${manager.lastName}`.trim() : fund.name,
      managerTitle: manager?.title || undefined,
      calendlyUrl: fund.calendlyUrl || '',
    });
  }

  /**
   * Send post-meeting proceed (called by worker)
   */
  async sendPostMeetingProceed(
    prospectId: string,
    fundId: string,
    metadata?: { meetingRecap?: string }
  ): Promise<void> {
    const prospect = await this.getProspect(prospectId);
    if (!prospect) return;

    const fund = await this.getFundSettings(fundId);
    if (!fund) return;

    const manager = prospect.sentBy ? await this.getManager(prospect.sentBy) : null;

    const accountUrl = `${getBaseUrl()}/onboard/${prospect.id}`;

    await this.emailService.sendPostMeetingProceed(prospect.email, {
      recipientName: this.getDisplayName(prospect),
      fundName: fund.name,
      managerName: manager ? `${manager.firstName} ${manager.lastName}`.trim() : fund.name,
      managerTitle: manager?.title || undefined,
      accountCreationUrl: accountUrl,
      platformName: fund.platformName,
      postMeetingRecap: metadata?.meetingRecap || fund.postMeetingRecapTemplate || undefined,
    });
  }

  /**
   * Send post-meeting considering (called by worker)
   */
  async sendPostMeetingConsidering(
    prospectId: string,
    fundId: string,
    metadata?: { meetingRecapBullets?: string }
  ): Promise<void> {
    const prospect = await this.getProspect(prospectId);
    if (!prospect) return;

    const fund = await this.getFundSettings(fundId);
    if (!fund) return;

    const manager = prospect.sentBy ? await this.getManager(prospect.sentBy) : null;

    const readyToInvestUrl = `${getBaseUrl()}/kyc/ready/${prospect.id}`;

    await this.emailService.sendPostMeetingConsidering(prospect.email, {
      recipientName: this.getDisplayName(prospect),
      fundName: fund.name,
      managerName: manager ? `${manager.firstName} ${manager.lastName}`.trim() : fund.name,
      managerTitle: manager?.title || undefined,
      readyToInvestUrl,
      meetingRecapBullets:
        metadata?.meetingRecapBullets || prospect.meetingRecapBullets || undefined,
      consideringSupportMessage: fund.consideringSupportMessage || undefined,
    });
  }

  /**
   * Send post-meeting not fit (called by worker)
   */
  async sendPostMeetingNotFit(prospectId: string, fundId: string): Promise<void> {
    const prospect = await this.getProspect(prospectId);
    if (!prospect) return;

    const fund = await this.getFundSettings(fundId);
    if (!fund) return;

    const manager = prospect.sentBy ? await this.getManager(prospect.sentBy) : null;

    const keepMeInformedUrl = `${getBaseUrl()}/subscribe/${fundId}`;

    await this.emailService.sendPostMeetingNotFit(prospect.email, {
      recipientName: this.getDisplayName(prospect),
      fundName: fund.name,
      managerName: manager ? `${manager.firstName} ${manager.lastName}`.trim() : fund.name,
      keepMeInformedUrl,
      investmentBriefDescriptor: fund.investmentBriefDescriptor || undefined,
    });
  }

  /**
   * Send nurture day 15 (called by worker)
   */
  async sendNurtureDay15(prospectId: string, fundId: string): Promise<void> {
    const prospect = await this.getProspect(prospectId);
    if (!prospect) return;

    // Only send if still in considering status
    if (prospect.status !== 'considering') {
      console.log(`[ProspectEmailTriggers] Skipping nurture day 15 - status changed`);
      return;
    }

    const fund = await this.getFundSettings(fundId);
    if (!fund) return;

    const manager = prospect.sentBy ? await this.getManager(prospect.sentBy) : null;

    await this.emailService.sendNurtureDay15(prospect.email, {
      recipientName: this.getDisplayName(prospect),
      fundName: fund.name,
      managerName: manager ? `${manager.firstName} ${manager.lastName}`.trim() : fund.name,
      scheduleFollowUpUrl: fund.calendlyUrl || '',
      readyToInvestUrl: `${getBaseUrl()}/kyc/ready/${prospect.id}`,
    });
  }

  /**
   * Send nurture day 23 (called by worker)
   */
  async sendNurtureDay23(prospectId: string, fundId: string): Promise<void> {
    const prospect = await this.getProspect(prospectId);
    if (!prospect) return;

    if (prospect.status !== 'considering') {
      console.log(`[ProspectEmailTriggers] Skipping nurture day 23 - status changed`);
      return;
    }

    const fund = await this.getFundSettings(fundId);
    if (!fund) return;

    const manager = prospect.sentBy ? await this.getManager(prospect.sentBy) : null;

    // TODO: Rotate through nurture_update_templates from fund settings
    await this.emailService.sendNurtureDay23(prospect.email, {
      recipientName: this.getDisplayName(prospect),
      fundName: fund.name,
      managerName: manager ? `${manager.firstName} ${manager.lastName}`.trim() : fund.name,
      letsTalkUrl: fund.calendlyUrl || '',
      readyToInvestUrl: `${getBaseUrl()}/kyc/ready/${prospect.id}`,
    });
  }

  /**
   * Send nurture day 30 (called by worker)
   */
  async sendNurtureDay30(prospectId: string, fundId: string): Promise<void> {
    const prospect = await this.getProspect(prospectId);
    if (!prospect) return;

    if (prospect.status !== 'considering') {
      console.log(`[ProspectEmailTriggers] Skipping nurture day 30 - status changed`);
      return;
    }

    const fund = await this.getFundSettings(fundId);
    if (!fund) return;

    const manager = prospect.sentBy ? await this.getManager(prospect.sentBy) : null;

    await this.emailService.sendNurtureDay30(prospect.email, {
      recipientName: this.getDisplayName(prospect),
      fundName: fund.name,
      managerName: manager ? `${manager.firstName} ${manager.lastName}`.trim() : fund.name,
      readyToInvestUrl: `${getBaseUrl()}/kyc/ready/${prospect.id}`,
      keepMeUpdatedUrl: `${getBaseUrl()}/subscribe/${fundId}`,
    });
  }

  /**
   * Send dormant closeout (called by worker)
   */
  async sendDormantCloseout(prospectId: string, fundId: string): Promise<void> {
    const prospect = await this.getProspect(prospectId);
    if (!prospect) return;

    if (prospect.status !== 'considering') {
      console.log(`[ProspectEmailTriggers] Skipping dormant closeout - status changed`);
      return;
    }

    const fund = await this.getFundSettings(fundId);
    if (!fund) return;

    const manager = prospect.sentBy ? await this.getManager(prospect.sentBy) : null;

    await this.emailService.sendDormantCloseout(prospect.email, {
      recipientName: this.getDisplayName(prospect),
      fundName: fund.name,
      managerName: manager ? `${manager.firstName} ${manager.lastName}`.trim() : fund.name,
      keepMeUpdatedUrl: `${getBaseUrl()}/subscribe/${fundId}`,
    });

    // TODO: Update prospect status to a dormant/closed status
  }

  // ============================================================
  // Status Change Handler
  // ============================================================

  /**
   * Handle status change and trigger appropriate email/job actions
   */
  async onStatusChanged(
    prospect: Prospect,
    previousStatus: ProspectStatus,
    fundName: string,
    calendlyUrl?: string,
    managerName?: string,
    timestamp?: Date
  ): Promise<void> {
    // Delegate suppression handling to job scheduler
    await prospectJobScheduler.handleStatusChange(prospect.id, prospect.status, previousStatus);

    // Trigger immediate emails based on new status
    switch (prospect.status) {
      case 'pre_qualified':
        if (calendlyUrl) {
          await this.onKYCApproved(prospect, fundName, calendlyUrl);
        }
        break;

      case 'not_eligible':
        // KYC not eligible email will be sent by the controller
        break;

      case 'meeting_complete':
        await this.onMeetingCompleted(prospect);
        break;
    }
  }

  // ============================================================
  // Legacy Methods (for backwards compatibility)
  // ============================================================

  /**
   * @deprecated Use sendScheduledKYCReminder instead
   */
  async sendKYCReminder(prospect: Prospect, fundName: string): Promise<void> {
    await this.emailService.sendKYCReminder1(prospect.email, {
      recipientName: this.getDisplayName(prospect),
      fundName,
      kycUrl: prospect.kycLinkToken
        ? `${getBaseUrl()}/kyc/token/${prospect.kycLinkToken}`
        : `${getBaseUrl()}/kyc/${prospect.fundId}`,
    });
  }

  /**
   * @deprecated Use onMarkedProceed instead
   */
  async onAccountInviteSent(
    prospect: Prospect,
    fundName: string,
    managerName: string
  ): Promise<void> {
    await this.onMarkedProceed(prospect, fundName, managerName);
  }

  /**
   * Send onboarding reminder
   */
  async sendOnboardingReminder(prospect: Prospect, fundName: string): Promise<void> {
    await this.emailService.sendOnboardingReminder(prospect.email, {
      recipientName: this.getDisplayName(prospect),
      fundName,
      onboardingUrl: `${getBaseUrl()}/onboard/${prospect.id}`,
    });
  }

  /**
   * Trigger when DocuSign is sent
   */
  async onDocuSignSent(prospect: Prospect, fundName: string): Promise<void> {
    // DocuSign handles its own email notifications
    console.log(`[ProspectEmailTriggers] DocuSign sent for prospect ${prospect.id}`);
  }

  /**
   * Trigger when prospect is converted to investor
   */
  async onConvertedToInvestor(
    prospect: Prospect,
    fundName: string,
    commitmentAmount: number,
    timestamp: Date,
    managerName?: string,
    managerEmail?: string
  ): Promise<void> {
    // Cancel any pending emails
    await prospectJobScheduler.cancelAllProspectEmails(prospect.id);

    await this.emailService.sendWelcomeInvestor(prospect.email, {
      recipientName: this.getDisplayName(prospect),
      fundName,
      investmentAmount: commitmentAmount.toLocaleString(),
      investmentDate: timestamp.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      portalUrl: `${getBaseUrl()}/investor`,
      managerName,
    });
  }
}

// Export singleton instance
export const prospectEmailTriggers = new ProspectEmailTriggers(emailService);
