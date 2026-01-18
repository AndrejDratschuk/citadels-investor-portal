/**
 * Prospect/KYC Email Templates
 * Stage 01: 17 emails for the prospect pipeline
 * Based on Lionshare_Stage_01_Emails_Final specification
 */

import {
  escapeHtml,
  baseTemplate,
  primaryButton,
  secondaryButton,
  buttonRow,
  header,
  content,
  infoBox,
  detailBox,
} from './baseTemplate';

// ============================================================================
// Template Data Interfaces
// ============================================================================

export interface KYCInviteTemplateData {
  recipientName: string;
  fundName: string;
  kycUrl: string;
  managerName: string;
  managerTitle?: string;
  managerNameWithCredentials?: string;
  investmentBriefDescriptor?: string;
}

export interface KYCAutoSendTemplateData {
  recipientName: string;
  fundName: string;
  kycUrl: string;
}

export interface KYCReminder1TemplateData {
  recipientName: string;
  fundName: string;
  kycUrl: string;
}

export interface KYCReminder2TemplateData {
  recipientName: string;
  fundName: string;
  kycUrl: string;
}

export interface KYCReminder3TemplateData {
  recipientName: string;
  fundName: string;
  kycUrl: string;
  keepMeUpdatedUrl: string;
}

export interface MeetingInviteTemplateData {
  recipientName: string;
  fundName: string;
  calendlyUrl: string;
  managerNameWithCredentials?: string;
}

export interface KYCNotEligibleTemplateData {
  recipientName: string;
  fundName: string;
  accreditationEducationContent?: string;
}

export interface MeetingReminder24hrTemplateData {
  recipientName: string;
  fundName: string;
  managerName: string;
  managerTitle?: string;
  meetingDate: string;
  meetingTime: string;
  timezone: string;
  meetingLink: string;
  preMeetingMaterials?: string;
}

export interface MeetingReminder15minTemplateData {
  recipientName: string;
  managerName: string;
  meetingLink: string;
}

export interface MeetingNoShowTemplateData {
  recipientName: string;
  fundName: string;
  managerName: string;
  managerTitle?: string;
  calendlyUrl: string;
}

export interface PostMeetingProceedTemplateData {
  recipientName: string;
  fundName: string;
  managerName: string;
  managerTitle?: string;
  accountCreationUrl: string;
  platformName?: string;
  postMeetingRecap?: string;
}

export interface PostMeetingConsideringTemplateData {
  recipientName: string;
  fundName: string;
  managerName: string;
  managerTitle?: string;
  readyToInvestUrl: string;
  meetingRecapBullets?: string;
  deckLink?: string;
  ppmPreviewLink?: string;
  consideringSupportMessage?: string;
}

export interface NurtureDay15TemplateData {
  recipientName: string;
  fundName: string;
  managerName: string;
  scheduleFollowUpUrl: string;
  readyToInvestUrl: string;
}

export interface NurtureDay23TemplateData {
  recipientName: string;
  fundName: string;
  managerName: string;
  letsTalkUrl: string;
  readyToInvestUrl: string;
  nurtureUpdateContent?: string;
}

export interface NurtureDay30TemplateData {
  recipientName: string;
  fundName: string;
  managerName: string;
  readyToInvestUrl: string;
  keepMeUpdatedUrl: string;
}

export interface DormantCloseoutTemplateData {
  recipientName: string;
  fundName: string;
  managerName: string;
  keepMeUpdatedUrl: string;
}

export interface PostMeetingNotFitTemplateData {
  recipientName: string;
  fundName: string;
  managerName: string;
  keepMeInformedUrl: string;
  investmentBriefDescriptor?: string;
}

// Legacy interfaces for backwards compatibility
export interface KYCReminderTemplateData {
  recipientName: string;
  fundName: string;
  kycUrl: string;
}

export interface PostMeetingOnboardingTemplateData {
  recipientName: string;
  fundName: string;
  accountCreationUrl: string;
  managerName?: string;
}

