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

// Export all templates as an object for easier access
export const emailTemplates = {
  accountInvite: accountInviteTemplate,
  verificationCode: verificationCodeTemplate,
  accountCreated: accountCreatedTemplate,
  documentRejection: documentRejectionTemplate,
  documentApproved: documentApprovedTemplate,
};

