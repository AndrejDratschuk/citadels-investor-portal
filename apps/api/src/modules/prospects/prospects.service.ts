/**
 * Prospects Service (Operator Layer)
 * Pure business logic - no side effects
 * No try/catch (errors bubble up to controller)
 * Timestamps/UUIDs passed in as parameters
 */

import type {
  Prospect,
  CreateProspectData,
  CreateInvestorFromProspectData,
  StatusTransitionValidation,
  SendKYCInput,
  ConvertToInvestorInput,
} from '@altsui/shared';
import type { ProspectStatus, ProspectSource } from '@altsui/shared';
import {
  canTransitionTo,
  validateStatusTransition as validateTransition,
} from '@altsui/shared';

export class ProspectsService {
  /**
   * Prepare data for creating a new prospect from manual KYC send
   * Pure function - validates and prepares data
   */
  prepareKYCSend(
    input: SendKYCInput,
    fundId: string,
    sentBy: string,
    generatedId: string,
    generatedToken: string,
    currentTime: Date
  ): CreateProspectData {
    return {
      id: generatedId,
      fundId,
      email: input.email.toLowerCase().trim(),
      firstName: input.firstName?.trim() ?? null,
      lastName: input.lastName?.trim() ?? null,
      phone: input.phone?.trim() ?? null,
      status: 'kyc_sent' as ProspectStatus,
      source: 'manual' as ProspectSource,
      sentBy,
      kycLinkToken: generatedToken,
      notes: input.notes?.trim() ?? null,
      createdAt: currentTime,
      updatedAt: currentTime,
    };
  }

  /**
   * Prepare data for creating a prospect from interest form
   * Pure function - validates and prepares data
   */
  prepareInterestFormProspect(
    email: string,
    name: string,
    phone: string | undefined,
    fundId: string,
    generatedId: string,
    generatedToken: string,
    currentTime: Date
  ): CreateProspectData {
    // Parse name into first/last
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || null;
    const lastName = nameParts.slice(1).join(' ') || null;

    return {
      id: generatedId,
      fundId,
      email: email.toLowerCase().trim(),
      firstName,
      lastName,
      phone: phone?.trim() ?? null,
      status: 'kyc_sent' as ProspectStatus,
      source: 'interest_form' as ProspectSource,
      sentBy: null,
      kycLinkToken: generatedToken,
      notes: null,
      createdAt: currentTime,
      updatedAt: currentTime,
    };
  }

  /**
   * Prepare data for creating a prospect from website KYC submission
   * Pure function - validates and prepares data
   */
  prepareWebsiteProspect(
    email: string,
    firstName: string | null,
    lastName: string | null,
    phone: string | null,
    fundId: string,
    generatedId: string,
    currentTime: Date
  ): CreateProspectData {
    return {
      id: generatedId,
      fundId,
      email: email.toLowerCase().trim(),
      firstName: firstName?.trim() ?? null,
      lastName: lastName?.trim() ?? null,
      phone: phone?.trim() ?? null,
      status: 'kyc_submitted' as ProspectStatus,
      source: 'website' as ProspectSource,
      sentBy: null,
      kycLinkToken: null,
      notes: null,
      createdAt: currentTime,
      updatedAt: currentTime,
    };
  }

  /**
   * Validate a status transition
   * Pure function - determines if transition is valid
   */
  validateStatusTransition(
    prospect: Prospect,
    newStatus: ProspectStatus
  ): StatusTransitionValidation {
    return validateTransition(prospect.status, newStatus);
  }

  /**
   * Check if a prospect can be approved (has valid accreditation)
   * Pure function - validates accreditation data
   */
  canApproveKYC(prospect: Prospect): { valid: boolean; error?: string } {
    // Must have at least one accreditation basis selected
    if (!prospect.accreditationBases || prospect.accreditationBases.length === 0) {
      return {
        valid: false,
        error: 'No accreditation basis selected',
      };
    }

    // Must have consent
    if (!prospect.consentGiven) {
      return {
        valid: false,
        error: 'Consent not given',
      };
    }

    return { valid: true };
  }

  /**
   * Check if documents can be approved
   * Pure function - validates current state allows document approval
   */
  canApproveDocuments(prospect: Prospect): { valid: boolean; error?: string } {
    if (prospect.status !== 'documents_pending') {
      return {
        valid: false,
        error: 'Documents can only be approved when status is documents_pending',
      };
    }

    return { valid: true };
  }

  /**
   * Check if prospect can be converted to investor
   * Pure function - validates all requirements are met
   */
  canConvertToInvestor(prospect: Prospect): { valid: boolean; error?: string } {
    if (prospect.status !== 'docusign_signed') {
      return {
        valid: false,
        error: 'Prospect must have signed DocuSign before conversion',
      };
    }

    if (prospect.convertedToInvestor) {
      return {
        valid: false,
        error: 'Prospect has already been converted to an investor',
      };
    }

    return { valid: true };
  }