// ============================================================================
// 01.01.A1 — KYC Invitation (Manual)
// ============================================================================
export const kycInviteTemplate = (data: KYCInviteTemplateData): string => {
  const safeName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeManagerName = escapeHtml(data.managerName);
  const safeManagerTitle = data.managerTitle ? escapeHtml(data.managerTitle) : '';
  const safeCredentials = data.managerNameWithCredentials
    ? escapeHtml(data.managerNameWithCredentials)
    : safeManagerName;
  const safeDescriptor = data.investmentBriefDescriptor
    ? escapeHtml(data.investmentBriefDescriptor)
    : '';

  return baseTemplate(
    `
    ${header('Investment Opportunity', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        ${safeManagerName} from ${safeFundName} has invited you to explore an investment opportunity${safeDescriptor ? ` ${safeDescriptor}` : ''}.
      </p>
      <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        To get started, please complete this brief pre-qualification form (takes 3-4 minutes):
      </p>
      ${primaryButton('Complete Pre-Qualification', data.kycUrl)}
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        This confirms your eligibility as an accredited investor. Once confirmed, you'll receive a calendar link to schedule a brief call with ${safeCredentials}.
      </p>
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        Best regards,<br>
        <strong>${safeManagerName}</strong>${safeManagerTitle ? `<br>${safeManagerTitle}` : ''}
      </p>
    `)}
    `,
    'You have been invited to explore an investment opportunity'
  );
};

// ============================================================================
// 01.02.A1 — KYC Auto-Send
// ============================================================================
export const kycAutoSendTemplate = (data: KYCAutoSendTemplateData): string => {
  const safeName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);

  return baseTemplate(
    `
    ${header('Thanks for Your Interest', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Thank you for your interest in ${safeFundName}.
      </p>
      <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        <strong>Next step:</strong> Complete this brief pre-qualification form (3-4 minutes):
      </p>
      ${primaryButton('Complete Pre-Qualification', data.kycUrl)}
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        This confirms your eligibility as an accredited investor. You'll hear back within 24-48 hours.
      </p>
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        ${safeFundName} Team
      </p>
    `)}
    `,
    'Complete your pre-qualification to continue'
  );
};

// ============================================================================
// 01.02.B1 — KYC Reminder #1 (+48hr)
// ============================================================================
export const kycReminder1Template = (data: KYCReminder1TemplateData): string => {
  const safeName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);

  return baseTemplate(
    `
    ${header('Complete Your Pre-Qualification', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeName},
      </p>
      <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        You started the pre-qualification process but haven't completed it yet.
      </p>
      ${primaryButton('Continue Where You Left Off', data.kycUrl)}
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        This takes about 3 minutes to finish.
      </p>
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        Questions? Reply to this email or call us directly.
      </p>
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        ${safeFundName} Team
      </p>
    `)}
    `,
    'Complete your pre-qualification form'
  );
};

// ============================================================================
// 01.02.B2 — KYC Reminder #2 (+5 days)
// ============================================================================
export const kycReminder2Template = (data: KYCReminder2TemplateData): string => {
  const safeName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);

  return baseTemplate(
    `
    ${header('Still Interested?', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeName},
      </p>
      <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Your pre-qualification form is still waiting for you.
      </p>
      ${primaryButton('Complete Pre-Qualification', data.kycUrl)}
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        If you have any questions, feel free to reply to this email.
      </p>
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        ${safeFundName} Team
      </p>
    `)}
    `,
    'Your pre-qualification form is waiting'
  );
};

// ============================================================================
// 01.02.B3 — KYC Reminder #3 (Final, +10 days)
// ============================================================================
export const kycReminder3Template = (data: KYCReminder3TemplateData): string => {
  const safeName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);

  return baseTemplate(
    `
    ${header('Last Reminder', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeName},
      </p>
      <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        This is a final reminder to complete your pre-qualification for ${safeFundName}.
      </p>
      ${primaryButton('Complete Pre-Qualification', data.kycUrl)}
      <p style="margin: 16px 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        If this isn't the right time, no problem. Click here to receive updates on future investment opportunities.
      </p>
      ${secondaryButton('Keep Me Updated', data.keepMeUpdatedUrl)}
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        ${safeFundName} Team
      </p>
    `)}
    `,
    'Final reminder: Complete your pre-qualification'
  );
};

// ============================================================================
// 01.03.A1 — Meeting Invite (KYC Approved)
// ============================================================================
export const meetingInviteTemplate = (data: MeetingInviteTemplateData): string => {
  const safeName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeCredentials = data.managerNameWithCredentials
    ? escapeHtml(data.managerNameWithCredentials)
    : 'our team';

  return baseTemplate(
    `
    ${header('Pre-Qualified - Schedule Your Call', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeName},
      </p>
      ${infoBox("Great news—you're pre-qualified as an accredited investor.", 'success')}
      <p style="margin: 16px 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        <strong>Next step:</strong> Schedule a brief 15-minute call with ${safeCredentials} to discuss the opportunity:
      </p>
      ${primaryButton('Schedule Call', data.calendlyUrl)}
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        This call is simply to answer your questions and confirm mutual fit—no commitment required.
      </p>
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        ${safeFundName} Team
      </p>
    `)}
    `,
    "You're pre-qualified! Schedule your call."
  );
};

