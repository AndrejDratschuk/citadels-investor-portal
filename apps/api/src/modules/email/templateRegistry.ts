/**
 * Email Template Registry
 * Defines all email templates with metadata, variables, and default content
 */

import { escapeHtml, baseTemplate, primaryButton, secondaryButton, buttonRow, header, content, infoBox, detailBox } from './templates/baseTemplate';

// ============================================================================
// Type Definitions
// ============================================================================

export interface TemplateVariable {
  key: string;
  label: string;
  description: string;
  example?: string;
}

export type TemplateCategory = 
  | 'prospect'
  | 'investor_onboarding'
  | 'capital_calls'
  | 'reporting'
  | 'compliance'
  | 'exit_transfer'
  | 'team'
  | 'internal';

export interface TemplateDefinition {
  key: string;
  name: string;
  description: string;
  category: TemplateCategory;
  variables: TemplateVariable[];
  defaultSubject: string;
  defaultBody: string;
}

export interface TemplateWithStatus extends TemplateDefinition {
  isCustomized: boolean;
  customSubject?: string;
  customBody?: string;
}

// ============================================================================
// Common Variables (shared across many templates)
// ============================================================================

const commonVariables: TemplateVariable[] = [
  { key: 'recipientName', label: 'Recipient Name', description: 'First name of the email recipient', example: 'John' },
  { key: 'fundName', label: 'Fund Name', description: 'Name of the investment fund', example: 'Citadel Growth Fund I' },
  { key: 'managerName', label: 'Manager Name', description: 'Name of the fund manager', example: 'Sarah Johnson' },
  { key: 'platformName', label: 'Platform Name', description: 'Name of the investment platform', example: 'Citadel' },
];

const managerVariables: TemplateVariable[] = [
  { key: 'managerTitle', label: 'Manager Title', description: 'Job title of the fund manager', example: 'Managing Partner' },
  { key: 'managerNameWithCredentials', label: 'Manager Name with Credentials', description: 'Manager name with professional credentials', example: 'Sarah Johnson, CFA' },
];

// ============================================================================
// Category Labels
// ============================================================================

export const categoryLabels: Record<TemplateCategory, string> = {
  prospect: 'Prospect Pipeline',
  investor_onboarding: 'Investor Onboarding',
  capital_calls: 'Capital Calls & Distributions',
  reporting: 'Reporting & Tax',
  compliance: 'Compliance & Re-Verification',
  exit_transfer: 'Exit & Transfer',
  team: 'Team Management',
  internal: 'Internal Notifications',
};

// ============================================================================
// Helper: Generate default HTML body wrapper
// ============================================================================

function wrapBody(headerTitle: string, headerSubtitle: string, bodyContent: string, preheaderText: string = ''): string {
  return `${header(headerTitle, headerSubtitle)}
${content(bodyContent)}`;
}

// ============================================================================
// Template Definitions
// ============================================================================

