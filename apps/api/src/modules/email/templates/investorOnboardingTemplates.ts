/**
 * Investor Onboarding Email Templates (Stage 02)
 * Templates for the investor onboarding journey from account creation through funding
 */

import { escapeHtml, baseTemplate, primaryButton, header, content, infoBox } from './baseTemplate';

// ============================================================
// Onboarding Reminder Templates (02.02.B1-B3)
// ============================================================

export interface OnboardingReminder1TemplateData {
  recipientName: string;
  fundName: string;
  onboardingUrl: string;
}

/**
 * 02.02.B1 - Onboarding Reminder #1
 * Sent +48hr after account creation if profile incomplete
 */
export const onboardingReminder1Template = (data: OnboardingReminder1TemplateData): string => {
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
        You're almost done. Please complete your investor profile to move forward:
      </p>
      ${primaryButton('Continue Profile', data.onboardingUrl)}
      <p style="margin: 16px 0 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Completing your profile allows us to prepare your investment documents.
      </p>
      <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        If you have any questions, reply to this email.
      </p>
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        ${safeFundName} Team
      </p>
    `)}
    `,
    'Complete your investor profile to move forward'
  );
};

export interface OnboardingReminder2TemplateData {
  recipientName: string;
  fundName: string;
  onboardingUrl: string;
}

/**
 * 02.02.B2 - Onboarding Reminder #2
 * Sent +96hr after account creation if profile incomplete
 */
export const onboardingReminder2Template = (data: OnboardingReminder2TemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);

  return baseTemplate(
    `
    ${header('Your Investor Profile is Incomplete', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Your investor profile is still incomplete. Please finish it so we can proceed with your investment:
      </p>
      ${primaryButton('Complete Profile', data.onboardingUrl)}
      <p style="margin: 16px 0 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
        This should only take a few more minutes.
      </p>
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        ${safeFundName} Team
      </p>
    `)}
    `,
    'Your investor profile is incomplete'
  );
};

export interface OnboardingReminder3TemplateData {
  recipientName: string;
  fundName: string;
  onboardingUrl: string;
}

/**
 * 02.02.B3 - Onboarding Reminder #3 (Final)
 * Sent +144hr after account creation if profile incomplete
 */
export const onboardingReminder3Template = (data: OnboardingReminder3TemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);

  return baseTemplate(
    `
    ${header('Final Reminder - Complete Your Profile', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        This is a final reminder to complete your investor profile for ${safeFundName}.
      </p>
      ${primaryButton('Complete Profile', data.onboardingUrl)}
      <p style="margin: 16px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        If you're having any issues or have questions, please reply to this email and we'll help you through the process.
      </p>
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        ${safeFundName} Team
      </p>
    `)}
    `,
    'Final reminder to complete your investor profile'
  );
};

// ============================================================
// Document Templates (02.03.B1)
// ============================================================

export interface DocumentUploadedPendingTemplateData {
  recipientName: string;
  fundName: string;
  documentType: string;
  reviewTimeframe: string;
  portalUrl: string;
}

/**
 * 02.03.B1 - Document Uploaded Pending
 * Sent when investor uploads a document for review
 */
export const documentUploadedPendingTemplate = (data: DocumentUploadedPendingTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeDocumentType = escapeHtml(data.documentType);
  const safeReviewTimeframe = escapeHtml(data.reviewTimeframe);

  return baseTemplate(
    `
    ${header('Document Received', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        We've received your <strong>${safeDocumentType}</strong> and it's now under review.
      </p>
      ${infoBox(`You'll hear from us within ${safeReviewTimeframe}.`, 'info')}
      ${primaryButton('View Your Documents', data.portalUrl)}
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        ${safeFundName} Team
      </p>
    `)}
    `,
    'Your document has been received and is under review'
  );
};

// ============================================================
// Signature Templates (02.04.A1, 02.04.B1-B2)
// ============================================================

export interface DocumentsReadySignatureTemplateData {
  recipientName: string;
  fundName: string;
  docusignUrl: string;
}

