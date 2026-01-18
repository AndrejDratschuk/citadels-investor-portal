/**
 * Reporting & Tax Email Templates
 * Templates for quarterly/annual reports, meeting invites, property updates, and K-1 documents
 */

import { escapeHtml, baseTemplate, primaryButton, header, content, infoBox } from './baseTemplate';

// ============================================================
// PERIODIC REPORTS
// ============================================================

export interface QuarterlyReportTemplateData {
  recipientName: string;
  fundName: string;
  quarter: string;
  year: string;
  reportUrl: string;
  reportSummary?: string; // HTML content - already safe
}

/**
 * 04.01.A1 - Quarterly Report
 * Sent when Q+30 days per PPM (quarterly report published)
 */
export const quarterlyReportTemplate = (data: QuarterlyReportTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeQuarter = escapeHtml(data.quarter);
  const safeYear = escapeHtml(data.year);
  // reportSummary is HTML content from database, not escaped

  return baseTemplate(
    `
    ${header(`Q${safeQuarter} ${safeYear} Report Available`, safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Your Q${safeQuarter} ${safeYear} performance report is now available in your portal.
      </p>
      
      ${primaryButton('View Quarterly Report', data.reportUrl)}
      
      ${data.reportSummary ? `
      <div style="margin: 24px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
        ${data.reportSummary}
      </div>
      ` : ''}
      
      <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        If you have any questions about the report, please reply to this email.
      </p>
      <p style="margin: 16px 0 0 0; font-size: 16px; color: #374151;">${safeFundName} Team</p>
    `)}
    `,
    `Q${safeQuarter} ${safeYear} Report Available`
  );
};

export interface AnnualReportTemplateData {
  recipientName: string;
  fundName: string;
  year: string;
  reportUrl: string;
  reportSummary?: string; // HTML content - already safe
}

/**
 * 04.02.A1 - Annual Report
 * Sent when annual report is published
 */
export const annualReportTemplate = (data: AnnualReportTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeYear = escapeHtml(data.year);

  return baseTemplate(
    `
    ${header(`${safeYear} Annual Report Available`, safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        The ${safeYear} Annual Report for ${safeFundName} is now available in your portal.
      </p>
      
      ${primaryButton('View Annual Report', data.reportUrl)}
      
      ${data.reportSummary ? `
      <div style="margin: 24px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
        ${data.reportSummary}
      </div>
      ` : ''}
      
      <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        If you have any questions, please don't hesitate to reach out.
      </p>
      <p style="margin: 16px 0 0 0; font-size: 16px; color: #374151;">${safeFundName} Team</p>
    `)}
    `,
    `${safeYear} Annual Report Available`
  );
};

export interface AnnualMeetingInviteTemplateData {
  recipientName: string;
  fundName: string;
  year: string;
  meetingDate: string;
  meetingTime: string;
  timezone: string;
  meetingFormat: string;
  rsvpUrl: string;
  agendaPreview?: string; // HTML content - already safe
}

/**
 * 04.03.A1 - Annual Meeting Invite
 * Sent when manager schedules the annual investor meeting
 */