  /**
   * Prepare investor data from a converted prospect
   * Pure function - maps prospect data to investor format
   */
  prepareInvestorConversion(
    prospect: Prospect,
    input: ConvertToInvestorInput,
    generatedId: string,
    currentTime: Date
  ): CreateInvestorFromProspectData {
    // Determine entity info
    let entityType: string | null = null;
    let entityName: string | null = null;

    if (prospect.investorCategory === 'entity') {
      entityType = prospect.investorType;
      entityName = prospect.entityLegalName;
    } else {
      entityType = 'individual';
    }

    return {
      id: generatedId,
      prospectId: prospect.id,
      fundId: prospect.fundId,
      email: prospect.email,
      firstName: prospect.firstName || prospect.authorizedSignerFirstName || '',
      lastName: prospect.lastName || prospect.authorizedSignerLastName || '',
      phone: prospect.phone,
      status: 'active',
      onboardedAt: currentTime,
      entityType,
      entityName,
      commitmentAmount: input.commitmentAmount,
    };
  }

  /**
   * Get display name for a prospect
   * Pure function - formats name for display
   */
  getDisplayName(prospect: Prospect): string {
    if (prospect.firstName && prospect.lastName) {
      return `${prospect.firstName} ${prospect.lastName}`;
    }
    if (prospect.firstName) {
      return prospect.firstName;
    }
    if (prospect.entityLegalName) {
      return prospect.entityLegalName;
    }
    if (prospect.authorizedSignerFirstName && prospect.authorizedSignerLastName) {
      return `${prospect.authorizedSignerFirstName} ${prospect.authorizedSignerLastName}`;
    }
    return prospect.email;
  }

  /**
   * Build KYC form URL for a prospect
   * Pure function - constructs URL from base and token
   */
  buildKYCFormUrl(baseUrl: string, token: string): string {
    return `${baseUrl}/kyc/token/${token}`;
  }

  /**
   * Build KYC form URL for fund (public link)
   * Pure function - constructs URL from base and fund ID
   */
  buildPublicKYCUrl(baseUrl: string, fundId: string): string {
    return `${baseUrl}/kyc/${fundId}`;
  }

  /**
   * Determine which email should be sent based on status change
   * Pure function - returns email type to send
   */
  determineEmailTrigger(
    newStatus: ProspectStatus,
    previousStatus: ProspectStatus
  ): string | null {
    // Map status transitions to email triggers
    const emailTriggers: Record<ProspectStatus, string | null> = {
      kyc_sent: 'kyc_invite',
      kyc_submitted: null, // No auto-email on submission
      pre_qualified: 'meeting_invite',
      not_eligible: null, // Consider adding rejection email
      meeting_scheduled: null, // Calendly handles this
      meeting_complete: 'post_meeting_onboarding',
      account_invite_sent: 'account_invite',
      account_created: 'account_created',
      onboarding_submitted: null, // No auto-email
      documents_pending: null, // No auto-email
      documents_approved: 'documents_approved_docusign',
      documents_rejected: 'documents_rejected',
      docusign_sent: null, // DocuSign handles this
      docusign_signed: null, // Consider adding confirmation
      converted: 'welcome_investor',
    };

    return emailTriggers[newStatus] ?? null;
  }

  /**
   * Check if prospect requires manager action
   * Pure function - evaluates current state
   */
  requiresManagerAction(prospect: Prospect): boolean {
    const actionRequiredStatuses: ProspectStatus[] = [
      'kyc_submitted' as ProspectStatus,
      'meeting_complete' as ProspectStatus,
      'documents_pending' as ProspectStatus,
      'docusign_signed' as ProspectStatus,
    ];
    return actionRequiredStatuses.includes(prospect.status);
  }

  /**
   * Get next recommended action for a prospect
   * Pure function - determines what should happen next
   */
  getNextAction(prospect: Prospect): string {
    switch (prospect.status) {
      case 'kyc_sent':
        return 'Waiting for prospect to complete KYC form';
      case 'kyc_submitted':
        return 'Review KYC submission and approve or reject';
      case 'pre_qualified':
        return 'Waiting for prospect to schedule meeting';
      case 'meeting_scheduled':
        return 'Waiting for meeting to occur';
      case 'meeting_complete':
        return 'Send account creation invite';
      case 'account_invite_sent':
        return 'Waiting for prospect to create account';
      case 'account_created':
        return 'Waiting for prospect to complete onboarding';
      case 'onboarding_submitted':
        return 'Review submitted onboarding documents';
      case 'documents_pending':
        return 'Review and approve or reject documents';
      case 'documents_approved':
        return 'Send DocuSign for signature';
      case 'documents_rejected':
        return 'Waiting for prospect to resubmit documents';
      case 'docusign_sent':
        return 'Waiting for DocuSign to be signed';
      case 'docusign_signed':
        return 'Convert prospect to investor';
      case 'converted':
        return 'Completed - investor created';
      case 'not_eligible':
        return 'Prospect is not eligible';
      default:
        return 'Unknown status';
    }
  }
}

export const prospectsService = new ProspectsService();