// ============================================================================
// 01.03.C1 — KYC Not Eligible
// ============================================================================
export const kycNotEligibleTemplate = (data: KYCNotEligibleTemplateData): string => {
  const safeName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeEducation = data.accreditationEducationContent
    ? escapeHtml(data.accreditationEducationContent)
    : '';

  return baseTemplate(
    `
    ${header('Thank You for Your Interest', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Thank you for your interest in ${safeFundName}.
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Based on the information provided, this investment opportunity is limited to accredited investors under SEC regulations.
      </p>
      ${safeEducation ? `<p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">${safeEducation}</p>` : ''}
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        If your circumstances change, we'd welcome the opportunity to reconnect.
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        We appreciate your interest and wish you success in your investment endeavors.
      </p>
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        ${safeFundName} Team
      </p>
    `)}
    `,
    'Thank you for your interest'
  );
};

// ============================================================================
// 01.04.A1 — Meeting Reminder (24hr)
// ============================================================================
export const meetingReminder24hrTemplate = (data: MeetingReminder24hrTemplateData): string => {
  const safeName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeManagerName = escapeHtml(data.managerName);
  const safeManagerTitle = data.managerTitle ? escapeHtml(data.managerTitle) : '';

  return baseTemplate(
    `
    ${header(`Tomorrow: Your Call with ${safeManagerName}`, safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        This is a reminder of your scheduled call:
      </p>
      ${detailBox([
        { label: 'Date', value: escapeHtml(data.meetingDate) },
        { label: 'Time', value: `${escapeHtml(data.meetingTime)} ${escapeHtml(data.timezone)}` },
      ])}
      ${primaryButton('Join Meeting', data.meetingLink)}
      ${data.preMeetingMaterials ? `<p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">${escapeHtml(data.preMeetingMaterials)}</p>` : ''}
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Looking forward to speaking with you.
      </p>
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        ${safeManagerName}${safeManagerTitle ? `<br>${safeManagerTitle}` : ''}
      </p>
    `)}
    `,
    'Reminder: Your call is tomorrow'
  );
};

// ============================================================================
// 01.04.A2 — Meeting Reminder (15min)
// ============================================================================
export const meetingReminder15minTemplate = (data: MeetingReminder15minTemplateData): string => {
  const safeName = escapeHtml(data.recipientName);
  const safeManagerName = escapeHtml(data.managerName);

  return baseTemplate(
    `
    ${header(`Starting Soon: Your Call with ${safeManagerName}`)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeName},
      </p>
      <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Your call starts in 15 minutes.
      </p>
      ${primaryButton('Join Meeting', data.meetingLink)}
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        See you soon.<br>
        ${safeManagerName}
      </p>
    `)}
    `,
    'Your call starts in 15 minutes'
  );
};

// ============================================================================
// 01.05.B1 — Meeting No-Show
// ============================================================================
export const meetingNoShowTemplate = (data: MeetingNoShowTemplateData): string => {
  const safeName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeManagerName = escapeHtml(data.managerName);
  const safeManagerTitle = data.managerTitle ? escapeHtml(data.managerTitle) : '';

  return baseTemplate(
    `
    ${header("Let's Reschedule", safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeName},
      </p>
      <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        We missed you for our scheduled call. No problem—schedules change.
      </p>
      ${primaryButton('Pick a New Time', data.calendlyUrl)}
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        If you have any questions in the meantime, feel free to reply to this email.
      </p>
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        ${safeManagerName}${safeManagerTitle ? `<br>${safeManagerTitle}` : ''}
      </p>
    `)}
    `,
    "Let's find a new time to connect"
  );
};

