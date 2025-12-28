/**
 * Onboarding Email Templates
 * Templates for account creation, verification, and profile completion
 */

import { escapeHtml, baseTemplate, primaryButton, header, content, infoBox } from './baseTemplate';

export interface AccountInviteTemplateData {
  recipientName: string;
  fundName: string;
  accountCreationUrl: string;
  managerName?: string;
}

/**
 * Account Creation Invite Email
 * Sent by fund manager after meeting complete to invite investor to create account
 */
export const accountInviteTemplate = (data: AccountInviteTemplateData): string => {
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
        Thank you for taking the time to meet with us. We're excited to move forward with your investment!
      </p>
      <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        <strong>Next step:</strong> Create your secure investor account to complete your profile and upload verification documents.
      </p>
      ${primaryButton('Create Your Account', data.accountCreationUrl)}
      ${infoBox('This process takes about 5 minutes. You will need to set a password and verify your email address.', 'info')}
      <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        Questions? Reply to this email or contact your fund manager directly.
      </p>
      ${safeManagerName ? `<p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">Best regards,<br><strong>${safeManagerName}</strong></p>` : ''}
    `)}
    `,
    'Create your investor account to continue the investment process'
  );
};

export interface VerificationCodeTemplateData {
  recipientName: string;
  verificationCode: string;
  expiresInMinutes: number;
}

/**
 * 2FA Verification Code Email
 * Sent during account creation to verify email address
 */
export const verificationCodeTemplate = (data: VerificationCodeTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeCode = escapeHtml(data.verificationCode);
  
  return baseTemplate(
    `
    ${header('Verify Your Email Address')}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Please use the verification code below to complete your account setup:
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center">
            <div style="display: inline-block; padding: 16px 32px; background-color: #f3f4f6; border-radius: 8px; border: 2px dashed #d1d5db;">
              <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #111827;">${safeCode}</span>
            </div>
          </td>
        </tr>
      </table>
      ${infoBox(`This code will expire in ${data.expiresInMinutes} minutes.`, 'warning')}
      <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        If you didn't request this code, you can safely ignore this email.
      </p>
    `)}
    `,
    `Your verification code is: ${safeCode}`
  );
};

export interface AccountCreatedTemplateData {
  recipientName: string;
  fundName: string;
  portalUrl: string;
  onboardingUrl: string;
}

/**
 * Account Created Confirmation Email
 * Sent after successful account creation
 */
export const accountCreatedTemplate = (data: AccountCreatedTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  
  return baseTemplate(
    `
    ${header('Account Created Successfully', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Your investor account has been successfully created! You can now complete your investor profile and upload the required verification documents.
      </p>
      ${primaryButton('Complete Your Profile', data.onboardingUrl)}
      ${infoBox('After completing your profile, our team will review your documents and you will be notified of the next steps.', 'success')}
      <p style="margin: 24px 0 8px 0; font-size: 14px; color: #6b7280;">
        Login anytime at: <a href="${data.portalUrl}" style="color: #1e40af;">${data.portalUrl}</a>
      </p>
    `)}
    `,
    'Your investor account has been created successfully'
  );
};

export interface OnboardingReminderTemplateData {
  recipientName: string;
  fundName: string;
  onboardingUrl: string;
}

/**
 * Onboarding Reminder Email
 * Sent 3 days after account creation if onboarding not completed
 */
export const onboardingReminderTemplate = (data: OnboardingReminderTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  
  return baseTemplate(
    `
    ${header('Complete Your Investor Profile', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        You are almost done! Please complete your investor profile to move forward:
      </p>
      ${primaryButton('Continue Profile', data.onboardingUrl)}
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Remaining steps:
      </p>
      <ul style="margin: 8px 0 24px 0; padding-left: 24px; font-size: 16px; color: #374151; line-height: 1.8;">
        <li>Upload verification documents</li>
        <li>Banking information</li>
        <li>Final review</li>
      </ul>
      <p style="margin: 0 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        Questions? Reply to this email.
      </p>
      <p style="margin: 16px 0 0 0; font-size: 16px; color: #374151;">Best regards,<br><strong>${safeFundName}</strong></p>
    `)}
    `,
    'Complete your investor profile'
  );
};

export interface WelcomeInvestorTemplateData {
  recipientName: string;
  fundName: string;
  investmentAmount: string;
  investmentDate: string;
  portalUrl: string;
  managerName?: string;
  managerEmail?: string;
}

/**
 * Welcome Investor Email
 * Sent when prospect is converted to investor (wire confirmed)
 */
export const welcomeInvestorTemplate = (data: WelcomeInvestorTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeAmount = escapeHtml(data.investmentAmount);
  const safeDate = escapeHtml(data.investmentDate);
  const safeManagerName = data.managerName ? escapeHtml(data.managerName) : undefined;
  const safeManagerEmail = data.managerEmail ? escapeHtml(data.managerEmail) : undefined;
  
  return baseTemplate(
    `
    ${header('Welcome to ' + safeFundName, safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      ${infoBox('Congratulations! Your investment is confirmed.', 'success')}
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
        <tr>
          <td style="padding: 20px;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Investment Details:</p>
            <p style="margin: 0 0 4px 0; font-size: 16px; color: #111827;"><strong>Amount:</strong> $${safeAmount}</p>
            <p style="margin: 0 0 4px 0; font-size: 16px; color: #111827;"><strong>Date:</strong> ${safeDate}</p>
            <p style="margin: 0; font-size: 16px; color: #111827;"><strong>Fund:</strong> ${safeFundName}</p>
          </td>
        </tr>
      </table>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Access Your Portal:
      </p>
      ${primaryButton('Login to Portal', data.portalUrl)}
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
        In your portal you will find:
      </p>
      <ul style="margin: 8px 0 24px 0; padding-left: 24px; font-size: 16px; color: #374151; line-height: 1.8;">
        <li>✓ Investment documents</li>
        <li>✓ Performance updates</li>
        <li>✓ Capital call notices</li>
        <li>✓ Quarterly reports</li>
      </ul>
      ${safeManagerName ? `<p style="margin: 16px 0 0 0; font-size: 14px; color: #6b7280;">Your fund manager ${safeManagerName}${safeManagerEmail ? ` (${safeManagerEmail})` : ''} is available for any questions.</p>` : ''}
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">Thank you for investing with us!<br><strong>${safeFundName} Team</strong></p>
    `)}
    `,
    'Welcome! Your investment is confirmed.'
  );
};

