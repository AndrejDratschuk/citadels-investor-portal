/**
 * Document Email Templates
 * Templates for document approval, rejection, and DocuSign flows
 */

import { escapeHtml, baseTemplate, primaryButton, header, content, infoBox } from './baseTemplate';

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
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeDocumentName = escapeHtml(data.documentName);
  const safeDocumentType = escapeHtml(data.documentType);
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

export interface DocumentsApprovedDocuSignTemplateData {
  recipientName: string;
  fundName: string;
  docusignUrl: string;
  commitmentAmount?: string;
}

/**
 * Documents Approved + DocuSign Email
 * Sent when all documents are approved to request DocuSign signature
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

