/**
 * Exit & Transfer Email Templates Tests (Stage 06)
 * Comprehensive tests for transfer request, approval, denial, and final exit statement emails
 * 
 * Test Coverage:
 * - Template rendering with required fields
 * - Template rendering with optional/configurable content blocks
 * - XSS protection (HTML escaping)
 * - HTML structure validation
 * - Edge cases and boundary conditions
 * - Transfer type variations (full/partial)
 * - Fund-configurable content blocks
 */

import { describe, it, expect } from 'vitest';
import {
  transferRequestReceivedTemplate,
  transferApprovedTemplate,
  transferDeniedTemplate,
  finalExitStatementTemplate,
  TransferRequestReceivedTemplateData,
  TransferApprovedTemplateData,
  TransferDeniedTemplateData,
  FinalExitStatementTemplateData,
} from './exitTransferTemplates';

// ============================================================
// TEST FIXTURES
// ============================================================

const baseTransferRequestData: TransferRequestReceivedTemplateData = {
  recipientName: 'John Doe',
  fundName: 'Acme Real Estate Fund I',
  transferType: 'full',
  reviewTimeframe: '5-7 business days',
  transferProcessNote: 'Our team will review your request and may reach out for additional documentation.',
};

const baseTransferApprovedData: TransferApprovedTemplateData = {
  recipientName: 'Jane Smith',
  fundName: 'Acme Real Estate Fund I',
  effectiveDate: 'February 15, 2026',
  transferNextSteps: 'Please ensure your banking information is up to date in your portal.',
};

const baseTransferDeniedData: TransferDeniedTemplateData = {
  recipientName: 'Bob Wilson',
  fundName: 'Acme Real Estate Fund I',
  denialReason: 'Transfer requests are not permitted during the lock-up period.',
  transferDenialOptions: 'You may resubmit your request after March 1, 2026 when the lock-up period ends.',
};

const baseFinalExitData: FinalExitStatementTemplateData = {
  recipientName: 'Alice Johnson',
  fundName: 'Acme Real Estate Fund I',
  exitSummary: {
    totalInvested: '500,000',
    totalDistributions: '125,000',
    finalPayout: '575,000',
    exitDate: 'January 31, 2026',
  },
  exitClosingMessage: 'We wish you the best in your future investment endeavors.',
};

// ============================================================
// 06.01.A1 - TRANSFER REQUEST RECEIVED TEMPLATE
// ============================================================

describe('transferRequestReceivedTemplate (06.01.A1)', () => {
  describe('Basic Rendering', () => {
    it('should render with all required fields', () => {
      const html = transferRequestReceivedTemplate(baseTransferRequestData);

      expect(html).toContain('John Doe');
      expect(html).toContain('Acme Real Estate Fund I');
      expect(html).toContain('Transfer Request Received');
      expect(html).toContain('5-7 business days');
    });

    it('should include the correct email header', () => {
      const html = transferRequestReceivedTemplate(baseTransferRequestData);
      expect(html).toContain('Transfer Request Received');
    });

    it('should include the fund team signature', () => {
      const html = transferRequestReceivedTemplate(baseTransferRequestData);
      expect(html).toContain('Acme Real Estate Fund I Team');
    });

    it('should include reply instruction', () => {
      const html = transferRequestReceivedTemplate(baseTransferRequestData);
      expect(html).toContain('reply to this email');
    });
  });

  describe('Transfer Type Variations', () => {
    it('should display "Full Transfer" for full transfer type', () => {
      const html = transferRequestReceivedTemplate({
        ...baseTransferRequestData,
        transferType: 'full',
      });

      expect(html).toContain('Full Transfer');
    });

    it('should display "Partial Transfer" for partial transfer type', () => {
      const html = transferRequestReceivedTemplate({
        ...baseTransferRequestData,
        transferType: 'partial',
      });

      expect(html).toContain('Partial Transfer');
    });
  });

  describe('Configurable Content Block', () => {
    it('should include transfer process note when provided', () => {
      const html = transferRequestReceivedTemplate(baseTransferRequestData);
      expect(html).toContain('Our team will review your request');
      expect(html).toContain('additional documentation');
    });

    it('should render without process note when empty', () => {
      const html = transferRequestReceivedTemplate({
        ...baseTransferRequestData,
        transferProcessNote: '',
      });

      // Should still render the template without errors
      expect(html).toContain('John Doe');
      expect(html).toContain('Transfer Request Received');
    });
  });

  describe('Review Timeframe Variations', () => {
    it('should display custom review timeframe', () => {
      const html = transferRequestReceivedTemplate({
        ...baseTransferRequestData,
        reviewTimeframe: '10-14 business days',
      });

      expect(html).toContain('10-14 business days');
    });

    it('should handle short timeframe', () => {
      const html = transferRequestReceivedTemplate({
        ...baseTransferRequestData,
        reviewTimeframe: '48 hours',
      });

      expect(html).toContain('48 hours');
    });
  });

  describe('Preheader Text', () => {
    it('should include appropriate preheader', () => {
      const html = transferRequestReceivedTemplate(baseTransferRequestData);
      expect(html).toContain('transfer request');
      expect(html).toContain('has been received');
    });
  });
});

