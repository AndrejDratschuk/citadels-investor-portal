/**
 * Capital Call Email Templates
 * Templates for capital call requests, wire confirmations, and wire issues
 */

import { escapeHtml, baseTemplate, primaryButton, header, content, infoBox, detailBox } from './baseTemplate';

export interface CapitalCallRequestTemplateData {
  recipientName: string;
  fundName: string;
  dealName: string;
  amountDue: string;
  deadline: string;
  capitalCallNumber: string;
  wireInstructionsUrl: string;
  wireInstructions: {
    bankName: string;
    routingNumber: string;
    accountNumber: string;
    referenceCode: string;
  };
  purpose?: string;
}

/**
 * Capital Call Request Email
 * Sent to investors when a capital call is created
 */
export const capitalCallRequestTemplate = (data: CapitalCallRequestTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeDealName = escapeHtml(data.dealName);
  const safeAmount = escapeHtml(data.amountDue);
  const safeDeadline = escapeHtml(data.deadline);
  const safeCallNumber = escapeHtml(data.capitalCallNumber);
  const safeBankName = escapeHtml(data.wireInstructions.bankName);
  const safeRoutingNumber = escapeHtml(data.wireInstructions.routingNumber);
  const safeAccountNumber = escapeHtml(data.wireInstructions.accountNumber);
  const safeReferenceCode = escapeHtml(data.wireInstructions.referenceCode);
  const safePurpose = data.purpose ? escapeHtml(data.purpose) : undefined;
  
  return baseTemplate(
    `
    ${header('Capital Call Notice', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        A capital call has been issued for your investment in <strong>${safeDealName}</strong>.
      </p>
      
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0; background-color: #fef3c7; border-radius: 8px; border: 1px solid #fcd34d;">
        <tr>
          <td style="padding: 20px;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #92400e; font-weight: 600;">Capital Call Details:</p>
            <p style="margin: 0 0 4px 0; font-size: 20px; color: #111827;"><strong>Amount Due: $${safeAmount}</strong></p>
            <p style="margin: 0 0 4px 0; font-size: 16px; color: #111827;"><strong>Deadline:</strong> ${safeDeadline}</p>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">Capital Call #${safeCallNumber}</p>
          </td>
        </tr>
      </table>
      
      ${safePurpose ? `<p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;"><strong>Purpose:</strong> ${safePurpose}</p>` : ''}
      
      <p style="margin: 24px 0 8px 0; font-size: 16px; color: #374151; font-weight: 600;">Wire Instructions:</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 24px 0; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
        <tr>
          <td style="padding: 20px;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #111827;"><strong>Bank Name:</strong> ${safeBankName}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #111827;"><strong>Routing Number:</strong> ${safeRoutingNumber}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #111827;"><strong>Account Number:</strong> ${safeAccountNumber}</p>
            <p style="margin: 0; font-size: 14px; color: #111827;"><strong>Reference Code:</strong> <span style="background: #dbeafe; padding: 2px 8px; border-radius: 4px; font-family: monospace;">${safeReferenceCode}</span></p>
          </td>
        </tr>
      </table>
      
      ${infoBox('Please include the reference code in your wire transfer to ensure proper allocation.', 'warning')}
      
      ${primaryButton('View Wire Instructions', data.wireInstructionsUrl)}
      
      <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        If you have questions about this capital call, please contact your fund manager.
      </p>
    `)}
    `,
    `Capital Call Notice: $${safeAmount} due by ${safeDeadline}`
  );
};

export interface WireConfirmationTemplateData {
  recipientName: string;
  fundName: string;
  amountReceived: string;
  dateReceived: string;
  capitalCallNumber: string;
  confirmationNumber: string;
  dashboardUrl: string;
}

/**
 * Wire Confirmation Email
 * Sent when the fund manager confirms wire receipt
 */
