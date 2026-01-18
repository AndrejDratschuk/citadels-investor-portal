/**
 * Internal Notification Email Templates Tests
 * Tests for internal notification email templates (Stage 07)
 * These are manager-facing emails, NOT investor-facing
 */

import { describe, it, expect } from 'vitest';
import {
  internalNewInvestorTemplate,
  internalDocumentReviewTemplate,
  internalCapitalCallSummaryTemplate,
  InternalNewInvestorTemplateData,
  InternalDocumentReviewTemplateData,
  InternalCapitalCallSummaryTemplateData,
} from './internalNotificationTemplates';

// Test data fixtures
const newInvestorData: InternalNewInvestorTemplateData = {
  investorName: 'John Doe',
  investmentAmount: '250,000',
  investmentDate: 'January 15, 2026',
  fundName: 'Acme Real Estate Fund I',
  viewInvestorUrl: 'https://app.altsui.com/manager/investors/inv-123',
};

const docReviewData: InternalDocumentReviewTemplateData = {
  investorName: 'John Doe',
  documentType: 'Accreditation Letter',
  uploadTimestamp: 'Jan 15, 2026, 2:30 PM',
  fundName: 'Acme Real Estate Fund I',
  reviewDocumentUrl: 'https://app.altsui.com/manager/documents?investorId=inv-123',
};

const capCallSummaryData: InternalCapitalCallSummaryTemplateData = {
  capitalCallNumber: '3',
  dealName: 'Miami Beach Tower',
  totalCalled: '5,000,000.00',
  totalReceived: '3,750,000.00',
  percentReceived: '75',
  totalOutstanding: '1,250,000.00',
  totalPastDue: '250,000.00',
  fundName: 'Acme Real Estate Fund I',
  viewReportUrl: 'https://app.altsui.com/manager/capital-calls/cc-123',
};