// ============================================================
// 06.01.A2 - TRANSFER APPROVED TEMPLATE
// ============================================================

describe('transferApprovedTemplate (06.01.A2)', () => {
  describe('Basic Rendering', () => {
    it('should render with all required fields', () => {
      const html = transferApprovedTemplate(baseTransferApprovedData);

      expect(html).toContain('Jane Smith');
      expect(html).toContain('Acme Real Estate Fund I');
      expect(html).toContain('Transfer Approved');
      expect(html).toContain('February 15, 2026');
    });

    it('should include success indicator', () => {
      const html = transferApprovedTemplate(baseTransferApprovedData);
      expect(html).toContain('has been approved');
    });

    it('should mention final exit statement for full transfers', () => {
      const html = transferApprovedTemplate(baseTransferApprovedData);
      expect(html).toContain('final exit statement');
    });

    it('should include thank you message', () => {
      const html = transferApprovedTemplate(baseTransferApprovedData);
      expect(html).toContain('Thank you for your investment');
    });
  });

  describe('Effective Date Display', () => {
    it('should display the effective date prominently', () => {
      const html = transferApprovedTemplate(baseTransferApprovedData);
      expect(html).toContain('Effective Date');
      expect(html).toContain('February 15, 2026');
    });

    it('should handle various date formats', () => {
      const html = transferApprovedTemplate({
        ...baseTransferApprovedData,
        effectiveDate: '2026-03-01',
      });

      expect(html).toContain('2026-03-01');
    });
  });

  describe('Configurable Content Block', () => {
    it('should include next steps when provided', () => {
      const html = transferApprovedTemplate(baseTransferApprovedData);
      expect(html).toContain('banking information');
      expect(html).toContain('up to date');
    });

    it('should render without next steps when empty', () => {
      const html = transferApprovedTemplate({
        ...baseTransferApprovedData,
        transferNextSteps: '',
      });

      expect(html).toContain('Jane Smith');
      expect(html).toContain('Transfer Approved');
    });
  });

  describe('Preheader Text', () => {
    it('should include appropriate preheader', () => {
      const html = transferApprovedTemplate(baseTransferApprovedData);
      expect(html).toContain('has been approved');
    });
  });
});

// ============================================================
// 06.01.C1 - TRANSFER DENIED TEMPLATE
// ============================================================

describe('transferDeniedTemplate (06.01.C1)', () => {
  describe('Basic Rendering', () => {
    it('should render with all required fields', () => {
      const html = transferDeniedTemplate(baseTransferDeniedData);

      expect(html).toContain('Bob Wilson');
      expect(html).toContain('Acme Real Estate Fund I');
      expect(html).toContain('Transfer Request Update');
    });

    it('should display denial message clearly', () => {
      const html = transferDeniedTemplate(baseTransferDeniedData);
      expect(html).toContain('unable to approve');
    });

    it('should include contact instruction', () => {
      const html = transferDeniedTemplate(baseTransferDeniedData);
      expect(html).toContain('reply to this email');
      expect(html).toContain('contact us directly');
    });
  });

  describe('Denial Reason Display', () => {
    it('should display the denial reason', () => {
      const html = transferDeniedTemplate(baseTransferDeniedData);
      expect(html).toContain('lock-up period');
      expect(html).toContain('Reason');
    });

    it('should handle various denial reasons', () => {
      const reasons = [
        'Insufficient liquidity in the fund.',
        'Right of first refusal has not been satisfied.',
        'Pending regulatory approval.',
        'Transfer documentation incomplete.',
      ];

      for (const reason of reasons) {
        const html = transferDeniedTemplate({
          ...baseTransferDeniedData,
          denialReason: reason,
        });
        expect(html).toContain(reason);
      }
    });
  });

  describe('Configurable Content Block', () => {
    it('should include denial options when provided', () => {
      const html = transferDeniedTemplate(baseTransferDeniedData);
      expect(html).toContain('resubmit your request');
      expect(html).toContain('March 1, 2026');
    });

    it('should render without options when empty', () => {
      const html = transferDeniedTemplate({
        ...baseTransferDeniedData,
        transferDenialOptions: '',
      });

      expect(html).toContain('Bob Wilson');
      expect(html).toContain('unable to approve');
    });
  });

  describe('Subject Line Appropriateness', () => {
    it('should use neutral subject line (not "Denied")', () => {
      const html = transferDeniedTemplate(baseTransferDeniedData);
      expect(html).toContain('Transfer Request Update');
      // Should not explicitly say "Denied" in header to be professional
      expect(html).not.toContain('>Transfer Denied<');
    });
  });

  describe('Preheader Text', () => {
    it('should include appropriate preheader', () => {
      const html = transferDeniedTemplate(baseTransferDeniedData);
      expect(html).toContain('Update on your transfer request');
    });
  });
});

