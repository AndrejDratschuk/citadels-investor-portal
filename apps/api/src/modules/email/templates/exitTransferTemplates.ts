/**
 * Exit & Transfer Email Templates (Stage 06)
 * Templates for transfer requests, approvals, denials, and final exit statements
 */

import {
  escapeHtml,
  baseTemplate,
  header,
  content,
  infoBox,
  detailBox,
} from './baseTemplate';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface TransferRequestReceivedTemplateData {
  recipientName: string;
  fundName: string;
  transferType: 'full' | 'partial';
  reviewTimeframe: string;
  transferProcessNote: string;
}

export interface TransferApprovedTemplateData {
  recipientName: string;
  fundName: string;
  effectiveDate: string;
  transferNextSteps: string;
}

export interface TransferDeniedTemplateData {
  recipientName: string;
  fundName: string;
  denialReason: string;
  transferDenialOptions: string;
}

export interface FinalExitStatementTemplateData {
  recipientName: string;
  fundName: string;
  exitSummary: {
    totalInvested: string;
    totalDistributions: string;
    finalPayout: string;
    exitDate: string;
  };
  exitClosingMessage: string;
}

// ============================================================
// 06.01.A1 - TRANSFER REQUEST RECEIVED
// ============================================================

/**
 * Transfer Request Received Email
 * Sent when an investor submits a transfer request
 */
export const transferRequestReceivedTemplate = (
  data: TransferRequestReceivedTemplateData
): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeTransferType =
    data.transferType === 'full' ? 'Full Transfer' : 'Partial Transfer';
  const safeReviewTimeframe = escapeHtml(data.reviewTimeframe);
  const safeProcessNote = escapeHtml(data.transferProcessNote);

  return baseTemplate(
    `
    ${header('Transfer Request Received', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        We have received your request to transfer your interest in ${safeFundName}.
      </p>
      
      ${detailBox([{ label: 'Transfer Type', value: safeTransferType }])}
      
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        We will review your request and respond within <strong>${safeReviewTimeframe}</strong>.
      </p>
      
      ${safeProcessNote ? infoBox(safeProcessNote, 'info') : ''}
      
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
        If you have any questions in the meantime, please reply to this email.
      </p>
      <p style="margin: 16px 0 0 0; font-size: 16px; color: #374151;">
        <strong>${safeFundName} Team</strong>
      </p>
    `)}
    `,
    `Your transfer request for ${safeFundName} has been received`
  );
};

// ============================================================
// 06.01.A2 - TRANSFER APPROVED
// ============================================================

/**
 * Transfer Approved Email
 * Sent when manager approves a transfer request
 */
export const transferApprovedTemplate = (
  data: TransferApprovedTemplateData
): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeEffectiveDate = escapeHtml(data.effectiveDate);
  const safeNextSteps = escapeHtml(data.transferNextSteps);

  return baseTemplate(
    `
    ${header('Transfer Approved', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      
      ${infoBox('Your transfer request has been approved.', 'success')}
      
      ${detailBox([{ label: 'Effective Date', value: safeEffectiveDate }])}
      
      ${safeNextSteps ? `
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        ${safeNextSteps}
      </p>
      ` : ''}
      
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        If this is a full transfer, you will receive a final exit statement once the transfer is complete.
      </p>
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Thank you for your investment in ${safeFundName}.
      </p>
      <p style="margin: 16px 0 0 0; font-size: 16px; color: #374151;">
        <strong>${safeFundName} Team</strong>
      </p>
    `)}
    `,
    `Your transfer request for ${safeFundName} has been approved`
  );
};

// ============================================================
// 06.01.C1 - TRANSFER DENIED
// ============================================================

/**
 * Transfer Denied Email
 * Sent when manager denies a transfer request
 */
export const transferDeniedTemplate = (
  data: TransferDeniedTemplateData
): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeDenialReason = escapeHtml(data.denialReason);
  const safeDenialOptions = escapeHtml(data.transferDenialOptions);

  return baseTemplate(
    `
    ${header('Transfer Request Update', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        We have reviewed your transfer request and are unable to approve it at this time.
      </p>
      
      ${detailBox([{ label: 'Reason', value: safeDenialReason }])}
      
      ${safeDenialOptions ? `
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        ${safeDenialOptions}
      </p>
      ` : ''}
      
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
        If you have questions or would like to discuss alternative options, please reply to this email or contact us directly.
      </p>
      <p style="margin: 16px 0 0 0; font-size: 16px; color: #374151;">
        <strong>${safeFundName} Team</strong>
      </p>
    `)}
    `,
    `Update on your transfer request for ${safeFundName}`
  );
};

// ============================================================
// 06.02.A1 - FINAL EXIT STATEMENT
// ============================================================

/**
 * Final Exit Statement Email
 * Sent when an investor fully exits the fund
 */
export const finalExitStatementTemplate = (
  data: FinalExitStatementTemplateData
): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeTotalInvested = escapeHtml(data.exitSummary.totalInvested);
  const safeTotalDistributions = escapeHtml(data.exitSummary.totalDistributions);
  const safeFinalPayout = escapeHtml(data.exitSummary.finalPayout);
  const safeExitDate = escapeHtml(data.exitSummary.exitDate);
  const safeClosingMessage = escapeHtml(data.exitClosingMessage);

  return baseTemplate(
    `
    ${header('Final Statement', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Your investment in ${safeFundName} has been fully liquidated.
      </p>
      
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
        <tr>
          <td style="padding: 20px;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Exit Summary</p>
            <p style="margin: 0 0 8px 0; font-size: 16px; color: #111827;"><strong>Total Invested:</strong> $${safeTotalInvested}</p>
            <p style="margin: 0 0 8px 0; font-size: 16px; color: #111827;"><strong>Total Distributions:</strong> $${safeTotalDistributions}</p>
            <p style="margin: 0 0 8px 0; font-size: 16px; color: #111827;"><strong>Final Payout:</strong> $${safeFinalPayout}</p>
            <p style="margin: 0; font-size: 16px; color: #111827;"><strong>Exit Date:</strong> ${safeExitDate}</p>
          </td>
        </tr>
      </table>
      
      ${infoBox('Final K-1 documents will be provided following the applicable tax year.', 'info')}
      
      ${safeClosingMessage ? `
      <p style="margin: 16px 0 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
        ${safeClosingMessage}
      </p>
      ` : ''}
      
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Thank you for your investment in ${safeFundName}. We appreciate your partnership.
      </p>
      <p style="margin: 16px 0 0 0; font-size: 16px; color: #374151;">
        <strong>${safeFundName} Team</strong>
      </p>
    `)}
    `,
    `Final exit statement for your investment in ${safeFundName}`
  );
};
