import {
  ProspectStatus,
  ProspectEvent,
  PROSPECT_STATUS,
  PROSPECT_EVENT,
} from '../constants/status';
import type {
  Prospect,
  PipelineMetrics,
  StatusTransitionValidation,
} from '../types/prospect.types';

/**
 * Allowed status transitions map
 * Defines which statuses can transition to which other statuses
 */
const ALLOWED_TRANSITIONS: Record<ProspectStatus, ProspectStatus[]> = {
  [PROSPECT_STATUS.KYC_SENT]: [
    PROSPECT_STATUS.KYC_SUBMITTED,
    PROSPECT_STATUS.NOT_ELIGIBLE,
  ],
  [PROSPECT_STATUS.KYC_SUBMITTED]: [
    PROSPECT_STATUS.PRE_QUALIFIED,
    PROSPECT_STATUS.NOT_ELIGIBLE,
  ],
  // Legacy status - same transitions as kyc_submitted
  [PROSPECT_STATUS.SUBMITTED]: [
    PROSPECT_STATUS.PRE_QUALIFIED,
    PROSPECT_STATUS.NOT_ELIGIBLE,
  ],
  [PROSPECT_STATUS.PRE_QUALIFIED]: [
    PROSPECT_STATUS.MEETING_SCHEDULED,
    PROSPECT_STATUS.ACCOUNT_INVITE_SENT, // Can skip meeting and send onboarding directly
    PROSPECT_STATUS.NOT_ELIGIBLE,
  ],
  [PROSPECT_STATUS.NOT_ELIGIBLE]: [], // Terminal state
  [PROSPECT_STATUS.MEETING_SCHEDULED]: [
    PROSPECT_STATUS.MEETING_COMPLETE,
    PROSPECT_STATUS.NOT_ELIGIBLE,
  ],
  [PROSPECT_STATUS.MEETING_COMPLETE]: [
    PROSPECT_STATUS.ACCOUNT_INVITE_SENT,
    PROSPECT_STATUS.NOT_ELIGIBLE,
  ],
  [PROSPECT_STATUS.ACCOUNT_INVITE_SENT]: [
    PROSPECT_STATUS.ACCOUNT_CREATED,
  ],
  [PROSPECT_STATUS.ACCOUNT_CREATED]: [
    PROSPECT_STATUS.ONBOARDING_SUBMITTED,
  ],
  [PROSPECT_STATUS.ONBOARDING_SUBMITTED]: [
    PROSPECT_STATUS.DOCUMENTS_PENDING,
  ],
  [PROSPECT_STATUS.DOCUMENTS_PENDING]: [
    PROSPECT_STATUS.DOCUMENTS_APPROVED,
    PROSPECT_STATUS.DOCUMENTS_REJECTED,
  ],
  [PROSPECT_STATUS.DOCUMENTS_APPROVED]: [
    PROSPECT_STATUS.DOCUSIGN_SENT,
  ],
  [PROSPECT_STATUS.DOCUMENTS_REJECTED]: [
    PROSPECT_STATUS.ONBOARDING_SUBMITTED, // Can resubmit
    PROSPECT_STATUS.NOT_ELIGIBLE,
  ],
  [PROSPECT_STATUS.DOCUSIGN_SENT]: [
    PROSPECT_STATUS.DOCUSIGN_SIGNED,
  ],
  [PROSPECT_STATUS.DOCUSIGN_SIGNED]: [
    PROSPECT_STATUS.CONVERTED,
  ],
  [PROSPECT_STATUS.CONVERTED]: [], // Terminal state
};

/**
 * Auto-transition map based on events
 * Maps event types to the resulting status
 */
const AUTO_TRANSITIONS: Record<ProspectEvent, ProspectStatus | null> = {
  [PROSPECT_EVENT.KYC_FORM_SENT]: PROSPECT_STATUS.KYC_SENT,
  [PROSPECT_EVENT.KYC_FORM_SUBMITTED]: PROSPECT_STATUS.KYC_SUBMITTED,
  [PROSPECT_EVENT.KYC_APPROVED]: PROSPECT_STATUS.PRE_QUALIFIED,
  [PROSPECT_EVENT.KYC_REJECTED]: PROSPECT_STATUS.NOT_ELIGIBLE,
  [PROSPECT_EVENT.MEETING_BOOKED]: PROSPECT_STATUS.MEETING_SCHEDULED,
  [PROSPECT_EVENT.MEETING_COMPLETED]: PROSPECT_STATUS.MEETING_COMPLETE,
  [PROSPECT_EVENT.ACCOUNT_INVITE_SENT]: PROSPECT_STATUS.ACCOUNT_INVITE_SENT,
  [PROSPECT_EVENT.ACCOUNT_CREATED]: PROSPECT_STATUS.ACCOUNT_CREATED,
  [PROSPECT_EVENT.ONBOARDING_SUBMITTED]: PROSPECT_STATUS.ONBOARDING_SUBMITTED,
  [PROSPECT_EVENT.DOCUMENTS_UPLOADED]: PROSPECT_STATUS.DOCUMENTS_PENDING,
  [PROSPECT_EVENT.DOCUMENTS_APPROVED]: PROSPECT_STATUS.DOCUMENTS_APPROVED,
  [PROSPECT_EVENT.DOCUMENTS_REJECTED]: PROSPECT_STATUS.DOCUMENTS_REJECTED,
  [PROSPECT_EVENT.DOCUSIGN_SENT]: PROSPECT_STATUS.DOCUSIGN_SENT,
  [PROSPECT_EVENT.DOCUSIGN_SIGNED]: PROSPECT_STATUS.DOCUSIGN_SIGNED,
  [PROSPECT_EVENT.CONVERTED_TO_INVESTOR]: PROSPECT_STATUS.CONVERTED,
};