// ============================================================
// 06.02.A1 - FINAL EXIT STATEMENT TEMPLATE
// ============================================================

describe('finalExitStatementTemplate (06.02.A1)', () => {
  describe('Basic Rendering', () => {
    it('should render with all required fields', () => {
      const html = finalExitStatementTemplate(baseFinalExitData);

      expect(html).toContain('Alice Johnson');
      expect(html).toContain('Acme Real Estate Fund I');
      expect(html).toContain('Final Statement');
    });

    it('should indicate full liquidation', () => {
      const html = finalExitStatementTemplate(baseFinalExitData);
      expect(html).toContain('fully liquidated');
    });

    it('should include thank you and appreciation', () => {
      const html = finalExitStatementTemplate(baseFinalExitData);
      expect(html).toContain('Thank you for your investment');
      expect(html).toContain('appreciate your partnership');
    });
  });

  describe('Exit Summary Display', () => {
    it('should display all summary fields', () => {
      const html = finalExitStatementTemplate(baseFinalExitData);

      expect(html).toContain('Total Invested');
      expect(html).toContain('500,000');
      expect(html).toContain('Total Distributions');
      expect(html).toContain('125,000');
      expect(html).toContain('Final Payout');
      expect(html).toContain('575,000');
      expect(html).toContain('Exit Date');
      expect(html).toContain('January 31, 2026');
    });

    it('should handle summary with different amounts', () => {
      const html = finalExitStatementTemplate({
        ...baseFinalExitData,
        exitSummary: {
          totalInvested: '1,000,000',
          totalDistributions: '250,000',
          finalPayout: '1,350,000',
          exitDate: 'December 15, 2026',
        },
      });

      expect(html).toContain('1,000,000');
      expect(html).toContain('250,000');
      expect(html).toContain('1,350,000');
      expect(html).toContain('December 15, 2026');
    });

    it('should display Exit Summary header', () => {
      const html = finalExitStatementTemplate(baseFinalExitData);
      expect(html).toContain('Exit Summary');
    });
  });

  describe('K-1 Notice', () => {
    it('should include K-1 document notice', () => {
      const html = finalExitStatementTemplate(baseFinalExitData);
      expect(html).toContain('K-1');
      expect(html).toContain('tax year');
    });
  });

  describe('Configurable Content Block', () => {
    it('should include closing message when provided', () => {
      const html = finalExitStatementTemplate(baseFinalExitData);
      expect(html).toContain('future investment endeavors');
    });

    it('should render without closing message when empty', () => {
      const html = finalExitStatementTemplate({
        ...baseFinalExitData,
        exitClosingMessage: '',
      });

      expect(html).toContain('Alice Johnson');
      expect(html).toContain('Final Statement');
      expect(html).toContain('fully liquidated');
    });
  });

  describe('Preheader Text', () => {
    it('should include appropriate preheader', () => {
      const html = finalExitStatementTemplate(baseFinalExitData);
      expect(html).toContain('Final exit statement');
    });
  });
});

// ============================================================
// XSS PROTECTION TESTS
// ============================================================

