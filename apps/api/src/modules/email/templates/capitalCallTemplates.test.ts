/**
 * Capital Call Email Templates Tests
 * Tests for all capital call, distribution, and refinance email templates
 */

import { describe, it, expect } from 'vitest';
import {
  capitalCallRequestTemplate,
  wireConfirmationTemplate,
  wireIssueTemplate,
  capitalCallReminder7Template,
  capitalCallReminder3Template,
  capitalCallReminder1Template,
  capitalCallPastDueTemplate,
  capitalCallPastDue7Template,
  capitalCallDefaultTemplate,
  distributionNoticeTemplate,
  distributionSentTemplate,
  distributionElectionTemplate,
  refinanceNoticeTemplate,
} from './capitalCallTemplates';

// ============================================================
// CAPITAL CALL REQUEST TEMPLATE
// ============================================================

describe('capitalCallRequestTemplate', () => {
  const baseData = {
    recipientName: 'John Doe',
    fundName: 'Acme Fund I',
    dealName: 'Downtown Office Building',
    amountDue: '50,000',
    deadline: 'January 31, 2026',
    capitalCallNumber: '2026-001',
    wireInstructionsUrl: 'https://app.example.com/investor/capital-calls/123',
    wireInstructions: {
      bankName: 'First National Bank',
      routingNumber: '123456789',
      accountNumber: '987654321',
      referenceCode: 'CC-2026-001-ABCD1234',
    },
  };

  it('should render with all required fields', () => {
    const html = capitalCallRequestTemplate(baseData);

    expect(html).toContain('John Doe');
    expect(html).toContain('Acme Fund I');
    expect(html).toContain('Downtown Office Building');
    expect(html).toContain('50,000');
    expect(html).toContain('January 31, 2026');
    expect(html).toContain('2026-001');
  });

  it('should include wire instructions', () => {
    const html = capitalCallRequestTemplate(baseData);

    expect(html).toContain('First National Bank');
    expect(html).toContain('123456789');
    expect(html).toContain('987654321');
    expect(html).toContain('CC-2026-001-ABCD1234');
  });

  it('should include optional purpose when provided', () => {
    const dataWithPurpose = {
      ...baseData,
      purpose: 'Property acquisition closing costs',
    };

    const html = capitalCallRequestTemplate(dataWithPurpose);
    expect(html).toContain('Property acquisition closing costs');
  });

  it('should escape HTML in user input', () => {
    const dataWithXSS = {
      ...baseData,
      recipientName: '<script>alert("xss")</script>',
    };

    const html = capitalCallRequestTemplate(dataWithXSS);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

// ============================================================
// WIRE CONFIRMATION TEMPLATE
// ============================================================

describe('wireConfirmationTemplate', () => {
  const baseData = {
    recipientName: 'Jane Smith',
    fundName: 'Acme Fund I',
    amountReceived: '50,000',
    dateReceived: 'January 15, 2026',
    capitalCallNumber: '2026-001',
    confirmationNumber: 'CONF-ABC123',
    dashboardUrl: 'https://app.example.com/investor/dashboard',
  };

  it('should render with all required fields', () => {
    const html = wireConfirmationTemplate(baseData);

    expect(html).toContain('Jane Smith');
    expect(html).toContain('Acme Fund I');
    expect(html).toContain('50,000');
    expect(html).toContain('January 15, 2026');
    expect(html).toContain('2026-001');
    expect(html).toContain('CONF-ABC123');
  });

  it('should include success message', () => {
    const html = wireConfirmationTemplate(baseData);
    expect(html).toContain('received');
    expect(html).toContain('Thank you');
  });
});

// ============================================================
// WIRE ISSUE TEMPLATE
// ============================================================

describe('wireIssueTemplate', () => {
  const baseData = {
    recipientName: 'Bob Wilson',
    fundName: 'Acme Fund I',
    issueDescription: 'Wire amount does not match capital call amount',
    capitalCallNumber: '2026-001',
    wireInstructionsUrl: 'https://app.example.com/investor/capital-calls/123',
    wireInstructions: {
      bankName: 'First National Bank',
      routingNumber: '123456789',
      accountNumber: '987654321',
      referenceCode: 'CC-2026-001-WXYZ5678',
    },
  };

  it('should render with issue description', () => {
    const html = wireIssueTemplate(baseData);

    expect(html).toContain('Bob Wilson');
    expect(html).toContain('Wire amount does not match capital call amount');
    expect(html).toContain('Action Required');
  });

  it('should show amount discrepancy when provided', () => {
    const dataWithAmounts = {
      ...baseData,
      expectedAmount: '50,000',
      receivedAmount: '45,000',
    };

    const html = wireIssueTemplate(dataWithAmounts);
    expect(html).toContain('50,000');
    expect(html).toContain('45,000');
  });
});

// ============================================================
// CAPITAL CALL REMINDER TEMPLATES
// ============================================================

describe('capitalCallReminder7Template', () => {
  const baseData = {
    recipientName: 'Alice Brown',
    fundName: 'Acme Fund I',
    amountDue: '75,000',
    deadline: 'February 15, 2026',
    capitalCallNumber: '2026-002',
    wireInstructionsUrl: 'https://app.example.com/investor/capital-calls/456',
  };

  it('should mention 7 days remaining', () => {
    const html = capitalCallReminder7Template(baseData);

    expect(html).toContain('7 days');
    expect(html).toContain('Alice Brown');
    expect(html).toContain('75,000');
    expect(html).toContain('February 15, 2026');
  });
});

describe('capitalCallReminder3Template', () => {
  const baseData = {
    recipientName: 'Charlie Davis',
    fundName: 'Acme Fund I',
    amountDue: '100,000',
    deadline: 'March 1, 2026',
    capitalCallNumber: '2026-003',
    wireInstructionsUrl: 'https://app.example.com/investor/capital-calls/789',
  };

  it('should mention 3 days remaining', () => {
    const html = capitalCallReminder3Template(baseData);

    expect(html).toContain('3 days');
    expect(html).toContain('Charlie Davis');
    expect(html).toContain('100,000');
  });

  it('should prompt to initiate wire promptly', () => {
    const html = capitalCallReminder3Template(baseData);
    expect(html).toContain('promptly');
  });
});

describe('capitalCallReminder1Template', () => {
  const baseData = {
    recipientName: 'Diana Evans',
    fundName: 'Acme Fund I',
    amountDue: '25,000',
    deadline: 'March 10, 2026',
    capitalCallNumber: '2026-004',
    wireInstructionsUrl: 'https://app.example.com/investor/capital-calls/101',
  };

  it('should mention due tomorrow', () => {
    const html = capitalCallReminder1Template(baseData);

    expect(html).toContain('tomorrow');
    expect(html).toContain('REMINDER');
    expect(html).toContain('Diana Evans');
  });

  it('should note to disregard if already sent', () => {
    const html = capitalCallReminder1Template(baseData);
    expect(html).toContain('already initiated');
    expect(html).toContain('disregard');
  });
});

// ============================================================
// PAST DUE AND DEFAULT TEMPLATES
// ============================================================

describe('capitalCallPastDueTemplate', () => {
  const baseData = {
    recipientName: 'Frank Garcia',
    fundName: 'Acme Fund I',
    amountDue: '60,000',
    deadline: 'January 15, 2026',
    daysPastDue: '3',
    capitalCallNumber: '2026-001',
    wireInstructionsUrl: 'https://app.example.com/investor/capital-calls/201',
    managerName: 'Sarah Manager',
    managerTitle: 'Managing Partner',
  };

  it('should show URGENT and past due status', () => {
    const html = capitalCallPastDueTemplate(baseData);

    expect(html).toContain('URGENT');
    expect(html).toContain('Past Due');
    expect(html).toContain('Frank Garcia');
    expect(html).toContain('3');
  });

  it('should warn about dilution penalties', () => {
    const html = capitalCallPastDueTemplate(baseData);
    expect(html).toContain('dilution');
    expect(html).toContain('penalties');
  });

  it('should include manager contact info', () => {
    const html = capitalCallPastDueTemplate(baseData);
    expect(html).toContain('Sarah Manager');
    expect(html).toContain('Managing Partner');
  });
});

describe('capitalCallPastDue7Template', () => {
  const baseData = {
    recipientName: 'Grace Harris',
    fundName: 'Acme Fund I',
    amountDue: '80,000',
    deadline: 'January 1, 2026',
    daysPastDue: '10',
    capitalCallNumber: '2026-001',
    defaultSection: 'Section 4.2',
    managerName: 'Tom Director',
    managerPhone: '555-123-4567',
  };

  it('should show 7+ days past due urgency', () => {
    const html = capitalCallPastDue7Template(baseData);

    expect(html).toContain('URGENT');
    expect(html).toContain('7+ Days Past Due');
    expect(html).toContain('10');
  });

  it('should reference operating agreement section', () => {
    const html = capitalCallPastDue7Template(baseData);
    expect(html).toContain('Section 4.2');
    expect(html).toContain('Operating Agreement');
  });

  it('should warn about default proceedings', () => {
    const html = capitalCallPastDue7Template(baseData);
    expect(html).toContain('default');
  });
});

describe('capitalCallDefaultTemplate', () => {
  const baseData = {
    recipientName: 'Henry Irving',
    fundName: 'Acme Fund I',
    amountDue: '100,000',
    daysPastDue: '30',
    capitalCallNumber: '2026-001',
    defaultSection: 'Section 4.3',
    legalDefaultNoticeContent: '<p>You are hereby notified of default per the Operating Agreement.</p>',
  };

  it('should show formal Notice of Default', () => {
    const html = capitalCallDefaultTemplate(baseData);

    expect(html).toContain('Notice of Default');
    expect(html).toContain('formal notice');
    expect(html).toContain('Henry Irving');
  });

  it('should include legal content', () => {
    const html = capitalCallDefaultTemplate(baseData);
    expect(html).toContain('hereby notified');
    expect(html).toContain('Operating Agreement');
  });

  it('should reference the default section', () => {
    const html = capitalCallDefaultTemplate(baseData);
    expect(html).toContain('Section 4.3');
  });
});

// ============================================================
// DISTRIBUTION TEMPLATES
// ============================================================

describe('distributionNoticeTemplate', () => {
  const baseData = {
    recipientName: 'Irene Johnson',
    fundName: 'Acme Fund I',
    distributionAmount: '15,000',
    distributionType: 'Quarterly Distribution',
    paymentDate: 'February 1, 2026',
    paymentMethod: 'Wire',
    distributionDetailsUrl: 'https://app.example.com/investor/distributions/301',
  };

  it('should render distribution details', () => {
    const html = distributionNoticeTemplate(baseData);

    expect(html).toContain('Irene Johnson');
    expect(html).toContain('15,000');
    expect(html).toContain('Quarterly Distribution');
    expect(html).toContain('February 1, 2026');
    expect(html).toContain('Wire');
  });

  it('should include tax advisor notice', () => {
    const html = distributionNoticeTemplate(baseData);
    expect(html).toContain('tax advisor');
  });
});

describe('distributionSentTemplate', () => {
  const baseData = {
    recipientName: 'Jack King',
    fundName: 'Acme Fund I',
    distributionAmount: '20,000',
    dateSent: 'February 3, 2026',
    paymentMethod: 'ACH',
    confirmationNumber: 'DIST-XYZ789',
    arrivalTimeframe: '2-3 business days',
    portalUrl: 'https://app.example.com/investor/distributions',
  };

  it('should confirm distribution sent', () => {
    const html = distributionSentTemplate(baseData);

    expect(html).toContain('Jack King');
    expect(html).toContain('20,000');
    expect(html).toContain('has been sent');
    expect(html).toContain('DIST-XYZ789');
  });

  it('should show expected arrival timeframe', () => {
    const html = distributionSentTemplate(baseData);
    expect(html).toContain('2-3 business days');
  });
});

describe('distributionElectionTemplate', () => {
  const baseData = {
    recipientName: 'Karen Lee',
    fundName: 'Acme Fund I',
    eligibleAmount: '35,000',
    source: 'Property Sale Proceeds',
    electionDeadline: 'February 28, 2026',
    receiveDistributionUrl: 'https://app.example.com/investor/elections/401?action=distribute',
    reinvestUrl: 'https://app.example.com/investor/elections/401?action=reinvest',
  };

  it('should present election options', () => {
    const html = distributionElectionTemplate(baseData);

    expect(html).toContain('Karen Lee');
    expect(html).toContain('35,000');
    expect(html).toContain('Property Sale Proceeds');
    expect(html).toContain('Election Required');
  });

  it('should include both action buttons', () => {
    const html = distributionElectionTemplate(baseData);
    expect(html).toContain('Receive Distribution');
    expect(html).toContain('Reinvest');
  });

  it('should show election deadline', () => {
    const html = distributionElectionTemplate(baseData);
    expect(html).toContain('February 28, 2026');
    expect(html).toContain('Deadline');
  });

  it('should mention default election', () => {
    const html = distributionElectionTemplate(baseData);
    expect(html).toContain('default election');
    expect(html).toContain('subscription agreement');
  });
});

// ============================================================
// REFINANCE TEMPLATE
// ============================================================

describe('refinanceNoticeTemplate', () => {
  const baseData = {
    recipientName: 'Laura Martinez',
    fundName: 'Acme Fund I',
    propertyName: 'Riverfront Office Complex',
    refinanceSummary: '<p>New loan: $5,000,000 at 5.5% fixed for 10 years.</p><p>Cash out: $500,000</p>',
    propertyDetailsUrl: 'https://app.example.com/investor/properties/501',
  };

  it('should announce refinance completion', () => {
    const html = refinanceNoticeTemplate(baseData);

    expect(html).toContain('Laura Martinez');
    expect(html).toContain('Riverfront Office Complex');
    expect(html).toContain('Refinance Completed');
  });

  it('should include refinance summary', () => {
    const html = refinanceNoticeTemplate(baseData);
    expect(html).toContain('5,000,000');
    expect(html).toContain('5.5%');
  });

  it('should mention future distribution election notice', () => {
    const html = refinanceNoticeTemplate(baseData);
    expect(html).toContain('notified separately');
    expect(html).toContain('distribution elections');
  });
});

// ============================================================
// XSS PROTECTION TESTS
// ============================================================

describe('XSS Protection', () => {
  it('should escape HTML in reminder templates', () => {
    const maliciousData = {
      recipientName: '<img src=x onerror=alert(1)>',
      fundName: 'Test<script>Fund',
      amountDue: '50,000',
      deadline: 'Test Date',
      capitalCallNumber: '001',
      wireInstructionsUrl: 'https://example.com',
    };

    const html = capitalCallReminder7Template(maliciousData);
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;');
  });

  it('should escape HTML in distribution templates', () => {
    const maliciousData = {
      recipientName: '"><script>alert("xss")</script>',
      fundName: 'Test Fund',
      distributionAmount: '10,000',
      distributionType: 'Test',
      paymentDate: 'Test Date',
      paymentMethod: 'Wire',
      distributionDetailsUrl: 'https://example.com',
    };

    const html = distributionNoticeTemplate(maliciousData);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