// ============================================================================
// 01.06.A1 — Post-Meeting: Proceed
// ============================================================================
export const postMeetingProceedTemplate = (data: PostMeetingProceedTemplateData): string => {
  const safeName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeManagerName = escapeHtml(data.managerName);
  const safeManagerTitle = data.managerTitle ? escapeHtml(data.managerTitle) : '';
  const safePlatformName = data.platformName ? escapeHtml(data.platformName) : 'Investor Portal';
  const safeRecap = data.postMeetingRecap
    ? escapeHtml(data.postMeetingRecap)
    : 'It was great learning about your investment objectives.';

  return baseTemplate(
    `
    ${header('Create Your Investor Account', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Thank you for our conversation.
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        ${safeRecap}
      </p>
      <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        To move forward with your investment, please create your secure investor account:
      </p>
      ${primaryButton('Create Account', data.accountCreationUrl)}
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Your ${safePlatformName} portal gives you 24/7 access to documents, performance data, and direct communication with the fund.
      </p>
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        This takes about 5 minutes.
      </p>
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        ${safeManagerName}${safeManagerTitle ? `<br>${safeManagerTitle}` : ''}
      </p>
    `)}
    `,
    'Create your investor account to proceed'
  );
};

// ============================================================================
// 01.06.B1 — Post-Meeting: Considering
// ============================================================================
export const postMeetingConsideringTemplate = (data: PostMeetingConsideringTemplateData): string => {
  const safeName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeManagerName = escapeHtml(data.managerName);
  const safeManagerTitle = data.managerTitle ? escapeHtml(data.managerTitle) : '';
  const safeSupportMsg = data.consideringSupportMessage
    ? escapeHtml(data.consideringSupportMessage)
    : "I'm available whenever you have questions—just reply or schedule time.";

  return baseTemplate(
    `
    ${header(`${safeFundName} - Next Steps When You're Ready`, safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Thank you for taking the time to discuss ${safeFundName}.
      </p>
      ${data.meetingRecapBullets ? `<p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">${escapeHtml(data.meetingRecapBullets)}</p>` : ''}
      <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        When you're ready to move forward:
      </p>
      ${primaryButton("I'm Ready to Invest", data.readyToInvestUrl)}
      ${(data.deckLink || data.ppmPreviewLink) ? `
      <p style="margin: 16px 0 8px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        In the meantime, here are the materials we discussed:
      </p>
      <ul style="margin: 0 0 16px 0; padding-left: 24px; font-size: 16px; color: #374151; line-height: 1.8;">
        ${data.deckLink ? `<li><a href="${data.deckLink}" style="color: #1e40af;">Investment Deck</a></li>` : ''}
        ${data.ppmPreviewLink ? `<li><a href="${data.ppmPreviewLink}" style="color: #1e40af;">PPM Preview</a></li>` : ''}
      </ul>
      ` : ''}
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        ${safeSupportMsg}
      </p>
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        ${safeManagerName}${safeManagerTitle ? `<br>${safeManagerTitle}` : ''}
      </p>
    `)}
    `,
    "Next steps when you're ready to invest"
  );
};

// ============================================================================
// 01.06.B2 — Nurture Day 15
// ============================================================================
export const nurtureDay15Template = (data: NurtureDay15TemplateData): string => {
  const safeName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeManagerName = escapeHtml(data.managerName);

  return baseTemplate(
    `
    ${header('Checking In', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeName},
      </p>
      <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        I wanted to follow up on our conversation about ${safeFundName}.
      </p>
      <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        If you have any questions or would like to discuss further, I'm happy to connect.
      </p>
      ${buttonRow([
        { text: 'Schedule a Follow-Up', url: data.scheduleFollowUpUrl, primary: false },
        { text: "I'm Ready to Invest", url: data.readyToInvestUrl, primary: true },
      ])}
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        ${safeManagerName}
      </p>
    `)}
    `,
    'Following up on our conversation'
  );
};

// ============================================================================
// 01.06.B3 — Nurture Day 23
// ============================================================================
export const nurtureDay23Template = (data: NurtureDay23TemplateData): string => {
  const safeName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeManagerName = escapeHtml(data.managerName);
  const safeUpdate = data.nurtureUpdateContent ? escapeHtml(data.nurtureUpdateContent) : '';

  return baseTemplate(
    `
    ${header(`${safeFundName} - Quick Update`, safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        I wanted to share a quick update on ${safeFundName} and see if you had any remaining questions.
      </p>
      ${safeUpdate ? `<p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">${safeUpdate}</p>` : ''}
      ${buttonRow([
        { text: "Let's Talk", url: data.letsTalkUrl, primary: false },
        { text: "I'm Ready to Invest", url: data.readyToInvestUrl, primary: true },
      ])}
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        ${safeManagerName}
      </p>
    `)}
    `,
    'Quick update and checking in'
  );
};

