/**
 * Team Invite Email Templates
 * Templates for inviting team members to join a fund
 */

import { escapeHtml, baseTemplate, primaryButton, header, content, infoBox } from './baseTemplate';

export interface TeamInviteTemplateData {
  recipientEmail: string;
  fundName: string;
  role: string;
  inviterName: string;
  acceptInviteUrl: string;
  expiresInDays?: number;
}

/**
 * Team Invite Email
 * Sent when a fund manager invites a team member to join their fund
 */
export const teamInviteTemplate = (data: TeamInviteTemplateData): string => {
  const safeFundName = escapeHtml(data.fundName);
  const safeRole = escapeHtml(data.role);
  const safeInviterName = escapeHtml(data.inviterName);
  const expiryDays = data.expiresInDays || 7;

  const roleDescriptions: Record<string, string> = {
    manager: 'full access to manage the fund, investors, and settings',
    accountant: 'access to K-1 management and investor tax data',
    attorney: 'access to legal documents and signing status',
    investor: 'access to view investments and fund updates',
  };

  const roleDescription = roleDescriptions[data.role.toLowerCase()] || `access as a ${safeRole}`;

  return baseTemplate(
    `
    ${header(`You're Invited to Join ${safeFundName}`)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hello,
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        <strong>${safeInviterName}</strong> has invited you to join <strong>${safeFundName}</strong> on Altsui as a <strong>${safeRole}</strong>.
      </p>
      <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        As a ${safeRole}, you'll have ${roleDescription}.
      </p>
      ${primaryButton('Accept Invitation', data.acceptInviteUrl)}
      ${infoBox(`This invitation will expire in ${expiryDays} days. Click the button above to create your account and join the team.`, 'info')}
      <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        If you weren't expecting this invitation, you can safely ignore this email.
      </p>
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        Best regards,<br>
        <strong>The Altsui Team</strong>
      </p>
    `)}
    `,
    `You've been invited to join ${safeFundName} as a ${safeRole}`
  );
};

export interface TeamInviteReminderTemplateData {
  recipientEmail: string;
  fundName: string;
  role: string;
  inviterName: string;
  acceptInviteUrl: string;
  expiresInDays?: number;
}

/**
 * Team Invite Reminder Email
 * Sent when a manager resends an invitation
 */
export const teamInviteReminderTemplate = (data: TeamInviteReminderTemplateData): string => {
  const safeFundName = escapeHtml(data.fundName);
  const safeRole = escapeHtml(data.role);
  const safeInviterName = escapeHtml(data.inviterName);
  const expiryDays = data.expiresInDays || 7;

  return baseTemplate(
    `
    ${header(`Reminder: Join ${safeFundName}`)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hello,
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        This is a reminder that <strong>${safeInviterName}</strong> has invited you to join <strong>${safeFundName}</strong> on Altsui as a <strong>${safeRole}</strong>.
      </p>
      <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Your invitation is still pending. Click below to accept and create your account.
      </p>
      ${primaryButton('Accept Invitation', data.acceptInviteUrl)}
      ${infoBox(`This invitation will expire in ${expiryDays} days.`, 'warning')}
      <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        If you don't want to join, you can ignore this email.
      </p>
    `)}
    `,
    `Reminder: You've been invited to join ${safeFundName}`
  );
};

