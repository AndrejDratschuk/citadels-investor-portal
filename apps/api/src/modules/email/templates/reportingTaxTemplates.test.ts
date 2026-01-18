/**
 * Tests for Reporting & Tax Email Templates (Stage 04)
 */

import { describe, it, expect } from 'vitest';
import {
  quarterlyReportTemplate,
  annualReportTemplate,
  annualMeetingInviteTemplate,
  propertyAcquisitionTemplate,
  propertyDispositionTemplate,
  k1AvailableTemplate,
  k1EstimateTemplate,
  k1AmendedTemplate,
} from './reportingTaxTemplates';

// ============================================================
// PERIODIC REPORTS
// ============================================================

describe('quarterlyReportTemplate', () => {
  it('renders the quarterly report template correctly', () => {
    const data = {
      recipientName: 'John Smith',
      fundName: 'Alpha Growth Fund',
      quarter: '1',
      year: '2026',
      reportUrl: 'https://portal.example.com/reports/123',
    };

    const html = quarterlyReportTemplate(data);

    expect(html).toContain('Q1 2026 Report Available');
    expect(html).toContain('Hi John Smith,');
    expect(html).toContain('Alpha Growth Fund');
    expect(html).toContain('Q1 2026 performance report');
    expect(html).toContain('View Quarterly Report');
    expect(html).toContain('https://portal.example.com/reports/123');
    expect(html).toContain('reply to this email');
  });

  it('renders with optional report summary', () => {
    const data = {
      recipientName: 'Jane Doe',
      fundName: 'Beta Fund',
      quarter: '2',
      year: '2025',
      reportUrl: 'https://portal.example.com/reports/456',
      reportSummary: '<p>Strong performance this quarter with 12% returns.</p>',
    };

    const html = quarterlyReportTemplate(data);

    expect(html).toContain('Strong performance this quarter with 12% returns.');
  });

  it('escapes HTML in user-provided fields', () => {
    const data = {
      recipientName: '<script>alert("xss")</script>',
      fundName: 'Test<Fund>',
      quarter: '3',
      year: '2026',
      reportUrl: 'https://portal.example.com/reports/789',
    };

    const html = quarterlyReportTemplate(data);

    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('Test&lt;Fund&gt;');
    expect(html).not.toContain('<script>alert("xss")</script>');
  });
});

describe('annualReportTemplate', () => {
  it('renders the annual report template correctly', () => {
    const data = {
      recipientName: 'John Smith',
      fundName: 'Alpha Growth Fund',
      year: '2025',
      reportUrl: 'https://portal.example.com/reports/annual-2025',
    };

    const html = annualReportTemplate(data);

    expect(html).toContain('2025 Annual Report Available');
    expect(html).toContain('Hi John Smith,');
    expect(html).toContain('Alpha Growth Fund');
    expect(html).toContain('View Annual Report');
    expect(html).toContain('https://portal.example.com/reports/annual-2025');
    expect(html).toContain("don't hesitate");
  });

  it('renders with optional report summary', () => {
    const data = {
      recipientName: 'Jane Doe',
      fundName: 'Beta Fund',
      year: '2025',
      reportUrl: 'https://portal.example.com/reports/annual',
      reportSummary: '<ul><li>Total return: 18%</li><li>Distributions: $2.5M</li></ul>',
    };

    const html = annualReportTemplate(data);

    expect(html).toContain('Total return: 18%');
    expect(html).toContain('Distributions: $2.5M');
  });
});

