/**
 * Prospect Email Templates Tests
 * Ensures all 17 Stage 01 email templates render correctly without errors
 */

import { describe, it, expect } from 'vitest';
import {
  kycInviteTemplate,
  kycAutoSendTemplate,
  kycReminder1Template,
  kycReminder2Template,
  kycReminder3Template,
  meetingInviteTemplate,
  kycNotEligibleTemplate,
  meetingReminder24hrTemplate,
  meetingReminder15minTemplate,
  meetingNoShowTemplate,
  postMeetingProceedTemplate,
  postMeetingConsideringTemplate,
  nurtureDay15Template,
  nurtureDay23Template,
  nurtureDay30Template,
  dormantCloseoutTemplate,
  postMeetingNotFitTemplate,
} from './prospectTemplates';

// Test data fixtures
const baseTestData = {
  recipientName: 'John Doe',
  fundName: 'Acme Real Estate Fund I',
  managerName: 'Jane Smith',
};

describe('Prospect Email Templates - Stage 01', () => {
  describe('01.01.A1 - KYC Invite (Manual)', () => {
    it('should render with minimal required data', () => {
      const html = kycInviteTemplate({
        recipientName: 'John Doe',
        fundName: 'Acme Fund',
        kycUrl: 'https://example.com/kyc/abc123',
        managerName: 'Jane Smith',
      });

      expect(html).toContain('John Doe');
      expect(html).toContain('Acme Fund');
      expect(html).toContain('https://example.com/kyc/abc123');
      expect(html).toContain('Jane Smith');
      expect(html).toContain('Investment Opportunity');
      expect(html).toContain('Complete Pre-Qualification');
    });

    it('should render with optional credentials and title', () => {
      const html = kycInviteTemplate({
        recipientName: 'John Doe',
        fundName: 'Acme Fund',
        kycUrl: 'https://example.com/kyc/abc123',
        managerName: 'Jane Smith',
        managerTitle: 'Managing Partner',
        managerNameWithCredentials: 'Jane Smith, CAIA',
        investmentBriefDescriptor: 'in South Florida multifamily real estate',
      });

      expect(html).toContain('Managing Partner');
      expect(html).toContain('Jane Smith, CAIA');
      expect(html).toContain('in South Florida multifamily real estate');
    });

    it('should escape HTML in user input', () => {
      const html = kycInviteTemplate({
        recipientName: '<script>alert("xss")</script>',
        fundName: 'Acme Fund',
        kycUrl: 'https://example.com/kyc',
        managerName: 'Jane',
      });

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should produce valid HTML structure', () => {
      const html = kycInviteTemplate({
        recipientName: 'John',
        fundName: 'Fund',
        kycUrl: 'https://url.com',
        managerName: 'Jane',
      });

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
      expect(html).toContain('<body');
      expect(html).toContain('</body>');
    });
  });

  describe('01.02.A1 - KYC Auto-Send', () => {
    it('should render correctly', () => {
      const html = kycAutoSendTemplate({
        recipientName: 'John Doe',
        fundName: 'Acme Fund',
        kycUrl: 'https://example.com/kyc/abc123',
      });

      expect(html).toContain('Thanks for Your Interest');
      expect(html).toContain('John Doe');
      expect(html).toContain('Complete Pre-Qualification');
      expect(html).toContain('24-48 hours');
    });
  });

  describe('01.02.B1 - KYC Reminder #1 (+48hr)', () => {
    it('should render correctly', () => {
      const html = kycReminder1Template({
        recipientName: 'John Doe',
        fundName: 'Acme Fund',
        kycUrl: 'https://example.com/kyc/abc123',
      });

      expect(html).toContain('Complete Your Pre-Qualification');
      expect(html).toContain("haven't completed it yet");
      expect(html).toContain('Continue Where You Left Off');
      expect(html).toContain('3 minutes');
    });
  });

  describe('01.02.B2 - KYC Reminder #2 (+5 days)', () => {
    it('should render correctly', () => {
      const html = kycReminder2Template({
        recipientName: 'John Doe',
        fundName: 'Acme Fund',
        kycUrl: 'https://example.com/kyc/abc123',
      });

      expect(html).toContain('Still Interested?');
      expect(html).toContain('still waiting');
      expect(html).toContain('Complete Pre-Qualification');
    });
  });

  describe('01.02.B3 - KYC Reminder #3 (Final, +10 days)', () => {
    it('should render correctly with keep me updated option', () => {
      const html = kycReminder3Template({
        recipientName: 'John Doe',
        fundName: 'Acme Fund',
        kycUrl: 'https://example.com/kyc/abc123',
        keepMeUpdatedUrl: 'https://example.com/subscribe',
      });

      expect(html).toContain('Last Reminder');
      expect(html).toContain('final reminder');
      expect(html).toContain('Keep Me Updated');
      expect(html).toContain('https://example.com/subscribe');
    });
  });

  describe('01.03.A1 - Meeting Invite (KYC Approved)', () => {
    it('should render correctly', () => {
      const html = meetingInviteTemplate({
        recipientName: 'John Doe',
        fundName: 'Acme Fund',
        calendlyUrl: 'https://calendly.com/acme',
      });

      expect(html).toContain('Pre-Qualified');
      expect(html).toContain('Schedule Your Call');
      expect(html).toContain('Schedule Call');
      expect(html).toContain('no commitment required');
    });

    it('should include manager credentials when provided', () => {
      const html = meetingInviteTemplate({
        recipientName: 'John Doe',
        fundName: 'Acme Fund',
        calendlyUrl: 'https://calendly.com/acme',
        managerNameWithCredentials: 'Jane Smith, CAIA, CFA',
      });

      expect(html).toContain('Jane Smith, CAIA, CFA');
    });
  });

  describe('01.03.C1 - KYC Not Eligible', () => {
    it('should render correctly', () => {
      const html = kycNotEligibleTemplate({
        recipientName: 'John Doe',
        fundName: 'Acme Fund',
      });

      expect(html).toContain('Thank You for Your Interest');
      expect(html).toContain('accredited investors');
      expect(html).toContain('SEC regulations');
    });

    it('should include custom education content', () => {
      const html = kycNotEligibleTemplate({
        recipientName: 'John Doe',
        fundName: 'Acme Fund',
        accreditationEducationContent: 'Learn more about accreditation at sec.gov',
      });

      expect(html).toContain('Learn more about accreditation at sec.gov');
    });
  });

  describe('01.04.A1 - Meeting Reminder (24hr)', () => {
    it('should render correctly with meeting details', () => {
      const html = meetingReminder24hrTemplate({
        recipientName: 'John Doe',
        fundName: 'Acme Fund',
        managerName: 'Jane Smith',
        meetingDate: 'Monday, January 20, 2026',
        meetingTime: '2:00 PM',
        timezone: 'EST',
        meetingLink: 'https://zoom.us/j/123',
      });

      expect(html).toContain('Tomorrow');
      expect(html).toContain('Jane Smith');
      expect(html).toContain('Monday, January 20, 2026');
      expect(html).toContain('2:00 PM');
      expect(html).toContain('EST');
      expect(html).toContain('Join Meeting');
    });

    it('should include pre-meeting materials when provided', () => {
      const html = meetingReminder24hrTemplate({
        recipientName: 'John',
        fundName: 'Fund',
        managerName: 'Jane',
        meetingDate: 'Monday',
        meetingTime: '2 PM',
        timezone: 'EST',
        meetingLink: 'https://zoom.us',
        preMeetingMaterials: 'Please review our deck at https://deck.com',
      });

      expect(html).toContain('Please review our deck');
    });
  });

  describe('01.04.A2 - Meeting Reminder (15min)', () => {
    it('should render correctly', () => {
      const html = meetingReminder15minTemplate({
        recipientName: 'John Doe',
        managerName: 'Jane Smith',
        meetingLink: 'https://zoom.us/j/123',
      });

      expect(html).toContain('Starting Soon');
      expect(html).toContain('15 minutes');
      expect(html).toContain('Join Meeting');
      expect(html).toContain('See you soon');
    });
  });

  describe('01.05.B1 - Meeting No-Show', () => {
    it('should render correctly', () => {
      const html = meetingNoShowTemplate({
        recipientName: 'John Doe',
        fundName: 'Acme Fund',
        managerName: 'Jane Smith',
        calendlyUrl: 'https://calendly.com/acme',
      });

      expect(html).toContain('Reschedule');
      expect(html).toContain('missed you');
      expect(html).toContain('Pick a New Time');
    });
  });

  describe('01.06.A1 - Post-Meeting: Proceed', () => {
    it('should render correctly', () => {
      const html = postMeetingProceedTemplate({
        recipientName: 'John Doe',
        fundName: 'Acme Fund',
        managerName: 'Jane Smith',
        accountCreationUrl: 'https://example.com/create-account/abc123',
      });

      expect(html).toContain('Create Your Investor Account');
      expect(html).toContain('Thank you for our conversation');
      expect(html).toContain('Create Account');
      expect(html).toContain('5 minutes');
    });

    it('should include custom platform name and recap', () => {
      const html = postMeetingProceedTemplate({
        recipientName: 'John',
        fundName: 'Fund',
        managerName: 'Jane',
        accountCreationUrl: 'https://url.com',
        platformName: 'Lionshare Portal',
        postMeetingRecap: 'We discussed your interest in multifamily investments.',
      });

      expect(html).toContain('Lionshare Portal');
      expect(html).toContain('multifamily investments');
    });
  });

  describe('01.06.B1 - Post-Meeting: Considering', () => {
    it('should render correctly', () => {
      const html = postMeetingConsideringTemplate({
        recipientName: 'John Doe',
        fundName: 'Acme Fund',
        managerName: 'Jane Smith',
        readyToInvestUrl: 'https://example.com/ready/abc123',
      });

      expect(html).toContain("When You're Ready");
      expect(html).toContain("I'm Ready to Invest");
      expect(html).toContain('available whenever');
    });

    it('should include meeting recap and materials links', () => {
      const html = postMeetingConsideringTemplate({
        recipientName: 'John',
        fundName: 'Fund',
        managerName: 'Jane',
        readyToInvestUrl: 'https://url.com',
        meetingRecapBullets: 'Key points: 8% target returns, 5-year hold.',
        deckLink: 'https://deck.com',
        ppmPreviewLink: 'https://ppm.com',
      });

      expect(html).toContain('8% target returns');
      expect(html).toContain('Investment Deck');
      expect(html).toContain('PPM Preview');
    });
  });

  describe('01.06.B2 - Nurture Day 15', () => {
    it('should render correctly', () => {
      const html = nurtureDay15Template({
        recipientName: 'John Doe',
        fundName: 'Acme Fund',
        managerName: 'Jane Smith',
        scheduleFollowUpUrl: 'https://calendly.com/acme',
        readyToInvestUrl: 'https://example.com/ready/abc123',
      });

      expect(html).toContain('Checking In');
      expect(html).toContain('follow up');
      expect(html).toContain('Schedule a Follow-Up');
      expect(html).toContain("I'm Ready to Invest");
    });
  });

  describe('01.06.B3 - Nurture Day 23', () => {
    it('should render correctly', () => {
      const html = nurtureDay23Template({
        recipientName: 'John Doe',
        fundName: 'Acme Fund',
        managerName: 'Jane Smith',
        letsTalkUrl: 'https://calendly.com/acme',
        readyToInvestUrl: 'https://example.com/ready/abc123',
      });

      expect(html).toContain('Quick Update');
      expect(html).toContain("Let's Talk");
      expect(html).toContain("I'm Ready to Invest");
    });

    it('should include nurture update content when provided', () => {
      const html = nurtureDay23Template({
        recipientName: 'John',
        fundName: 'Fund',
        managerName: 'Jane',
        letsTalkUrl: 'https://url.com',
        readyToInvestUrl: 'https://url.com',
        nurtureUpdateContent: 'We just closed on a new property in Miami!',
      });

      expect(html).toContain('new property in Miami');
    });
  });

  describe('01.06.B4 - Nurture Day 30 (Final)', () => {
    it('should render correctly', () => {
      const html = nurtureDay30Template({
        recipientName: 'John Doe',
        fundName: 'Acme Fund',
        managerName: 'Jane Smith',
        readyToInvestUrl: 'https://example.com/ready/abc123',
        keepMeUpdatedUrl: 'https://example.com/subscribe',
      });

      expect(html).toContain('Final Follow-Up');
      expect(html).toContain('one more time');
      expect(html).toContain("I'm Ready to Invest");
      expect(html).toContain('Keep Me Updated');
    });
  });

  describe('01.06.B5 - Dormant Close-Out', () => {
    it('should render correctly', () => {
      const html = dormantCloseoutTemplate({
        recipientName: 'John Doe',
        fundName: 'Acme Fund',
        managerName: 'Jane Smith',
        keepMeUpdatedUrl: 'https://example.com/subscribe',
      });

      expect(html).toContain('Thank You');
      expect(html).toContain("timing isn't right");
      expect(html).toContain('Keep Me Updated');
      expect(html).toContain('continued success');
    });
  });

  describe('01.06.C1 - Post-Meeting: Not a Fit', () => {
    it('should render correctly', () => {
      const html = postMeetingNotFitTemplate({
        recipientName: 'John Doe',
        fundName: 'Acme Fund',
        managerName: 'Jane Smith',
        keepMeInformedUrl: 'https://example.com/subscribe',
      });

      expect(html).toContain('Thank You for Your Time');
      expect(html).toContain('not be the best fit');
      expect(html).toContain('Keep Me Informed');
      expect(html).toContain('alternative investments');
    });

    it('should include custom investment descriptor', () => {
      const html = postMeetingNotFitTemplate({
        recipientName: 'John',
        fundName: 'Fund',
        managerName: 'Jane',
        keepMeInformedUrl: 'https://url.com',
        investmentBriefDescriptor: 'South Florida multifamily',
      });

      expect(html).toContain('South Florida multifamily');
    });
  });
});

