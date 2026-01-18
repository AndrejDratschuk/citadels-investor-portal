/**
 * Capital Call Email Templates
 * Templates for capital call requests, reminders, wire confirmations, 
 * past due notices, distributions, and refinancing
 */

import { escapeHtml, baseTemplate, primaryButton, secondaryButton, buttonRow, header, content, infoBox, detailBox } from './baseTemplate';

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

// ============================================================
// CAPITAL CALL REMINDER TEMPLATES
// ============================================================

export interface CapitalCallReminderTemplateData {
  recipientName: string;
  fundName: string;
  amountDue: string;
  deadline: string;
  capitalCallNumber: string;
  wireInstructionsUrl: string;
}

/**
 * 03.01.A2 - Capital Call Reminder (7 Day)
 * Sent 7 days before the capital call deadline
 */
export const capitalCallReminder7Template = (data: CapitalCallReminderTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeAmount = escapeHtml(data.amountDue);
  const safeDeadline = escapeHtml(data.deadline);
  const safeCallNumber = escapeHtml(data.capitalCallNumber);

  return baseTemplate(
    `
    ${header('Capital Call Reminder', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        This is a reminder that Capital Call #${safeCallNumber} is due in <strong>7 days</strong>.
      </p>
      
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0; background-color: #fef3c7; border-radius: 8px; border: 1px solid #fcd34d;">
        <tr>
          <td style="padding: 20px;">
            <p style="margin: 0 0 4px 0; font-size: 20px; color: #111827;"><strong>Amount Due: $${safeAmount}</strong></p>
            <p style="margin: 0; font-size: 16px; color: #111827;"><strong>Deadline:</strong> ${safeDeadline}</p>
          </td>
        </tr>
      </table>
      
      ${primaryButton('View Wire Instructions', data.wireInstructionsUrl)}
      
      <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        If you have any questions about the funding process, please contact us.
      </p>
      <p style="margin: 16px 0 0 0; font-size: 16px; color: #374151;">${safeFundName} Team</p>
    `)}
    `,
    `Capital Call Reminder - 7 Days Remaining`
  );
};

/**
 * 03.01.A3 - Capital Call Reminder (3 Day)
 * Sent 3 days before the capital call deadline
 */
export const capitalCallReminder3Template = (data: CapitalCallReminderTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeAmount = escapeHtml(data.amountDue);
  const safeDeadline = escapeHtml(data.deadline);
  const safeCallNumber = escapeHtml(data.capitalCallNumber);

  return baseTemplate(
    `
    ${header('Capital Call Reminder', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Capital Call #${safeCallNumber} is due in <strong>3 days</strong>.
      </p>
      
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0; background-color: #fef3c7; border-radius: 8px; border: 1px solid #fcd34d;">
        <tr>
          <td style="padding: 20px;">
            <p style="margin: 0 0 4px 0; font-size: 20px; color: #111827;"><strong>Amount Due: $${safeAmount}</strong></p>
            <p style="margin: 0; font-size: 16px; color: #111827;"><strong>Deadline:</strong> ${safeDeadline}</p>
          </td>
        </tr>
      </table>
      
      ${primaryButton('View Wire Instructions', data.wireInstructionsUrl)}
      
      <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        Please ensure your wire is initiated promptly to meet the deadline.
      </p>
      <p style="margin: 16px 0 0 0; font-size: 16px; color: #374151;">${safeFundName} Team</p>
    `)}
    `,
    `Capital Call Reminder - 3 Days Remaining`
  );
};

/**
 * 03.01.A4 - Capital Call Reminder (1 Day)
 * Sent 1 day before the capital call deadline
 */
