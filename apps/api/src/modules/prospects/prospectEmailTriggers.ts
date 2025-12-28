/**
 * Prospect Email Triggers (Email Orchestration Layer)
 * Separates email logic from business logic
 * Single Level of Abstraction - only handles email decisions
 */

import { EmailService } from '../email/email.service';
import type {
  KYCInviteTemplateData,
  KYCAutoSendTemplateData,
  MeetingInviteTemplateData,
  PostMeetingOnboardingTemplateData,
  DocumentsApprovedDocuSignTemplateData,
  WelcomeInvestorTemplateData,
  KYCReminderTemplateData,
  OnboardingReminderTemplateData,
  AccountInviteTemplateData,
} from '../email/email.templates';
import type { Prospect, ProspectStatus } from '@flowveda/shared';

// Base URL for email links - should be configured via environment
const getBaseUrl = (): string => {
  const url = process.env.FRONTEND_URL || 'http://localhost:5173';
  console.log(`[Email] Using FRONTEND_URL: ${url}`);
  return url;
};

export class ProspectEmailTriggers {
  constructor(private emailService: EmailService) {}

  /**
   * Trigger email when KYC form is manually sent
   */
  async onKYCSent(
    prospect: Prospect,
    fundName: string,
    managerName?: string,
    managerEmail?: string
  ): Promise<void> {
    if (!prospect.kycLinkToken) {
      console.warn('Cannot send KYC invite - no token available');
      return;
    }

    const templateData: KYCInviteTemplateData = {
      recipientName: prospect.firstName || 'Investor',
      fundName,
      kycUrl: `${getBaseUrl()}/kyc/token/${prospect.kycLinkToken}`,
      managerName,
      managerEmail,
    };

    console.log(`[Email] Sending KYC invite to ${prospect.email} for fund ${fundName}`);
    const result = await this.emailService.sendKYCInvite(prospect.email, templateData);
    
    if (result.success) {
      console.log(`[Email] KYC invite sent successfully to ${prospect.email}, messageId: ${result.messageId}`);
    } else {
      console.error(`[Email] Failed to send KYC invite to ${prospect.email}: ${result.error}`);
    }
  }

  /**
   * Trigger email when interest form is submitted (auto-send KYC link)
   */
  async onInterestFormSubmitted(
    prospect: Prospect,
    fundName: string
  ): Promise<void> {
    if (!prospect.kycLinkToken) {
      console.warn('Cannot send KYC auto-send - no token available');
      return;
    }

    const templateData: KYCAutoSendTemplateData = {
      recipientName: prospect.firstName || 'Investor',
      fundName,
      kycUrl: `${getBaseUrl()}/kyc/token/${prospect.kycLinkToken}`,
    };

    await this.emailService.sendKYCAutoSend(prospect.email, templateData);
  }

  /**
   * Trigger email when KYC is approved (send meeting invite)
   */
  async onKYCApproved(
    prospect: Prospect,
    fundName: string,
    calendlyUrl: string,
    managerName?: string
  ): Promise<void> {
    const templateData: MeetingInviteTemplateData = {
      recipientName: this.getDisplayName(prospect),
      fundName,
      calendlyUrl,
      managerName,
    };

    await this.emailService.sendMeetingInvite(prospect.email, templateData);
  }

  /**
   * Trigger email after meeting complete (send account creation invite)
   */
  async onMeetingComplete(
    prospect: Prospect,
    fundName: string,
    accountCreationUrl: string,
    managerName?: string
  ): Promise<void> {
    const templateData: PostMeetingOnboardingTemplateData = {
      recipientName: this.getDisplayName(prospect),
      fundName,
      accountCreationUrl,
      managerName,
    };

    await this.emailService.sendPostMeetingOnboarding(prospect.email, templateData);
  }

  /**
   * Trigger email when documents are approved (send DocuSign request)
   */
  async onDocumentsApproved(
    prospect: Prospect,
    fundName: string,
    docusignUrl: string,
    commitmentAmount?: number
  ): Promise<void> {
    const templateData: DocumentsApprovedDocuSignTemplateData = {
      recipientName: this.getDisplayName(prospect),
      fundName,
      docusignUrl,
      commitmentAmount: commitmentAmount?.toLocaleString(),
    };

    await this.emailService.sendDocumentsApprovedDocuSign(prospect.email, templateData);
  }