describe('annualMeetingInviteTemplate', () => {
  it('renders the annual meeting invite template correctly', () => {
    const data = {
      recipientName: 'John Smith',
      fundName: 'Alpha Growth Fund',
      year: '2026',
      meetingDate: 'March 15, 2026',
      meetingTime: '2:00 PM',
      timezone: 'EST',
      meetingFormat: 'Virtual',
      rsvpUrl: 'https://portal.example.com/meetings/123/rsvp',
    };

    const html = annualMeetingInviteTemplate(data);

    expect(html).toContain('Annual Investor Meeting Invitation');
    expect(html).toContain('Hi John Smith,');
    expect(html).toContain('2026 Annual Investor Meeting');
    expect(html).toContain('Alpha Growth Fund');
    expect(html).toContain('March 15, 2026');
    expect(html).toContain('2:00 PM');
    expect(html).toContain('EST');
    expect(html).toContain('Virtual');
    expect(html).toContain('RSVP Now');
    expect(html).toContain('https://portal.example.com/meetings/123/rsvp');
    expect(html).toContain('comprehensive update');
  });

  it('renders with optional agenda preview', () => {
    const data = {
      recipientName: 'Jane Doe',
      fundName: 'Beta Fund',
      year: '2026',
      meetingDate: 'April 1, 2026',
      meetingTime: '10:00 AM',
      timezone: 'PST',
      meetingFormat: 'In Person',
      rsvpUrl: 'https://portal.example.com/meetings/456/rsvp',
      agendaPreview: '<ol><li>Welcome</li><li>Performance Review</li><li>Q&A</li></ol>',
    };

    const html = annualMeetingInviteTemplate(data);

    expect(html).toContain('Agenda Preview');
    expect(html).toContain('Welcome');
    expect(html).toContain('Performance Review');
  });

  it('escapes HTML in meeting details', () => {
    const data = {
      recipientName: 'Test User',
      fundName: 'Test<Fund>',
      year: '2026',
      meetingDate: 'Date<script>',
      meetingTime: '10:00 AM',
      timezone: 'UTC',
      meetingFormat: 'Virtual',
      rsvpUrl: 'https://example.com',
    };

    const html = annualMeetingInviteTemplate(data);

    expect(html).toContain('Date&lt;script&gt;');
    expect(html).toContain('Test&lt;Fund&gt;');
  });
});

// ============================================================
// PROPERTY UPDATES
// ============================================================

describe('propertyAcquisitionTemplate', () => {
  it('renders the property acquisition template correctly', () => {
    const data = {
      recipientName: 'John Smith',
      fundName: 'Real Estate Fund I',
      propertyName: '123 Main Street',
      propertyDetailsUrl: 'https://portal.example.com/deals/abc',
    };

    const html = propertyAcquisitionTemplate(data);

    expect(html).toContain('New Acquisition');
    expect(html).toContain('Hi John Smith,');
    expect(html).toContain('pleased to announce the acquisition');
    expect(html).toContain('<strong>123 Main Street</strong>');
    expect(html).toContain('View Property Details');
    expect(html).toContain('https://portal.example.com/deals/abc');
    expect(html).toContain('value-add business plan');
    expect(html).toContain('Past performance is not indicative');
    expect(html).toContain('PPM');
  });

  it('renders with optional acquisition summary', () => {
    const data = {
      recipientName: 'Jane Doe',
      fundName: 'Fund II',
      propertyName: 'Sunset Tower',
      propertyDetailsUrl: 'https://example.com/deals/123',
      acquisitionSummary: '<p>Purchase Price: $25M</p><p>Cap Rate: 6.5%</p>',
    };

    const html = propertyAcquisitionTemplate(data);

    expect(html).toContain('Purchase Price: $25M');
    expect(html).toContain('Cap Rate: 6.5%');
  });

  it('escapes HTML in property name', () => {
    const data = {
      recipientName: 'User',
      fundName: 'Fund',
      propertyName: '<script>alert("xss")</script>',
      propertyDetailsUrl: 'https://example.com',
    };

    const html = propertyAcquisitionTemplate(data);

    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>alert');
  });
});

describe('propertyDispositionTemplate', () => {
  it('renders the property disposition template correctly', () => {
    const data = {
      recipientName: 'John Smith',
      fundName: 'Real Estate Fund I',
      propertyName: '456 Oak Avenue',
      detailsUrl: 'https://portal.example.com/deals/xyz',
    };

    const html = propertyDispositionTemplate(data);

    expect(html).toContain('Property Sale Completed');
    expect(html).toContain('Hi John Smith,');
    expect(html).toContain('completed the sale');
    expect(html).toContain('<strong>456 Oak Avenue</strong>');
    expect(html).toContain('View Details');
    expect(html).toContain('https://portal.example.com/deals/xyz');
    expect(html).toContain('Distribution information will follow separately');
    expect(html).toContain('election request');
  });

  it('renders with optional disposition summary', () => {
    const data = {
      recipientName: 'Jane Doe',
      fundName: 'Fund II',
      propertyName: 'Harbor View',
      detailsUrl: 'https://example.com/deals/456',
      dispositionSummary: '<p>Sale Price: $35M</p><p>IRR: 22%</p><p>Equity Multiple: 2.1x</p>',
    };

    const html = propertyDispositionTemplate(data);

    expect(html).toContain('Sale Price: $35M');
    expect(html).toContain('IRR: 22%');
    expect(html).toContain('Equity Multiple: 2.1x');
  });
});

