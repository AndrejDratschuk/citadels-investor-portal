/**
 * Prospect/KYC Email Templates
 * Templates for KYC invites, meeting scheduling, and pre-qualification flows
 */

import { escapeHtml, baseTemplate, primaryButton, header, content, infoBox } from './baseTemplate';

export interface KYCInviteTemplateData {
  recipientName: string;
  fundName: string;
  kycUrl: string;
  managerName?: string;
  managerEmail?: string;
}

/**
 * KYC Invite Email (Manual Send)
 * Sent by fund manager to invite prospect to complete KYC form
 */
export const kycInviteTemplate = (data: KYCInviteTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeManagerName = data.managerName ? escapeHtml(data.managerName) : undefined;
  
  return baseTemplate(
    `
    ${header('Investment Opportunity', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        ${safeManagerName ? `${safeManagerName} from ${safeFundName}` : safeFundName} has invited you to explore an investment opportunity.
      </p>
      <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        To get started, please complete this brief pre-qualification form (takes 3-4 minutes):
      </p>
      ${primaryButton('Complete Pre-Qualification', data.kycUrl)}
      ${infoBox('This helps us verify you qualify as an accredited investor. We will follow up to schedule a brief call to discuss the opportunity.', 'info')}
      <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        Questions? Reply to this email or contact us directly.
      </p>
      ${safeManagerName ? `<p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">Best regards,<br><strong>${safeManagerName}</strong><br>${safeFundName}</p>` : ''}
    `)}
    `,
    'You have been invited to explore an investment opportunity'
  );
};

export interface KYCAutoSendTemplateData {
  recipientName: string;
  fundName: string;
  kycUrl: string;
}

/**
 * KYC Auto-Send Email (Interest Form)
 * Sent automatically when someone submits the interest form
 */
export const kycAutoSendTemplate = (data: KYCAutoSendTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  
  return baseTemplate(
    `
    ${header('Thanks for Your Interest', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Thank you for expressing interest in ${safeFundName}!
      </p>
      <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        <strong>Next step:</strong> Please complete this brief pre-qualification form (takes 3-4 minutes):
      </p>
      ${primaryButton('Complete Pre-Qualification', data.kycUrl)}
      ${infoBox('This verifies you qualify as an accredited investor. We will follow up within 24 hours to schedule a brief call.', 'info')}
      <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        Looking forward to speaking with you!
      </p>
      <p style="margin: 16px 0 0 0; font-size: 16px; color: #374151;">Best regards,<br><strong>${safeFundName}</strong></p>
    `)}
    `,
    'Complete your pre-qualification to continue'
  );
};

export interface MeetingInviteTemplateData {
  recipientName: string;
  fundName: string;
  calendlyUrl: string;
  managerName?: string;
}

/**
 * Meeting Invite Email
 * Sent when KYC is approved to invite prospect to schedule a meeting
 */
export const meetingInviteTemplate = (data: MeetingInviteTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeManagerName = data.managerName ? escapeHtml(data.managerName) : undefined;
  
  return baseTemplate(
    `
    ${header('Pre-Qualified! Schedule Your Call', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      ${infoBox('Great news - you are pre-qualified as an accredited investor!', 'success')}
      <p style="margin: 16px 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        <strong>Next step:</strong> Schedule a brief 15-minute call with ${safeManagerName || 'our team'} to discuss the investment opportunity:
      </p>
      ${primaryButton('Schedule Call', data.calendlyUrl)}
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
        We will review the fund details, answer your questions, and outline next steps if you decide to proceed.
      </p>
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">Best regards,<br><strong>${safeManagerName || safeFundName}</strong></p>
    `)}
    `,
    'You are pre-qualified! Schedule your call.'
  );
};

export interface PostMeetingOnboardingTemplateData {
  recipientName: string;
  fundName: string;
  accountCreationUrl: string;
  managerName?: string;
}

/**
 * Post-Meeting Onboarding Email
 * Sent after meeting complete to invite prospect to create account
 */
export const postMeetingOnboardingTemplate = (data: PostMeetingOnboardingTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeManagerName = data.managerName ? escapeHtml(data.managerName) : undefined;
  
  return baseTemplate(
    `
    ${header('Create Your Investor Account', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Thank you for our conversation! To move forward with your investment, please create your secure investor account:
      </p>
      ${primaryButton('Create Account', data.accountCreationUrl)}
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
        This takes about 5 minutes and includes:
      </p>
      <ul style="margin: 8px 0 24px 0; padding-left: 24px; font-size: 16px; color: #374151; line-height: 1.8;">
        <li>Creating your secure account</li>
        <li>Completing your investor profile</li>
        <li>Uploading verification documents</li>
      </ul>
      <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        Questions? Reply to this email.
      </p>
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">Best regards,<br><strong>${safeManagerName || safeFundName}</strong></p>
    `)}
    `,
    'Create your investor account to continue'
  );
};

export interface KYCReminderTemplateData {
  recipientName: string;
  fundName: string;
  kycUrl: string;
}

/**
 * KYC Reminder Email
 * Sent 48 hours after KYC form sent if not completed
 */
export const kycReminderTemplate = (data: KYCReminderTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  
  return baseTemplate(
    `
    ${header('Reminder: Complete Your Pre-Qualification', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        We noticed you have not completed your pre-qualification form yet.
      </p>
      ${primaryButton('Complete Pre-Qualification', data.kycUrl)}
      ${infoBox('This only takes 3-4 minutes and is required to move forward.', 'info')}
      <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        Questions? Reply to this email.
      </p>
      <p style="margin: 16px 0 0 0; font-size: 16px; color: #374151;">Best regards,<br><strong>${safeFundName}</strong></p>
    `)}
    `,
    'Reminder: Complete your pre-qualification form'
  );
};

