import { Resend } from 'resend';
import {
  emailTemplates,
  AccountInviteTemplateData,
  VerificationCodeTemplateData,
  AccountCreatedTemplateData,
  DocumentRejectionTemplateData,
  DocumentApprovedTemplateData,
  KYCInviteTemplateData,
  KYCAutoSendTemplateData,
  MeetingInviteTemplateData,
  PostMeetingOnboardingTemplateData,
  DocumentsApprovedDocuSignTemplateData,
  WelcomeInvestorTemplateData,
  KYCReminderTemplateData,
  OnboardingReminderTemplateData,
  CapitalCallRequestTemplateData,
  WireConfirmationTemplateData,
  WireIssueTemplateData,
} from './templates';

// Initialize Resend with API key from environment
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  console.warn('[Email] WARNING: RESEND_API_KEY is not set - emails will not be sent');
}
const resend = new Resend(resendApiKey);

export interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
  from?: string;
  html?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailService {
  /**
   * Send an email using Resend
   */
  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const { to, subject, body, from, html } = input;

    // Default from address - should be configured in fund settings
    const fromAddress = from || process.env.EMAIL_FROM_ADDRESS || 'noreply@altsui.com';

    if (!resendApiKey) {
      console.error('[Email] Cannot send email - RESEND_API_KEY is not configured');
      return {
        success: false,
        error: 'Email service not configured - RESEND_API_KEY is missing',
      };
    }

    try {
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: [to],
        subject: subject,
        text: body, // Plain text version
        html: html || body.replace(/\n/g, '<br>'), // HTML version
      });

      if (error) {
        console.error('Resend error:', error);
        return {
          success: false,
          error: error.message || 'Failed to send email',
        };
      }

      return {
        success: true,
        messageId: data?.id,
      };
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Email send error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }
  }

  /**
   * Send account creation invite email
   */
  async sendAccountInvite(to: string, data: AccountInviteTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Create Your Investor Account - ${data.fundName}`,
      body: `Hi ${data.recipientName}, please create your investor account at: ${data.accountCreationUrl}`,
      html: emailTemplates.accountInvite(data),
    });
  }

  /**
   * Send email verification code
   */
  async sendVerificationCode(to: string, data: VerificationCodeTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: 'Verify Your Email Address',
      body: `Hi ${data.recipientName}, your verification code is: ${data.verificationCode}. This code expires in ${data.expiresInMinutes} minutes.`,
      html: emailTemplates.verificationCode(data),
    });
  }

  /**
   * Send account created confirmation email
   */
  async sendAccountCreated(to: string, data: AccountCreatedTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Account Created Successfully - ${data.fundName}`,
      body: `Hi ${data.recipientName}, your investor account has been created. Complete your profile at: ${data.onboardingUrl}`,
      html: emailTemplates.accountCreated(data),
    });
  }

  /**
   * Send document rejection notification email
   */
  async sendDocumentRejection(to: string, data: DocumentRejectionTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Document Requires Attention - ${data.fundName}`,
      body: `Hi ${data.recipientName}, your document "${data.documentName}" was rejected. Reason: ${data.rejectionReason}. Please upload a new document at: ${data.portalUrl}`,
      html: emailTemplates.documentRejection(data),
    });
  }

  /**
   * Send document approved notification email
   */
  async sendDocumentApproved(to: string, data: DocumentApprovedTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Document Approved - ${data.fundName}`,
      body: `Hi ${data.recipientName}, your document "${data.documentName}" has been approved. View your documents at: ${data.portalUrl}`,
      html: emailTemplates.documentApproved(data),
    });
  }

  // ============================================================
  // Pipeline / Prospect Email Methods
  // ============================================================

  /**
   * Send KYC invite email (manual send)
   */
  async sendKYCInvite(to: string, data: KYCInviteTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Investment Opportunity - ${data.fundName}`,
      body: `Hi ${data.recipientName}, you've been invited to complete a pre-qualification form for ${data.fundName}. Complete it here: ${data.kycUrl}`,
      html: emailTemplates.kycInvite(data),
    });
  }

  /**
   * Send KYC auto-send email (from interest form)
   */
  async sendKYCAutoSend(to: string, data: KYCAutoSendTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Thanks for Your Interest - ${data.fundName}`,
      body: `Hi ${data.recipientName}, thank you for your interest in ${data.fundName}. Complete your pre-qualification here: ${data.kycUrl}`,
      html: emailTemplates.kycAutoSend(data),
    });
  }

  /**
   * Send meeting invite email
   */
  async sendMeetingInvite(to: string, data: MeetingInviteTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `You're Pre-Qualified! Schedule Your Call - ${data.fundName}`,
      body: `Hi ${data.recipientName}, you're pre-qualified for ${data.fundName}. Schedule your call here: ${data.calendlyUrl}`,
      html: emailTemplates.meetingInvite(data),
    });
  }

  /**
   * Send post-meeting onboarding email
   */
  async sendPostMeetingOnboarding(to: string, data: PostMeetingOnboardingTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Create Your Investor Account - ${data.fundName}`,
      body: `Hi ${data.recipientName}, thank you for meeting with us! Create your account here: ${data.accountCreationUrl}`,
      html: emailTemplates.postMeetingOnboarding(data),
    });
  }

  /**
   * Send documents approved + DocuSign email
   */
  async sendDocumentsApprovedDocuSign(to: string, data: DocumentsApprovedDocuSignTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Documents Ready for Signature - ${data.fundName}`,
      body: `Hi ${data.recipientName}, your documents have been approved. Sign your investment documents here: ${data.docusignUrl}`,
      html: emailTemplates.documentsApprovedDocuSign(data),
    });
  }

  /**
   * Send welcome investor email
   */
  async sendWelcomeInvestor(to: string, data: WelcomeInvestorTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Welcome to ${data.fundName}!`,
      body: `Hi ${data.recipientName}, congratulations! Your investment of $${data.investmentAmount} in ${data.fundName} is confirmed. Access your portal: ${data.portalUrl}`,
      html: emailTemplates.welcomeInvestor(data),
    });
  }

  /**
   * Send KYC reminder email
   */
  async sendKYCReminder(to: string, data: KYCReminderTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Reminder: Complete Your Pre-Qualification - ${data.fundName}`,
      body: `Hi ${data.recipientName}, don't forget to complete your pre-qualification form: ${data.kycUrl}`,
      html: emailTemplates.kycReminder(data),
    });
  }

  /**
   * Send onboarding reminder email
   */
  async sendOnboardingReminder(to: string, data: OnboardingReminderTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Complete Your Investor Profile - ${data.fundName}`,
      body: `Hi ${data.recipientName}, please complete your investor profile: ${data.onboardingUrl}`,
      html: emailTemplates.onboardingReminder(data),
    });
  }

  // ============================================================
  // Capital Call Email Methods
  // ============================================================

  /**
   * Send capital call request email
   */
  async sendCapitalCallRequest(to: string, data: CapitalCallRequestTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Capital Call Notice - ${data.fundName}`,
      body: `Hi ${data.recipientName}, a capital call of $${data.amountDue} has been issued for ${data.dealName}. Deadline: ${data.deadline}. View wire instructions: ${data.wireInstructionsUrl}`,
      html: emailTemplates.capitalCallRequest(data),
    });
  }

  /**
   * Send wire confirmation email
   */
  async sendWireConfirmation(to: string, data: WireConfirmationTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Wire Transfer Received - ${data.fundName}`,
      body: `Hi ${data.recipientName}, your wire transfer of $${data.amountReceived} has been received. Confirmation: ${data.confirmationNumber}`,
      html: emailTemplates.wireConfirmation(data),
    });
  }

  /**
   * Send wire issue notification email
   */
  async sendWireIssue(to: string, data: WireIssueTemplateData): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Action Required - Wire Transfer Issue - ${data.fundName}`,
      body: `Hi ${data.recipientName}, there was an issue with your wire transfer: ${data.issueDescription}. Please contact us to resolve.`,
      html: emailTemplates.wireIssue(data),
    });
  }
}

export const emailService = new EmailService();

// Re-export template types for convenience
export type {
  AccountInviteTemplateData,
  VerificationCodeTemplateData,
  AccountCreatedTemplateData,
  DocumentRejectionTemplateData,
  DocumentApprovedTemplateData,
  KYCInviteTemplateData,
  KYCAutoSendTemplateData,
  MeetingInviteTemplateData,
  PostMeetingOnboardingTemplateData,
  DocumentsApprovedDocuSignTemplateData,
  WelcomeInvestorTemplateData,
  KYCReminderTemplateData,
  OnboardingReminderTemplateData,
  CapitalCallRequestTemplateData,
  WireConfirmationTemplateData,
  WireIssueTemplateData,
};