export const wireConfirmationTemplate = (data: WireConfirmationTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeAmount = escapeHtml(data.amountReceived);
  const safeDate = escapeHtml(data.dateReceived);
  const safeCallNumber = escapeHtml(data.capitalCallNumber);
  const safeConfirmation = escapeHtml(data.confirmationNumber);
  
  return baseTemplate(
    `
    ${header('Wire Transfer Received', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      ${infoBox('Your wire transfer has been received. Thank you!', 'success')}
      
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0; background-color: #f0fdf4; border-radius: 8px; border: 1px solid #86efac;">
        <tr>
          <td style="padding: 20px;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #166534; font-weight: 600;">Payment Confirmation:</p>
            <p style="margin: 0 0 4px 0; font-size: 20px; color: #111827;"><strong>$${safeAmount}</strong></p>
            <p style="margin: 0 0 4px 0; font-size: 14px; color: #111827;"><strong>Date Received:</strong> ${safeDate}</p>
            <p style="margin: 0 0 4px 0; font-size: 14px; color: #111827;"><strong>Capital Call:</strong> #${safeCallNumber}</p>
            <p style="margin: 0; font-size: 14px; color: #6b7280;"><strong>Confirmation:</strong> ${safeConfirmation}</p>
          </td>
        </tr>
      </table>
      
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Your capital call is now complete. You can view your updated investment details in your dashboard.
      </p>
      
      ${primaryButton('View Investment Dashboard', data.dashboardUrl)}
      
      <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        Thank you for your continued investment.
      </p>
      <p style="margin: 16px 0 0 0; font-size: 16px; color: #374151;">Best regards,<br><strong>${safeFundName} Team</strong></p>
    `)}
    `,
    'Wire transfer received - Thank you'
  );
};

export interface WireIssueTemplateData {
  recipientName: string;
  fundName: string;
  issueDescription: string;
  expectedAmount?: string;
  receivedAmount?: string;
  capitalCallNumber: string;
  wireInstructionsUrl: string;
  managerContact?: string;
  wireInstructions: {
    bankName: string;
    routingNumber: string;
    accountNumber: string;
    referenceCode: string;
  };
}

/**
 * Wire Issue Email
 * Sent when there's a problem with a wire transfer
 */
export const wireIssueTemplate = (data: WireIssueTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeIssue = escapeHtml(data.issueDescription).replace(/\n/g, '<br>');
  const safeCallNumber = escapeHtml(data.capitalCallNumber);
  const safeExpected = data.expectedAmount ? escapeHtml(data.expectedAmount) : undefined;
  const safeReceived = data.receivedAmount ? escapeHtml(data.receivedAmount) : undefined;
  const safeManagerContact = data.managerContact ? escapeHtml(data.managerContact) : undefined;
  const safeBankName = escapeHtml(data.wireInstructions.bankName);
  const safeRoutingNumber = escapeHtml(data.wireInstructions.routingNumber);
  const safeAccountNumber = escapeHtml(data.wireInstructions.accountNumber);
  const safeReferenceCode = escapeHtml(data.wireInstructions.referenceCode);
  
  return baseTemplate(
    `
    ${header('Action Required - Wire Transfer Issue', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        We've identified an issue with your wire transfer for Capital Call #${safeCallNumber}.
      </p>
      
      ${infoBox(`<strong>Issue:</strong><br>${safeIssue}`, 'error')}
      
      ${safeExpected && safeReceived ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 16px 0; background-color: #fef2f2; border-radius: 8px; border: 1px solid #fecaca;">
        <tr>
          <td style="padding: 16px;">
            <p style="margin: 0 0 4px 0; font-size: 14px; color: #111827;"><strong>Expected Amount:</strong> $${safeExpected}</p>
            <p style="margin: 0; font-size: 14px; color: #111827;"><strong>Received Amount:</strong> $${safeReceived}</p>
          </td>
        </tr>
      </table>
      ` : ''}
      
      <p style="margin: 24px 0 8px 0; font-size: 16px; color: #374151; font-weight: 600;">Correct Wire Instructions:</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 24px 0; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
        <tr>
          <td style="padding: 20px;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #111827;"><strong>Bank Name:</strong> ${safeBankName}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #111827;"><strong>Routing Number:</strong> ${safeRoutingNumber}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #111827;"><strong>Account Number:</strong> ${safeAccountNumber}</p>
            <p style="margin: 0; font-size: 14px; color: #111827;"><strong>Reference Code:</strong> <span style="background: #dbeafe; padding: 2px 8px; border-radius: 4px; font-family: monospace;">${safeReferenceCode}</span></p>
          </td>
        </tr>
      </table>
      
      ${primaryButton('View Wire Instructions', data.wireInstructionsUrl)}
      
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Please contact us to resolve this issue as soon as possible.
      </p>
      ${safeManagerContact ? `<p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">Contact: ${safeManagerContact}</p>` : ''}
    `)}
    `,
    'Action Required: Wire transfer issue'
  );
};