describe('Template HTML Validation', () => {
  const allTemplates = [
    {
      name: 'kycInvite',
      fn: () =>
        kycInviteTemplate({
          recipientName: 'Test',
          fundName: 'Fund',
          kycUrl: 'https://url.com',
          managerName: 'Manager',
        }),
    },
    {
      name: 'kycAutoSend',
      fn: () =>
        kycAutoSendTemplate({
          recipientName: 'Test',
          fundName: 'Fund',
          kycUrl: 'https://url.com',
        }),
    },
    {
      name: 'kycReminder1',
      fn: () =>
        kycReminder1Template({
          recipientName: 'Test',
          fundName: 'Fund',
          kycUrl: 'https://url.com',
        }),
    },
    {
      name: 'kycReminder2',
      fn: () =>
        kycReminder2Template({
          recipientName: 'Test',
          fundName: 'Fund',
          kycUrl: 'https://url.com',
        }),
    },
    {
      name: 'kycReminder3',
      fn: () =>
        kycReminder3Template({
          recipientName: 'Test',
          fundName: 'Fund',
          kycUrl: 'https://url.com',
          keepMeUpdatedUrl: 'https://url.com',
        }),
    },
    {
      name: 'meetingInvite',
      fn: () =>
        meetingInviteTemplate({
          recipientName: 'Test',
          fundName: 'Fund',
          calendlyUrl: 'https://url.com',
        }),
    },
    {
      name: 'kycNotEligible',
      fn: () =>
        kycNotEligibleTemplate({
          recipientName: 'Test',
          fundName: 'Fund',
        }),
    },
    {
      name: 'meetingReminder24hr',
      fn: () =>
        meetingReminder24hrTemplate({
          recipientName: 'Test',
          fundName: 'Fund',
          managerName: 'Manager',
          meetingDate: 'Monday',
          meetingTime: '2 PM',
          timezone: 'EST',
          meetingLink: 'https://url.com',
        }),
    },
    {
      name: 'meetingReminder15min',
      fn: () =>
        meetingReminder15minTemplate({
          recipientName: 'Test',
          managerName: 'Manager',
          meetingLink: 'https://url.com',
        }),
    },
    {
      name: 'meetingNoShow',
      fn: () =>
        meetingNoShowTemplate({
          recipientName: 'Test',
          fundName: 'Fund',
          managerName: 'Manager',
          calendlyUrl: 'https://url.com',
        }),
    },
    {
      name: 'postMeetingProceed',
      fn: () =>
        postMeetingProceedTemplate({
          recipientName: 'Test',
          fundName: 'Fund',
          managerName: 'Manager',
          accountCreationUrl: 'https://url.com',
        }),
    },
    {
      name: 'postMeetingConsidering',
      fn: () =>
        postMeetingConsideringTemplate({
          recipientName: 'Test',
          fundName: 'Fund',
          managerName: 'Manager',
          readyToInvestUrl: 'https://url.com',
        }),
    },
    {
      name: 'nurtureDay15',
      fn: () =>
        nurtureDay15Template({
          recipientName: 'Test',
          fundName: 'Fund',
          managerName: 'Manager',
          scheduleFollowUpUrl: 'https://url.com',
          readyToInvestUrl: 'https://url.com',
        }),
    },
    {
      name: 'nurtureDay23',
      fn: () =>
        nurtureDay23Template({
          recipientName: 'Test',
          fundName: 'Fund',
          managerName: 'Manager',
          letsTalkUrl: 'https://url.com',
          readyToInvestUrl: 'https://url.com',
        }),
    },
    {
      name: 'nurtureDay30',
      fn: () =>
        nurtureDay30Template({
          recipientName: 'Test',
          fundName: 'Fund',
          managerName: 'Manager',
          readyToInvestUrl: 'https://url.com',
          keepMeUpdatedUrl: 'https://url.com',
        }),
    },
    {
      name: 'dormantCloseout',
      fn: () =>
        dormantCloseoutTemplate({
          recipientName: 'Test',
          fundName: 'Fund',
          managerName: 'Manager',
          keepMeUpdatedUrl: 'https://url.com',
        }),
    },
    {
      name: 'postMeetingNotFit',
      fn: () =>
        postMeetingNotFitTemplate({
          recipientName: 'Test',
          fundName: 'Fund',
          managerName: 'Manager',
          keepMeInformedUrl: 'https://url.com',
        }),
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

  it.each(allTemplates)('$name template should have balanced HTML tags', ({ fn }) => {
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
});