/**
 * Check if a status transition is allowed
 * Pure function - no side effects
 */
export function canTransitionTo(
  currentStatus: ProspectStatus,
  targetStatus: ProspectStatus
): boolean {
  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  return allowed?.includes(targetStatus) ?? false;
}

/**
 * Validate a status transition and return detailed result
 * Pure function - no side effects
 */
export function validateStatusTransition(
  currentStatus: ProspectStatus,
  targetStatus: ProspectStatus
): StatusTransitionValidation {
  if (currentStatus === targetStatus) {
    return { valid: false, error: 'Status is already set to this value' };
  }

  if (!canTransitionTo(currentStatus, targetStatus)) {
    return {
      valid: false,
      error: `Cannot transition from '${currentStatus}' to '${targetStatus}'`,
    };
  }

  return { valid: true };
}

/**
 * Get the next status based on an event
 * Returns null if no auto-transition should occur
 * Pure function - no side effects
 */
export function getNextAutoStatus(
  currentStatus: ProspectStatus,
  event: ProspectEvent
): ProspectStatus | null {
  const nextStatus = AUTO_TRANSITIONS[event];
  
  if (!nextStatus) {
    return null;
  }

  // Verify the transition is valid from current status
  if (!canTransitionTo(currentStatus, nextStatus)) {
    return null;
  }

  return nextStatus;
}

/**
 * Get all possible next statuses from current status
 * Pure function - no side effects
 */
export function getPossibleNextStatuses(
  currentStatus: ProspectStatus
): ProspectStatus[] {
  return ALLOWED_TRANSITIONS[currentStatus] ?? [];
}

/**
 * Check if a status is a terminal state (no further transitions)
 * Pure function - no side effects
 */
export function isTerminalStatus(status: ProspectStatus): boolean {
  const nextStatuses = ALLOWED_TRANSITIONS[status];
  return !nextStatuses || nextStatuses.length === 0;
}

/**
 * Get display-friendly status label
 * Pure function - no side effects
 */
export function getStatusLabel(status: ProspectStatus): string {
  const labels: Record<ProspectStatus, string> = {
    [PROSPECT_STATUS.KYC_SENT]: 'KYC Sent',
    [PROSPECT_STATUS.KYC_SUBMITTED]: 'KYC Submitted',
    [PROSPECT_STATUS.SUBMITTED]: 'KYC Submitted', // Legacy status label
    [PROSPECT_STATUS.PRE_QUALIFIED]: 'Pre-Qualified',
    [PROSPECT_STATUS.NOT_ELIGIBLE]: 'Not Eligible',
    [PROSPECT_STATUS.MEETING_SCHEDULED]: 'Meeting Scheduled',
    [PROSPECT_STATUS.MEETING_COMPLETE]: 'Meeting Complete',
    [PROSPECT_STATUS.ACCOUNT_INVITE_SENT]: 'Account Invite Sent',
    [PROSPECT_STATUS.ACCOUNT_CREATED]: 'Account Created',
    [PROSPECT_STATUS.ONBOARDING_SUBMITTED]: 'Onboarding Submitted',
    [PROSPECT_STATUS.DOCUMENTS_PENDING]: 'Documents Pending',
    [PROSPECT_STATUS.DOCUMENTS_APPROVED]: 'Documents Approved',
    [PROSPECT_STATUS.DOCUMENTS_REJECTED]: 'Documents Rejected',
    [PROSPECT_STATUS.DOCUSIGN_SENT]: 'DocuSign Sent',
    [PROSPECT_STATUS.DOCUSIGN_SIGNED]: 'DocuSign Signed',
    [PROSPECT_STATUS.CONVERTED]: 'Converted to Investor',
  };
  return labels[status] ?? status;
}

/**
 * Calculate pipeline metrics from a list of prospects
 * Pure aggregation function - no side effects
 */
