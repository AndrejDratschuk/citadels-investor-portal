/**
 * Internal Notification Email Templates (Stage 07)
 * Templates for internal team notifications - NOT white-labeled
 * Subject lines use [Internal] prefix for easy filtering
 */

import { escapeHtml, baseTemplate, primaryButton, header, content, detailBox } from './baseTemplate';

// ============================================================
// 07.02.A1 - Internal: New Investor
// ============================================================

export interface InternalNewInvestorTemplateData {
  investorName: string;
  investmentAmount: string;
  investmentDate: string;
  fundName: string;
  viewInvestorUrl: string;
}

/**
 * Internal New Investor Email (07.02.A1)
 * Sent to all fund managers when funding is received and investor converts
 */
export const internalNewInvestorTemplate = (data: InternalNewInvestorTemplateData): string => {
  const safeInvestorName = escapeHtml(data.investorName);
  const safeAmount = escapeHtml(data.investmentAmount);
  const safeDate = escapeHtml(data.investmentDate);
  const safeFundName = escapeHtml(data.fundName);

  return baseTemplate(
    `
    ${header('New Investor Funded', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        New investor funded:
      </p>
      ${detailBox([
        { label: 'Name', value: safeInvestorName },
        { label: 'Amount', value: `$${safeAmount}` },
        { label: 'Date', value: safeDate },
      ])}
      ${primaryButton('View Investor Profile', data.viewInvestorUrl)}
    `)}
    `,
    `New investor ${safeInvestorName} has funded their investment`
  );
};

// ============================================================
// 07.02.A2 - Internal: Doc Review
// ============================================================

export interface InternalDocumentReviewTemplateData {
  investorName: string;
  documentType: string;
  uploadTimestamp: string;
  fundName: string;
  reviewDocumentUrl: string;
}

/**
 * Internal Document Review Email (07.02.A2)
 * Sent to all fund managers when a document is uploaded requiring review
 */
export const internalDocumentReviewTemplate = (data: InternalDocumentReviewTemplateData): string => {
  const safeInvestorName = escapeHtml(data.investorName);
  const safeDocumentType = escapeHtml(data.documentType);
  const safeTimestamp = escapeHtml(data.uploadTimestamp);
  const safeFundName = escapeHtml(data.fundName);

  return baseTemplate(
    `
    ${header('Document Review Required', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Document uploaded requiring review:
      </p>
      ${detailBox([
        { label: 'Investor', value: safeInvestorName },
        { label: 'Document', value: safeDocumentType },
        { label: 'Uploaded', value: safeTimestamp },
      ])}
      ${primaryButton('Review Document', data.reviewDocumentUrl)}
    `)}
    `,
    `${safeInvestorName} uploaded a ${safeDocumentType} for review`
  );
};

// ============================================================
// 07.02.A3 - Internal: Cap Call Summary
// ============================================================

export interface InternalCapitalCallSummaryTemplateData {
  capitalCallNumber: string;
  dealName: string;
  totalCalled: string;
  totalReceived: string;
  percentReceived: string;
  totalOutstanding: string;
  totalPastDue: string;
  fundName: string;
  viewReportUrl: string;
}

/**
 * Internal Capital Call Summary Email (07.02.A3)
 * Sent daily or weekly to fund managers during an active capital call period
 */
export const internalCapitalCallSummaryTemplate = (data: InternalCapitalCallSummaryTemplateData): string => {
  const safeCallNumber = escapeHtml(data.capitalCallNumber);
  const safeDealName = escapeHtml(data.dealName);
  const safeFundName = escapeHtml(data.fundName);

  return baseTemplate(
    `
    ${header(`Capital Call #${safeCallNumber} Status Update`, safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Capital Call #${safeCallNumber} - ${safeDealName}
      </p>
      ${detailBox([
        { label: 'Total Called', value: `$${escapeHtml(data.totalCalled)}` },
        { label: 'Received', value: `$${escapeHtml(data.totalReceived)} (${escapeHtml(data.percentReceived)}%)` },
        { label: 'Outstanding', value: `$${escapeHtml(data.totalOutstanding)}` },
        { label: 'Past Due', value: `$${escapeHtml(data.totalPastDue)}` },
      ])}
      ${primaryButton('View Full Report', data.viewReportUrl)}
    `)}
    `,
    `Capital Call #${safeCallNumber} status: ${escapeHtml(data.percentReceived)}% received`
  );
};