describe('XSS Protection', () => {
  const xssPayloads = [
    '<script>alert("xss")</script>',
    '"><img src=x onerror=alert(1)>',
    '<iframe src="evil.com"></iframe>',
    '{{constructor.constructor("alert(1)")()}}',
    '<svg onload=alert(1)>',
    "javascript:alert('xss')",
    '<body onload=alert("xss")>',
  ];

  describe('Transfer Request Received - XSS', () => {
    it('should escape HTML in recipient name', () => {
      for (const payload of xssPayloads) {
        const html = transferRequestReceivedTemplate({
          ...baseTransferRequestData,
          recipientName: payload,
        });

        expect(html).not.toContain(payload);
        if (payload.includes('<')) {
          expect(html).toContain('&lt;');
        }
      }
    });

    it('should escape HTML in fund name', () => {
      for (const payload of xssPayloads) {
        const html = transferRequestReceivedTemplate({
          ...baseTransferRequestData,
          fundName: payload,
        });

        expect(html).not.toContain(payload);
      }
    });

    it('should escape HTML in transfer process note', () => {
      const html = transferRequestReceivedTemplate({
        ...baseTransferRequestData,
        transferProcessNote: '<script>alert("xss")</script>',
      });

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should escape HTML in review timeframe', () => {
      const html = transferRequestReceivedTemplate({
        ...baseTransferRequestData,
        reviewTimeframe: '<script>5 days</script>',
      });

      expect(html).not.toContain('<script>');
    });
  });

  describe('Transfer Approved - XSS', () => {
    it('should escape HTML in all fields', () => {
      const html = transferApprovedTemplate({
        recipientName: '<script>name</script>',
        fundName: '<img src=x onerror=alert(1)>',
        effectiveDate: '<script>date</script>',
        transferNextSteps: '<iframe src=evil></iframe>',
      });

      expect(html).not.toContain('<script>');
      expect(html).not.toContain('<img src=x');
      expect(html).not.toContain('<iframe');
    });
  });

  describe('Transfer Denied - XSS', () => {
    it('should escape HTML in denial reason', () => {
      const html = transferDeniedTemplate({
        ...baseTransferDeniedData,
        denialReason: '<script>alert("reason")</script>',
      });

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should escape HTML in denial options', () => {
      const html = transferDeniedTemplate({
        ...baseTransferDeniedData,
        transferDenialOptions: '<img onerror=alert(1) src=x>',
      });

      expect(html).not.toContain('<img onerror');
    });
  });

  describe('Final Exit Statement - XSS', () => {
    it('should escape HTML in exit summary fields', () => {
      const html = finalExitStatementTemplate({
        ...baseFinalExitData,
        exitSummary: {
          totalInvested: '<script>100</script>',
          totalDistributions: '<img src=x>',
          finalPayout: '<iframe>500</iframe>',
          exitDate: '<script>date</script>',
        },
      });

      expect(html).not.toContain('<script>');
      expect(html).not.toContain('<img src=x');
      expect(html).not.toContain('<iframe>');
    });

    it('should escape HTML in closing message', () => {
      const html = finalExitStatementTemplate({
        ...baseFinalExitData,
        exitClosingMessage: '<script>goodbye</script>',
      });

      expect(html).not.toContain('<script>goodbye');
    });
  });
});

// ============================================================
// HTML STRUCTURE VALIDATION
// ============================================================

describe('HTML Structure Validation', () => {
  const allTemplates = [
    {
      name: 'transferRequestReceived',
      fn: () => transferRequestReceivedTemplate(baseTransferRequestData),
    },
    {
      name: 'transferApproved',
      fn: () => transferApprovedTemplate(baseTransferApprovedData),
    },
    {
      name: 'transferDenied',
      fn: () => transferDeniedTemplate(baseTransferDeniedData),
    },
    {
      name: 'finalExitStatement',
      fn: () => finalExitStatementTemplate(baseFinalExitData),
    },
  ];

  it.each(allTemplates)('$name template should not throw errors', ({ fn }) => {
    expect(() => fn()).not.toThrow();
  });

  it.each(allTemplates)('$name template should return non-empty string', ({ fn }) => {
    const result = fn();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(100);
  });

  it.each(allTemplates)('$name template should have valid DOCTYPE', ({ fn }) => {
    const result = fn();
    expect(result).toMatch(/<!DOCTYPE html>/i);
  });

  it.each(allTemplates)('$name template should have complete HTML structure', ({ fn }) => {
    const result = fn();
    expect(result).toContain('<html');
    expect(result).toContain('</html>');
    expect(result).toContain('<body');
    expect(result).toContain('</body>');
    expect(result).toContain('<head');
    expect(result).toContain('</head>');
  });

  it.each(allTemplates)('$name template should have balanced table tags', ({ fn }) => {
    const result = fn();
    const openTables = (result.match(/<table/g) || []).length;
    const closeTables = (result.match(/<\/table>/g) || []).length;
    expect(openTables).toBe(closeTables);

    const openTr = (result.match(/<tr/g) || []).length;
    const closeTr = (result.match(/<\/tr>/g) || []).length;
    expect(openTr).toBe(closeTr);

    const openTd = (result.match(/<td/g) || []).length;
    const closeTd = (result.match(/<\/td>/g) || []).length;
    expect(openTd).toBe(closeTd);
  });

  it.each(allTemplates)('$name template should have email-compatible meta tags', ({ fn }) => {
    const result = fn();
    expect(result).toContain('charset="UTF-8"');
    expect(result).toContain('viewport');
  });

  it.each(allTemplates)('$name template should include footer text', ({ fn }) => {
    const result = fn();
    expect(result).toContain('automated message');
    expect(result).toContain('Investor Portal');
  });
});