// ============================================================================
// 01.06.B4 — Nurture Day 30 (Final)
// ============================================================================
export const nurtureDay30Template = (data: NurtureDay30TemplateData): string => {
  const safeName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeManagerName = escapeHtml(data.managerName);

  return baseTemplate(
    `
    ${header('Final Follow-Up', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        I'm reaching out one more time regarding ${safeFundName}.
      </p>
      <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        If this isn't the right time, I completely understand—I'll plan to reconnect in a few months.
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        If you'd like to move forward:
      </p>
      ${primaryButton("I'm Ready to Invest", data.readyToInvestUrl)}
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Or if you'd prefer to stay informed about future opportunities:
      </p>
      ${secondaryButton('Keep Me Updated', data.keepMeUpdatedUrl)}
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        Best regards,<br>
        ${safeManagerName}
      </p>
    `)}
    `,
    'Final follow-up regarding the investment'
  );
};

// ============================================================================
// 01.06.B5 — Dormant Close-Out
// ============================================================================
export const dormantCloseoutTemplate = (data: DormantCloseoutTemplateData): string => {
  const safeName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeManagerName = escapeHtml(data.managerName);

  return baseTemplate(
    `
    ${header('Thank You', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Thank you for taking the time to learn about ${safeFundName}.
      </p>
      <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        I understand the timing isn't right at the moment.
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        If you'd like to receive occasional market insights and future opportunities, click below.
      </p>
      ${primaryButton('Keep Me Updated', data.keepMeUpdatedUrl)}
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        Wishing you continued success.<br>
        ${safeManagerName}
      </p>
    `)}
    `,
    'Thank you for your interest'
  );
};

// ============================================================================
// 01.06.C1 — Post-Meeting: Not a Fit
// ============================================================================
export const postMeetingNotFitTemplate = (data: PostMeetingNotFitTemplateData): string => {
  const safeName = escapeHtml(data.recipientName);
  const safeFundName = escapeHtml(data.fundName);
  const safeManagerName = escapeHtml(data.managerName);
  const safeDescriptor = data.investmentBriefDescriptor
    ? escapeHtml(data.investmentBriefDescriptor)
    : 'alternative investments';

  return baseTemplate(
    `
    ${header('Thank You for Your Time', safeFundName)}
    ${content(`
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${safeName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        Thank you for taking the time to speak with us about ${safeFundName}.
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        After our conversation, we've determined that this particular opportunity may not be the best fit at this time.
      </p>
      <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        We occasionally share insights on the ${safeDescriptor} market—click here if you'd like to stay informed.
      </p>
      ${primaryButton('Keep Me Informed', data.keepMeInformedUrl)}
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
        We appreciate your interest and wish you success in your investment endeavors.
      </p>
      <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
        Best regards,<br>
        ${safeManagerName}
      </p>
    `)}
    `,
    'Thank you for your time'
  );
};

// ============================================================================
// Legacy Template Aliases (Backwards Compatibility)
// ============================================================================

/**
 * @deprecated Use kycReminder1Template instead
 */
export const kycReminderTemplate = kycReminder1Template;

/**
 * @deprecated Use postMeetingProceedTemplate instead
 */
export const postMeetingOnboardingTemplate = (data: PostMeetingOnboardingTemplateData): string => {
  return postMeetingProceedTemplate({
    recipientName: data.recipientName,
    fundName: data.fundName,
    managerName: data.managerName || data.fundName,
    accountCreationUrl: data.accountCreationUrl,
  });
};

