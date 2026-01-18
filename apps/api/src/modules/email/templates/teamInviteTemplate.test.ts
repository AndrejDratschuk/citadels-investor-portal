/**
 * Team Invite Email Templates Tests
 * Tests for team invitation and reminder email templates (Stage 07)
 */

import { describe, it, expect } from 'vitest';
import {
  teamInviteTemplate,
  teamInviteReminderTemplate,
  TeamInviteTemplateData,
  TeamInviteReminderTemplateData,
} from './teamInviteTemplate';

// Test data fixtures
const baseInviteData: TeamInviteTemplateData = {
  recipientEmail: 'john@example.com',
  fundName: 'Acme Real Estate Fund I',
  platformName: 'Altsui',
  role: 'accountant',
  inviterName: 'Jane Smith',
  inviterEmail: 'jane@acmefund.com',
  acceptInviteUrl: 'https://app.altsui.com/invite/accept?token=abc123',
  expiresInDays: 7,
};

const baseReminderData: TeamInviteReminderTemplateData = {
  recipientEmail: 'john@example.com',
  fundName: 'Acme Real Estate Fund I',
  platformName: 'Altsui',
  role: 'accountant',
  inviterName: 'Jane Smith',
  acceptInviteUrl: 'https://app.altsui.com/invite/accept?token=abc123',
  daysRemaining: 4,
};

describe('Team Invite Email Templates - Stage 07', () => {
  describe('07.01.A1 - Team Invitation', () => {
    it('should render with all required data', () => {
      const html = teamInviteTemplate(baseInviteData);

      expect(html).toContain('Jane Smith');
      expect(html).toContain('Acme Real Estate Fund I');
      expect(html).toContain('Altsui');
      expect(html).toContain('accountant');
      expect(html).toContain('Accept Invitation');
      expect(html).toContain('abc123');
    });

    it('should include inviter contact info', () => {
      const html = teamInviteTemplate(baseInviteData);

      expect(html).toContain('jane@acmefund.com');
      expect(html).toContain('mailto:jane@acmefund.com');
    });

    it('should show expiry days', () => {
      const html = teamInviteTemplate(baseInviteData);
      expect(html).toContain('7 days');
    });

    it('should include correct role description for manager', () => {
      const html = teamInviteTemplate({
        ...baseInviteData,
        role: 'manager',
      });

      expect(html).toContain('full access to manage the fund, investors, and settings');
    });

    it('should include correct role description for accountant', () => {
      const html = teamInviteTemplate({
        ...baseInviteData,
        role: 'accountant',
      });

      expect(html).toContain('K-1 management and investor tax data');
    });

    it('should include correct role description for attorney', () => {
      const html = teamInviteTemplate({
        ...baseInviteData,
        role: 'attorney',
      });

      expect(html).toContain('legal documents and signing status');
    });

    it('should handle custom roles gracefully', () => {
      const html = teamInviteTemplate({
        ...baseInviteData,
        role: 'custom_role',
      });

      expect(html).toContain('access as a custom_role');
    });

    it('should escape HTML in user input', () => {
      const html = teamInviteTemplate({
        ...baseInviteData,
        inviterName: '<script>alert("xss")</script>',
        fundName: '<img src=x onerror=alert(1)>',
      });

      // Should escape < and > to prevent actual HTML execution
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('<img src=x'); // Not the raw unescaped img tag
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('&lt;img'); // Properly escaped
    });

    it('should produce valid HTML structure', () => {
      const html = teamInviteTemplate(baseInviteData);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
      expect(html).toContain('<body');
      expect(html).toContain('</body>');
    });

    it('should use custom platform name', () => {
      const html = teamInviteTemplate({
        ...baseInviteData,
        platformName: 'LionShare Portal',
      });

      expect(html).toContain('LionShare Portal');
    });

    it('should use default expiry days when not provided', () => {
      const data = { ...baseInviteData };
      delete data.expiresInDays;
      const html = teamInviteTemplate(data);

      expect(html).toContain('7 days');
    });
  });

  describe('07.01.A2 - Team Invite Reminder', () => {
    it('should render with all required data', () => {
      const html = teamInviteReminderTemplate(baseReminderData);

      expect(html).toContain('Reminder');
      expect(html).toContain('Jane Smith');
      expect(html).toContain('Acme Real Estate Fund I');
      expect(html).toContain('Altsui');
      expect(html).toContain('accountant');
      expect(html).toContain('Accept Invitation');
    });

    it('should show days remaining', () => {
      const html = teamInviteReminderTemplate(baseReminderData);
      expect(html).toContain('4 days');
    });

    it('should handle 2 days remaining (Day 5 reminder)', () => {
      const html = teamInviteReminderTemplate({
        ...baseReminderData,
        daysRemaining: 2,
      });

      expect(html).toContain('2 days');
    });

    it('should escape HTML in user input', () => {
      const html = teamInviteReminderTemplate({
        ...baseReminderData,
        inviterName: '<script>evil()</script>',
      });

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should indicate invitation is still pending', () => {
      const html = teamInviteReminderTemplate(baseReminderData);
      expect(html).toContain('still pending');
    });

    it('should produce valid HTML structure', () => {
      const html = teamInviteReminderTemplate(baseReminderData);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
    });
  });

  describe('Template Consistency', () => {
    it('invite and reminder should have same button label', () => {
      const inviteHtml = teamInviteTemplate(baseInviteData);
      const reminderHtml = teamInviteReminderTemplate(baseReminderData);

      expect(inviteHtml).toContain('Accept Invitation');
      expect(reminderHtml).toContain('Accept Invitation');
    });

    it('both templates should include the accept URL', () => {
      const inviteHtml = teamInviteTemplate(baseInviteData);
      const reminderHtml = teamInviteReminderTemplate(baseReminderData);

      expect(inviteHtml).toContain('abc123');
      expect(reminderHtml).toContain('abc123');
    });
  });
});

describe('Subject Line Verification', () => {
  it('team invite should have correct subject format placeholder in preview', () => {
    const html = teamInviteTemplate(baseInviteData);
    // The preview text should mention being invited
    expect(html).toContain('invited to join');
  });

  it('reminder should indicate its a reminder in the header', () => {
    const html = teamInviteReminderTemplate(baseReminderData);
    expect(html).toContain('Reminder');
  });
});