export const capitalCallReminder1Template = (data: CapitalCallReminderTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeAmount = escapeHtml(data.amountDue);
  const safeDeadline = escapeHtml(data.deadline);
  const safeCallNumber = escapeHtml(data.capitalCallNumber);

  return baseTemplate(
    `
    ${header('REMINDER: Capital Call Due Tomorrow', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Capital Call #${safeCallNumber} is due <strong>tomorrow</strong>.
      </p>
      
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0; background-color: #fef3c7; border-radius: 8px; border: 1px solid #fcd34d;">
        <tr>
          <td style="padding: 20px;">
            <p style="margin: 0 0 4px 0; font-size: 20px; color: #111827;"><strong>Amount Due: $${safeAmount}</strong></p>
            <p style="margin: 0; font-size: 16px; color: #111827;"><strong>Deadline:</strong> ${safeDeadline}</p>
          </td>
        </tr>
      </table>
      
      ${primaryButton('View Wire Instructions', data.wireInstructionsUrl)}
      
      <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        If you've already initiated your wire, thank you. Please disregard this reminder.
      </p>
      <p style="margin: 16px 0 0 0; font-size: 16px; color: #374151;">${safeFundName} Team</p>
    `)}
    `,
    `REMINDER: Capital Call Due Tomorrow`
  );
};

// ============================================================
// PAST DUE AND DEFAULT TEMPLATES
// ============================================================

export interface CapitalCallPastDueTemplateData {
  recipientName: string;
  fundName: string;
  amountDue: string;
  deadline: string;
  daysPastDue: string;
  capitalCallNumber: string;
  wireInstructionsUrl: string;
  managerName: string;
  managerTitle: string;
}

/**
 * 03.01.B2 - Capital Call Past Due
 * Sent when the capital call deadline has passed and remains unpaid
 */
export const capitalCallPastDueTemplate = (data: CapitalCallPastDueTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeAmount = escapeHtml(data.amountDue);
  const safeDeadline = escapeHtml(data.deadline);
  const safeDaysPastDue = escapeHtml(data.daysPastDue);
  const safeCallNumber = escapeHtml(data.capitalCallNumber);
  const safeManagerName = escapeHtml(data.managerName);
  const safeManagerTitle = escapeHtml(data.managerTitle);

  return baseTemplate(
    `
    ${header('URGENT: Capital Call Past Due', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      
      ${infoBox(`Capital Call #${safeCallNumber} was due on ${safeDeadline} and remains unfunded.`, 'error')}
      
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0; background-color: #fef2f2; border-radius: 8px; border: 1px solid #fecaca;">
        <tr>
          <td style="padding: 20px;">
            <p style="margin: 0 0 4px 0; font-size: 20px; color: #991b1b;"><strong>Amount Due: $${safeAmount}</strong></p>
            <p style="margin: 0; font-size: 16px; color: #111827;"><strong>Days Past Due:</strong> ${safeDaysPastDue}</p>
          </td>
        </tr>
      </table>
      
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Per the Fund's governing documents, failure to fund capital calls may result in penalties including dilution of your interest.
      </p>
      
      <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6; font-weight: 600;">
        Please contact us immediately to discuss.
      </p>
      
      ${primaryButton('View Wire Instructions', data.wireInstructionsUrl)}
      
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        ${safeManagerName}<br>
        <span style="color: #6b7280;">${safeManagerTitle}</span>
      </p>
    `)}
    `,
    `URGENT: Capital Call Past Due`
  );
};

export interface CapitalCallPastDue7TemplateData {
  recipientName: string;
  fundName: string;
  amountDue: string;
  deadline: string;
  daysPastDue: string;
  capitalCallNumber: string;
  defaultSection: string;
  managerName: string;
  managerPhone: string;
}

/**
 * 03.01.B3 - Capital Call Past Due +7
 * Sent 7+ days after the capital call deadline has passed
 */
export const capitalCallPastDue7Template = (data: CapitalCallPastDue7TemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeAmount = escapeHtml(data.amountDue);
  const safeDeadline = escapeHtml(data.deadline);
  const safeDaysPastDue = escapeHtml(data.daysPastDue);
  const safeCallNumber = escapeHtml(data.capitalCallNumber);
  const safeDefaultSection = escapeHtml(data.defaultSection);
  const safeManagerName = escapeHtml(data.managerName);
  const safeManagerPhone = escapeHtml(data.managerPhone);

  return baseTemplate(
    `
    ${header('URGENT: Capital Call 7+ Days Past Due', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      
      ${infoBox(`Capital Call #${safeCallNumber} is now <strong>${safeDaysPastDue} days past due</strong>.`, 'error')}
      
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0; background-color: #fef2f2; border-radius: 8px; border: 1px solid #fecaca;">
        <tr>
          <td style="padding: 20px;">
            <p style="margin: 0 0 4px 0; font-size: 20px; color: #991b1b;"><strong>Amount Due: $${safeAmount}</strong></p>
            <p style="margin: 0; font-size: 16px; color: #111827;"><strong>Original Deadline:</strong> ${safeDeadline}</p>
          </td>
        </tr>
      </table>
      
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Per <strong>${safeDefaultSection}</strong> of the Operating Agreement, continued failure to fund may result in default proceedings and dilution of your interest.
      </p>
      
      <p style="margin: 0 0 24px 0; font-size: 16px; color: #991b1b; line-height: 1.6; font-weight: 600;">
        Please contact us immediately.
      </p>
      
      <p style="margin: 0; font-size: 16px; color: #374151;">
        ${safeManagerName}<br>
        <span style="color: #6b7280;">${safeManagerPhone}</span>
      </p>
    `)}
    `,
    `URGENT: Capital Call 7+ Days Past Due`
  );
};

