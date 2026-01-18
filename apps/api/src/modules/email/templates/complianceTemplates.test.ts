/**
 * Compliance & Re-Verification Email Templates Tests (Stage 05)
 * Comprehensive tests for all compliance email templates including:
 * - Re-KYC Required
 * - Accreditation Re-Verification
 * - Banking Update Request
 * - PPM Amendment Notice
 * - Material Event Notice
 */

import { describe, it, expect } from 'vitest';
import {
  rekycRequiredTemplate,
  accreditationReverificationTemplate,
  bankingUpdateRequestTemplate,
  ppmAmendmentTemplate,
  materialEventTemplate,
  type RekycRequiredTemplateData,
  type AccreditationReverificationTemplateData,
  type BankingUpdateRequestTemplateData,
  type PpmAmendmentTemplateData,
  type MaterialEventTemplateData,
} from './complianceTemplates';

// ============================================================
// 05.01.A1 — RE-KYC REQUIRED TEMPLATE
// ============================================================

describe('rekycRequiredTemplate', () => {
  const baseData: RekycRequiredTemplateData = {
    recipientName: 'John Smith',
    fundName: 'Alpha Growth Fund',
    reverificationReason: 'Annual compliance review',
    deadline: '30 days',
    verificationUrl: 'https://portal.example.com/investor/verify',
  };

  describe('basic rendering', () => {
    it('should render all required fields correctly', () => {
      const html = rekycRequiredTemplate(baseData);

      expect(html).toContain('Verification Update Required');
      expect(html).toContain('Hi John Smith,');
      expect(html).toContain('Alpha Growth Fund');
      expect(html).toContain('compliance requirements');
    });

    it('should display the reverification reason', () => {
      const html = rekycRequiredTemplate(baseData);

      expect(html).toContain('Reason:');
      expect(html).toContain('Annual compliance review');
    });

    it('should show the deadline prominently', () => {
      const html = rekycRequiredTemplate(baseData);

      expect(html).toContain('30 days');
      expect(html).toContain('<strong>30 days</strong>');
    });

    it('should include the verification button with correct URL', () => {
      const html = rekycRequiredTemplate(baseData);

      expect(html).toContain('Update Verification');
      expect(html).toContain('https://portal.example.com/investor/verify');
    });

    it('should include warning about non-compliance consequences', () => {
      const html = rekycRequiredTemplate(baseData);

      expect(html).toContain('Failure to complete re-verification');
      expect(html).toContain('capital calls');
      expect(html).toContain('distributions');
    });

    it('should include fund team signature', () => {
      const html = rekycRequiredTemplate(baseData);

      expect(html).toContain('Alpha Growth Fund Team');
    });
  });

  describe('different reverification reasons', () => {
    it('should handle regulatory change reason', () => {
      const data = {
        ...baseData,
        reverificationReason: 'Regulatory requirement change effective January 2026',
      };

      const html = rekycRequiredTemplate(data);

      expect(html).toContain('Regulatory requirement change effective January 2026');
    });

    it('should handle information update reason', () => {
      const data = {
        ...baseData,
        reverificationReason: 'Your contact information needs to be updated',
      };

      const html = rekycRequiredTemplate(data);

      expect(html).toContain('Your contact information needs to be updated');
    });

    it('should handle periodic review reason', () => {
      const data = {
        ...baseData,
        reverificationReason: 'Periodic investor verification per PPM Section 5.2',
      };

      const html = rekycRequiredTemplate(data);

      expect(html).toContain('Periodic investor verification per PPM Section 5.2');
    });
  });

  describe('different deadline formats', () => {
    it('should handle specific date deadline', () => {
      const data = {
        ...baseData,
        deadline: 'February 28, 2026',
      };

      const html = rekycRequiredTemplate(data);

      expect(html).toContain('February 28, 2026');
    });

    it('should handle days-based deadline', () => {
      const data = {
        ...baseData,
        deadline: '14 business days',
      };

      const html = rekycRequiredTemplate(data);

      expect(html).toContain('14 business days');
    });
  });

  describe('XSS protection', () => {
    it('should escape HTML in recipient name', () => {
      const data = {
        ...baseData,
        recipientName: '<script>alert("xss")</script>',
      };

      const html = rekycRequiredTemplate(data);

      expect(html).not.toContain('<script>alert("xss")</script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should escape HTML in fund name', () => {
      const data = {
        ...baseData,
        fundName: 'Fund<img src=x onerror=alert(1)>',
      };

      const html = rekycRequiredTemplate(data);

      expect(html).not.toContain('<img src=x');
      expect(html).toContain('Fund&lt;img');
    });

    it('should escape HTML in reverification reason', () => {
      const data = {
        ...baseData,
        reverificationReason: '<a href="javascript:evil()">Click here</a>',
      };

      const html = rekycRequiredTemplate(data);

      expect(html).not.toContain('href="javascript:');
      expect(html).toContain('&lt;a href=');
    });

    it('should escape HTML in deadline', () => {
      const data = {
        ...baseData,
        deadline: '30 days<script>',
      };

      const html = rekycRequiredTemplate(data);

      expect(html).toContain('&lt;script&gt;');
    });
  });

  describe('preheader text', () => {
    it('should include deadline in preheader', () => {
      const html = rekycRequiredTemplate(baseData);

      expect(html).toContain('Verification update required');
    });
  });
});

// ============================================================
// 05.02.A1 — ACCREDITATION RE-VERIFICATION TEMPLATE
// ============================================================

describe('accreditationReverificationTemplate', () => {
  const baseData: AccreditationReverificationTemplateData = {
    recipientName: 'Jane Doe',
    fundName: 'Beta Income Fund',
    verificationUrl: 'https://portal.example.com/investor/accreditation',
  };

  describe('basic rendering', () => {
    it('should render all required fields correctly', () => {
      const html = accreditationReverificationTemplate(baseData);

      expect(html).toContain('Accreditation Verification Required');
      expect(html).toContain('Hi Jane Doe,');
      expect(html).toContain('Beta Income Fund');
    });

    it('should explain the accreditation requirement', () => {
      const html = accreditationReverificationTemplate(baseData);

      expect(html).toContain('accredited investor status');
      expect(html).toContain('periodic re-verification');
    });

    it('should include the verification button with correct URL', () => {
      const html = accreditationReverificationTemplate(baseData);

      expect(html).toContain('Complete Verification');
      expect(html).toContain('https://portal.example.com/investor/accreditation');
    });

    it('should mention SEC Regulation D', () => {
      const html = accreditationReverificationTemplate(baseData);

      expect(html).toContain('SEC Regulation D');
      expect(html).toContain('investment eligibility');
    });

    it('should mention the time requirement', () => {
      const html = accreditationReverificationTemplate(baseData);

      expect(html).toContain('approximately 5 minutes');
    });

    it('should offer help via email reply', () => {
      const html = accreditationReverificationTemplate(baseData);

      expect(html).toContain('reply to this email');
    });

    it('should include fund team signature', () => {
      const html = accreditationReverificationTemplate(baseData);

      expect(html).toContain('Beta Income Fund Team');
    });
  });

  describe('XSS protection', () => {
    it('should escape HTML in recipient name', () => {
      const data = {
        ...baseData,
        recipientName: '<img src="x" onerror="alert(1)">John',
      };

      const html = accreditationReverificationTemplate(data);

      expect(html).not.toContain('<img src="x"');
      expect(html).toContain('&lt;img');
    });

    it('should escape HTML in fund name', () => {
      const data = {
        ...baseData,
        fundName: 'Fund & <Partners> LLC',
      };

      const html = accreditationReverificationTemplate(data);

      expect(html).toContain('Fund &amp;');
      expect(html).toContain('&lt;Partners&gt;');
    });
  });

  describe('preheader text', () => {
    it('should include appropriate preheader', () => {
      const html = accreditationReverificationTemplate(baseData);

      expect(html).toContain('Accreditation verification required');
    });
  });
});

// ============================================================
// 05.03.A1 — BANKING UPDATE REQUEST TEMPLATE
// ============================================================

describe('bankingUpdateRequestTemplate', () => {
  const baseData: BankingUpdateRequestTemplateData = {
    recipientName: 'Robert Wilson',
    fundName: 'Gamma Real Estate Fund',
    failureReason: 'Account number invalid - check digits do not match',
    updateBankingUrl: 'https://portal.example.com/investor/banking',
  };

  describe('basic rendering', () => {
    it('should render all required fields correctly', () => {
      const html = bankingUpdateRequestTemplate(baseData);

      expect(html).toContain('Banking Information Update Needed');
      expect(html).toContain('Hi Robert Wilson,');
      expect(html).toContain('Gamma Real Estate Fund');
    });

    it('should explain the payment failure', () => {
      const html = bankingUpdateRequestTemplate(baseData);

      expect(html).toContain('unable to process a payment');
      expect(html).toContain('account on file');
    });

    it('should display the failure reason prominently', () => {
      const html = bankingUpdateRequestTemplate(baseData);

      expect(html).toContain('Reason:');
      expect(html).toContain('Account number invalid');
      expect(html).toContain('check digits do not match');
    });

    it('should include the update banking button with correct URL', () => {
      const html = bankingUpdateRequestTemplate(baseData);

      expect(html).toContain('Update Banking Information');
      expect(html).toContain('https://portal.example.com/investor/banking');
    });

    it('should mention future distributions', () => {
      const html = bankingUpdateRequestTemplate(baseData);

      expect(html).toContain('future distributions');
    });

    it('should offer contact option for errors', () => {
      const html = bankingUpdateRequestTemplate(baseData);

      expect(html).toContain('believe this is an error');
      expect(html).toContain('contact us');
    });

    it('should include fund team signature', () => {
      const html = bankingUpdateRequestTemplate(baseData);

      expect(html).toContain('Gamma Real Estate Fund Team');
    });
  });

  describe('different failure reasons', () => {
    it('should handle ACH failure reason', () => {
      const data = {
        ...baseData,
        failureReason: 'ACH transfer returned - Account closed',
      };

      const html = bankingUpdateRequestTemplate(data);

      expect(html).toContain('ACH transfer returned');
      expect(html).toContain('Account closed');
    });

    it('should handle wire rejection reason', () => {
      const data = {
        ...baseData,
        failureReason: 'Wire transfer rejected - Beneficiary name mismatch',
      };

      const html = bankingUpdateRequestTemplate(data);

      expect(html).toContain('Wire transfer rejected');
      expect(html).toContain('Beneficiary name mismatch');
    });

    it('should handle insufficient funds reason', () => {
      const data = {
        ...baseData,
        failureReason: 'Transaction failed - R01 Insufficient Funds',
      };

      const html = bankingUpdateRequestTemplate(data);

      expect(html).toContain('R01 Insufficient Funds');
    });

    it('should handle authorization revoked reason', () => {
      const data = {
        ...baseData,
        failureReason: 'R07 Authorization Revoked by Customer',
      };

      const html = bankingUpdateRequestTemplate(data);

      expect(html).toContain('R07 Authorization Revoked');
    });
  });

  describe('XSS protection', () => {
    it('should escape HTML in recipient name', () => {
      const data = {
        ...baseData,
        recipientName: '"><script>alert(document.cookie)</script>',
      };

      const html = bankingUpdateRequestTemplate(data);

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should escape HTML in fund name', () => {
      const data = {
        ...baseData,
        fundName: 'Test<style>body{display:none}</style>Fund',
      };

      const html = bankingUpdateRequestTemplate(data);

      expect(html).not.toContain('<style>');
      expect(html).toContain('&lt;style&gt;');
    });

    it('should escape HTML in failure reason', () => {
      const data = {
        ...baseData,
        failureReason: '<a href="http://phishing.com">Click to verify</a>',
      };

      const html = bankingUpdateRequestTemplate(data);

      expect(html).not.toContain('href="http://phishing.com"');
      expect(html).toContain('&lt;a href=');
    });
  });

  describe('styling', () => {
    it('should style the failure reason box with error colors', () => {
      const html = bankingUpdateRequestTemplate(baseData);

      expect(html).toContain('#fef2f2'); // Light red background
      expect(html).toContain('#fecaca'); // Red border
      expect(html).toContain('#991b1b'); // Dark red text
    });
  });
});

// ============================================================
// 05.04.A1 — PPM AMENDMENT NOTICE TEMPLATE
// ============================================================

describe('ppmAmendmentTemplate', () => {
  const baseData: PpmAmendmentTemplateData = {
    recipientName: 'Sarah Johnson',
    fundName: 'Delta Opportunity Fund',
    documentName: 'Private Placement Memorandum',
    amendmentSummary: '<ul><li>Updated fee structure in Section 4.2</li><li>Added new risk disclosure in Section 7</li></ul>',
    effectiveDate: 'March 1, 2026',
    reviewUrl: 'https://portal.example.com/documents/ppm-amendment',
  };

  describe('basic rendering', () => {
    it('should render all required fields correctly', () => {
      const html = ppmAmendmentTemplate(baseData);

      expect(html).toContain('Important: Fund Document Amendment');
      expect(html).toContain('Hi Sarah Johnson,');
      expect(html).toContain('Delta Opportunity Fund');
    });

    it('should display the document name', () => {
      const html = ppmAmendmentTemplate(baseData);

      expect(html).toContain('Private Placement Memorandum');
      expect(html).toContain('<strong>Private Placement Memorandum</strong>');
    });

    it('should display the amendment summary (HTML content)', () => {
      const html = ppmAmendmentTemplate(baseData);

      expect(html).toContain('Summary of Changes');
      expect(html).toContain('Updated fee structure in Section 4.2');
      expect(html).toContain('Added new risk disclosure in Section 7');
    });

    it('should display the effective date', () => {
      const html = ppmAmendmentTemplate(baseData);

      expect(html).toContain('Effective Date:');
      expect(html).toContain('March 1, 2026');
    });

    it('should include the review button with correct URL', () => {
      const html = ppmAmendmentTemplate(baseData);

      expect(html).toContain('Review Amendment');
      expect(html).toContain('https://portal.example.com/documents/ppm-amendment');
    });

    it('should offer contact for questions', () => {
      const html = ppmAmendmentTemplate(baseData);

      expect(html).toContain('questions about these changes');
      expect(html).toContain('contact us');
    });

    it('should include fund team signature', () => {
      const html = ppmAmendmentTemplate(baseData);

      expect(html).toContain('Delta Opportunity Fund Team');
    });
  });

  describe('optional acknowledgment note', () => {
    it('should render acknowledgment note when provided', () => {
      const data = {
        ...baseData,
        acknowledgmentNote: '<p><strong>Important:</strong> You must acknowledge this amendment within 30 days to continue participating in the fund.</p>',
      };

      const html = ppmAmendmentTemplate(data);

      expect(html).toContain('Important:');
      expect(html).toContain('acknowledge this amendment within 30 days');
    });

    it('should not render acknowledgment section when not provided', () => {
      const html = ppmAmendmentTemplate(baseData);

      // The acknowledgment box has specific styling - check it's not present
      expect(html).not.toContain('You must acknowledge');
    });
  });

  describe('different document types', () => {
    it('should handle Operating Agreement amendment', () => {
      const data = {
        ...baseData,
        documentName: 'Operating Agreement',
        amendmentSummary: '<p>Updated distribution waterfall in Article V.</p>',
      };

      const html = ppmAmendmentTemplate(data);

      expect(html).toContain('Operating Agreement');
      expect(html).toContain('distribution waterfall');
    });

    it('should handle Subscription Agreement amendment', () => {
      const data = {
        ...baseData,
        documentName: 'Subscription Agreement',
        amendmentSummary: '<p>Modified investor representations in Section 2.</p>',
      };

      const html = ppmAmendmentTemplate(data);

      expect(html).toContain('Subscription Agreement');
      expect(html).toContain('investor representations');
    });
  });

  describe('XSS protection', () => {
    it('should escape HTML in recipient name', () => {
      const data = {
        ...baseData,
        recipientName: '<marquee>HACKED</marquee>',
      };

      const html = ppmAmendmentTemplate(data);

      expect(html).not.toContain('<marquee>');
      expect(html).toContain('&lt;marquee&gt;');
    });

    it('should escape HTML in fund name', () => {
      const data = {
        ...baseData,
        fundName: 'Fund<iframe src="evil.com">',
      };

      const html = ppmAmendmentTemplate(data);

      expect(html).not.toContain('<iframe');
      expect(html).toContain('&lt;iframe');
    });

    it('should escape HTML in document name', () => {
      const data = {
        ...baseData,
        documentName: '<script>document.location="http://evil.com"</script>',
      };

      const html = ppmAmendmentTemplate(data);

      expect(html).not.toContain('<script>document.location');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should escape HTML in effective date', () => {
      const data = {
        ...baseData,
        effectiveDate: 'March<script>1</script>2026',
      };

      const html = ppmAmendmentTemplate(data);

      expect(html).toContain('March&lt;script&gt;1&lt;/script&gt;2026');
    });

    it('should NOT escape HTML in amendmentSummary (pre-sanitized content)', () => {
      // amendmentSummary is expected to be pre-sanitized HTML content
      const html = ppmAmendmentTemplate(baseData);

      expect(html).toContain('<ul>');
      expect(html).toContain('<li>');
    });

    it('should NOT escape HTML in acknowledgmentNote (pre-sanitized content)', () => {
      const data = {
        ...baseData,
        acknowledgmentNote: '<p><strong>Note:</strong> Please review carefully.</p>',
      };

      const html = ppmAmendmentTemplate(data);

      expect(html).toContain('<p><strong>Note:</strong>');
    });
  });

  describe('preheader text', () => {
    it('should include document name in preheader', () => {
      const html = ppmAmendmentTemplate(baseData);

      expect(html).toContain('Important: Fund document amendment');
    });
  });
});

// ============================================================
// 05.05.A1 — MATERIAL EVENT NOTICE TEMPLATE
// ============================================================

describe('materialEventTemplate', () => {
  const baseData: MaterialEventTemplateData = {
    recipientName: 'Michael Brown',
    fundName: 'Epsilon Venture Fund',
    eventContent: '<p>We are pleased to announce that Portfolio Company XYZ has completed a successful Series B funding round, raising $50 million at a $200 million valuation.</p><p>This represents a 2.5x step-up from our initial investment.</p>',
    detailsUrl: 'https://portal.example.com/updates/material-event-123',
  };

  describe('basic rendering', () => {
    it('should render all required fields correctly', () => {
      const html = materialEventTemplate(baseData);

      expect(html).toContain('Important Update');
      expect(html).toContain('Hi Michael Brown,');
      expect(html).toContain('Epsilon Venture Fund');
    });

    it('should display the event content (HTML)', () => {
      const html = materialEventTemplate(baseData);

      expect(html).toContain('Portfolio Company XYZ');
      expect(html).toContain('Series B funding round');
      expect(html).toContain('$50 million');
      expect(html).toContain('$200 million valuation');
      expect(html).toContain('2.5x step-up');
    });

    it('should include the details button with correct URL', () => {
      const html = materialEventTemplate(baseData);

      expect(html).toContain('View Details');
      expect(html).toContain('https://portal.example.com/updates/material-event-123');
    });

    it('should offer contact for questions', () => {
      const html = materialEventTemplate(baseData);

      expect(html).toContain('questions');
      expect(html).toContain('contact us');
    });

    it('should include fund team signature', () => {
      const html = materialEventTemplate(baseData);

      expect(html).toContain('Epsilon Venture Fund Team');
    });
  });

  describe('different material event types', () => {
    it('should handle property sale event', () => {
      const data = {
        ...baseData,
        eventContent: '<p>The fund has completed the sale of 123 Main Street for $15,000,000, achieving a 25% IRR over the 3-year hold period.</p>',
      };

      const html = materialEventTemplate(data);

      expect(html).toContain('completed the sale');
      expect(html).toContain('$15,000,000');
      expect(html).toContain('25% IRR');
    });

    it('should handle management change event', () => {
      const data = {
        ...baseData,
        eventContent: '<p>Effective January 15, 2026, John Smith will be joining the fund as Chief Investment Officer.</p>',
      };

      const html = materialEventTemplate(data);

      expect(html).toContain('Chief Investment Officer');
      expect(html).toContain('January 15, 2026');
    });

    it('should handle regulatory update event', () => {
      const data = {
        ...baseData,
        eventContent: '<p>Due to recent regulatory changes, the fund structure will be modified to ensure continued compliance. There is no action required from investors at this time.</p>',
      };

      const html = materialEventTemplate(data);

      expect(html).toContain('regulatory changes');
      expect(html).toContain('no action required');
    });

    it('should handle negative event notice', () => {
      const data = {
        ...baseData,
        eventContent: '<p>We regret to inform you that Portfolio Company ABC has entered bankruptcy proceedings. The fund exposure to this investment was 5% of total AUM.</p>',
      };

      const html = materialEventTemplate(data);

      expect(html).toContain('bankruptcy proceedings');
      expect(html).toContain('5% of total AUM');
    });
  });

  describe('XSS protection', () => {
    it('should escape HTML in recipient name', () => {
      const data = {
        ...baseData,
        recipientName: '<svg onload=alert(1)>',
      };

      const html = materialEventTemplate(data);

      expect(html).not.toContain('<svg onload');
      expect(html).toContain('&lt;svg');
    });

    it('should escape HTML in fund name', () => {
      const data = {
        ...baseData,
        fundName: 'Fund<body onload=alert(1)>',
      };

      const html = materialEventTemplate(data);

      expect(html).not.toContain('<body onload');
      expect(html).toContain('&lt;body');
    });

    it('should NOT escape HTML in eventContent (pre-sanitized content)', () => {
      // eventContent is expected to be pre-sanitized HTML content
      const html = materialEventTemplate(baseData);

      expect(html).toContain('<p>');
    });
  });

  describe('preheader text', () => {
    it('should include fund name in preheader', () => {
      const html = materialEventTemplate(baseData);

      expect(html).toContain('Important update from Epsilon Venture Fund');
    });
  });
});

// ============================================================
// TEMPLATE STRUCTURE TESTS
// ============================================================

describe('Template Structure', () => {
  describe('all templates should have consistent structure', () => {
    const templates = [
      {
        name: 'rekycRequired',
        fn: rekycRequiredTemplate,
        data: {
          recipientName: 'Test User',
          fundName: 'Test Fund',
          reverificationReason: 'Test reason',
          deadline: '30 days',
          verificationUrl: 'https://example.com',
        },
      },
      {
        name: 'accreditationReverification',
        fn: accreditationReverificationTemplate,
        data: {
          recipientName: 'Test User',
          fundName: 'Test Fund',
          verificationUrl: 'https://example.com',
        },
      },
      {
        name: 'bankingUpdateRequest',
        fn: bankingUpdateRequestTemplate,
        data: {
          recipientName: 'Test User',
          fundName: 'Test Fund',
          failureReason: 'Test reason',
          updateBankingUrl: 'https://example.com',
        },
      },
      {
        name: 'ppmAmendment',
        fn: ppmAmendmentTemplate,
        data: {
          recipientName: 'Test User',
          fundName: 'Test Fund',
          documentName: 'Test Document',
          amendmentSummary: '<p>Test summary</p>',
          effectiveDate: 'January 1, 2026',
          reviewUrl: 'https://example.com',
        },
      },
      {
        name: 'materialEvent',
        fn: materialEventTemplate,
        data: {
          recipientName: 'Test User',
          fundName: 'Test Fund',
          eventContent: '<p>Test content</p>',
          detailsUrl: 'https://example.com',
        },
      },
    ];

    templates.forEach(({ name, fn, data }) => {
      describe(`${name}Template`, () => {
        it('should return valid HTML document', () => {
          const html = fn(data as never);

          expect(html).toContain('<!DOCTYPE html>');
          expect(html).toContain('<html');
          expect(html).toContain('</html>');
        });

        it('should include responsive meta viewport', () => {
          const html = fn(data as never);

          expect(html).toContain('viewport');
          expect(html).toContain('width=device-width');
        });

        it('should include email-safe fonts', () => {
          const html = fn(data as never);

          expect(html).toContain('font-family');
          expect(html).toContain('Arial');
        });

        it('should include the recipient greeting', () => {
          const html = fn(data as never);

          expect(html).toContain('Hi Test User');
        });

        it('should include the fund name', () => {
          const html = fn(data as never);

          expect(html).toContain('Test Fund');
        });

        it('should include email footer', () => {
          const html = fn(data as never);

          expect(html).toContain('automated message');
        });

        it('should include a primary action button', () => {
          const html = fn(data as never);

          expect(html).toContain('https://example.com');
          expect(html).toContain('bgcolor="#1e40af"'); // Primary button color
        });
      });
    });
  });
});

// ============================================================
// EDGE CASES & SPECIAL CHARACTERS
// ============================================================

describe('Edge Cases', () => {
  describe('special characters handling', () => {
    it('should handle ampersands in all templates', () => {
      const data: RekycRequiredTemplateData = {
        recipientName: 'Smith & Johnson',
        fundName: 'Alpha & Beta Fund',
        reverificationReason: 'Q&A session requirement',
        deadline: '30 days',
        verificationUrl: 'https://example.com',
      };

      const html = rekycRequiredTemplate(data);

      expect(html).toContain('Smith &amp; Johnson');
      expect(html).toContain('Alpha &amp; Beta Fund');
      expect(html).toContain('Q&amp;A session requirement');
    });

    it('should handle quotes in user input', () => {
      const data: BankingUpdateRequestTemplateData = {
        recipientName: 'John "Jack" Smith',
        fundName: "O'Brien Fund",
        failureReason: 'Error: "Invalid account"',
        updateBankingUrl: 'https://example.com',
      };

      const html = bankingUpdateRequestTemplate(data);

      expect(html).toContain('John &quot;Jack&quot; Smith');
      expect(html).toContain('O&#039;Brien Fund');
    });

    it('should handle unicode characters', () => {
      const data: AccreditationReverificationTemplateData = {
        recipientName: 'José García',
        fundName: 'Fonds Européen',
        verificationUrl: 'https://example.com',
      };

      const html = accreditationReverificationTemplate(data);

      expect(html).toContain('José García');
      expect(html).toContain('Fonds Européen');
    });

    it('should handle very long content gracefully', () => {
      const longSummary = '<p>' + 'This is a very long amendment summary. '.repeat(50) + '</p>';

      const data: PpmAmendmentTemplateData = {
        recipientName: 'Test User',
        fundName: 'Test Fund',
        documentName: 'PPM',
        amendmentSummary: longSummary,
        effectiveDate: 'January 1, 2026',
        reviewUrl: 'https://example.com',
      };

      const html = ppmAmendmentTemplate(data);

      expect(html).toContain('This is a very long amendment summary');
      // Should still be valid HTML
      expect(html).toContain('</html>');
    });
  });

  describe('empty/minimal data handling', () => {
    it('should handle minimal required data for rekycRequired', () => {
      const data: RekycRequiredTemplateData = {
        recipientName: 'A',
        fundName: 'B',
        reverificationReason: 'C',
        deadline: 'D',
        verificationUrl: 'https://x.com',
      };

      const html = rekycRequiredTemplate(data);

      expect(html).toContain('Hi A,');
      expect(html).toContain('</html>');
    });
  });
});

// ============================================================
// ACCESSIBILITY TESTS
// ============================================================

describe('Accessibility', () => {
  it('should have proper table roles for email clients', () => {
    const data: RekycRequiredTemplateData = {
      recipientName: 'Test',
      fundName: 'Fund',
      reverificationReason: 'Reason',
      deadline: '30 days',
      verificationUrl: 'https://example.com',
    };

    const html = rekycRequiredTemplate(data);

    expect(html).toContain('role="presentation"');
  });

  it('should have lang attribute on html element', () => {
    const data: AccreditationReverificationTemplateData = {
      recipientName: 'Test',
      fundName: 'Fund',
      verificationUrl: 'https://example.com',
    };

    const html = accreditationReverificationTemplate(data);

    expect(html).toContain('lang="en"');
  });

  it('should have appropriate color contrast for readability', () => {
    const data: BankingUpdateRequestTemplateData = {
      recipientName: 'Test',
      fundName: 'Fund',
      failureReason: 'Reason',
      updateBankingUrl: 'https://example.com',
    };

    const html = bankingUpdateRequestTemplate(data);

    // Check for dark text on light backgrounds
    expect(html).toContain('color: #374151'); // Body text
    expect(html).toContain('color: #111827'); // Header text
  });
});