export const annualMeetingInviteTemplate = (data: AnnualMeetingInviteTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeYear = escapeHtml(data.year);
  const safeMeetingDate = escapeHtml(data.meetingDate);
  const safeMeetingTime = escapeHtml(data.meetingTime);
  const safeTimezone = escapeHtml(data.timezone);
  const safeMeetingFormat = escapeHtml(data.meetingFormat);

  return baseTemplate(
    `
    ${header('Annual Investor Meeting Invitation', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        You are invited to the ${safeYear} Annual Investor Meeting for ${safeFundName}.
      </p>
      
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0; background-color: #eff6ff; border-radius: 8px; border: 1px solid #3b82f6;">
        <tr>
          <td style="padding: 20px;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #1e40af; font-weight: 600;">Meeting Details:</p>
            <p style="margin: 0 0 4px 0; font-size: 16px; color: #111827;"><strong>Date:</strong> ${safeMeetingDate}</p>
            <p style="margin: 0 0 4px 0; font-size: 16px; color: #111827;"><strong>Time:</strong> ${safeMeetingTime} ${safeTimezone}</p>
            <p style="margin: 0; font-size: 16px; color: #111827;"><strong>Format:</strong> ${safeMeetingFormat}</p>
          </td>
        </tr>
      </table>
      
      ${data.agendaPreview ? `
      <div style="margin: 24px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Agenda Preview:</p>
        ${data.agendaPreview}
      </div>
      ` : ''}
      
      ${primaryButton('RSVP Now', data.rsvpUrl)}
      
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
        We look forward to providing you with a comprehensive update on the fund's performance and outlook.
      </p>
      <p style="margin: 16px 0 0 0; font-size: 16px; color: #374151;">${safeFundName} Team</p>
    `)}
    `,
    `Annual Investor Meeting Invitation - ${safeYear}`
  );
};

// ============================================================
// PROPERTY UPDATES
// ============================================================

export interface PropertyAcquisitionTemplateData {
  recipientName: string;
  fundName: string;
  propertyName: string;
  propertyDetailsUrl: string;
  acquisitionSummary?: string; // HTML content - already safe
}

/**
 * 04.04.A1 - Property Acquisition
 * Sent when acquisition closes
 */
export const propertyAcquisitionTemplate = (data: PropertyAcquisitionTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safePropertyName = escapeHtml(data.propertyName);

  return baseTemplate(
    `
    ${header('New Acquisition', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        We are pleased to announce the acquisition of <strong>${safePropertyName}</strong>.
      </p>
      
      ${data.acquisitionSummary ? `
      <div style="margin: 24px 0; padding: 20px; background-color: #f0fdf4; border-radius: 8px; border: 1px solid #86efac;">
        ${data.acquisitionSummary}
      </div>
      ` : ''}
      
      ${primaryButton('View Property Details', data.propertyDetailsUrl)}
      
      <p style="margin: 24px 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        This acquisition aligns with our investment strategy and we look forward to executing our value-add business plan.
      </p>
      
      <p style="margin: 0 0 0 0; font-size: 12px; color: #6b7280; line-height: 1.6; font-style: italic;">
        Past performance is not indicative of future results. Please refer to the PPM for complete risk disclosures.
      </p>
      <p style="margin: 16px 0 0 0; font-size: 16px; color: #374151;">${safeFundName} Team</p>
    `)}
    `,
    `New Acquisition: ${safePropertyName}`
  );
};

export interface PropertyDispositionTemplateData {
  recipientName: string;
  fundName: string;
  propertyName: string;
  detailsUrl: string;
  dispositionSummary?: string; // HTML content - already safe
}

/**
 * 04.04.A2 - Property Disposition
 * Sent when sale closes
 */
export const propertyDispositionTemplate = (data: PropertyDispositionTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safePropertyName = escapeHtml(data.propertyName);

  return baseTemplate(
    `
    ${header('Property Sale Completed', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        We have completed the sale of <strong>${safePropertyName}</strong>.
      </p>
      
      ${data.dispositionSummary ? `
      <div style="margin: 24px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
        ${data.dispositionSummary}
      </div>
      ` : ''}
      
      ${primaryButton('View Details', data.detailsUrl)}
      
      <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        Distribution information will follow separately. You may receive an election request if proceeds are available for distribution or reinvestment.
      </p>
      <p style="margin: 16px 0 0 0; font-size: 16px; color: #374151;">${safeFundName} Team</p>
    `)}
    `,
    `Property Sale Completed: ${safePropertyName}`
  );
};

// ============================================================
// TAX DOCUMENTS
// ============================================================

export interface K1AvailableTemplateData {
  recipientName: string;
  fundName: string;
  taxYear: string;
  downloadUrl: string;
}

/**
 * 04.05.A1 - K-1 Available
 * Sent when K-1 is uploaded to portal
 */
export const k1AvailableTemplate = (data: K1AvailableTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeTaxYear = escapeHtml(data.taxYear);

  return baseTemplate(
    `
    ${header(`${safeTaxYear} Schedule K-1 Available`, safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Your ${safeTaxYear} Schedule K-1 for ${safeFundName} is now available in your portal.
      </p>
      
      ${primaryButton('Download K-1', data.downloadUrl)}
      
      <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        Please forward this document to your tax advisor for inclusion in your tax filings. If you have questions about the K-1, please consult with your tax professional.
      </p>
      <p style="margin: 16px 0 0 0; font-size: 16px; color: #374151;">${safeFundName} Team</p>
    `)}
    `,
    `${safeTaxYear} Schedule K-1 Available`
  );
};