export interface CapitalCallDefaultTemplateData {
  recipientName: string;
  fundName: string;
  amountDue: string;
  daysPastDue: string;
  capitalCallNumber: string;
  defaultSection: string;
  legalDefaultNoticeContent: string;
}

/**
 * 03.01.B4 - Capital Call Default Notice
 * Formal notice of default sent when manager initiates default proceedings
 */
export const capitalCallDefaultTemplate = (data: CapitalCallDefaultTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeAmount = escapeHtml(data.amountDue);
  const safeDaysPastDue = escapeHtml(data.daysPastDue);
  const safeCallNumber = escapeHtml(data.capitalCallNumber);
  const safeDefaultSection = escapeHtml(data.defaultSection);
  // Note: legalDefaultNoticeContent may contain HTML, so we don't escape it
  const legalContent = data.legalDefaultNoticeContent;

  return baseTemplate(
    `
    ${header('Notice of Default', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      
      ${infoBox(`This is formal notice that you are in default on Capital Call #${safeCallNumber} for ${safeFundName}.`, 'error')}
      
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0; background-color: #fef2f2; border-radius: 8px; border: 1px solid #fecaca;">
        <tr>
          <td style="padding: 20px;">
            <p style="margin: 0 0 4px 0; font-size: 20px; color: #991b1b;"><strong>Amount Due: $${safeAmount}</strong></p>
            <p style="margin: 0; font-size: 16px; color: #111827;"><strong>Days Past Due:</strong> ${safeDaysPastDue}</p>
          </td>
        </tr>
      </table>
      
      <div style="margin: 24px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
        ${legalContent}
      </div>
      
      <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        This notice is issued per <strong>${safeDefaultSection}</strong> of the Operating Agreement.
      </p>
      
      <p style="margin: 16px 0 0 0; font-size: 16px; color: #374151; font-weight: 600;">
        ${safeFundName} Management
      </p>
    `)}
    `,
    `Notice of Default - Capital Call #${safeCallNumber}`
  );
};

// ============================================================
// DISTRIBUTION TEMPLATES
// ============================================================

export interface DistributionNoticeTemplateData {
  recipientName: string;
  fundName: string;
  distributionAmount: string;
  distributionType: string;
  paymentDate: string;
  paymentMethod: string;
  distributionDetailsUrl: string;
}

/**
 * 03.02.A1 - Distribution Notice
 * Sent when a distribution has been approved
 */
export const distributionNoticeTemplate = (data: DistributionNoticeTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeAmount = escapeHtml(data.distributionAmount);
  const safeType = escapeHtml(data.distributionType);
  const safePaymentDate = escapeHtml(data.paymentDate);
  const safePaymentMethod = escapeHtml(data.paymentMethod);

  return baseTemplate(
    `
    ${header('Distribution Notice', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        A distribution has been approved for your investment in ${safeFundName}.
      </p>
      
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0; background-color: #f0fdf4; border-radius: 8px; border: 1px solid #86efac;">
        <tr>
          <td style="padding: 20px;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #166534; font-weight: 600;">Distribution Details:</p>
            <p style="margin: 0 0 4px 0; font-size: 20px; color: #111827;"><strong>$${safeAmount}</strong></p>
            <p style="margin: 0 0 4px 0; font-size: 14px; color: #111827;"><strong>Distribution Type:</strong> ${safeType}</p>
            <p style="margin: 0 0 4px 0; font-size: 14px; color: #111827;"><strong>Payment Date:</strong> ${safePaymentDate}</p>
            <p style="margin: 0; font-size: 14px; color: #111827;"><strong>Payment Method:</strong> ${safePaymentMethod}</p>
          </td>
        </tr>
      </table>
      
      ${primaryButton('View Distribution Details', data.distributionDetailsUrl)}
      
      <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        Please consult your tax advisor regarding the tax treatment of this distribution.
      </p>
      <p style="margin: 16px 0 0 0; font-size: 16px; color: #374151;">${safeFundName} Team</p>
    `)}
    `,
    `Distribution Notice`
  );
};

export interface DistributionSentTemplateData {
  recipientName: string;
  fundName: string;
  distributionAmount: string;
  dateSent: string;
  paymentMethod: string;
  confirmationNumber: string;
  arrivalTimeframe: string;
  portalUrl: string;
}

/**
 * 03.02.A2 - Distribution Sent
 * Sent when the distribution wire/ACH has been initiated
 */
export const distributionSentTemplate = (data: DistributionSentTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeAmount = escapeHtml(data.distributionAmount);
  const safeDateSent = escapeHtml(data.dateSent);
  const safePaymentMethod = escapeHtml(data.paymentMethod);
  const safeConfirmation = escapeHtml(data.confirmationNumber);
  const safeArrivalTimeframe = escapeHtml(data.arrivalTimeframe);

  return baseTemplate(
    `
    ${header('Distribution Sent', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      
      ${infoBox('Your distribution has been sent.', 'success')}
      
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0; background-color: #f0fdf4; border-radius: 8px; border: 1px solid #86efac;">
        <tr>
          <td style="padding: 20px;">
            <p style="margin: 0 0 4px 0; font-size: 20px; color: #111827;"><strong>$${safeAmount}</strong></p>
            <p style="margin: 0 0 4px 0; font-size: 14px; color: #111827;"><strong>Date Sent:</strong> ${safeDateSent}</p>
            <p style="margin: 0 0 4px 0; font-size: 14px; color: #111827;"><strong>Method:</strong> ${safePaymentMethod}</p>
            <p style="margin: 0; font-size: 14px; color: #6b7280;"><strong>Confirmation:</strong> ${safeConfirmation}</p>
          </td>
        </tr>
      </table>
      
      <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Funds should arrive within <strong>${safeArrivalTimeframe}</strong>.
      </p>
      
      ${primaryButton('View in Portal', data.portalUrl)}
      
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">${safeFundName} Team</p>
    `)}
    `,
    `Distribution Sent`
  );
};

