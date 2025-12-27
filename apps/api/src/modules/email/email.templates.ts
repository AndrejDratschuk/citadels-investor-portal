/**
 * Email Templates for the Investor Portal
 * These templates generate professional HTML emails for various workflows
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * CRITICAL: Always use this for any user-provided content in email templates
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Base template wrapper for consistent styling
const baseTemplate = (content: string, preheader: string = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Investor Portal</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f7; min-height: 100vh;">
  ${preheader ? `<span style="display: none; max-height: 0; overflow: hidden;">${preheader}</span>` : ''}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f7;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          ${content}
        </table>
        <table role="presentation" width="600" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="padding: 20px; color: #6b7280; font-size: 12px;">
              <p style="margin: 0;">This is an automated message from the Investor Portal.</p>
              <p style="margin: 8px 0 0 0;">Please do not reply directly to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Primary button component
const primaryButton = (text: string, url: string) => `
<table role="presentation" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
  <tr>
    <td align="center" bgcolor="#1e40af" style="border-radius: 6px;">
      <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">
        ${text}
      </a>
    </td>
  </tr>
</table>
`;

// Header component
const header = (title: string, fundName?: string) => `
<tr>
  <td style="padding: 32px 40px 16px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
    ${fundName ? `<p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">${fundName}</p>` : ''}
    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">${title}</h1>
  </td>
</tr>
`;

// Content section
const content = (html: string) => `
<tr>
  <td style="padding: 32px 40px;">
    ${html}
  </td>
</tr>
`;

// Alert/info box
const infoBox = (text: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') => {
  const colors = {
    info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
    warning: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' },
    success: { bg: '#f0fdf4', border: '#22c55e', text: '#166534' },
    error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
  };
  const c = colors[type];
  return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 16px 0;">
  <tr>
    <td style="padding: 16px; background-color: ${c.bg}; border-left: 4px solid ${c.border}; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: ${c.text};">${text}</p>
    </td>
  </tr>
</table>
`;
};

// ============================================================
// Template Definitions
// ============================================================

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
  // Sanitize user-provided content
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
  // Sanitize user-provided content
  const safeRecipientName = escapeHtml(data.recipientName);
  // Verification code should be alphanumeric only, but escape anyway for safety
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
  // Sanitize user-provided content
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

export interface DocumentRejectionTemplateData {
  recipientName: string;
  fundName: string;
  documentName: string;
  documentType: string;
  rejectionReason: string;
  portalUrl: string;
}

/**
 * Document Rejection Email
 * Sent when a validation document is rejected by the fund manager
 */
export const documentRejectionTemplate = (data: DocumentRejectionTemplateData): string => {
  // CRITICAL: Sanitize all user-provided content to prevent XSS
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeDocumentName = escapeHtml(data.documentName);
  const safeDocumentType = escapeHtml(data.documentType);
  // Convert newlines to <br> after escaping HTML
  const safeRejectionReason = escapeHtml(data.rejectionReason).replace(/\n/g, '<br>');
  
  return baseTemplate(
    `
    ${header('Document Requires Attention', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        We've reviewed your submitted document and unfortunately, we need you to provide an updated version.
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 16px 0; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
        <tr>
          <td style="padding: 16px;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Document Details:</p>
            <p style="margin: 0 0 4px 0; font-size: 16px; color: #111827;"><strong>${safeDocumentName}</strong></p>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">Type: ${safeDocumentType}</p>
          </td>
        </tr>
      </table>
      ${infoBox(`<strong>Reason for rejection:</strong><br>${safeRejectionReason}`, 'error')}
      <p style="margin: 24px 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Please log in to your investor portal to upload a corrected document.
      </p>
      ${primaryButton('Upload New Document', data.portalUrl)}
      <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        If you have any questions about this request, please contact your fund manager.
      </p>
    `)}
    `,
    'Action required: Your document needs attention'
  );
};

export interface DocumentApprovedTemplateData {
  recipientName: string;
  fundName: string;
  documentName: string;
  documentType: string;
  portalUrl: string;
}

/**
 * Document Approved Email
 * Sent when a validation document is approved by the fund manager
 */
export const documentApprovedTemplate = (data: DocumentApprovedTemplateData): string => {
  // Sanitize user-provided content
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeDocumentName = escapeHtml(data.documentName);
  const safeDocumentType = escapeHtml(data.documentType);
  
  return baseTemplate(
    `
    ${header('Document Approved', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Great news! Your submitted document has been reviewed and approved.
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 16px 0; background-color: #f0fdf4; border-radius: 8px; border: 1px solid #86efac;">
        <tr>
          <td style="padding: 16px;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #166534;">✓ Approved</p>
            <p style="margin: 0 0 4px 0; font-size: 16px; color: #111827;"><strong>${safeDocumentName}</strong></p>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">Type: ${safeDocumentType}</p>
          </td>
        </tr>
      </table>
      <p style="margin: 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        You can view the status of all your documents in your investor portal.
      </p>
      ${primaryButton('View Your Documents', data.portalUrl)}
    `)}
    `,
    'Your document has been approved'
  );
};

// ============================================================
// Pipeline / Prospect Email Templates
// ============================================================

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

export interface DocumentsApprovedDocuSignTemplateData {
  recipientName: string;
  fundName: string;
  docusignUrl: string;
  commitmentAmount?: string;
}

/**
 * Documents Approved + DocuSign Email
 * Sent when documents are approved to request DocuSign signature
 */
export const documentsApprovedDocuSignTemplate = (data: DocumentsApprovedDocuSignTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeAmount = data.commitmentAmount ? escapeHtml(data.commitmentAmount) : undefined;
  
  return baseTemplate(
    `
    ${header('Investment Documents Ready for Signature', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      ${infoBox('Your verification documents have been approved!', 'success')}
      <p style="margin: 16px 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        <strong>Next step:</strong> Please review and sign your investment documents:
      </p>
      ${primaryButton('Sign Documents', data.docusignUrl)}
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Documents to sign:
      </p>
      <ul style="margin: 8px 0 24px 0; padding-left: 24px; font-size: 16px; color: #374151; line-height: 1.8;">
        <li>Subscription Agreement${safeAmount ? ` ($${safeAmount} investment)` : ''}</li>
        <li>Private Placement Memorandum Acknowledgement</li>
      </ul>
      <p style="margin: 0 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        After signing, you will receive wire instructions to complete your investment.
      </p>
    `)}
    `,
    'Your documents are ready for signature'
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
 * Sent when prospect is converted to investor
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

// Export all templates as an object for easier access
export const emailTemplates = {
  accountInvite: accountInviteTemplate,
  verificationCode: verificationCodeTemplate,
  accountCreated: accountCreatedTemplate,
  documentRejection: documentRejectionTemplate,
  documentApproved: documentApprovedTemplate,
  // Pipeline templates
  kycInvite: kycInviteTemplate,
  kycAutoSend: kycAutoSendTemplate,
  meetingInvite: meetingInviteTemplate,
  postMeetingOnboarding: postMeetingOnboardingTemplate,
  documentsApprovedDocuSign: documentsApprovedDocuSignTemplate,
  welcomeInvestor: welcomeInvestorTemplate,
  kycReminder: kycReminderTemplate,
  onboardingReminder: onboardingReminderTemplate,
};