export function calculatePipelineMetrics(
  prospects: ReadonlyArray<Prospect>,
  currentTime: Date
): PipelineMetrics {
  const oneWeekAgo = new Date(currentTime.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(currentTime.getTime() - 30 * 24 * 60 * 60 * 1000);

  const metrics: PipelineMetrics = {
    totalProspects: prospects.length,
    kycSent: 0,
    kycSubmitted: 0,
    kycSubmittedThisWeek: 0,
    preQualified: 0,
    meetingsScheduled: 0,
    meetingsCompleted: 0,
    onboardingInProgress: 0,
    documentsPending: 0,
    documentsApproved: 0,
    docusignPending: 0,
    readyToConvert: 0,
    convertedThisMonth: 0,
  };

  for (const prospect of prospects) {
    const createdAt = new Date(prospect.createdAt);

    switch (prospect.status) {
      case PROSPECT_STATUS.KYC_SENT:
        metrics.kycSent++;
        break;
      case PROSPECT_STATUS.KYC_SUBMITTED:
        metrics.kycSubmitted++;
        if (createdAt >= oneWeekAgo) {
          metrics.kycSubmittedThisWeek++;
        }
        break;
      case PROSPECT_STATUS.PRE_QUALIFIED:
        metrics.preQualified++;
        break;
      case PROSPECT_STATUS.MEETING_SCHEDULED:
        metrics.meetingsScheduled++;
        break;
      case PROSPECT_STATUS.MEETING_COMPLETE:
        metrics.meetingsCompleted++;
        break;
      case PROSPECT_STATUS.ACCOUNT_INVITE_SENT:
      case PROSPECT_STATUS.ACCOUNT_CREATED:
      case PROSPECT_STATUS.ONBOARDING_SUBMITTED:
        metrics.onboardingInProgress++;
        break;
      case PROSPECT_STATUS.DOCUMENTS_PENDING:
        metrics.documentsPending++;
        break;
      case PROSPECT_STATUS.DOCUMENTS_APPROVED:
        metrics.documentsApproved++;
        break;
      case PROSPECT_STATUS.DOCUSIGN_SENT:
        metrics.docusignPending++;
        break;
      case PROSPECT_STATUS.DOCUSIGN_SIGNED:
        metrics.readyToConvert++;
        break;
      case PROSPECT_STATUS.CONVERTED:
        if (prospect.convertedAt) {
          const convertedAt = new Date(prospect.convertedAt);
          if (convertedAt >= oneMonthAgo) {
            metrics.convertedThisMonth++;
          }
        }
        break;
    }
  }

  return metrics;
}

/**
 * Check if prospect requires action from fund manager
 * Pure function - no side effects
 */
export function requiresManagerAction(status: ProspectStatus): boolean {
  const actionRequiredStatuses: ProspectStatus[] = [
    PROSPECT_STATUS.KYC_SUBMITTED,
    PROSPECT_STATUS.MEETING_COMPLETE,
    PROSPECT_STATUS.DOCUMENTS_PENDING,
    PROSPECT_STATUS.DOCUSIGN_SIGNED,
  ];
  return actionRequiredStatuses.includes(status);
}

/**
 * Get the stage group for pipeline display
 * Pure function - no side effects
 */
export function getStageGroup(status: ProspectStatus): string {
  const kycStatuses: ProspectStatus[] = [
    PROSPECT_STATUS.KYC_SENT,
    PROSPECT_STATUS.KYC_SUBMITTED,
    PROSPECT_STATUS.PRE_QUALIFIED,
  ];
  if (kycStatuses.includes(status)) {
    return 'KYC';
  }

  const meetingStatuses: ProspectStatus[] = [
    PROSPECT_STATUS.MEETING_SCHEDULED,
    PROSPECT_STATUS.MEETING_COMPLETE,
  ];
  if (meetingStatuses.includes(status)) {
    return 'Meeting';
  }

  const onboardingStatuses: ProspectStatus[] = [
    PROSPECT_STATUS.ACCOUNT_INVITE_SENT,
    PROSPECT_STATUS.ACCOUNT_CREATED,
    PROSPECT_STATUS.ONBOARDING_SUBMITTED,
  ];
  if (onboardingStatuses.includes(status)) {
    return 'Onboarding';
  }

  const documentStatuses: ProspectStatus[] = [
    PROSPECT_STATUS.DOCUMENTS_PENDING,
    PROSPECT_STATUS.DOCUMENTS_APPROVED,
    PROSPECT_STATUS.DOCUMENTS_REJECTED,
  ];
  if (documentStatuses.includes(status)) {
    return 'Documents';
  }

  const signingStatuses: ProspectStatus[] = [
    PROSPECT_STATUS.DOCUSIGN_SENT,
    PROSPECT_STATUS.DOCUSIGN_SIGNED,
  ];
  if (signingStatuses.includes(status)) {
    return 'Signing';
  }

  if (status === PROSPECT_STATUS.CONVERTED) {
    return 'Converted';
  }

  if (status === PROSPECT_STATUS.NOT_ELIGIBLE) {
    return 'Rejected';
  }

  return 'Unknown';
}