export interface K1EstimateTemplateData {
  recipientName: string;
  fundName: string;
  taxYear: string;
  expectedFinalDate: string;
  estimateUrl: string;
}

/**
 * 04.05.B1 - K-1 Estimate
 * Sent when estimate is ready (final delayed)
 */
export const k1EstimateTemplate = (data: K1EstimateTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeTaxYear = escapeHtml(data.taxYear);
  const safeExpectedFinalDate = escapeHtml(data.expectedFinalDate);

  return baseTemplate(
    `
    ${header(`${safeTaxYear} K-1 Estimate Available`, safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Preliminary K-1 estimates for ${safeTaxYear} are now available for tax planning purposes.
      </p>
      
      ${primaryButton('View K-1 Estimate', data.estimateUrl)}
      
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0; background-color: #eff6ff; border-radius: 8px; border: 1px solid #3b82f6;">
        <tr>
          <td style="padding: 16px;">
            <p style="margin: 0; font-size: 14px; color: #1e40af;">
              <strong>Final K-1s are expected by ${safeExpectedFinalDate}.</strong>
            </p>
          </td>
        </tr>
      </table>
      
      ${infoBox('This is an estimate only and should not be used for filing purposes. Final K-1 figures may differ. Consult your tax advisor before using these estimates.', 'warning')}
      
      <p style="margin: 16px 0 0 0; font-size: 16px; color: #374151;">${safeFundName} Team</p>
    `)}
    `,
    `${safeTaxYear} K-1 Estimate Available`
  );
};

export interface K1AmendedTemplateData {
  recipientName: string;
  fundName: string;
  taxYear: string;
  amendmentReason: string;
  downloadUrl: string;
}

/**
 * 04.05.B2 - K-1 Amended
 * Sent when amended K-1 is issued
 */
export const k1AmendedTemplate = (data: K1AmendedTemplateData): string => {
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeTaxYear = escapeHtml(data.taxYear);
  const safeAmendmentReason = escapeHtml(data.amendmentReason);

  return baseTemplate(
    `
    ${header(`Amended ${safeTaxYear} Schedule K-1`, safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeRecipientName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        An amended Schedule K-1 for ${safeTaxYear} has been issued for your investment in ${safeFundName}.
      </p>
      
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0; background-color: #fef3c7; border-radius: 8px; border: 1px solid #fcd34d;">
        <tr>
          <td style="padding: 16px;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              <strong>Reason:</strong> ${safeAmendmentReason}
            </p>
          </td>
        </tr>
      </table>
      
      ${primaryButton('Download Amended K-1', data.downloadUrl)}
      
      ${infoBox('Please consult your tax advisor regarding any impact on your tax filings. If you have already filed, you may need to file an amended return.', 'warning')}
      
      <p style="margin: 16px 0 0 0; font-size: 16px; color: #374151;">${safeFundName} Team</p>
    `)}
    `,
    `Amended ${safeTaxYear} Schedule K-1`
  );
};