// ============================================================
// EDGE CASES AND BOUNDARY CONDITIONS
// ============================================================

describe('Edge Cases', () => {
  describe('Empty and Minimal Data', () => {
    it('should handle minimal recipient name', () => {
      const html = transferRequestReceivedTemplate({
        ...baseTransferRequestData,
        recipientName: 'A',
      });

      expect(html).toContain('A');
      expect(html).toContain('Transfer Request Received');
    });

    it('should handle very long recipient name', () => {
      const longName = 'A'.repeat(200);
      const html = transferRequestReceivedTemplate({
        ...baseTransferRequestData,
        recipientName: longName,
      });

      expect(html).toContain(longName);
    });

    it('should handle very long fund name', () => {
      const longFundName = 'Acme Investment Partners Real Estate Opportunity Fund Series A LP I '.repeat(5);
      const html = transferApprovedTemplate({
        ...baseTransferApprovedData,
        fundName: longFundName,
      });

      expect(html).toContain(longFundName.substring(0, 50));
    });
  });

  describe('Special Characters', () => {
    it('should handle ampersands in names', () => {
      const html = transferRequestReceivedTemplate({
        ...baseTransferRequestData,
        recipientName: 'John & Jane Doe',
        fundName: 'Smith & Partners Fund',
      });

      expect(html).toContain('&amp;');
    });

    it('should handle quotes in content', () => {
      const html = transferDeniedTemplate({
        ...baseTransferDeniedData,
        denialReason: 'Per "Section 5.2" of the agreement',
      });

      expect(html).toContain('&quot;');
    });

    it('should handle unicode characters', () => {
      const html = transferApprovedTemplate({
        ...baseTransferApprovedData,
        recipientName: 'José García',
      });

      expect(html).toContain('José García');
    });

    it('should handle currency symbols in amounts', () => {
      const html = finalExitStatementTemplate({
        ...baseFinalExitData,
        exitSummary: {
          ...baseFinalExitData.exitSummary,
          totalInvested: '€500,000',
        },
      });

      expect(html).toContain('€500,000');
    });
  });

  describe('Exit Summary Edge Cases', () => {
    it('should handle zero amounts', () => {
      const html = finalExitStatementTemplate({
        ...baseFinalExitData,
        exitSummary: {
          totalInvested: '100,000',
          totalDistributions: '0',
          finalPayout: '95,000',
          exitDate: 'January 1, 2026',
        },
      });

      expect(html).toContain('Total Distributions');
    });

    it('should handle large amounts', () => {
      const html = finalExitStatementTemplate({
        ...baseFinalExitData,
        exitSummary: {
          totalInvested: '50,000,000',
          totalDistributions: '12,500,000',
          finalPayout: '67,500,000',
          exitDate: 'January 1, 2026',
        },
      });

      expect(html).toContain('50,000,000');
      expect(html).toContain('67,500,000');
    });
  });
});

// ============================================================
// TEMPLATE CONTENT CONSISTENCY
// ============================================================

