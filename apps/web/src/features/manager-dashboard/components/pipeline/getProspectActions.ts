/**
 * getProspectActions
 * Pure function that determines which actions are available for a prospect based on status
 */

import type { ProspectStatus } from '@altsui/shared';

export type ProspectActionType =
  | 'approve_kyc'
  | 'reject_kyc'
  | 'copy_onboarding_link'
  | 'email_onboarding_link'
  | 'send_account_invite'
  | 'approve_documents'
  | 'reject_documents'
  | 'send_docusign'
  | 'convert_to_investor'
  | 'send_reminder'
  | 'mark_not_eligible';

export interface ProspectAction {
  type: ProspectActionType;
  label: string;
  variant: 'primary' | 'secondary' | 'destructive' | 'outline';
  description?: string;
}

export interface ProspectActionsConfig {
  actions: ProspectAction[];
  infoMessage?: string;
  showOnboardingLink?: boolean;
}

/**
 * Returns the available actions for a prospect based on their current status.
 * This is a pure function with no side effects.
 */
export function getProspectActions(status: ProspectStatus): ProspectActionsConfig {
  switch (status) {
    case 'kyc_sent':
      return {
        actions: [
          { type: 'send_reminder', label: 'Send Reminder', variant: 'outline' },
          { type: 'mark_not_eligible', label: 'Mark Not Eligible', variant: 'destructive' },
        ],
        infoMessage: 'Waiting for prospect to complete KYC form.',
      };

    case 'submitted':
    case 'kyc_submitted':
      return {
        actions: [
          { type: 'approve_kyc', label: 'Approve KYC', variant: 'primary' },
          { type: 'reject_kyc', label: 'Reject KYC', variant: 'destructive' },
        ],
        infoMessage: 'KYC form submitted. Review and approve or reject.',
      };

    case 'pre_qualified':
      return {
        actions: [
          { type: 'copy_onboarding_link', label: 'Copy Link', variant: 'outline' },
          { type: 'email_onboarding_link', label: 'Email Link', variant: 'primary' },
        ],
        showOnboardingLink: true,
        infoMessage: 'Pre-qualified. Send them the investor onboarding form.',
      };

    case 'meeting_scheduled':
      return {
        actions: [
          { type: 'send_reminder', label: 'Send Meeting Reminder', variant: 'outline' },
          { type: 'mark_not_eligible', label: 'Mark Not Eligible', variant: 'destructive' },
        ],
        infoMessage: 'Meeting is scheduled. Waiting for completion.',
      };

    case 'meeting_complete':
      return {
        actions: [
          { type: 'send_account_invite', label: 'Send Account Invite', variant: 'primary' },
          { type: 'mark_not_eligible', label: 'Mark Not Eligible', variant: 'destructive' },
        ],
        infoMessage: 'Meeting complete. Send an account invite to proceed.',
      };

    case 'account_invite_sent':
      return {
        actions: [
          { type: 'send_reminder', label: 'Resend Invite', variant: 'outline' },
          { type: 'mark_not_eligible', label: 'Mark Not Eligible', variant: 'destructive' },
        ],
        infoMessage: 'Account invite sent. Waiting for them to create their account.',
      };

    case 'account_created':
      return {
        actions: [
          { type: 'send_reminder', label: 'Send Reminder', variant: 'outline' },
        ],
        infoMessage: 'Account created. Waiting for onboarding submission.',
      };

    case 'onboarding_submitted':
      return {
        actions: [
          { type: 'send_reminder', label: 'Send Reminder', variant: 'outline' },
        ],
        infoMessage: 'Onboarding submitted. Waiting for document uploads.',
      };

    case 'documents_pending':
      return {
        actions: [
          { type: 'approve_documents', label: 'Approve Documents', variant: 'primary' },
          { type: 'reject_documents', label: 'Reject Documents', variant: 'destructive' },
        ],
        infoMessage: 'Documents uploaded. Review and approve or reject.',
      };

    case 'documents_approved':
      return {
        actions: [
          { type: 'send_docusign', label: 'Send DocuSign', variant: 'primary' },
        ],
        infoMessage: 'Documents approved. Send DocuSign for signature.',
      };

    case 'documents_rejected':
      return {
        actions: [
          { type: 'send_reminder', label: 'Request New Documents', variant: 'outline' },
          { type: 'mark_not_eligible', label: 'Mark Not Eligible', variant: 'destructive' },
        ],
        infoMessage: 'Documents rejected. Waiting for new uploads.',
      };

    case 'docusign_sent':
      return {
        actions: [
          { type: 'send_reminder', label: 'Send Reminder', variant: 'outline' },
        ],
        infoMessage: 'DocuSign sent. Waiting for signature.',
      };

    case 'docusign_signed':
      return {
        actions: [
          { type: 'convert_to_investor', label: 'Convert to Investor', variant: 'primary' },
        ],
        infoMessage: 'Documents signed. Ready to convert to investor.',
      };

    case 'converted':
      return {
        actions: [],
        infoMessage: 'This prospect has been converted to an investor.',
      };

    case 'not_eligible':
      return {
        actions: [],
        infoMessage: 'This prospect was marked as not eligible.',
      };

    default:
      return {
        actions: [
          { type: 'send_reminder', label: 'Send Reminder', variant: 'outline' },
        ],
      };
  }
}

/**
 * Returns the onboarding URL for a prospect
 */
export function buildOnboardingUrl(prospectId: string, baseUrl: string): string {
  return `${baseUrl}/onboarding/${prospectId}`;
}