export interface DistributionElectionTemplateData {
  recipientName: string;
  fundName: string;
  eligibleAmount: string;
  source: string;
  electionDeadline: string;
  receiveDistributionUrl: string;
  reinvestUrl: string;
}

/**
 * 03.02.B1 - Distribution Election Request
 * Sent when proceeds require investor election (distribute vs reinvest)
 */
export const distributionElectionTemplate = (data: DistributionElectionTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeAmount = escapeHtml(data.eligibleAmount);
  const safeSource = escapeHtml(data.source);
  const safeDeadline = escapeHtml(data.electionDeadline);

  return baseTemplate(
    `
    ${header('Distribution Election Required', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Proceeds of <strong>$${safeAmount}</strong> are available from ${safeSource}.
      </p>
      
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Please elect how you would like to handle these proceeds:
      </p>
      
      ${buttonRow([
        { text: 'Receive Distribution', url: data.receiveDistributionUrl, variant: 'primary' },
        { text: 'Reinvest in Fund', url: data.reinvestUrl, variant: 'secondary' },
      ])}
      
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0; background-color: #fef3c7; border-radius: 8px; border: 1px solid #fcd34d;">
        <tr>
          <td style="padding: 16px;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              <strong>Election Deadline:</strong> ${safeDeadline}
            </p>
          </td>
        </tr>
      </table>
      
      <p style="margin: 0 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        If no election is made by the deadline, the default election per your subscription agreement will apply.
      </p>
      <p style="margin: 16px 0 0 0; font-size: 16px; color: #374151;">${safeFundName} Team</p>
    `)}
    `,
    `Distribution Election Required`
  );
};

// ============================================================
// REFINANCE TEMPLATE
// ============================================================

export interface RefinanceNoticeTemplateData {
  recipientName: string;
  fundName: string;
  propertyName: string;
  refinanceSummary: string;
  propertyDetailsUrl: string;
}

/**
 * 03.03.A1 - Refinance Notice
 * Sent when a refinance has been completed
 */
export const refinanceNoticeTemplate = (data: RefinanceNoticeTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safePropertyName = escapeHtml(data.propertyName);
  // Note: refinanceSummary may contain HTML, so we don't escape it
  const refinanceSummary = data.refinanceSummary;

  return baseTemplate(
    `
    ${header('Refinance Completed', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        The refinance of <strong>${safePropertyName}</strong> has been completed.
      </p>
      
      <div style="margin: 24px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
        ${refinanceSummary}
      </div>
      
      <p style="margin: 0 0 24px 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        You will be notified separately regarding any distribution elections if proceeds are available.
      </p>
      
      ${primaryButton('View Property Details', data.propertyDetailsUrl)}
      
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">${safeFundName} Team</p>
    `)}
    `,
    `Refinance Completed - ${safePropertyName}`
  );
};