describe('Template Content Consistency', () => {
  it('all templates should have consistent styling', () => {
    const templates = [
      transferRequestReceivedTemplate(baseTransferRequestData),
      transferApprovedTemplate(baseTransferApprovedData),
      transferDeniedTemplate(baseTransferDeniedData),
      finalExitStatementTemplate(baseFinalExitData),
    ];

    for (const html of templates) {
      // Should use consistent font family
      expect(html).toContain('font-family');
      
      // Should use consistent background color
      expect(html).toContain('#f4f4f7');
      
      // Should use consistent border radius
      expect(html).toContain('border-radius');
    }
  });

  it('all templates should include the fund name in signature', () => {
    expect(transferRequestReceivedTemplate(baseTransferRequestData)).toContain('Acme Real Estate Fund I Team');
    expect(transferApprovedTemplate(baseTransferApprovedData)).toContain('Acme Real Estate Fund I Team');
    expect(transferDeniedTemplate(baseTransferDeniedData)).toContain('Acme Real Estate Fund I Team');
    expect(finalExitStatementTemplate(baseFinalExitData)).toContain('Acme Real Estate Fund I Team');
  });
});

// ============================================================
// TYPE SAFETY TESTS
// ============================================================

describe('Type Safety', () => {
  it('TransferRequestReceivedTemplateData should require all fields', () => {
    // This test verifies TypeScript catches missing required fields at compile time
    const validData: TransferRequestReceivedTemplateData = {
      recipientName: 'Test',
      fundName: 'Fund',
      transferType: 'full',
      reviewTimeframe: '5 days',
      transferProcessNote: 'Note',
    };

    expect(() => transferRequestReceivedTemplate(validData)).not.toThrow();
  });

  it('TransferType should only accept full or partial', () => {
    // Valid transfer types
    const fullTransfer: TransferRequestReceivedTemplateData = {
      ...baseTransferRequestData,
      transferType: 'full',
    };
    const partialTransfer: TransferRequestReceivedTemplateData = {
      ...baseTransferRequestData,
      transferType: 'partial',
    };

    expect(() => transferRequestReceivedTemplate(fullTransfer)).not.toThrow();
    expect(() => transferRequestReceivedTemplate(partialTransfer)).not.toThrow();
  });

  it('FinalExitStatementTemplateData exitSummary should have all required fields', () => {
    const validData: FinalExitStatementTemplateData = {
      recipientName: 'Test',
      fundName: 'Fund',
      exitSummary: {
        totalInvested: '100',
        totalDistributions: '50',
        finalPayout: '150',
        exitDate: 'Jan 1, 2026',
      },
      exitClosingMessage: 'Goodbye',
    };

    expect(() => finalExitStatementTemplate(validData)).not.toThrow();
  });
});

// ============================================================
// INTEGRATION SCENARIOS
// ============================================================

describe('Integration Scenarios', () => {
  describe('Full Transfer Flow', () => {
    it('should produce consistent messaging across the flow', () => {
      const fundName = 'Acme Partners Fund III';
      const investorName = 'Michael Chen';

      // Step 1: Request received
      const requestHtml = transferRequestReceivedTemplate({
        recipientName: investorName,
        fundName,
        transferType: 'full',
        reviewTimeframe: '5-7 business days',
        transferProcessNote: 'We will review your request promptly.',
      });
      expect(requestHtml).toContain(investorName);
      expect(requestHtml).toContain(fundName);
      expect(requestHtml).toContain('Full Transfer');

      // Step 2: Approved
      const approvedHtml = transferApprovedTemplate({
        recipientName: investorName,
        fundName,
        effectiveDate: 'March 1, 2026',
        transferNextSteps: 'No action required.',
      });
      expect(approvedHtml).toContain(investorName);
      expect(approvedHtml).toContain(fundName);
      expect(approvedHtml).toContain('approved');

      // Step 3: Final exit
      const exitHtml = finalExitStatementTemplate({
        recipientName: investorName,
        fundName,
        exitSummary: {
          totalInvested: '250,000',
          totalDistributions: '62,500',
          finalPayout: '312,500',
          exitDate: 'March 1, 2026',
        },
        exitClosingMessage: 'Thank you for being part of our investor community.',
      });
      expect(exitHtml).toContain(investorName);
      expect(exitHtml).toContain(fundName);
      expect(exitHtml).toContain('fully liquidated');
    });
  });

  describe('Denial and Resubmission Flow', () => {
    it('should handle denial with alternative options', () => {
      const deniedHtml = transferDeniedTemplate({
        recipientName: 'Sarah Williams',
        fundName: 'Growth Fund IV',
        denialReason: 'Lock-up period in effect until Q2 2026.',
        transferDenialOptions: 'Please resubmit after April 1, 2026. Alternatively, contact us to discuss partial redemption options.',
      });

      expect(deniedHtml).toContain('Lock-up period');
      expect(deniedHtml).toContain('resubmit');
      expect(deniedHtml).toContain('partial redemption');
    });
  });
});
