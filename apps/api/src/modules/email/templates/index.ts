/**
 * Email Templates Index
 * Re-exports all email templates and types for easy importing
 */

// Base template components
export {
  escapeHtml,
  baseTemplate,
  primaryButton,
  header,
  content,
  infoBox,
  detailBox,
} from './baseTemplate';

// Onboarding templates
export {
  accountInviteTemplate,
  verificationCodeTemplate,
  accountCreatedTemplate,
  onboardingReminderTemplate,
  welcomeInvestorTemplate,
} from './onboardingTemplates';

export type {
  AccountInviteTemplateData,
  VerificationCodeTemplateData,
  AccountCreatedTemplateData,
  OnboardingReminderTemplateData,
  WelcomeInvestorTemplateData,
} from './onboardingTemplates';

// Document templates
export {
  documentRejectionTemplate,
  documentApprovedTemplate,
  documentsApprovedDocuSignTemplate,
} from './documentTemplates';

export type {
  DocumentRejectionTemplateData,
  DocumentApprovedTemplateData,
  DocumentsApprovedDocuSignTemplateData,
} from './documentTemplates';

// Prospect/KYC templates
export {
  kycInviteTemplate,
  kycAutoSendTemplate,
  meetingInviteTemplate,
  postMeetingOnboardingTemplate,
  kycReminderTemplate,
} from './prospectTemplates';

export type {
  KYCInviteTemplateData,
  KYCAutoSendTemplateData,
  MeetingInviteTemplateData,
  PostMeetingOnboardingTemplateData,
  KYCReminderTemplateData,
} from './prospectTemplates';

// Capital call templates
export {
  capitalCallRequestTemplate,
  wireConfirmationTemplate,
  wireIssueTemplate,
} from './capitalCallTemplates';

export type {
  CapitalCallRequestTemplateData,
  WireConfirmationTemplateData,
  WireIssueTemplateData,
} from './capitalCallTemplates';

// Import all templates for the combined object export
import {
  accountInviteTemplate,
  verificationCodeTemplate,
  accountCreatedTemplate,
  onboardingReminderTemplate,
  welcomeInvestorTemplate,
} from './onboardingTemplates';

import {
  documentRejectionTemplate,
  documentApprovedTemplate,
  documentsApprovedDocuSignTemplate,
} from './documentTemplates';

import {
  kycInviteTemplate,
  kycAutoSendTemplate,
  meetingInviteTemplate,
  postMeetingOnboardingTemplate,
  kycReminderTemplate,
} from './prospectTemplates';

import {
  capitalCallRequestTemplate,
  wireConfirmationTemplate,
  wireIssueTemplate,
} from './capitalCallTemplates';

/**
 * Combined emailTemplates object for backwards compatibility
 * Matches the original email.templates.ts export structure
 */
export const emailTemplates = {
  // Onboarding
  accountInvite: accountInviteTemplate,
  verificationCode: verificationCodeTemplate,
  accountCreated: accountCreatedTemplate,
  onboardingReminder: onboardingReminderTemplate,
  welcomeInvestor: welcomeInvestorTemplate,
  // Documents
  documentRejection: documentRejectionTemplate,
  documentApproved: documentApprovedTemplate,
  documentsApprovedDocuSign: documentsApprovedDocuSignTemplate,
  // Prospects
  kycInvite: kycInviteTemplate,
  kycAutoSend: kycAutoSendTemplate,
  meetingInvite: meetingInviteTemplate,
  postMeetingOnboarding: postMeetingOnboardingTemplate,
  kycReminder: kycReminderTemplate,
  // Capital Calls
  capitalCallRequest: capitalCallRequestTemplate,
  wireConfirmation: wireConfirmationTemplate,
  wireIssue: wireIssueTemplate,
};