/**
 * 02.04.A1 - Docs Ready for Signature
 * Sent when all documents approved and ready for DocuSign
 */
export const documentsReadySignatureTemplate = (data: DocumentsReadySignatureTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);

  return baseTemplate(
    `
    ${header('Investment Documents Ready for Signature', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      ${infoBox('Your verification documents have been approved!', 'success')}
      <p style="margin: 16px 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        <strong>Next step:</strong> Review and sign your investment documents.
      </p>
      ${primaryButton('Sign Documents', data.docusignUrl)}
      <p style="margin: 16px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        Please review the documents carefully. If you have any questions, reach out before signing.
      </p>
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        ${safeFundName} Team
      </p>
    `)}
    `,
    'Your investment documents are ready for signature'
  );
};

export interface SignatureReminder1TemplateData {
  recipientName: string;
  fundName: string;
  docusignUrl: string;
}

/**
 * 02.04.B1 - Signature Reminder #1
 * Sent +48hr after documents sent for signature if unsigned
 */
export const signatureReminder1Template = (data: SignatureReminder1TemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);

  return baseTemplate(
    `
    ${header('Documents Awaiting Your Signature', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Your investment documents are ready and waiting for your signature.
      </p>
      ${primaryButton('Complete Signature', data.docusignUrl)}
      <p style="margin: 16px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        If you have any questions about the documents, please don't hesitate to reach out.
      </p>
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        ${safeFundName} Team
      </p>
    `)}
    `,
    'Your investment documents are awaiting signature'
  );
};

export interface SignatureReminder2TemplateData {
  recipientName: string;
  fundName: string;
  docusignUrl: string;
}

/**
 * 02.04.B2 - Signature Reminder #2 (Final)
 * Sent +96hr after documents sent for signature if unsigned
 */
export const signatureReminder2Template = (data: SignatureReminder2TemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);

  return baseTemplate(
    `
    ${header('Final Reminder - Documents Awaiting Signature', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        This is a reminder that your investment documents are still awaiting your signature.
      </p>
      ${primaryButton('Sign Now', data.docusignUrl)}
      <p style="margin: 16px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        If you're having any issues or need assistance, please reply to this email.
      </p>
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        ${safeFundName} Team
      </p>
    `)}
    `,
    'Final reminder - your investment documents need your signature'
  );
};

// ============================================================
// Execution Templates (02.05.A1)
// ============================================================

export interface DocumentsFullyExecutedTemplateData {
  recipientName: string;
  fundName: string;
  portalUrl: string;
}

/**
 * 02.05.A1 - Documents Fully Executed
 * Sent when manager countersigns and documents are fully executed
 */
export const documentsFullyExecutedTemplate = (data: DocumentsFullyExecutedTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);

  return baseTemplate(
    `
    ${header('Investment Documents Executed', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      ${infoBox('Your investment documents have been fully executed.', 'success')}
      <p style="margin: 16px 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Copies are now available in your portal.
      </p>
      ${primaryButton('View Executed Documents', data.portalUrl)}
      <p style="margin: 16px 0 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
        <strong>Next step:</strong> Fund your investment using the wire instructions in the following email.
      </p>
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        ${safeFundName} Team
      </p>
    `)}
    `,
    'Your investment documents have been fully executed'
  );
};

// ============================================================
// Funding Templates (02.06.A1, 02.06.B1)
// ============================================================

export interface FundingInstructionsTemplateData {
  recipientName: string;
  fundName: string;
  commitmentAmount: string;
  fundingDeadline: string;
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  referenceCode: string;
  portalUrl: string;
}

/**
 * 02.06.A1 - Funding Instructions
 * Sent after documents fully executed with wire details
 */
