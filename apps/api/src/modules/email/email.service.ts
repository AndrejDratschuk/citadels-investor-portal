import { Resend } from 'resend';
import {
  emailTemplates,
  AccountInviteTemplateData,
  VerificationCodeTemplateData,
  AccountCreatedTemplateData,
  DocumentRejectionTemplateData,
  DocumentApprovedTemplateData,
} from './email.templates';

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

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
    const fromAddress = from || process.env.EMAIL_FROM_ADDRESS || 'noreply@flowveda.com';

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
    } catch (err: any) {
      console.error('Email send error:', err);
      return {
        success: false,
        error: err.message || 'Failed to send email',
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
}

export const emailService = new EmailService();
