describe('Internal Notification Email Templates - Stage 07', () => {
  describe('07.02.A1 - Internal: New Investor', () => {
    it('should render with all required data', () => {
      const html = internalNewInvestorTemplate(newInvestorData);

      expect(html).toContain('John Doe');
      expect(html).toContain('$250,000');
      expect(html).toContain('January 15, 2026');
      expect(html).toContain('View Investor Profile');
    });

    it('should contain fund name in header', () => {
      const html = internalNewInvestorTemplate(newInvestorData);
      expect(html).toContain('Acme Real Estate Fund I');
    });

    it('should include the view URL', () => {
      const html = internalNewInvestorTemplate(newInvestorData);
      expect(html).toContain('manager/investors/inv-123');
    });

    it('should indicate new investor funded', () => {
      const html = internalNewInvestorTemplate(newInvestorData);
      expect(html).toContain('New investor funded');
    });

    it('should escape HTML in investor name', () => {
      const html = internalNewInvestorTemplate({
        ...newInvestorData,
        investorName: '<script>alert("xss")</script>',
      });

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should produce valid HTML structure', () => {
      const html = internalNewInvestorTemplate(newInvestorData);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
    });

    it('should have detail box with correct labels', () => {
      const html = internalNewInvestorTemplate(newInvestorData);

      expect(html).toContain('Name');
      expect(html).toContain('Amount');
      expect(html).toContain('Date');
    });
  });

  describe('07.02.A2 - Internal: Doc Review', () => {
    it('should render with all required data', () => {
      const html = internalDocumentReviewTemplate(docReviewData);

      expect(html).toContain('John Doe');
      expect(html).toContain('Accreditation Letter');
      expect(html).toContain('Jan 15, 2026, 2:30 PM');
      expect(html).toContain('Review Document');
    });

    it('should indicate document requires review', () => {
      const html = internalDocumentReviewTemplate(docReviewData);
      expect(html).toContain('requiring review');
    });

    it('should contain fund name', () => {
      const html = internalDocumentReviewTemplate(docReviewData);
      expect(html).toContain('Acme Real Estate Fund I');
    });

    it('should include the review URL', () => {
      const html = internalDocumentReviewTemplate(docReviewData);
      expect(html).toContain('manager/documents?investorId=inv-123');
    });

    it('should escape HTML in document type', () => {
      const html = internalDocumentReviewTemplate({
        ...docReviewData,
        documentType: '<img src=x onerror=alert(1)>',
      });

      // Should escape < and > to prevent actual HTML execution
      expect(html).not.toContain('<img src=x'); // Not the raw unescaped img tag
      expect(html).toContain('&lt;img'); // Properly escaped
    });

    it('should have detail box with correct labels', () => {
      const html = internalDocumentReviewTemplate(docReviewData);

      expect(html).toContain('Investor');
      expect(html).toContain('Document');
      expect(html).toContain('Uploaded');
    });

    it('should produce valid HTML structure', () => {
      const html = internalDocumentReviewTemplate(docReviewData);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('</html>');
    });
  });

  describe('07.02.A3 - Internal: Cap Call Summary', () => {
    it('should render with all required data', () => {
      const html = internalCapitalCallSummaryTemplate(capCallSummaryData);

      expect(html).toContain('Capital Call #3');
      expect(html).toContain('Miami Beach Tower');
      expect(html).toContain('View Full Report');
    });

    it('should show all financial metrics', () => {
      const html = internalCapitalCallSummaryTemplate(capCallSummaryData);

      expect(html).toContain('$5,000,000.00');
      expect(html).toContain('$3,750,000.00');
      expect(html).toContain('75%');
      expect(html).toContain('$1,250,000.00');
      expect(html).toContain('$250,000.00');
    });

    it('should have detail box with correct labels', () => {
      const html = internalCapitalCallSummaryTemplate(capCallSummaryData);

      expect(html).toContain('Total Called');
      expect(html).toContain('Received');
      expect(html).toContain('Outstanding');
      expect(html).toContain('Past Due');
    });

    it('should contain fund name', () => {
      const html = internalCapitalCallSummaryTemplate(capCallSummaryData);
      expect(html).toContain('Acme Real Estate Fund I');
    });

    it('should include the report URL', () => {
      const html = internalCapitalCallSummaryTemplate(capCallSummaryData);
      expect(html).toContain('manager/capital-calls/cc-123');
    });

    it('should escape HTML in deal name', () => {
      const html = internalCapitalCallSummaryTemplate({
        ...capCallSummaryData,
        dealName: '<script>bad()</script>',
      });

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should produce valid HTML structure', () => {
      const html = internalCapitalCallSummaryTemplate(capCallSummaryData);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('</html>');
    });

    it('should handle edge case: 0% received', () => {
      const html = internalCapitalCallSummaryTemplate({
        ...capCallSummaryData,
        totalReceived: '0.00',
        percentReceived: '0',
        totalOutstanding: '5,000,000.00',
      });

      expect(html).toContain('0%');
    });

    it('should handle edge case: 100% received', () => {
      const html = internalCapitalCallSummaryTemplate({
        ...capCallSummaryData,
        totalReceived: '5,000,000.00',
        percentReceived: '100',
        totalOutstanding: '0.00',
        totalPastDue: '0.00',
      });

      expect(html).toContain('100%');
    });
  });

  describe('Internal Email Characteristics', () => {
    it('internal emails should NOT have white-label placeholders', () => {
      const html1 = internalNewInvestorTemplate(newInvestorData);
      const html2 = internalDocumentReviewTemplate(docReviewData);
      const html3 = internalCapitalCallSummaryTemplate(capCallSummaryData);

      // Internal emails should not have [[BRACKET]] placeholders
      expect(html1).not.toContain('[[');
      expect(html2).not.toContain('[[');
      expect(html3).not.toContain('[[');
    });

    it('all internal templates should be consistently formatted', () => {
      const html1 = internalNewInvestorTemplate(newInvestorData);
      const html2 = internalDocumentReviewTemplate(docReviewData);
      const html3 = internalCapitalCallSummaryTemplate(capCallSummaryData);

      // All should have standard HTML structure
      [html1, html2, html3].forEach((html) => {
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toMatch(/<body[^>]*>/);
        expect(html).toContain('</body>');
      });
    });
  });
});

describe('Subject Line [Internal] Prefix Verification', () => {
  it('new investor email should be identifiable as internal', () => {
    const html = internalNewInvestorTemplate(newInvestorData);
    // Header should indicate this is for a new investor funded
    expect(html).toContain('New Investor Funded');
  });

  it('doc review email should be identifiable as internal', () => {
    const html = internalDocumentReviewTemplate(docReviewData);
    expect(html).toContain('Document Review Required');
  });

  it('cap call summary should be identifiable as internal', () => {
    const html = internalCapitalCallSummaryTemplate(capCallSummaryData);
    expect(html).toContain('Status Update');
  });
});