export const fundingInstructionsTemplate = (data: FundingInstructionsTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeCommitmentAmount = escapeHtml(data.commitmentAmount);
  const safeFundingDeadline = escapeHtml(data.fundingDeadline);
  const safeBankName = escapeHtml(data.bankName);
  const safeRoutingNumber = escapeHtml(data.routingNumber);
  const safeAccountNumber = escapeHtml(data.accountNumber);
  const safeReferenceCode = escapeHtml(data.referenceCode);

  return baseTemplate(
    `
    ${header('Funding Instructions', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Your subscription has been accepted. Please fund your commitment using the instructions below.
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0; background-color: #fef3c7; border-radius: 8px; border: 1px solid #fcd34d;">
        <tr>
          <td style="padding: 20px;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #92400e; font-weight: 600;">Funding Details:</p>
            <p style="margin: 0 0 4px 0; font-size: 20px; color: #111827;"><strong>Commitment Amount: $${safeCommitmentAmount}</strong></p>
            <p style="margin: 0; font-size: 16px; color: #111827;"><strong>Funding Deadline:</strong> ${safeFundingDeadline}</p>
          </td>
        </tr>
      </table>
      <p style="margin: 24px 0 8px 0; font-size: 16px; color: #374151; font-weight: 600;">Wire Instructions:</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 24px 0; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
        <tr>
          <td style="padding: 20px;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #111827;"><strong>Bank:</strong> ${safeBankName}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #111827;"><strong>Routing #:</strong> ${safeRoutingNumber}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #111827;"><strong>Account #:</strong> ${safeAccountNumber}</p>
            <p style="margin: 0; font-size: 14px; color: #111827;"><strong>Reference:</strong> <span style="background: #dbeafe; padding: 2px 8px; border-radius: 4px; font-family: monospace;">${safeReferenceCode}</span></p>
          </td>
        </tr>
      </table>
      ${primaryButton('View in Portal', data.portalUrl)}
      ${infoBox('Please include the reference code with your wire for proper allocation.', 'warning')}
      <p style="margin: 16px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        If you have any questions about the funding process, please contact us.
      </p>
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        ${safeFundName} Team
      </p>
    `)}
    `,
    `Funding instructions - $${safeCommitmentAmount} due by ${safeFundingDeadline}`
  );
};

export interface FundingDiscrepancyTemplateData {
  recipientName: string;
  fundName: string;
  commitmentAmount: string;
  receivedAmount: string;
  varianceAmount: string;
  managerName: string;
  managerTitle: string;
}

/**
 * 02.06.B1 - Funding Discrepancy
 * Sent when wire amount doesn't match commitment
 */
export const fundingDiscrepancyTemplate = (data: FundingDiscrepancyTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeCommitmentAmount = escapeHtml(data.commitmentAmount);
  const safeReceivedAmount = escapeHtml(data.receivedAmount);
  const safeVarianceAmount = escapeHtml(data.varianceAmount);
  const safeManagerName = escapeHtml(data.managerName);
  const safeManagerTitle = escapeHtml(data.managerTitle);

  return baseTemplate(
    `
    ${header('Funding Discrepancy', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        We received a wire transfer, but the amount doesn't match your commitment.
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 16px 0; background-color: #fef2f2; border-radius: 8px; border: 1px solid #fecaca;">
        <tr>
          <td style="padding: 20px;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #111827;"><strong>Committed:</strong> $${safeCommitmentAmount}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #111827;"><strong>Received:</strong> $${safeReceivedAmount}</p>
            <p style="margin: 0; font-size: 14px; color: #991b1b;"><strong>Difference:</strong> $${safeVarianceAmount}</p>
          </td>
        </tr>
      </table>
      <p style="margin: 16px 0 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Please contact us to resolve this discrepancy. You can reply to this email or reach us directly.
      </p>
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        ${safeManagerName}<br>
        <span style="color: #6b7280;">${safeManagerTitle}</span>
      </p>
    `)}
    `,
    'Action required: Wire amount discrepancy'
  );
};

// ============================================================
// Welcome Template (02.07.A1) - Enhanced version
// ============================================================

export interface WelcomeInvestorEnhancedTemplateData {
  recipientName: string;
  fundName: string;
  investmentAmount: string;
  investmentDate: string;
  portalUrl: string;
  platformName: string;
  welcomeMessage?: string;
  managerName: string;
  managerTitle: string;
}

