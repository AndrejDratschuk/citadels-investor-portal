/**
 * Investor Onboarding Templates Tests
 * Tests for Stage 02 email templates
 */

import { describe, it, expect } from 'vitest';
import {
  onboardingReminder1Template,
  onboardingReminder2Template,
  onboardingReminder3Template,
  documentUploadedPendingTemplate,
  documentsReadySignatureTemplate,
  signatureReminder1Template,
  signatureReminder2Template,
  documentsFullyExecutedTemplate,
  fundingInstructionsTemplate,
  fundingDiscrepancyTemplate,
  welcomeInvestorEnhancedTemplate,
  accountInvitationEnhancedTemplate,
} from './investorOnboardingTemplates';

// ============================================================
// Onboarding Reminder Templates
// ============================================================

describe('onboardingReminder1Template', () => {
  const baseData = {
    recipientName: 'John Doe',
    fundName: 'Acme Growth Fund',
    onboardingUrl: 'https://portal.example.com/investor/onboarding',
  };

  it('renders with all required fields', () => {
    const html = onboardingReminder1Template(baseData);

    expect(html).toContain('John Doe');
    expect(html).toContain('Acme Growth Fund');
    expect(html).toContain('Complete Your Investor Profile');
    expect(html).toContain('Continue Profile');
    expect(html).toContain(baseData.onboardingUrl);
  });

  it('escapes HTML in recipient name', () => {
    const data = { ...baseData, recipientName: '<script>alert("xss")</script>' };
    const html = onboardingReminder1Template(data);

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('includes fund name in team signature', () => {
    const html = onboardingReminder1Template(baseData);
    expect(html).toContain('Acme Growth Fund Team');
  });
});

describe('onboardingReminder2Template', () => {
  const baseData = {
    recipientName: 'Jane Smith',
    fundName: 'Acme Growth Fund',
    onboardingUrl: 'https://portal.example.com/investor/onboarding',
  };

  it('renders with incomplete profile messaging', () => {
    const html = onboardingReminder2Template(baseData);

    expect(html).toContain('Jane Smith');
    expect(html).toContain('Your Investor Profile is Incomplete');
    expect(html).toContain('Complete Profile');
    expect(html).toContain('few more minutes');
  });

  it('escapes HTML in fund name', () => {
    const data = { ...baseData, fundName: '<b>Dangerous Fund</b>' };
    const html = onboardingReminder2Template(data);

    expect(html).not.toContain('<b>Dangerous');
    expect(html).toContain('&lt;b&gt;');
  });
});

describe('onboardingReminder3Template', () => {
  const baseData = {
    recipientName: 'Bob Wilson',
    fundName: 'Acme Growth Fund',
    onboardingUrl: 'https://portal.example.com/investor/onboarding',
  };

  it('renders with final reminder messaging', () => {
    const html = onboardingReminder3Template(baseData);

    expect(html).toContain('Bob Wilson');
    expect(html).toContain('Final Reminder');
    expect(html).toContain('Complete Profile');
    expect(html).toContain('help you through the process');
  });
});

// ============================================================
// Document Templates
// ============================================================

describe('documentUploadedPendingTemplate', () => {
  const baseData = {
    recipientName: 'John Doe',
    fundName: 'Acme Growth Fund',
    documentType: 'Driver License',
    reviewTimeframe: '1-2 business days',
    portalUrl: 'https://portal.example.com/investor/documents',
  };

  it('renders with document type and timeframe', () => {
    const html = documentUploadedPendingTemplate(baseData);

    expect(html).toContain('John Doe');
    expect(html).toContain('Document Received');
    expect(html).toContain('Driver License');
    expect(html).toContain('1-2 business days');
    expect(html).toContain('View Your Documents');
  });

  it('escapes HTML in document type', () => {
    const data = { ...baseData, documentType: '<script>xss</script>' };
    const html = documentUploadedPendingTemplate(data);

    expect(html).not.toContain('<script>xss');
    expect(html).toContain('&lt;script&gt;');
  });
});

// ============================================================
// Signature Templates
// ============================================================

describe('documentsReadySignatureTemplate', () => {
  const baseData = {
    recipientName: 'John Doe',
    fundName: 'Acme Growth Fund',
    docusignUrl: 'https://docusign.example.com/sign/abc123',
  };

  it('renders with signature call to action', () => {
    const html = documentsReadySignatureTemplate(baseData);

    expect(html).toContain('John Doe');
    expect(html).toContain('Investment Documents Ready for Signature');
    expect(html).toContain('Sign Documents');
    expect(html).toContain(baseData.docusignUrl);
    expect(html).toContain('have been approved');
  });

  it('contains success info box', () => {
    const html = documentsReadySignatureTemplate(baseData);
    expect(html).toContain('verification documents have been approved');
  });
});

describe('signatureReminder1Template', () => {
  const baseData = {
    recipientName: 'Jane Smith',
    fundName: 'Acme Growth Fund',
    docusignUrl: 'https://docusign.example.com/sign/def456',
  };

  it('renders with reminder messaging', () => {
    const html = signatureReminder1Template(baseData);

    expect(html).toContain('Jane Smith');
    expect(html).toContain('Documents Awaiting Your Signature');
    expect(html).toContain('Complete Signature');
    expect(html).toContain(baseData.docusignUrl);
  });
});

describe('signatureReminder2Template', () => {
  const baseData = {
    recipientName: 'Bob Wilson',
    fundName: 'Acme Growth Fund',
    docusignUrl: 'https://docusign.example.com/sign/ghi789',
  };

  it('renders with final reminder messaging', () => {
    const html = signatureReminder2Template(baseData);

    expect(html).toContain('Bob Wilson');
    expect(html).toContain('Final Reminder');
    expect(html).toContain('Sign Now');
    expect(html).toContain('need assistance');
  });
});

// ============================================================
// Execution Templates
// ============================================================

describe('documentsFullyExecutedTemplate', () => {
  const baseData = {
    recipientName: 'John Doe',
    fundName: 'Acme Growth Fund',
    portalUrl: 'https://portal.example.com/investor/documents',
  };

  it('renders with execution confirmation', () => {
    const html = documentsFullyExecutedTemplate(baseData);

    expect(html).toContain('John Doe');
    expect(html).toContain('Investment Documents Executed');
    expect(html).toContain('View Executed Documents');
    expect(html).toContain('fully executed');
    expect(html).toContain('Next step');
    expect(html).toContain('wire instructions');
  });
});

// ============================================================
// Funding Templates
// ============================================================

describe('fundingInstructionsTemplate', () => {
  const baseData = {
    recipientName: 'John Doe',
    fundName: 'Acme Growth Fund',
    commitmentAmount: '250,000',
    fundingDeadline: 'January 31, 2026',
    bankName: 'First National Bank',
    routingNumber: '123456789',
    accountNumber: '987654321',
    referenceCode: 'INV-JD-2026-001',
    portalUrl: 'https://portal.example.com/investor',
  };

  it('renders with wire instructions', () => {
    const html = fundingInstructionsTemplate(baseData);

    expect(html).toContain('John Doe');
    expect(html).toContain('Funding Instructions');
    expect(html).toContain('$250,000');
    expect(html).toContain('January 31, 2026');
    expect(html).toContain('First National Bank');
    expect(html).toContain('123456789');
    expect(html).toContain('987654321');
    expect(html).toContain('INV-JD-2026-001');
    expect(html).toContain('View in Portal');
  });

  it('includes reference code warning', () => {
    const html = fundingInstructionsTemplate(baseData);
    expect(html).toContain('include the reference code');
  });

  it('escapes HTML in bank details', () => {
    const data = { ...baseData, bankName: '<script>hack</script>' };
    const html = fundingInstructionsTemplate(data);

    expect(html).not.toContain('<script>hack');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('fundingDiscrepancyTemplate', () => {
  const baseData = {
    recipientName: 'John Doe',
    fundName: 'Acme Growth Fund',
    commitmentAmount: '250,000',
    receivedAmount: '200,000',
    varianceAmount: '50,000',
    managerName: 'Sarah Manager',
    managerTitle: 'Fund Manager',
  };

  it('renders with discrepancy details', () => {
    const html = fundingDiscrepancyTemplate(baseData);

    expect(html).toContain('John Doe');
    expect(html).toContain('Funding Discrepancy');
    expect(html).toContain('$250,000');
    expect(html).toContain('$200,000');
    expect(html).toContain('$50,000');
    expect(html).toContain('Sarah Manager');
    expect(html).toContain('Fund Manager');
  });

  it('highlights the variance amount', () => {
    const html = fundingDiscrepancyTemplate(baseData);
    expect(html).toContain('Difference');
  });
});

// ============================================================
// Welcome Template
// ============================================================

describe('welcomeInvestorEnhancedTemplate', () => {
  const baseData = {
    recipientName: 'John Doe',
    fundName: 'Acme Growth Fund',
    investmentAmount: '250,000',
    investmentDate: 'January 15, 2026',
    portalUrl: 'https://portal.example.com/investor',
    platformName: 'Lionshare Portal',
    managerName: 'Sarah Manager',
    managerTitle: 'Managing Partner',
  };

  it('renders with investment details', () => {
    const html = welcomeInvestorEnhancedTemplate(baseData);

    expect(html).toContain('John Doe');
    expect(html).toContain('Welcome to Acme Growth Fund');
    expect(html).toContain('$250,000');
    expect(html).toContain('January 15, 2026');
    expect(html).toContain('Login to Portal');
    expect(html).toContain('Congratulations');
  });

  it('includes platform features list', () => {
    const html = welcomeInvestorEnhancedTemplate(baseData);

    expect(html).toContain('Investment documents');
    expect(html).toContain('Performance reports');
    expect(html).toContain('Capital call');
    expect(html).toContain('Direct communication');
  });

  it('includes platform name', () => {
    const html = welcomeInvestorEnhancedTemplate(baseData);
    expect(html).toContain('Lionshare Portal');
  });

  it('includes manager signature', () => {
    const html = welcomeInvestorEnhancedTemplate(baseData);
    expect(html).toContain('Sarah Manager');
    expect(html).toContain('Managing Partner');
  });

  it('renders optional welcome message when provided', () => {
    const data = {
      ...baseData,
      welcomeMessage: 'Thank you for joining our fund family!',
    };
    const html = welcomeInvestorEnhancedTemplate(data);

    expect(html).toContain('Thank you for joining our fund family!');
  });

  it('omits welcome message section when not provided', () => {
    const html = welcomeInvestorEnhancedTemplate(baseData);
    // Should not have the bordered message box if no welcome message
    expect(html).not.toContain('border-left: 4px solid #1e40af;');
  });
});

// ============================================================
// Account Invitation Template
// ============================================================

describe('accountInvitationEnhancedTemplate', () => {
  const baseData = {
    recipientName: 'John Doe',
    fundName: 'Acme Growth Fund',
    accountCreationUrl: 'https://portal.example.com/create-account/token123',
    platformName: 'Lionshare Portal',
    managerName: 'Sarah Manager',
    managerTitle: 'Managing Partner',
  };

  it('renders with account creation CTA', () => {
    const html = accountInvitationEnhancedTemplate(baseData);

    expect(html).toContain('John Doe');
    expect(html).toContain('Create Your Investor Account');
    expect(html).toContain('Create Your Account');
    expect(html).toContain(baseData.accountCreationUrl);
    expect(html).toContain('Thank you for our conversation');
  });

  it('includes platform name', () => {
    const html = accountInvitationEnhancedTemplate(baseData);
    expect(html).toContain('Lionshare Portal');
    expect(html).toContain('24/7 access');
  });

  it('includes manager signature', () => {
    const html = accountInvitationEnhancedTemplate(baseData);
    expect(html).toContain('Sarah Manager');
    expect(html).toContain('Managing Partner');
    expect(html).toContain('Best regards');
  });

  it('renders post meeting recap when provided', () => {
    const data = {
      ...baseData,
      postMeetingRecap: 'We discussed the 8% target return and 5-year hold period.',
    };
    const html = accountInvitationEnhancedTemplate(data);

    expect(html).toContain('We discussed the 8% target return');
  });

  it('omits recap section when not provided', () => {
    const html = accountInvitationEnhancedTemplate(baseData);
    // Should not have the bordered recap box if no recap
    const recapBoxCount = (html.match(/border-left: 4px solid #1e40af/g) || []).length;
    expect(recapBoxCount).toBe(0);
  });

  it('includes time estimate info box', () => {
    const html = accountInvitationEnhancedTemplate(baseData);
    expect(html).toContain('5 minutes');
  });
});

// ============================================================
// HTML Structure Tests
// ============================================================

describe('HTML Structure', () => {
  it('all templates produce valid HTML document structure', () => {
    const templates = [
      onboardingReminder1Template({
        recipientName: 'Test',
        fundName: 'Test Fund',
        onboardingUrl: 'https://example.com',
      }),
      documentUploadedPendingTemplate({
        recipientName: 'Test',
        fundName: 'Test Fund',
        documentType: 'ID',
        reviewTimeframe: '1 day',
        portalUrl: 'https://example.com',
      }),
      fundingInstructionsTemplate({
        recipientName: 'Test',
        fundName: 'Test Fund',
        commitmentAmount: '100,000',
        fundingDeadline: '2026-01-31',
        bankName: 'Bank',
        routingNumber: '123',
        accountNumber: '456',
        referenceCode: 'REF',
        portalUrl: 'https://example.com',
      }),
    ];

    for (const html of templates) {
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
      expect(html).toContain('<body');
      expect(html).toContain('</body>');
    }
  });

  it('all templates contain preheader text', () => {
    const html = fundingInstructionsTemplate({
      recipientName: 'Test',
      fundName: 'Test Fund',
      commitmentAmount: '100,000',
      fundingDeadline: '2026-01-31',
      bankName: 'Bank',
      routingNumber: '123',
      accountNumber: '456',
      referenceCode: 'REF',
      portalUrl: 'https://example.com',
    });

    // Preheader is hidden span for email clients
    expect(html).toContain('display: none');
  });
});

// ============================================================
// XSS Prevention Tests
// ============================================================

describe('XSS Prevention', () => {
  const xssPayloads = [
    '<script>alert("xss")</script>',
    '"><img src=x onerror=alert(1)>',
    "javascript:alert('xss')",
    '<iframe src="evil.com">',
    '{{constructor.constructor("alert(1)")()}}',
  ];

  it('escapes XSS payloads in recipient name', () => {
    for (const payload of xssPayloads) {
      const html = onboardingReminder1Template({
        recipientName: payload,
        fundName: 'Safe Fund',
        onboardingUrl: 'https://example.com',
      });

      expect(html).not.toContain(payload);
    }
  });

  it('escapes XSS payloads in fund name', () => {
    for (const payload of xssPayloads) {
      const html = onboardingReminder1Template({
        recipientName: 'Safe User',
        fundName: payload,
        onboardingUrl: 'https://example.com',
      });

      expect(html).not.toContain(payload);
    }
  });

  it('escapes XSS payloads in wire instructions', () => {
    for (const payload of xssPayloads) {
      const html = fundingInstructionsTemplate({
        recipientName: 'Test',
        fundName: 'Test Fund',
        commitmentAmount: '100,000',
        fundingDeadline: '2026-01-31',
        bankName: payload,
        routingNumber: payload,
        accountNumber: payload,
        referenceCode: payload,
        portalUrl: 'https://example.com',
      });

      expect(html).not.toContain(payload);
    }
  });
});
