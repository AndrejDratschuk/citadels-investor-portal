import { Resend } from 'resend';

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
  from?: string;
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
    const { to, subject, body, from } = input;

    // Default from address - should be configured in fund settings
    const fromAddress = from || process.env.EMAIL_FROM_ADDRESS || 'noreply@flowveda.com';

    try {
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: [to],
        subject: subject,
        text: body, // Plain text version
        html: body.replace(/\n/g, '<br>'), // Simple HTML conversion
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
}

export const emailService = new EmailService();













