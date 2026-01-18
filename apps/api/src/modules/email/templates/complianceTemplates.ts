/**
 * Compliance & Re-Verification Email Templates (Stage 05)
 * Templates for compliance communications including re-KYC, accreditation,
 * banking updates, PPM amendments, and material events.
 */

import { escapeHtml, baseTemplate, primaryButton, header, content, infoBox } from './baseTemplate';

// ============================================================
// Template Data Interfaces
// ============================================================

export interface RekycRequiredTemplateData {
  recipientName: string;
  fundName: string;
  reverificationReason: string;
  deadline: string;
  verificationUrl: string;
}

export interface AccreditationReverificationTemplateData {
  recipientName: string;
  fundName: string;
  verificationUrl: string;
}

export interface BankingUpdateRequestTemplateData {
  recipientName: string;
  fundName: string;
  failureReason: string;
  updateBankingUrl: string;
}

export interface PpmAmendmentTemplateData {
  recipientName: string;
  fundName: string;
  documentName: string;
  amendmentSummary: string; // HTML content - already safe
  effectiveDate: string;
  reviewUrl: string;
  acknowledgmentNote?: string; // HTML content - already safe
}

export interface MaterialEventTemplateData {
  recipientName: string;
  fundName: string;
  eventContent: string; // HTML content - already safe
  detailsUrl: string;
}

// ============================================================
// 05.01.A1 — Re-KYC Required
// ============================================================

/**
 * 05.01.A1 - Re-KYC Required
 * Sent when periodic or event-based re-verification is required
 */
export const rekycRequiredTemplate = (data: RekycRequiredTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeReason = escapeHtml(data.reverificationReason);
  const safeDeadline = escapeHtml(data.deadline);

  return baseTemplate(
    `
    ${header('Verification Update Required', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Per ${safeFundName}'s compliance requirements, we need to verify your current information.
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 16px 0; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
        <tr>
          <td style="padding: 16px;">
            <p style="margin: 0; font-size: 14px; color: #111827;"><strong>Reason:</strong> ${safeReason}</p>
          </td>
        </tr>
      </table>
      ${primaryButton('Update Verification', data.verificationUrl)}
      <p style="margin: 16px 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Please complete this within <strong>${safeDeadline}</strong>.
      </p>
      ${infoBox('Failure to complete re-verification may affect your ability to participate in future capital calls or receive distributions.', 'warning')}
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        ${safeFundName} Team
      </p>
    `)}
    `,
    'Verification update required - please complete by ' + safeDeadline
  );
};

// ============================================================
// 05.02.A1 — Accreditation Re-Verification
// ============================================================

/**
 * 05.02.A1 - Accreditation Re-Verification
 * Sent when accreditation status expires (506c compliance)
 */
export const accreditationReverificationTemplate = (data: AccreditationReverificationTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);

  return baseTemplate(
    `
    ${header('Accreditation Verification Required', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Your accredited investor status requires periodic re-verification.
      </p>
      ${primaryButton('Complete Verification', data.verificationUrl)}
      ${infoBox('This is required to maintain your investment eligibility under SEC Regulation D.', 'info')}
      <p style="margin: 16px 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        The verification process takes approximately 5 minutes. If you have questions about accreditation requirements, please reply to this email.
      </p>
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        ${safeFundName} Team
      </p>
    `)}
    `,
    'Accreditation verification required to maintain investment eligibility'
  );
};

// ============================================================
// 05.03.A1 — Banking Update Request
// ============================================================

/**
 * 05.03.A1 - Banking Update Request
 * Sent when ACH fails or wire is returned
 */
export const bankingUpdateRequestTemplate = (data: BankingUpdateRequestTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeFailureReason = escapeHtml(data.failureReason);

  return baseTemplate(
    `
    ${header('Banking Information Update Needed', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        We were unable to process a payment to your account on file.
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 16px 0; background-color: #fef2f2; border-radius: 8px; border: 1px solid #fecaca;">
        <tr>
          <td style="padding: 16px;">
            <p style="margin: 0; font-size: 14px; color: #991b1b;"><strong>Reason:</strong> ${safeFailureReason}</p>
          </td>
        </tr>
      </table>
      ${primaryButton('Update Banking Information', data.updateBankingUrl)}
      <p style="margin: 16px 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Please update your banking information to ensure you receive future distributions.
      </p>
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        If you believe this is an error, please contact us.
      </p>
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        ${safeFundName} Team
      </p>
    `)}
    `,
    'Banking information update needed - payment could not be processed'
  );
};

// ============================================================
// 05.04.A1 — PPM Amendment Notice
// ============================================================

/**
 * 05.04.A1 - PPM Amendment Notice
 * Sent when PPM/OA is amended
 */
export const ppmAmendmentTemplate = (data: PpmAmendmentTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeDocumentName = escapeHtml(data.documentName);
  const safeEffectiveDate = escapeHtml(data.effectiveDate);
  // amendmentSummary and acknowledgmentNote are HTML content, not escaped

  return baseTemplate(
    `
    ${header('Important: Fund Document Amendment', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        The <strong>${safeDocumentName}</strong> for ${safeFundName} has been amended.
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 16px 0; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
        <tr>
          <td style="padding: 20px;">
            <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Summary of Changes:</p>
            <div style="font-size: 14px; color: #374151; line-height: 1.6;">
              ${data.amendmentSummary}
            </div>
          </td>
        </tr>
      </table>
      <p style="margin: 16px 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        <strong>Effective Date:</strong> ${safeEffectiveDate}
      </p>
      ${primaryButton('Review Amendment', data.reviewUrl)}
      ${data.acknowledgmentNote ? `
      <div style="margin: 24px 0; padding: 16px; background-color: #eff6ff; border-radius: 8px; border: 1px solid #3b82f6;">
        <div style="font-size: 14px; color: #1e40af; line-height: 1.6;">
          ${data.acknowledgmentNote}
        </div>
      </div>
      ` : ''}
      <p style="margin: 16px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        If you have questions about these changes, please contact us.
      </p>
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        ${safeFundName} Team
      </p>
    `)}
    `,
    'Important: Fund document amendment - ' + safeDocumentName
  );
};

// ============================================================
// 05.05.A1 — Material Event Notice
// ============================================================

/**
 * 05.05.A1 - Material Event Notice
 * Sent when a material event is published
 */
export const materialEventTemplate = (data: MaterialEventTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  // eventContent is HTML content, not escaped

  return baseTemplate(
    `
    ${header('Important Update', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <div style="margin: 16px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
        <div style="font-size: 16px; color: #374151; line-height: 1.6;">
          ${data.eventContent}
        </div>
      </div>
      ${primaryButton('View Details', data.detailsUrl)}
      <p style="margin: 16px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        If you have questions, please contact us.
      </p>
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        ${safeFundName} Team
      </p>
    `)}
    `,
    'Important update from ' + safeFundName
  );
};