  /**
   * Trigger email when documents are rejected
   */
  async onDocumentsRejected(
    prospect: Prospect,
    fundName: string,
    rejectionReason: string
  ): Promise<void> {
    const portalUrl = `${getBaseUrl()}/investor/documents`;

    await this.emailService.sendDocumentRejection(prospect.email, {
      recipientName: this.getDisplayName(prospect),
      fundName,
      documentName: 'Verification Documents',
      documentType: 'Identity/Accreditation',
      rejectionReason,
      portalUrl,
    });
  }

  /**
   * Trigger email when prospect is converted to investor
   */
  async onConvertedToInvestor(
    prospect: Prospect,
    fundName: string,
    investmentAmount: number,
    investmentDate: Date,
    managerName?: string,
    managerEmail?: string
  ): Promise<void> {
    const templateData: WelcomeInvestorTemplateData = {
      recipientName: this.getDisplayName(prospect),
      fundName,
      investmentAmount: investmentAmount.toLocaleString(),
      investmentDate: investmentDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      portalUrl: `${getBaseUrl()}/investor/dashboard`,
      managerName,
      managerEmail,
    };

    await this.emailService.sendWelcomeInvestor(prospect.email, templateData);
  }

  /**
   * Trigger KYC reminder email
   */
  async sendKYCReminder(
    prospect: Prospect,
    fundName: string
  ): Promise<void> {
    if (!prospect.kycLinkToken) {
      console.warn('Cannot send KYC reminder - no token available');
      return;
    }

    const templateData: KYCReminderTemplateData = {
      recipientName: prospect.firstName || 'Investor',
      fundName,
      kycUrl: `${getBaseUrl()}/kyc/token/${prospect.kycLinkToken}`,
    };

    await this.emailService.sendKYCReminder(prospect.email, templateData);
  }

  /**
   * Trigger onboarding reminder email
   */
  async sendOnboardingReminder(
    prospect: Prospect,
    fundName: string
  ): Promise<void> {
    const templateData: OnboardingReminderTemplateData = {
      recipientName: this.getDisplayName(prospect),
      fundName,
      onboardingUrl: `${getBaseUrl()}/investor/profile`,
    };

    await this.emailService.sendOnboardingReminder(prospect.email, templateData);
  }

  /**
   * Trigger email when account invite is sent (onboarding link)
   */
  async onAccountInviteSent(
    prospect: Prospect,
    fundName: string,
    managerName?: string
  ): Promise<void> {
    const templateData: AccountInviteTemplateData = {
      recipientName: this.getDisplayName(prospect),
      fundName,
      accountCreationUrl: `${getBaseUrl()}/onboard/${prospect.id}`,
      managerName,
    };

    console.log(`[Email] Sending account invite to ${prospect.email} for fund ${fundName}`);
    const result = await this.emailService.sendAccountInvite(prospect.email, templateData);

    if (result.success) {
      console.log(`[Email] Account invite sent successfully to ${prospect.email}, messageId: ${result.messageId}`);
    } else {
      console.error(`[Email] Failed to send account invite to ${prospect.email}: ${result.error}`);
    }
  }

  /**
   * Handle status change and trigger appropriate email
   */
  async onStatusChanged(
    prospect: Prospect,
    previousStatus: ProspectStatus,
    fundName: string,
    calendlyUrl?: string,
    managerName?: string,
    managerEmail?: string
  ): Promise<void> {
    switch (prospect.status) {
      case 'pre_qualified':
        if (calendlyUrl) {
          await this.onKYCApproved(prospect, fundName, calendlyUrl, managerName);
        }
        break;

      case 'meeting_complete':
        // Account invite is typically sent manually, but can auto-trigger
        break;

      case 'account_invite_sent':
        await this.onAccountInviteSent(prospect, fundName, managerName);
        break;

      case 'documents_approved':
        // DocuSign URL would be generated separately
        break;

      case 'documents_rejected':
        if (prospect.documentRejectionReason) {
          await this.onDocumentsRejected(
            prospect,
            fundName,
            prospect.documentRejectionReason
          );
        }
        break;

      case 'converted':
        // Welcome email is sent via onConvertedToInvestor
        break;

      default:
        // No auto-email for other status changes
        break;
    }
  }

  /**
   * Get display name for a prospect
   */
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
    if (prospect.authorizedSignerFirstName && prospect.authorizedSignerLastName) {
      return `${prospect.authorizedSignerFirstName} ${prospect.authorizedSignerLastName}`;
    }
    return 'Investor';
  }
}