export const templateRegistry: TemplateDefinition[] = [
  // ==========================================================================
  // PROSPECT PIPELINE (Stage 01)
  // ==========================================================================
  {
    key: 'kycInvite',
    name: 'KYC Invitation',
    description: 'Initial invitation to complete pre-qualification form',
    category: 'prospect',
    variables: [
      ...commonVariables,
      ...managerVariables,
      { key: 'kycUrl', label: 'KYC URL', description: 'Link to the pre-qualification form', example: 'https://app.citadel.com/kyc/abc123' },
      { key: 'investmentBriefDescriptor', label: 'Investment Brief', description: 'Brief description of the investment opportunity', example: 'in South Florida multifamily real estate' },
    ],
    defaultSubject: 'Investment Opportunity - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>{{managerName}} from {{fundName}} has invited you to explore an investment opportunity{{investmentBriefDescriptor}}.</p>
<p>To get started, please complete this brief pre-qualification form (takes 3-4 minutes):</p>
<p><a href="{{kycUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Complete Pre-Qualification</a></p>
<p>This confirms your eligibility as an accredited investor. Once confirmed, you'll receive a calendar link to schedule a brief call with {{managerNameWithCredentials}}.</p>
<p>Best regards,<br><strong>{{managerName}}</strong><br>{{managerTitle}}</p>`,
  },
  {
    key: 'kycAutoSend',
    name: 'KYC Auto-Send',
    description: 'Automatic response when prospect expresses interest',
    category: 'prospect',
    variables: [
      ...commonVariables,
      { key: 'kycUrl', label: 'KYC URL', description: 'Link to the pre-qualification form', example: 'https://app.citadel.com/kyc/abc123' },
    ],
    defaultSubject: 'Thanks for Your Interest - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>Thank you for your interest in {{fundName}}.</p>
<p><strong>Next step:</strong> Complete this brief pre-qualification form (3-4 minutes):</p>
<p><a href="{{kycUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Complete Pre-Qualification</a></p>
<p>This confirms your eligibility as an accredited investor. You'll hear back within 24-48 hours.</p>
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'kycReminder1',
    name: 'KYC Reminder #1 (+48hr)',
    description: 'First reminder to complete pre-qualification',
    category: 'prospect',
    variables: [
      ...commonVariables,
      { key: 'kycUrl', label: 'KYC URL', description: 'Link to the pre-qualification form', example: 'https://app.citadel.com/kyc/abc123' },
    ],
    defaultSubject: 'Quick Reminder - Complete Your Pre-Qualification',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>Just a quick reminder to complete your pre-qualification for {{fundName}}.</p>
<p>It only takes 3-4 minutes:</p>
<p><a href="{{kycUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Complete Pre-Qualification</a></p>
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'kycReminder2',
    name: 'KYC Reminder #2 (+5 days)',
    description: 'Second reminder to complete pre-qualification',
    category: 'prospect',
    variables: [
      ...commonVariables,
      { key: 'kycUrl', label: 'KYC URL', description: 'Link to the pre-qualification form', example: 'https://app.citadel.com/kyc/abc123' },
    ],
    defaultSubject: 'Still Interested? - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>We noticed you haven't had a chance to complete your pre-qualification for {{fundName}} yet.</p>
<p>If you're still interested, you can complete it here (3-4 minutes):</p>
<p><a href="{{kycUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Complete Pre-Qualification</a></p>
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'kycReminder3',
    name: 'KYC Reminder #3 (+10 days)',
    description: 'Final reminder with option to stay updated',
    category: 'prospect',
    variables: [
      ...commonVariables,
      { key: 'kycUrl', label: 'KYC URL', description: 'Link to the pre-qualification form', example: 'https://app.citadel.com/kyc/abc123' },
      { key: 'keepMeUpdatedUrl', label: 'Keep Me Updated URL', description: 'Link to opt-in for future updates', example: 'https://app.citadel.com/updates' },
    ],
    defaultSubject: 'Last Chance - {{fundName}} Pre-Qualification',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>This is our final reminder about your pre-qualification for {{fundName}}.</p>
<p><a href="{{kycUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Complete Pre-Qualification</a></p>
<p>Not ready yet? <a href="{{keepMeUpdatedUrl}}">Keep me updated on future opportunities</a></p>
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'meetingInvite',
    name: 'Meeting Invitation',
    description: 'Invitation to schedule a call after KYC approval',
    category: 'prospect',
    variables: [
      ...commonVariables,
      ...managerVariables,
      { key: 'calendlyUrl', label: 'Calendar URL', description: 'Link to schedule a meeting', example: 'https://calendly.com/sarah-johnson' },
    ],
    defaultSubject: 'Schedule Your Call - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>Great news! Your pre-qualification for {{fundName}} has been approved.</p>
<p>Please schedule a brief call to discuss the investment opportunity:</p>
<p><a href="{{calendlyUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Schedule Call</a></p>
<p>Best regards,<br><strong>{{managerNameWithCredentials}}</strong></p>`,
  },
  {
    key: 'kycNotEligible',
    name: 'KYC Not Eligible',
    description: 'Notification when prospect does not meet accreditation requirements',
    category: 'prospect',
    variables: [
      ...commonVariables,
      { key: 'accreditationEducationContent', label: 'Accreditation Education', description: 'Educational content about accreditation requirements', example: '' },
    ],
    defaultSubject: 'Update on Your {{fundName}} Application',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>Thank you for your interest in {{fundName}}.</p>
<p>Based on the information provided, you don't currently meet the accreditation requirements for this investment opportunity.</p>
{{accreditationEducationContent}}
<p>We appreciate your interest and wish you the best in your investment journey.</p>
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'meetingReminder24hr',
    name: 'Meeting Reminder (24hr)',
    description: '24-hour reminder before scheduled meeting',
    category: 'prospect',
    variables: [
      ...commonVariables,
      ...managerVariables,
      { key: 'meetingDate', label: 'Meeting Date', description: 'Date of the meeting', example: 'Tuesday, January 15' },
      { key: 'meetingTime', label: 'Meeting Time', description: 'Time of the meeting', example: '2:00 PM' },
      { key: 'timezone', label: 'Timezone', description: 'Timezone for the meeting', example: 'EST' },
      { key: 'meetingLink', label: 'Meeting Link', description: 'Video call link', example: 'https://zoom.us/j/123456' },
      { key: 'preMeetingMaterials', label: 'Pre-Meeting Materials', description: 'Link to materials to review before meeting', example: '' },
    ],
    defaultSubject: 'Reminder: Your Call Tomorrow - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>This is a reminder about your call with {{managerName}} tomorrow.</p>
<p><strong>When:</strong> {{meetingDate}} at {{meetingTime}} {{timezone}}</p>
<p><a href="{{meetingLink}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Join Meeting</a></p>
{{preMeetingMaterials}}
<p>Looking forward to speaking with you!</p>
<p><strong>{{managerName}}</strong><br>{{managerTitle}}</p>`,
  },
  {
    key: 'meetingReminder15min',
    name: 'Meeting Reminder (15min)',
    description: '15-minute reminder before meeting',
    category: 'prospect',
    variables: [
      { key: 'recipientName', label: 'Recipient Name', description: 'First name of the recipient', example: 'John' },
      { key: 'managerName', label: 'Manager Name', description: 'Name of the fund manager', example: 'Sarah Johnson' },
      { key: 'meetingLink', label: 'Meeting Link', description: 'Video call link', example: 'https://zoom.us/j/123456' },
    ],
    defaultSubject: 'Starting Soon: Your Investment Call',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>Your call with {{managerName}} starts in 15 minutes.</p>
<p><a href="{{meetingLink}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Join Meeting Now</a></p>`,
  },
  {
    key: 'meetingNoShow',
    name: 'Meeting No-Show',
    description: 'Follow-up when prospect misses scheduled meeting',
    category: 'prospect',
    variables: [
      ...commonVariables,
      ...managerVariables,
      { key: 'calendlyUrl', label: 'Calendar URL', description: 'Link to reschedule', example: 'https://calendly.com/sarah-johnson' },
    ],
    defaultSubject: 'We Missed You - Reschedule Your Call',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>I'm sorry we missed connecting today. I understand things come up!</p>
<p>When you're ready, please reschedule at your convenience:</p>
<p><a href="{{calendlyUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Reschedule Call</a></p>
<p>Best regards,<br><strong>{{managerName}}</strong><br>{{managerTitle}}</p>`,
  },
  {
    key: 'postMeetingProceed',
    name: 'Post-Meeting: Ready to Proceed',
    description: 'Follow-up for prospects ready to invest after meeting',
    category: 'prospect',
    variables: [
      ...commonVariables,
      ...managerVariables,
      { key: 'accountCreationUrl', label: 'Account Creation URL', description: 'Link to create investor account', example: 'https://app.citadel.com/onboard/abc123' },
      { key: 'postMeetingRecap', label: 'Post-Meeting Recap', description: 'Custom recap message from the meeting', example: '' },
    ],
    defaultSubject: "Next Steps - Let's Get Started",
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>{{postMeetingRecap}}</p>
<p>Ready to move forward? Create your investor account to begin the onboarding process:</p>
<p><a href="{{accountCreationUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Create Account</a></p>
<p>Best regards,<br><strong>{{managerName}}</strong><br>{{managerTitle}}</p>`,
  },
  {
    key: 'postMeetingConsidering',
    name: 'Post-Meeting: Considering',
    description: 'Follow-up for prospects still considering',
    category: 'prospect',
    variables: [
      ...commonVariables,
      ...managerVariables,
      { key: 'readyToInvestUrl', label: 'Ready to Invest URL', description: 'Link when prospect is ready', example: 'https://app.citadel.com/ready' },
      { key: 'meetingRecapBullets', label: 'Meeting Recap Bullets', description: 'Key points from the meeting', example: '' },
      { key: 'deckLink', label: 'Deck Link', description: 'Link to presentation deck', example: '' },
      { key: 'ppmPreviewLink', label: 'PPM Preview Link', description: 'Link to PPM preview', example: '' },
      { key: 'consideringSupportMessage', label: 'Support Message', description: 'Custom support message for prospects considering', example: '' },
    ],
    defaultSubject: 'Following Up - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>Thank you for taking the time to learn about {{fundName}}.</p>
{{meetingRecapBullets}}
{{deckLink}}
{{ppmPreviewLink}}
<p>{{consideringSupportMessage}}</p>
<p>When you're ready:</p>
<p><a href="{{readyToInvestUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">I'm Ready to Invest</a></p>
<p>Best regards,<br><strong>{{managerName}}</strong><br>{{managerTitle}}</p>`,
  },
  {
    key: 'postMeetingNotFit',
    name: 'Post-Meeting: Not a Fit',
    description: 'Follow-up when investment is not right for prospect',
    category: 'prospect',
    variables: [
      ...commonVariables,
      ...managerVariables,
      { key: 'keepMeInformedUrl', label: 'Keep Me Informed URL', description: 'Link to stay updated on future opportunities', example: 'https://app.citadel.com/updates' },
      { key: 'investmentBriefDescriptor', label: 'Investment Brief', description: 'Brief description of the investment', example: '' },
    ],
    defaultSubject: 'Thank You - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>Thank you for taking the time to learn about {{fundName}}{{investmentBriefDescriptor}}.</p>
<p>While this particular opportunity may not be the right fit at this time, I'd be happy to keep you informed about future investments:</p>
<p><a href="{{keepMeInformedUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #6b7280; color: white; text-decoration: none; border-radius: 6px;">Keep Me Informed</a></p>
<p>Best regards,<br><strong>{{managerName}}</strong></p>`,
  },
  {
    key: 'nurtureDay15',
    name: 'Nurture: Day 15',
    description: 'First nurture email for prospects still considering',
    category: 'prospect',
    variables: [
      ...commonVariables,
      { key: 'scheduleFollowUpUrl', label: 'Schedule Follow-up URL', description: 'Link to schedule a follow-up call', example: 'https://calendly.com/sarah-johnson' },
      { key: 'readyToInvestUrl', label: 'Ready to Invest URL', description: 'Link when prospect is ready', example: 'https://app.citadel.com/ready' },
    ],
    defaultSubject: 'Checking In - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>I wanted to check in and see if you had any questions about {{fundName}}.</p>
<p><a href="{{scheduleFollowUpUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #6b7280; color: white; text-decoration: none; border-radius: 6px; margin-right: 8px;">Schedule a Call</a> <a href="{{readyToInvestUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">I'm Ready to Invest</a></p>
<p>Best regards,<br><strong>{{managerName}}</strong></p>`,
  },
  {
    key: 'nurtureDay23',
    name: 'Nurture: Day 23',
    description: 'Second nurture email with value-add content',
    category: 'prospect',
    variables: [
      ...commonVariables,
      { key: 'letsTalkUrl', label: "Let's Talk URL", description: 'Link to schedule a call', example: 'https://calendly.com/sarah-johnson' },
      { key: 'readyToInvestUrl', label: 'Ready to Invest URL', description: 'Link when prospect is ready', example: 'https://app.citadel.com/ready' },
      { key: 'nurtureUpdateContent', label: 'Nurture Update Content', description: 'Custom market/fund update content', example: '' },
    ],
    defaultSubject: 'Update: {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>I wanted to share a quick update about {{fundName}}:</p>
{{nurtureUpdateContent}}
<p><a href="{{letsTalkUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #6b7280; color: white; text-decoration: none; border-radius: 6px; margin-right: 8px;">Let's Talk</a> <a href="{{readyToInvestUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">I'm Ready to Invest</a></p>
<p>Best regards,<br><strong>{{managerName}}</strong></p>`,
  },
  {
    key: 'nurtureDay30',
    name: 'Nurture: Day 30',
    description: 'Final nurture email before moving to dormant',
    category: 'prospect',
    variables: [
      ...commonVariables,
      { key: 'readyToInvestUrl', label: 'Ready to Invest URL', description: 'Link when prospect is ready', example: 'https://app.citadel.com/ready' },
      { key: 'keepMeUpdatedUrl', label: 'Keep Me Updated URL', description: 'Link to stay on mailing list', example: 'https://app.citadel.com/updates' },
    ],
    defaultSubject: 'Still Interested? - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>I wanted to reach out one more time to see if you're still interested in {{fundName}}.</p>
<p><a href="{{readyToInvestUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Yes, I'm Ready to Invest</a></p>
<p>If now isn't the right time, no problem at all. <a href="{{keepMeUpdatedUrl}}">Click here</a> to stay updated on future opportunities.</p>
<p>Best regards,<br><strong>{{managerName}}</strong></p>`,
  },
  {
    key: 'dormantCloseout',
    name: 'Dormant Closeout',
    description: 'Final email when moving prospect to dormant status',
    category: 'prospect',
    variables: [
      ...commonVariables,
      { key: 'keepMeUpdatedUrl', label: 'Keep Me Updated URL', description: 'Link to stay on mailing list', example: 'https://app.citadel.com/updates' },
    ],
    defaultSubject: 'Closing the Loop - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>I haven't heard back from you, so I'll assume the timing isn't right for {{fundName}}.</p>
<p>If you'd like to stay informed about future investment opportunities, you can sign up here:</p>
<p><a href="{{keepMeUpdatedUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #6b7280; color: white; text-decoration: none; border-radius: 6px;">Keep Me Updated</a></p>
<p>Best regards,<br><strong>{{managerName}}</strong></p>`,
  },

  // ==========================================================================
  // INVESTOR ONBOARDING (Stage 02)
  // ==========================================================================
  {
    key: 'accountInvitationEnhanced',
    name: 'Account Invitation',
    description: 'Invitation to create investor account',
    category: 'investor_onboarding',
    variables: [
      ...commonVariables,
      ...managerVariables,
      { key: 'accountCreationUrl', label: 'Account Creation URL', description: 'Link to create account', example: 'https://app.citadel.com/signup/abc123' },
    ],
    defaultSubject: 'Create Your {{fundName}} Investor Account',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>Welcome to {{fundName}}! Please create your investor account to begin the onboarding process:</p>
<p><a href="{{accountCreationUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Create Account</a></p>
<p>Best regards,<br><strong>{{managerName}}</strong><br>{{managerTitle}}</p>`,
  },
  {
    key: 'onboardingReminder1',
    name: 'Onboarding Reminder #1',
    description: 'First reminder to complete onboarding',
    category: 'investor_onboarding',
    variables: [
      ...commonVariables,
      { key: 'onboardingUrl', label: 'Onboarding URL', description: 'Link to continue onboarding', example: 'https://app.citadel.com/onboard' },
      { key: 'completedSteps', label: 'Completed Steps', description: 'Steps already completed', example: '2 of 5' },
    ],
    defaultSubject: 'Complete Your Onboarding - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>You're making progress on your {{fundName}} investor onboarding ({{completedSteps}} steps complete).</p>
<p>Continue where you left off:</p>
<p><a href="{{onboardingUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Continue Onboarding</a></p>
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'onboardingReminder2',
    name: 'Onboarding Reminder #2',
    description: 'Second reminder to complete onboarding',
    category: 'investor_onboarding',
    variables: [
      ...commonVariables,
      { key: 'onboardingUrl', label: 'Onboarding URL', description: 'Link to continue onboarding', example: 'https://app.citadel.com/onboard' },
    ],
    defaultSubject: 'Reminder: Complete Your {{fundName}} Onboarding',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>Just a reminder to complete your {{fundName}} investor onboarding.</p>
<p><a href="{{onboardingUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Complete Onboarding</a></p>
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'onboardingReminder3',
    name: 'Onboarding Reminder #3',
    description: 'Final reminder to complete onboarding',
    category: 'investor_onboarding',
    variables: [
      ...commonVariables,
      ...managerVariables,
      { key: 'onboardingUrl', label: 'Onboarding URL', description: 'Link to continue onboarding', example: 'https://app.citadel.com/onboard' },
    ],
    defaultSubject: 'Action Required: Complete Your Onboarding',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>This is a final reminder to complete your {{fundName}} investor onboarding.</p>
<p>If you have any questions or need assistance, please don't hesitate to reach out.</p>
<p><a href="{{onboardingUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Complete Onboarding</a></p>
<p>Best regards,<br><strong>{{managerName}}</strong></p>`,
  },
  {
    key: 'documentUploadedPending',
    name: 'Document Uploaded - Pending Review',
    description: 'Confirmation when investor uploads documents',
    category: 'investor_onboarding',
    variables: [
      ...commonVariables,
      { key: 'documentName', label: 'Document Name', description: 'Name of uploaded document', example: 'W-9 Form' },
      { key: 'reviewTimeframe', label: 'Review Timeframe', description: 'Expected review time', example: '1-2 business days' },
    ],
    defaultSubject: 'Document Received - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>We've received your {{documentName}} for {{fundName}}.</p>
<p>Our team will review it within {{reviewTimeframe}} and follow up with next steps.</p>
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'documentsReadySignature',
    name: 'Documents Ready for Signature',
    description: 'Notification when documents are ready to sign',
    category: 'investor_onboarding',
    variables: [
      ...commonVariables,
      { key: 'signingUrl', label: 'Signing URL', description: 'Link to sign documents', example: 'https://app.citadel.com/sign' },
    ],
    defaultSubject: 'Documents Ready for Signature - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>Your investment documents for {{fundName}} are ready for your signature.</p>
<p><a href="{{signingUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Sign Documents</a></p>
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'signatureReminder1',
    name: 'Signature Reminder #1',
    description: 'First reminder to sign documents',
    category: 'investor_onboarding',
    variables: [
      ...commonVariables,
      { key: 'signingUrl', label: 'Signing URL', description: 'Link to sign documents', example: 'https://app.citadel.com/sign' },
    ],
    defaultSubject: 'Reminder: Sign Your {{fundName}} Documents',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>Just a reminder that your {{fundName}} investment documents are awaiting your signature.</p>
<p><a href="{{signingUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Sign Documents</a></p>
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'signatureReminder2',
    name: 'Signature Reminder #2',
    description: 'Second reminder to sign documents',
    category: 'investor_onboarding',
    variables: [
      ...commonVariables,
      ...managerVariables,
      { key: 'signingUrl', label: 'Signing URL', description: 'Link to sign documents', example: 'https://app.citadel.com/sign' },
    ],
    defaultSubject: 'Action Required: Sign Your Investment Documents',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>Your {{fundName}} investment documents still need your signature to proceed.</p>
<p>If you have any questions, please reach out to me directly.</p>
<p><a href="{{signingUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Sign Documents</a></p>
<p>Best regards,<br><strong>{{managerName}}</strong></p>`,
  },
  {
    key: 'documentsFullyExecuted',
    name: 'Documents Fully Executed',
    description: 'Confirmation when all documents are signed',
    category: 'investor_onboarding',
    variables: [
      ...commonVariables,
      { key: 'documentsUrl', label: 'Documents URL', description: 'Link to view signed documents', example: 'https://app.citadel.com/documents' },
    ],
    defaultSubject: 'Documents Complete - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>Great news! All your {{fundName}} investment documents have been fully executed.</p>
<p>You can view and download your signed documents here:</p>
<p><a href="{{documentsUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">View Documents</a></p>
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'fundingInstructions',
    name: 'Funding Instructions',
    description: 'Wire transfer instructions for investment',
    category: 'investor_onboarding',
    variables: [
      ...commonVariables,
      { key: 'investmentAmount', label: 'Investment Amount', description: 'Amount to be funded', example: '$100,000' },
      { key: 'wireInstructions', label: 'Wire Instructions', description: 'Bank wire transfer details', example: '' },
      { key: 'fundingDeadline', label: 'Funding Deadline', description: 'Deadline for funding', example: 'January 31, 2024' },
    ],
    defaultSubject: 'Funding Instructions - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>Thank you for your commitment to {{fundName}}. Please fund your investment of {{investmentAmount}} by {{fundingDeadline}}.</p>
<p><strong>Wire Instructions:</strong></p>
{{wireInstructions}}
<p>Please include your name in the wire memo for easy identification.</p>
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'fundingDiscrepancy',
    name: 'Funding Discrepancy',
    description: 'Notification when funding amount does not match commitment',
    category: 'investor_onboarding',
    variables: [
      ...commonVariables,
      ...managerVariables,
      { key: 'expectedAmount', label: 'Expected Amount', description: 'Committed investment amount', example: '$100,000' },
      { key: 'receivedAmount', label: 'Received Amount', description: 'Amount actually received', example: '$95,000' },
      { key: 'discrepancyAmount', label: 'Discrepancy Amount', description: 'Difference between expected and received', example: '$5,000' },
    ],
    defaultSubject: 'Funding Discrepancy - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>We received your wire transfer for {{fundName}}, but there's a discrepancy in the amount:</p>
<ul>
<li><strong>Expected:</strong> {{expectedAmount}}</li>
<li><strong>Received:</strong> {{receivedAmount}}</li>
<li><strong>Difference:</strong> {{discrepancyAmount}}</li>
</ul>
<p>Please reply to this email or contact us to resolve this discrepancy.</p>
<p>Best regards,<br><strong>{{managerName}}</strong></p>`,
  },
  {
    key: 'welcomeInvestorEnhanced',
    name: 'Welcome Investor',
    description: 'Welcome email after investment is complete',
    category: 'investor_onboarding',
    variables: [
      ...commonVariables,
      ...managerVariables,
      { key: 'dashboardUrl', label: 'Dashboard URL', description: 'Link to investor dashboard', example: 'https://app.citadel.com/dashboard' },
      { key: 'welcomeMessage', label: 'Welcome Message', description: 'Custom welcome message', example: '' },
    ],
    defaultSubject: 'Welcome to {{fundName}}!',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>Welcome to {{fundName}}! Your investment is now complete.</p>
{{welcomeMessage}}
<p>Access your investor dashboard to track your investment:</p>
<p><a href="{{dashboardUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">View Dashboard</a></p>
<p>Best regards,<br><strong>{{managerName}}</strong><br>{{managerTitle}}</p>`,
  },

  // ==========================================================================
  // CAPITAL CALLS & DISTRIBUTIONS (Stage 03)
  // ==========================================================================
  {
    key: 'capitalCallRequest',
    name: 'Capital Call Notice',
    description: 'Initial capital call request to investors',
    category: 'capital_calls',
    variables: [
      ...commonVariables,
      { key: 'dealName', label: 'Deal Name', description: 'Name of the deal/property', example: 'Sunset Gardens Acquisition' },
      { key: 'amountDue', label: 'Amount Due', description: 'Capital call amount', example: '$25,000' },
      { key: 'deadline', label: 'Deadline', description: 'Payment deadline', example: 'February 15, 2024' },
      { key: 'wireInstructions', label: 'Wire Instructions', description: 'Bank wire details', example: '' },
      { key: 'capitalCallUrl', label: 'Capital Call URL', description: 'Link to view capital call details', example: 'https://app.citadel.com/capital-call/abc' },
    ],
    defaultSubject: 'Capital Call Notice - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>A capital call has been issued for {{fundName}}:</p>
<ul>
<li><strong>Deal:</strong> {{dealName}}</li>
<li><strong>Amount Due:</strong> {{amountDue}}</li>
<li><strong>Deadline:</strong> {{deadline}}</li>
</ul>
{{wireInstructions}}
<p><a href="{{capitalCallUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">View Details</a></p>
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'capitalCallReminder7',
    name: 'Capital Call Reminder (7 days)',
    description: '7-day reminder for capital call',
    category: 'capital_calls',
    variables: [
      ...commonVariables,
      { key: 'dealName', label: 'Deal Name', description: 'Name of the deal', example: 'Sunset Gardens Acquisition' },
      { key: 'amountDue', label: 'Amount Due', description: 'Amount remaining', example: '$25,000' },
      { key: 'deadline', label: 'Deadline', description: 'Payment deadline', example: 'February 15, 2024' },
      { key: 'capitalCallUrl', label: 'Capital Call URL', description: 'Link to capital call', example: 'https://app.citadel.com/capital-call/abc' },
    ],
    defaultSubject: 'Reminder: Capital Call Due in 7 Days',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>This is a reminder that your capital call for {{fundName}} is due in 7 days:</p>
<ul>
<li><strong>Amount:</strong> {{amountDue}}</li>
<li><strong>Deadline:</strong> {{deadline}}</li>
</ul>
<p><a href="{{capitalCallUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">View Details</a></p>
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'capitalCallReminder3',
    name: 'Capital Call Reminder (3 days)',
    description: '3-day reminder for capital call',
    category: 'capital_calls',
    variables: [
      ...commonVariables,
      { key: 'amountDue', label: 'Amount Due', description: 'Amount remaining', example: '$25,000' },
      { key: 'deadline', label: 'Deadline', description: 'Payment deadline', example: 'February 15, 2024' },
      { key: 'capitalCallUrl', label: 'Capital Call URL', description: 'Link to capital call', example: 'https://app.citadel.com/capital-call/abc' },
    ],
    defaultSubject: 'Reminder: Capital Call Due in 3 Days',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>Your capital call for {{fundName}} is due in 3 days:</p>
<ul>
<li><strong>Amount:</strong> {{amountDue}}</li>
<li><strong>Deadline:</strong> {{deadline}}</li>
</ul>
<p><a href="{{capitalCallUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">View Details</a></p>
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'capitalCallReminder1',
    name: 'Capital Call Reminder (1 day)',
    description: '1-day reminder for capital call',
    category: 'capital_calls',
    variables: [
      ...commonVariables,
      { key: 'amountDue', label: 'Amount Due', description: 'Amount remaining', example: '$25,000' },
      { key: 'deadline', label: 'Deadline', description: 'Payment deadline', example: 'Tomorrow' },
      { key: 'capitalCallUrl', label: 'Capital Call URL', description: 'Link to capital call', example: 'https://app.citadel.com/capital-call/abc' },
    ],
    defaultSubject: 'URGENT: Capital Call Due Tomorrow',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p><strong>Your capital call for {{fundName}} is due tomorrow.</strong></p>
<ul>
<li><strong>Amount:</strong> {{amountDue}}</li>
<li><strong>Deadline:</strong> {{deadline}}</li>
</ul>
<p><a href="{{capitalCallUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px;">View & Pay Now</a></p>
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'capitalCallPastDue',
    name: 'Capital Call Past Due',
    description: 'Notification when capital call is past due',
    category: 'capital_calls',
    variables: [
      ...commonVariables,
      ...managerVariables,
      { key: 'amountDue', label: 'Amount Due', description: 'Amount remaining', example: '$25,000' },
      { key: 'originalDeadline', label: 'Original Deadline', description: 'Original payment deadline', example: 'February 15, 2024' },
      { key: 'capitalCallUrl', label: 'Capital Call URL', description: 'Link to capital call', example: 'https://app.citadel.com/capital-call/abc' },
    ],
    defaultSubject: 'PAST DUE: Capital Call - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>Your capital call for {{fundName}} is now past due:</p>
<ul>
<li><strong>Amount:</strong> {{amountDue}}</li>
<li><strong>Original Deadline:</strong> {{originalDeadline}}</li>
</ul>
<p>Please submit payment immediately to avoid any penalties.</p>
<p><a href="{{capitalCallUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px;">Pay Now</a></p>
<p>Best regards,<br><strong>{{managerName}}</strong></p>`,
  },
  {
    key: 'capitalCallPastDue7',
    name: 'Capital Call Past Due (7 days)',
    description: 'Second past due notice after 7 days',
    category: 'capital_calls',
    variables: [
      ...commonVariables,
      ...managerVariables,
      { key: 'amountDue', label: 'Amount Due', description: 'Amount remaining', example: '$25,000' },
      { key: 'daysOverdue', label: 'Days Overdue', description: 'Number of days past due', example: '7' },
      { key: 'capitalCallUrl', label: 'Capital Call URL', description: 'Link to capital call', example: 'https://app.citadel.com/capital-call/abc' },
    ],
    defaultSubject: 'URGENT: Capital Call 7 Days Past Due',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>Your capital call for {{fundName}} is now {{daysOverdue}} days past due:</p>
<ul>
<li><strong>Amount Due:</strong> {{amountDue}}</li>
</ul>
<p>Please contact us immediately to discuss payment arrangements.</p>
<p><a href="{{capitalCallUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px;">Pay Now</a></p>
<p>Best regards,<br><strong>{{managerName}}</strong></p>`,
  },
  {
    key: 'capitalCallDefault',
    name: 'Capital Call Default Notice',
    description: 'Formal default notice for unpaid capital call',
    category: 'capital_calls',
    variables: [
      ...commonVariables,
      ...managerVariables,
      { key: 'amountDue', label: 'Amount Due', description: 'Amount remaining', example: '$25,000' },
      { key: 'defaultSection', label: 'Default Section', description: 'Operating agreement section reference', example: 'Section 4.2' },
      { key: 'legalDefaultNotice', label: 'Legal Default Notice', description: 'Legal notice content', example: '' },
    ],
    defaultSubject: 'DEFAULT NOTICE: {{fundName}} Capital Call',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>This is a formal notice that you are in default on your capital call obligation for {{fundName}}.</p>
<ul>
<li><strong>Amount Due:</strong> {{amountDue}}</li>
</ul>
<p>Per {{defaultSection}} of the Operating Agreement:</p>
{{legalDefaultNotice}}
<p>Please contact us immediately to resolve this matter.</p>
<p>Best regards,<br><strong>{{managerName}}</strong></p>`,
  },
  {
    key: 'wireConfirmation',
    name: 'Wire Confirmation',
    description: 'Confirmation when wire transfer is received',
    category: 'capital_calls',
    variables: [
      ...commonVariables,
      { key: 'amount', label: 'Amount', description: 'Amount received', example: '$25,000' },
      { key: 'dealName', label: 'Deal Name', description: 'Name of the deal', example: 'Sunset Gardens Acquisition' },
      { key: 'receiptUrl', label: 'Receipt URL', description: 'Link to view receipt', example: 'https://app.citadel.com/receipt/abc' },
    ],
    defaultSubject: 'Wire Received - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>We've received your wire transfer of {{amount}} for {{fundName}} - {{dealName}}.</p>
<p>Thank you for your investment!</p>
<p><a href="{{receiptUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">View Receipt</a></p>
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'wireIssue',
    name: 'Wire Issue',
    description: 'Notification of issue with wire transfer',
    category: 'capital_calls',
    variables: [
      ...commonVariables,
      ...managerVariables,
      { key: 'issueDescription', label: 'Issue Description', description: 'Description of the wire issue', example: 'Wire was rejected by the bank' },
    ],
    defaultSubject: 'Issue with Your Wire Transfer - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>There was an issue with your wire transfer for {{fundName}}:</p>
<p>{{issueDescription}}</p>
<p>Please contact us to resolve this issue.</p>
<p>Best regards,<br><strong>{{managerName}}</strong></p>`,
  },
  {
    key: 'distributionNotice',
    name: 'Distribution Notice',
    description: 'Notice of upcoming distribution',
    category: 'capital_calls',
    variables: [
      ...commonVariables,
      { key: 'distributionAmount', label: 'Distribution Amount', description: 'Amount to be distributed', example: '$5,000' },
      { key: 'distributionDate', label: 'Distribution Date', description: 'Date of distribution', example: 'March 1, 2024' },
      { key: 'distributionType', label: 'Distribution Type', description: 'Type of distribution', example: 'Quarterly Income' },
    ],
    defaultSubject: 'Distribution Notice - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>A distribution has been declared for {{fundName}}:</p>
<ul>
<li><strong>Amount:</strong> {{distributionAmount}}</li>
<li><strong>Type:</strong> {{distributionType}}</li>
<li><strong>Expected Date:</strong> {{distributionDate}}</li>
</ul>
<p>The funds will be sent to your bank account on file.</p>
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'distributionSent',
    name: 'Distribution Sent',
    description: 'Confirmation that distribution has been sent',
    category: 'capital_calls',
    variables: [
      ...commonVariables,
      { key: 'distributionAmount', label: 'Distribution Amount', description: 'Amount distributed', example: '$5,000' },
      { key: 'distributionType', label: 'Distribution Type', description: 'Type of distribution', example: 'Quarterly Income' },
    ],
    defaultSubject: 'Distribution Sent - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>Your {{distributionType}} distribution of {{distributionAmount}} from {{fundName}} has been sent to your bank account.</p>
<p>Please allow 1-3 business days for the funds to appear.</p>
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'distributionElection',
    name: 'Distribution Election',
    description: 'Request for distribution election preference',
    category: 'capital_calls',
    variables: [
      ...commonVariables,
      { key: 'electionDeadline', label: 'Election Deadline', description: 'Deadline to make election', example: 'February 28, 2024' },
      { key: 'electionUrl', label: 'Election URL', description: 'Link to make election', example: 'https://app.citadel.com/election' },
    ],
    defaultSubject: 'Distribution Election Required - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>Please select your distribution preference for {{fundName}} by {{electionDeadline}}:</p>
<p><a href="{{electionUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Make Election</a></p>
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'refinanceNotice',
    name: 'Refinance Notice',
    description: 'Notice of property refinancing',
    category: 'capital_calls',
    variables: [
      ...commonVariables,
      { key: 'propertyName', label: 'Property Name', description: 'Name of the property', example: 'Sunset Gardens' },
      { key: 'refinanceSummary', label: 'Refinance Summary', description: 'Summary of refinance details', example: '' },
    ],
    defaultSubject: 'Refinance Notice - {{propertyName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>We're pleased to inform you about a refinancing event for {{propertyName}} in {{fundName}}:</p>
{{refinanceSummary}}
<p>{{fundName}} Team</p>`,
  },

  // ==========================================================================
  // REPORTING & TAX (Stage 04)
  // ==========================================================================
  {
    key: 'quarterlyReport',
    name: 'Quarterly Report',
    description: 'Quarterly investor report notification',
    category: 'reporting',
    variables: [
      ...commonVariables,
      { key: 'reportPeriod', label: 'Report Period', description: 'Quarter being reported', example: 'Q4 2023' },
      { key: 'reportUrl', label: 'Report URL', description: 'Link to view report', example: 'https://app.citadel.com/reports/q4-2023' },
      { key: 'reportSummary', label: 'Report Summary', description: 'Summary of quarterly performance', example: '' },
    ],
    defaultSubject: '{{reportPeriod}} Report - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>Your {{reportPeriod}} report for {{fundName}} is now available.</p>
{{reportSummary}}
<p><a href="{{reportUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">View Report</a></p>
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'annualReport',
    name: 'Annual Report',
    description: 'Annual investor report notification',
    category: 'reporting',
    variables: [
      ...commonVariables,
      { key: 'reportYear', label: 'Report Year', description: 'Year being reported', example: '2023' },
      { key: 'reportUrl', label: 'Report URL', description: 'Link to view report', example: 'https://app.citadel.com/reports/annual-2023' },
      { key: 'reportSummary', label: 'Report Summary', description: 'Summary of annual performance', example: '' },
    ],
    defaultSubject: '{{reportYear}} Annual Report - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>Your {{reportYear}} Annual Report for {{fundName}} is now available.</p>
{{reportSummary}}
<p><a href="{{reportUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">View Report</a></p>
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'annualMeetingInvite',
    name: 'Annual Meeting Invitation',
    description: 'Invitation to annual investor meeting',
    category: 'reporting',
    variables: [
      ...commonVariables,
      { key: 'meetingDate', label: 'Meeting Date', description: 'Date of the meeting', example: 'March 15, 2024' },
      { key: 'meetingTime', label: 'Meeting Time', description: 'Time of the meeting', example: '2:00 PM EST' },
      { key: 'meetingLink', label: 'Meeting Link', description: 'Link to join meeting', example: 'https://zoom.us/j/123456' },
      { key: 'rsvpUrl', label: 'RSVP URL', description: 'Link to RSVP', example: 'https://app.citadel.com/rsvp' },
      { key: 'agendaPreview', label: 'Agenda Preview', description: 'Preview of meeting agenda', example: '' },
    ],
    defaultSubject: 'Annual Investor Meeting - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>You're invited to the {{fundName}} Annual Investor Meeting:</p>
<ul>
<li><strong>Date:</strong> {{meetingDate}}</li>
<li><strong>Time:</strong> {{meetingTime}}</li>
</ul>
{{agendaPreview}}
<p><a href="{{rsvpUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">RSVP</a></p>
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'propertyAcquisition',
    name: 'Property Acquisition',
    description: 'Announcement of new property acquisition',
    category: 'reporting',
    variables: [
      ...commonVariables,
      { key: 'propertyName', label: 'Property Name', description: 'Name of the property', example: 'Sunset Gardens' },
      { key: 'acquisitionSummary', label: 'Acquisition Summary', description: 'Summary of the acquisition', example: '' },
      { key: 'propertyDetailsUrl', label: 'Property Details URL', description: 'Link to property details', example: 'https://app.citadel.com/properties/sunset-gardens' },
    ],
    defaultSubject: 'New Acquisition: {{propertyName}} - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>We're excited to announce a new acquisition for {{fundName}}:</p>
<p><strong>{{propertyName}}</strong></p>
{{acquisitionSummary}}
<p><a href="{{propertyDetailsUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">View Details</a></p>
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'propertyDisposition',
    name: 'Property Disposition',
    description: 'Announcement of property sale',
    category: 'reporting',
    variables: [
      ...commonVariables,
      { key: 'propertyName', label: 'Property Name', description: 'Name of the property', example: 'Sunset Gardens' },
      { key: 'saleSummary', label: 'Sale Summary', description: 'Summary of the sale', example: '' },
    ],
    defaultSubject: 'Property Sale: {{propertyName}} - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>We're pleased to announce the successful sale of {{propertyName}} from the {{fundName}} portfolio:</p>
{{saleSummary}}
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'k1Available',
    name: 'K-1 Available',
    description: 'Notification when K-1 tax document is ready',
    category: 'reporting',
    variables: [
      ...commonVariables,
      { key: 'taxYear', label: 'Tax Year', description: 'Tax year for the K-1', example: '2023' },
      { key: 'k1Url', label: 'K-1 URL', description: 'Link to download K-1', example: 'https://app.citadel.com/documents/k1-2023' },
    ],
    defaultSubject: 'Your {{taxYear}} K-1 is Ready - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>Your {{taxYear}} Schedule K-1 for {{fundName}} is now available.</p>
<p><a href="{{k1Url}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Download K-1</a></p>
<p>Please consult with your tax advisor for guidance on how to report this on your tax return.</p>
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'k1Estimate',
    name: 'K-1 Estimate',
    description: 'Preliminary K-1 estimate notification',
    category: 'reporting',
    variables: [
      ...commonVariables,
      { key: 'taxYear', label: 'Tax Year', description: 'Tax year for the estimate', example: '2023' },
      { key: 'estimateUrl', label: 'Estimate URL', description: 'Link to view estimate', example: 'https://app.citadel.com/documents/k1-estimate' },
    ],
    defaultSubject: '{{taxYear}} K-1 Estimate - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>Your preliminary {{taxYear}} K-1 estimate for {{fundName}} is now available.</p>
<p><a href="{{estimateUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">View Estimate</a></p>
<p>Note: This is an estimate. Your final K-1 will be available by March 15.</p>
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'k1Amended',
    name: 'K-1 Amended',
    description: 'Notification of amended K-1',
    category: 'reporting',
    variables: [
      ...commonVariables,
      { key: 'taxYear', label: 'Tax Year', description: 'Tax year for the K-1', example: '2023' },
      { key: 'amendmentReason', label: 'Amendment Reason', description: 'Reason for the amendment', example: 'Correction to property depreciation calculation' },
      { key: 'k1Url', label: 'K-1 URL', description: 'Link to download amended K-1', example: 'https://app.citadel.com/documents/k1-amended' },
    ],
    defaultSubject: 'Amended {{taxYear}} K-1 - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>An amended {{taxYear}} Schedule K-1 for {{fundName}} has been issued.</p>
<p><strong>Reason:</strong> {{amendmentReason}}</p>
<p><a href="{{k1Url}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Download Amended K-1</a></p>
<p>Please consult with your tax advisor regarding any necessary amendments to your tax return.</p>
<p>{{fundName}} Team</p>`,
  },

  // ==========================================================================
  // COMPLIANCE & RE-VERIFICATION (Stage 05)
  // ==========================================================================
  {
    key: 'rekycRequired',
    name: 'Re-KYC Required',
    description: 'Request to update KYC information',
    category: 'compliance',
    variables: [
      ...commonVariables,
      { key: 'rekycUrl', label: 'Re-KYC URL', description: 'Link to update KYC', example: 'https://app.citadel.com/rekyc' },
      { key: 'deadline', label: 'Deadline', description: 'Deadline to complete', example: 'March 31, 2024' },
    ],
    defaultSubject: 'Action Required: Update Your Information - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>As part of our compliance requirements, please update your investor information for {{fundName}} by {{deadline}}.</p>
<p><a href="{{rekycUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Update Information</a></p>
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'accreditationReverification',
    name: 'Accreditation Re-Verification',
    description: 'Request to re-verify accredited investor status',
    category: 'compliance',
    variables: [
      ...commonVariables,
      { key: 'reverificationUrl', label: 'Re-Verification URL', description: 'Link to re-verify status', example: 'https://app.citadel.com/accreditation' },
      { key: 'deadline', label: 'Deadline', description: 'Deadline to complete', example: 'March 31, 2024' },
    ],
    defaultSubject: 'Accreditation Verification Required - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>Your accredited investor status for {{fundName}} needs to be re-verified by {{deadline}}.</p>
<p><a href="{{reverificationUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Verify Accreditation</a></p>
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'bankingUpdateRequest',
    name: 'Banking Update Request',
    description: 'Request to update banking information',
    category: 'compliance',
    variables: [
      ...commonVariables,
      { key: 'updateUrl', label: 'Update URL', description: 'Link to update banking info', example: 'https://app.citadel.com/banking' },
    ],
    defaultSubject: 'Update Your Banking Information - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>Please update your banking information for {{fundName}} to ensure uninterrupted distributions.</p>
<p><a href="{{updateUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Update Banking Info</a></p>
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'ppmAmendment',
    name: 'PPM Amendment',
    description: 'Notification of Private Placement Memorandum amendment',
    category: 'compliance',
    variables: [
      ...commonVariables,
      { key: 'amendmentSummary', label: 'Amendment Summary', description: 'Summary of the amendment', example: '' },
      { key: 'amendmentUrl', label: 'Amendment URL', description: 'Link to view amendment', example: 'https://app.citadel.com/documents/ppm-amendment' },
      { key: 'acknowledgmentNote', label: 'Acknowledgment Note', description: 'Note about acknowledgment requirements', example: '' },
    ],
    defaultSubject: 'PPM Amendment - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>An amendment has been made to the {{fundName}} Private Placement Memorandum:</p>
{{amendmentSummary}}
<p><a href="{{amendmentUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">View Amendment</a></p>
{{acknowledgmentNote}}
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'materialEvent',
    name: 'Material Event',
    description: 'Notification of material event affecting the fund',
    category: 'compliance',
    variables: [
      ...commonVariables,
      { key: 'eventTitle', label: 'Event Title', description: 'Title of the material event', example: 'Change in Fund Management' },
      { key: 'eventContent', label: 'Event Content', description: 'Details of the event', example: '' },
      { key: 'detailsUrl', label: 'Details URL', description: 'Link for more details', example: 'https://app.citadel.com/announcements/event' },
    ],
    defaultSubject: 'Important Notice: {{eventTitle}} - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>We're writing to inform you of an important matter regarding {{fundName}}:</p>
<p><strong>{{eventTitle}}</strong></p>
{{eventContent}}
<p><a href="{{detailsUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">View Details</a></p>
<p>{{fundName}} Team</p>`,
  },

  // ==========================================================================
  // EXIT & TRANSFER (Stage 06)
  // ==========================================================================
  {
    key: 'transferRequestReceived',
    name: 'Transfer Request Received',
    description: 'Confirmation of transfer request receipt',
    category: 'exit_transfer',
    variables: [
      ...commonVariables,
      { key: 'transferAmount', label: 'Transfer Amount', description: 'Amount being transferred', example: '$50,000' },
      { key: 'transferProcessNote', label: 'Transfer Process Note', description: 'Note about transfer process', example: '' },
    ],
    defaultSubject: 'Transfer Request Received - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>We've received your request to transfer {{transferAmount}} of your {{fundName}} interest.</p>
{{transferProcessNote}}
<p>We'll review your request and follow up within 5-7 business days.</p>
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'transferApproved',
    name: 'Transfer Approved',
    description: 'Notification of approved transfer',
    category: 'exit_transfer',
    variables: [
      ...commonVariables,
      { key: 'transferAmount', label: 'Transfer Amount', description: 'Amount transferred', example: '$50,000' },
      { key: 'transferNextSteps', label: 'Transfer Next Steps', description: 'Next steps after approval', example: '' },
    ],
    defaultSubject: 'Transfer Approved - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>Your transfer request for {{transferAmount}} of your {{fundName}} interest has been approved.</p>
{{transferNextSteps}}
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'transferDenied',
    name: 'Transfer Denied',
    description: 'Notification of denied transfer',
    category: 'exit_transfer',
    variables: [
      ...commonVariables,
      ...managerVariables,
      { key: 'transferAmount', label: 'Transfer Amount', description: 'Amount requested', example: '$50,000' },
      { key: 'denialReason', label: 'Denial Reason', description: 'Reason for denial', example: '' },
      { key: 'transferDenialOptions', label: 'Transfer Denial Options', description: 'Alternative options', example: '' },
    ],
    defaultSubject: 'Transfer Request Update - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>Unfortunately, your transfer request for {{transferAmount}} of your {{fundName}} interest cannot be approved at this time.</p>
{{denialReason}}
{{transferDenialOptions}}
<p>Please contact us if you have any questions.</p>
<p>Best regards,<br><strong>{{managerName}}</strong></p>`,
  },
  {
    key: 'finalExitStatement',
    name: 'Final Exit Statement',
    description: 'Final statement when investor exits the fund',
    category: 'exit_transfer',
    variables: [
      ...commonVariables,
      ...managerVariables,
      { key: 'finalAmount', label: 'Final Amount', description: 'Final distribution amount', example: '$125,000' },
      { key: 'exitClosingMessage', label: 'Exit Closing Message', description: 'Closing message for exiting investor', example: '' },
      { key: 'statementUrl', label: 'Statement URL', description: 'Link to final statement', example: 'https://app.citadel.com/documents/exit-statement' },
    ],
    defaultSubject: 'Final Exit Statement - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>Your exit from {{fundName}} is now complete.</p>
<p><strong>Final Distribution:</strong> {{finalAmount}}</p>
<p><a href="{{statementUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">View Statement</a></p>
{{exitClosingMessage}}
<p>Best regards,<br><strong>{{managerName}}</strong></p>`,
  },

  // ==========================================================================
  // TEAM MANAGEMENT (Stage 07)
  // ==========================================================================
  {
    key: 'teamInvite',
    name: 'Team Invitation',
    description: 'Invitation to join fund team',
    category: 'team',
    variables: [
      ...commonVariables,
      { key: 'inviterName', label: 'Inviter Name', description: 'Name of person sending invite', example: 'Sarah Johnson' },
      { key: 'role', label: 'Role', description: 'Role being offered', example: 'Analyst' },
      { key: 'inviteUrl', label: 'Invite URL', description: 'Link to accept invitation', example: 'https://app.citadel.com/invite/abc123' },
    ],
    defaultSubject: "You're Invited to Join {{fundName}}",
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>{{inviterName}} has invited you to join {{fundName}} as a {{role}}.</p>
<p><a href="{{inviteUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Accept Invitation</a></p>
<p>{{fundName}} Team</p>`,
  },
  {
    key: 'teamInviteReminder',
    name: 'Team Invitation Reminder',
    description: 'Reminder for pending team invitation',
    category: 'team',
    variables: [
      ...commonVariables,
      { key: 'inviterName', label: 'Inviter Name', description: 'Name of person who sent invite', example: 'Sarah Johnson' },
      { key: 'role', label: 'Role', description: 'Role being offered', example: 'Analyst' },
      { key: 'inviteUrl', label: 'Invite URL', description: 'Link to accept invitation', example: 'https://app.citadel.com/invite/abc123' },
    ],
    defaultSubject: 'Reminder: Invitation to Join {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>This is a reminder that {{inviterName}} has invited you to join {{fundName}} as a {{role}}.</p>
<p><a href="{{inviteUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Accept Invitation</a></p>
<p>{{fundName}} Team</p>`,
  },

  // ==========================================================================
  // INTERNAL NOTIFICATIONS
  // ==========================================================================
  {
    key: 'internalNewInvestor',
    name: 'New Investor Notification',
    description: 'Internal notification when new investor joins',
    category: 'internal',
    variables: [
      { key: 'recipientName', label: 'Recipient Name', description: 'Manager receiving notification', example: 'Sarah' },
      { key: 'fundName', label: 'Fund Name', description: 'Name of the fund', example: 'Citadel Growth Fund I' },
      { key: 'investorName', label: 'Investor Name', description: 'Name of the new investor', example: 'John Smith' },
      { key: 'investorEmail', label: 'Investor Email', description: 'Email of the new investor', example: 'john@example.com' },
      { key: 'investmentAmount', label: 'Investment Amount', description: 'Amount invested', example: '$100,000' },
      { key: 'dashboardUrl', label: 'Dashboard URL', description: 'Link to view investor', example: 'https://app.citadel.com/manager/investors/abc' },
    ],
    defaultSubject: 'New Investor: {{investorName}} - {{fundName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>A new investor has joined {{fundName}}:</p>
<ul>
<li><strong>Name:</strong> {{investorName}}</li>
<li><strong>Email:</strong> {{investorEmail}}</li>
<li><strong>Investment:</strong> {{investmentAmount}}</li>
</ul>
<p><a href="{{dashboardUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">View Investor</a></p>`,
  },
  {
    key: 'internalDocumentReview',
    name: 'Document Review Required',
    description: 'Internal notification for document review',
    category: 'internal',
    variables: [
      { key: 'recipientName', label: 'Recipient Name', description: 'Manager receiving notification', example: 'Sarah' },
      { key: 'fundName', label: 'Fund Name', description: 'Name of the fund', example: 'Citadel Growth Fund I' },
      { key: 'investorName', label: 'Investor Name', description: 'Name of the investor', example: 'John Smith' },
      { key: 'documentType', label: 'Document Type', description: 'Type of document', example: 'W-9 Form' },
      { key: 'reviewUrl', label: 'Review URL', description: 'Link to review document', example: 'https://app.citadel.com/manager/documents/review' },
    ],
    defaultSubject: 'Document Review Required: {{investorName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>A document requires your review for {{fundName}}:</p>
<ul>
<li><strong>Investor:</strong> {{investorName}}</li>
<li><strong>Document:</strong> {{documentType}}</li>
</ul>
<p><a href="{{reviewUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Review Document</a></p>`,
  },
  {
    key: 'internalCapitalCallSummary',
    name: 'Capital Call Summary',
    description: 'Internal summary of capital call status',
    category: 'internal',
    variables: [
      { key: 'recipientName', label: 'Recipient Name', description: 'Manager receiving notification', example: 'Sarah' },
      { key: 'fundName', label: 'Fund Name', description: 'Name of the fund', example: 'Citadel Growth Fund I' },
      { key: 'dealName', label: 'Deal Name', description: 'Name of the deal', example: 'Sunset Gardens Acquisition' },
      { key: 'totalCalled', label: 'Total Called', description: 'Total amount called', example: '$1,000,000' },
      { key: 'totalReceived', label: 'Total Received', description: 'Total amount received', example: '$850,000' },
      { key: 'outstandingCount', label: 'Outstanding Count', description: 'Number of outstanding calls', example: '5' },
      { key: 'summaryUrl', label: 'Summary URL', description: 'Link to view summary', example: 'https://app.citadel.com/manager/capital-calls/abc' },
    ],
    defaultSubject: 'Capital Call Summary: {{dealName}}',
    defaultBody: `<p>Hi {{recipientName}},</p>
<p>Here's the current status for the {{dealName}} capital call:</p>
<ul>
<li><strong>Total Called:</strong> {{totalCalled}}</li>
<li><strong>Total Received:</strong> {{totalReceived}}</li>
<li><strong>Outstanding:</strong> {{outstandingCount}} investors</li>
</ul>
<p><a href="{{summaryUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">View Details</a></p>`,
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all templates grouped by category
 */
export function getTemplatesByCategory(): Record<TemplateCategory, TemplateDefinition[]> {
  const grouped: Record<TemplateCategory, TemplateDefinition[]> = {
    prospect: [],
    investor_onboarding: [],
    capital_calls: [],
    reporting: [],
    compliance: [],
    exit_transfer: [],
    team: [],
    internal: [],
  };

  for (const template of templateRegistry) {
    grouped[template.category].push(template);
  }

  return grouped;
}

/**
 * Get a template by key
 */
export function getTemplateDefinition(key: string): TemplateDefinition | undefined {
  return templateRegistry.find(t => t.key === key);
}

/**
 * Get all template keys
 */
export function getTemplateKeys(): string[] {
  return templateRegistry.map(t => t.key);
}

/**
 * Get sample data for a template (for preview)
 */
export function getSampleData(key: string): Record<string, string> {
  const template = getTemplateDefinition(key);
  if (!template) return {};

  const sampleData: Record<string, string> = {};
  for (const variable of template.variables) {
    sampleData[variable.key] = variable.example || `[${variable.label}]`;
  }
  return sampleData;
}
