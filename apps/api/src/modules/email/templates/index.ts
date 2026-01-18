/**
 * Email Templates Index
 * Re-exports all email templates and types for easy importing
 */

// Base template components
export {
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

// Prospect/KYC templates (Stage 01 - 17 emails)
export {
  // Primary flow
  kycInviteTemplate,
  kycAutoSendTemplate,
  meetingInviteTemplate,
  // KYC reminders
  kycReminder1Template,
  kycReminder2Template,
  kycReminder3Template,
  // KYC rejection
  kycNotEligibleTemplate,
  // Meeting reminders
  meetingReminder24hrTemplate,
  meetingReminder15minTemplate,
  meetingNoShowTemplate,
  // Post-meeting
  postMeetingProceedTemplate,
  postMeetingConsideringTemplate,
  postMeetingNotFitTemplate,
  // Nurture sequence
  nurtureDay15Template,
  nurtureDay23Template,
  nurtureDay30Template,
  dormantCloseoutTemplate,
  // Legacy aliases
  kycReminderTemplate,
  postMeetingOnboardingTemplate,
} from './prospectTemplates';

export type {
  KYCInviteTemplateData,
  KYCAutoSendTemplateData,
  MeetingInviteTemplateData,
  KYCReminder1TemplateData,
  KYCReminder2TemplateData,
  KYCReminder3TemplateData,
  KYCNotEligibleTemplateData,
  MeetingReminder24hrTemplateData,
  MeetingReminder15minTemplateData,
  MeetingNoShowTemplateData,
  PostMeetingProceedTemplateData,
  PostMeetingConsideringTemplateData,
  PostMeetingNotFitTemplateData,
  NurtureDay15TemplateData,
  NurtureDay23TemplateData,
  NurtureDay30TemplateData,
  DormantCloseoutTemplateData,
  // Legacy types
  KYCReminderTemplateData,
  PostMeetingOnboardingTemplateData,
} from './prospectTemplates';

// Capital call templates (Stage 03 - Capital Operations)
export {
  // Original templates
  capitalCallRequestTemplate,
  wireConfirmationTemplate,
  wireIssueTemplate,
  // Capital call reminders
  capitalCallReminder7Template,
  capitalCallReminder3Template,
  capitalCallReminder1Template,
  // Past due and default
  capitalCallPastDueTemplate,
  capitalCallPastDue7Template,
  capitalCallDefaultTemplate,
  // Distributions
  distributionNoticeTemplate,
  distributionSentTemplate,
  distributionElectionTemplate,
  // Refinancing
  refinanceNoticeTemplate,
} from './capitalCallTemplates';

export type {
  // Original types
  CapitalCallRequestTemplateData,
  WireConfirmationTemplateData,
  WireIssueTemplateData,
  // Capital call reminders
  CapitalCallReminderTemplateData,
  // Past due and default
  CapitalCallPastDueTemplateData,
  CapitalCallPastDue7TemplateData,
  CapitalCallDefaultTemplateData,
  // Distributions
  DistributionNoticeTemplateData,
  DistributionSentTemplateData,
  DistributionElectionTemplateData,
  // Refinancing
  RefinanceNoticeTemplateData,
} from './capitalCallTemplates';

// Investor onboarding templates (Stage 02)
export {
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

export type {
  OnboardingReminder1TemplateData,
  OnboardingReminder2TemplateData,
  OnboardingReminder3TemplateData,
  DocumentUploadedPendingTemplateData,
  DocumentsReadySignatureTemplateData,
  SignatureReminder1TemplateData,
  SignatureReminder2TemplateData,
  DocumentsFullyExecutedTemplateData,
  FundingInstructionsTemplateData,
  FundingDiscrepancyTemplateData,
  WelcomeInvestorEnhancedTemplateData,
  AccountInvitationEnhancedTemplateData,
} from './investorOnboardingTemplates';

// Team invite templates
export {
  teamInviteTemplate,
  teamInviteReminderTemplate,
} from './teamInviteTemplate';

export type {
  TeamInviteTemplateData,
  TeamInviteReminderTemplateData,
} from './teamInviteTemplate';

// Reporting & Tax templates (Stage 04)
export {
  // Periodic Reports
  quarterlyReportTemplate,
  annualReportTemplate,
  annualMeetingInviteTemplate,
  // Property Updates
  propertyAcquisitionTemplate,
  propertyDispositionTemplate,
  // Tax Documents
  k1AvailableTemplate,
  k1EstimateTemplate,
  k1AmendedTemplate,
} from './reportingTaxTemplates';

export type {
  QuarterlyReportTemplateData,
  AnnualReportTemplateData,
  AnnualMeetingInviteTemplateData,
  PropertyAcquisitionTemplateData,
  PropertyDispositionTemplateData,
  K1AvailableTemplateData,
  K1EstimateTemplateData,
  K1AmendedTemplateData,
} from './reportingTaxTemplates';

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
  kycReminder1Template,
  kycReminder2Template,
  kycReminder3Template,
  kycNotEligibleTemplate,
  meetingReminder24hrTemplate,
  meetingReminder15minTemplate,
  meetingNoShowTemplate,
  postMeetingProceedTemplate,
  postMeetingConsideringTemplate,
  postMeetingNotFitTemplate,
  nurtureDay15Template,
  nurtureDay23Template,
  nurtureDay30Template,
  dormantCloseoutTemplate,
  kycReminderTemplate,
  postMeetingOnboardingTemplate,
} from './prospectTemplates';

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

import {
  teamInviteTemplate,
  teamInviteReminderTemplate,
} from './teamInviteTemplate';

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

import {
  quarterlyReportTemplate,
  annualReportTemplate,
  annualMeetingInviteTemplate,
  propertyAcquisitionTemplate,
  propertyDispositionTemplate,
  k1AvailableTemplate,
  k1EstimateTemplate,
  k1AmendedTemplate,
} from './reportingTaxTemplates';

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
  // Prospects - Primary flow
  kycInvite: kycInviteTemplate,
  kycAutoSend: kycAutoSendTemplate,
  meetingInvite: meetingInviteTemplate,
  // Prospects - KYC reminders
  kycReminder: kycReminderTemplate, // Legacy alias
  kycReminder1: kycReminder1Template,
  kycReminder2: kycReminder2Template,
  kycReminder3: kycReminder3Template,
  // Prospects - KYC rejection
  kycNotEligible: kycNotEligibleTemplate,
  // Prospects - Meeting
  meetingReminder24hr: meetingReminder24hrTemplate,
  meetingReminder15min: meetingReminder15minTemplate,
  meetingNoShow: meetingNoShowTemplate,
  // Prospects - Post-meeting
  postMeetingOnboarding: postMeetingOnboardingTemplate, // Legacy alias
  postMeetingProceed: postMeetingProceedTemplate,
  postMeetingConsidering: postMeetingConsideringTemplate,
  postMeetingNotFit: postMeetingNotFitTemplate,
  // Prospects - Nurture
  nurtureDay15: nurtureDay15Template,
  nurtureDay23: nurtureDay23Template,
  nurtureDay30: nurtureDay30Template,
  dormantCloseout: dormantCloseoutTemplate,
  // Capital Calls (Stage 03)
  capitalCallRequest: capitalCallRequestTemplate,
  wireConfirmation: wireConfirmationTemplate,
  wireIssue: wireIssueTemplate,
  capitalCallReminder7: capitalCallReminder7Template,
  capitalCallReminder3: capitalCallReminder3Template,
  capitalCallReminder1: capitalCallReminder1Template,
  capitalCallPastDue: capitalCallPastDueTemplate,
  capitalCallPastDue7: capitalCallPastDue7Template,
  capitalCallDefault: capitalCallDefaultTemplate,
  // Distributions (Stage 03)
  distributionNotice: distributionNoticeTemplate,
  distributionSent: distributionSentTemplate,
  distributionElection: distributionElectionTemplate,
  // Refinancing (Stage 03)
  refinanceNotice: refinanceNoticeTemplate,
  // Team Invites
  teamInvite: teamInviteTemplate,
  teamInviteReminder: teamInviteReminderTemplate,
  // Investor Onboarding (Stage 02)
  onboardingReminder1: onboardingReminder1Template,
  onboardingReminder2: onboardingReminder2Template,
  onboardingReminder3: onboardingReminder3Template,
  documentUploadedPending: documentUploadedPendingTemplate,
  documentsReadySignature: documentsReadySignatureTemplate,
  signatureReminder1: signatureReminder1Template,
  signatureReminder2: signatureReminder2Template,
  documentsFullyExecuted: documentsFullyExecutedTemplate,
  fundingInstructions: fundingInstructionsTemplate,
  fundingDiscrepancy: fundingDiscrepancyTemplate,
  welcomeInvestorEnhanced: welcomeInvestorEnhancedTemplate,
  accountInvitationEnhanced: accountInvitationEnhancedTemplate,
  // Reporting & Tax (Stage 04)
  quarterlyReport: quarterlyReportTemplate,
  annualReport: annualReportTemplate,
  annualMeetingInvite: annualMeetingInviteTemplate,
  propertyAcquisition: propertyAcquisitionTemplate,
  propertyDisposition: propertyDispositionTemplate,
  k1Available: k1AvailableTemplate,
  k1Estimate: k1EstimateTemplate,
  k1Amended: k1AmendedTemplate,
};