// ============================================================
// TAX DOCUMENTS
// ============================================================

describe('k1AvailableTemplate', () => {
  it('renders the K-1 available template correctly', () => {
    const data = {
      recipientName: 'John Smith',
      fundName: 'Alpha Growth Fund',
      taxYear: '2025',
      downloadUrl: 'https://portal.example.com/documents/k1-123/download',
    };

    const html = k1AvailableTemplate(data);

    expect(html).toContain('2025 Schedule K-1 Available');
    expect(html).toContain('Hi John Smith,');
    expect(html).toContain('2025 Schedule K-1');
    expect(html).toContain('Alpha Growth Fund');
    expect(html).toContain('Download K-1');
    expect(html).toContain('https://portal.example.com/documents/k1-123/download');
    expect(html).toContain('forward this document to your tax advisor');
    expect(html).toContain('tax professional');
  });

  it('escapes HTML in all fields', () => {
    const data = {
      recipientName: '<img src=x onerror=alert(1)>',
      fundName: 'Fund & <Partners>',
      taxYear: '2025',
      downloadUrl: 'https://example.com',
    };

    const html = k1AvailableTemplate(data);

    expect(html).toContain('&lt;img');
    expect(html).toContain('Fund &amp;');
    expect(html).toContain('&lt;Partners&gt;');
  });
});

describe('k1EstimateTemplate', () => {
  it('renders the K-1 estimate template correctly', () => {
    const data = {
      recipientName: 'John Smith',
      fundName: 'Alpha Growth Fund',
      taxYear: '2025',
      expectedFinalDate: 'March 15, 2026',
      estimateUrl: 'https://portal.example.com/documents/k1-est-123',
    };

    const html = k1EstimateTemplate(data);

    expect(html).toContain('2025 K-1 Estimate Available');
    expect(html).toContain('Hi John Smith,');
    expect(html).toContain('Preliminary K-1 estimates');
    expect(html).toContain('tax planning purposes');
    expect(html).toContain('View K-1 Estimate');
    expect(html).toContain('https://portal.example.com/documents/k1-est-123');
    expect(html).toContain('Final K-1s are expected by March 15, 2026');
    expect(html).toContain('estimate only');
    expect(html).toContain('should not be used for filing');
    expect(html).toContain('Final K-1 figures may differ');
  });

  it('escapes HTML in expected final date', () => {
    const data = {
      recipientName: 'User',
      fundName: 'Fund',
      taxYear: '2025',
      expectedFinalDate: '<script>alert(1)</script>',
      estimateUrl: 'https://example.com',
    };

    const html = k1EstimateTemplate(data);

    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>alert');
  });
});

describe('k1AmendedTemplate', () => {
  it('renders the K-1 amended template correctly', () => {
    const data = {
      recipientName: 'John Smith',
      fundName: 'Alpha Growth Fund',
      taxYear: '2025',
      amendmentReason: 'Correction to depreciation allocation',
      downloadUrl: 'https://portal.example.com/documents/k1-amended-123/download',
    };

    const html = k1AmendedTemplate(data);

    expect(html).toContain('Amended 2025 Schedule K-1');
    expect(html).toContain('Hi John Smith,');
    expect(html).toContain('amended Schedule K-1');
    expect(html).toContain('Alpha Growth Fund');
    expect(html).toContain('Reason:');
    expect(html).toContain('Correction to depreciation allocation');
    expect(html).toContain('Download Amended K-1');
    expect(html).toContain('https://portal.example.com/documents/k1-amended-123/download');
    expect(html).toContain('impact on your tax filings');
    expect(html).toContain('amended return');
  });

  it('escapes HTML in amendment reason', () => {
    const data = {
      recipientName: 'User',
      fundName: 'Fund',
      taxYear: '2025',
      amendmentReason: '<script>malicious</script>',
      downloadUrl: 'https://example.com',
    };

    const html = k1AmendedTemplate(data);

    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>malicious');
  });
});