/**
 * 02.07.A1 - Welcome Investor (Enhanced)
 * Sent when funding received and investment confirmed
 */
export const welcomeInvestorEnhancedTemplate = (data: WelcomeInvestorEnhancedTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeAmount = escapeHtml(data.investmentAmount);
  const safeDate = escapeHtml(data.investmentDate);
  const safePlatformName = escapeHtml(data.platformName);
  const safeWelcomeMessage = data.welcomeMessage ? escapeHtml(data.welcomeMessage) : undefined;
  const safeManagerName = escapeHtml(data.managerName);
  const safeManagerTitle = escapeHtml(data.managerTitle);

  return baseTemplate(
    `
    ${header('Welcome to ' + safeFundName, safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      ${infoBox('Congratulations! Your investment is confirmed.', 'success')}
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0; background-color: #f0fdf4; border-radius: 8px; border: 1px solid #86efac;">
        <tr>
          <td style="padding: 20px;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #166534; font-weight: 600;">Investment Details:</p>
            <p style="margin: 0 0 4px 0; font-size: 16px; color: #111827;"><strong>Amount:</strong> $${safeAmount}</p>
            <p style="margin: 0 0 4px 0; font-size: 16px; color: #111827;"><strong>Date:</strong> ${safeDate}</p>
            <p style="margin: 0; font-size: 16px; color: #111827;"><strong>Fund:</strong> ${safeFundName}</p>
          </td>
        </tr>
      </table>
      ${primaryButton('Login to Portal', data.portalUrl)}
      <p style="margin: 24px 0 8px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Your ${safePlatformName} portal is your home for:
      </p>
      <ul style="margin: 8px 0 24px 0; padding-left: 24px; font-size: 16px; color: #374151; line-height: 1.8;">
        <li>Investment documents and statements</li>
        <li>Performance reports and updates</li>
        <li>Capital call and distribution notices</li>
        <li>Direct communication with the fund team</li>
      </ul>
      ${safeWelcomeMessage ? `<p style="margin: 16px 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6; padding: 16px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #1e40af;">${safeWelcomeMessage}</p>` : ''}
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        ${safeManagerName}<br>
        <span style="color: #6b7280;">${safeManagerTitle}</span>
      </p>
    `)}
    `,
    'Welcome! Your investment is confirmed.'
  );
};

// ============================================================
// Account Invitation Template (02.01.A1) - Enhanced version
// ============================================================

export interface AccountInvitationEnhancedTemplateData {
  recipientName: string;
  fundName: string;
  accountCreationUrl: string;
  postMeetingRecap?: string;
  platformName: string;
  managerName: string;
  managerTitle: string;
}

/**
 * 02.01.A1 - Account Invitation (Enhanced)
 * Sent after meeting to invite investor to create account
 */
export const accountInvitationEnhancedTemplate = (data: AccountInvitationEnhancedTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safePostMeetingRecap = data.postMeetingRecap ? escapeHtml(data.postMeetingRecap) : undefined;
  const safePlatformName = escapeHtml(data.platformName);
  const safeManagerName = escapeHtml(data.managerName);
  const safeManagerTitle = escapeHtml(data.managerTitle);

  return baseTemplate(
    `
    ${header('Create Your Investor Account', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Thank you for our conversation.
      </p>
      ${safePostMeetingRecap ? `<p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6; padding: 16px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #1e40af;">${safePostMeetingRecap}</p>` : ''}
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        To move forward with your investment, please create your secure investor account:
      </p>
      ${primaryButton('Create Your Account', data.accountCreationUrl)}
      <p style="margin: 16px 0 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Your ${safePlatformName} portal gives you 24/7 access to documents, performance data, and direct communication with the fund.
      </p>
      ${infoBox('This takes about 5 minutes.', 'info')}
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        Best regards,<br>
        ${safeManagerName}<br>
        <span style="color: #6b7280;">${safeManagerTitle}</span>
      </p>
    `)}
    `,
    'Create your investor account to move forward'
  );
};
