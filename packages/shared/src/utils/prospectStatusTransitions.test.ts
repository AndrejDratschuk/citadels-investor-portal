/**
 * Prospect Status Transitions Tests
 * Validates the state machine for prospect pipeline flow
 */

import { describe, it, expect } from 'vitest';
import {
  canTransitionTo,
  validateStatusTransition,
  getNextAutoStatus,
  getPossibleNextStatuses,
  isTerminalStatus,
  getStatusLabel,
  requiresManagerAction,
  getStageGroup,
  calculatePipelineMetrics,
} from './prospectStatusTransitions';
import { PROSPECT_STATUS, PROSPECT_EVENT } from '../constants/status';
import type { Prospect } from '../types/prospect.types';

describe('Status Transition Validation', () => {
  describe('canTransitionTo', () => {
    // Valid KYC flow transitions
    it('should allow KYC_SENT -> KYC_SUBMITTED', () => {
      expect(canTransitionTo(PROSPECT_STATUS.KYC_SENT, PROSPECT_STATUS.KYC_SUBMITTED)).toBe(true);
    });

    it('should allow KYC_SENT -> NOT_ELIGIBLE', () => {
      expect(canTransitionTo(PROSPECT_STATUS.KYC_SENT, PROSPECT_STATUS.NOT_ELIGIBLE)).toBe(true);
    });

    it('should allow KYC_SUBMITTED -> PRE_QUALIFIED', () => {
      expect(canTransitionTo(PROSPECT_STATUS.KYC_SUBMITTED, PROSPECT_STATUS.PRE_QUALIFIED)).toBe(true);
    });

    it('should allow KYC_SUBMITTED -> NOT_ELIGIBLE', () => {
      expect(canTransitionTo(PROSPECT_STATUS.KYC_SUBMITTED, PROSPECT_STATUS.NOT_ELIGIBLE)).toBe(true);
    });

    // Valid meeting flow transitions
    it('should allow PRE_QUALIFIED -> MEETING_SCHEDULED', () => {
      expect(canTransitionTo(PROSPECT_STATUS.PRE_QUALIFIED, PROSPECT_STATUS.MEETING_SCHEDULED)).toBe(true);
    });

    it('should allow PRE_QUALIFIED -> ACCOUNT_INVITE_SENT (skip meeting)', () => {
      expect(canTransitionTo(PROSPECT_STATUS.PRE_QUALIFIED, PROSPECT_STATUS.ACCOUNT_INVITE_SENT)).toBe(true);
    });

    it('should allow MEETING_SCHEDULED -> MEETING_COMPLETE', () => {
      expect(canTransitionTo(PROSPECT_STATUS.MEETING_SCHEDULED, PROSPECT_STATUS.MEETING_COMPLETE)).toBe(true);
    });

    // Post-meeting outcomes
    it('should allow MEETING_COMPLETE -> ACCOUNT_INVITE_SENT (Proceed)', () => {
      expect(canTransitionTo(PROSPECT_STATUS.MEETING_COMPLETE, PROSPECT_STATUS.ACCOUNT_INVITE_SENT)).toBe(true);
    });

    it('should allow MEETING_COMPLETE -> CONSIDERING', () => {
      expect(canTransitionTo(PROSPECT_STATUS.MEETING_COMPLETE, PROSPECT_STATUS.CONSIDERING)).toBe(true);
    });

    it('should allow MEETING_COMPLETE -> NOT_A_FIT', () => {
      expect(canTransitionTo(PROSPECT_STATUS.MEETING_COMPLETE, PROSPECT_STATUS.NOT_A_FIT)).toBe(true);
    });

    // Nurture to onboarding
    it('should allow CONSIDERING -> ACCOUNT_INVITE_SENT', () => {
      expect(canTransitionTo(PROSPECT_STATUS.CONSIDERING, PROSPECT_STATUS.ACCOUNT_INVITE_SENT)).toBe(true);
    });

    it('should allow CONSIDERING -> NOT_A_FIT', () => {
      expect(canTransitionTo(PROSPECT_STATUS.CONSIDERING, PROSPECT_STATUS.NOT_A_FIT)).toBe(true);
    });

    // Onboarding flow
    it('should allow ACCOUNT_INVITE_SENT -> ACCOUNT_CREATED', () => {
      expect(canTransitionTo(PROSPECT_STATUS.ACCOUNT_INVITE_SENT, PROSPECT_STATUS.ACCOUNT_CREATED)).toBe(true);
    });

    it('should allow ACCOUNT_CREATED -> ONBOARDING_SUBMITTED', () => {
      expect(canTransitionTo(PROSPECT_STATUS.ACCOUNT_CREATED, PROSPECT_STATUS.ONBOARDING_SUBMITTED)).toBe(true);
    });

    // Document flow
    it('should allow ONBOARDING_SUBMITTED -> DOCUMENTS_PENDING', () => {
      expect(canTransitionTo(PROSPECT_STATUS.ONBOARDING_SUBMITTED, PROSPECT_STATUS.DOCUMENTS_PENDING)).toBe(true);
    });

    it('should allow DOCUMENTS_PENDING -> DOCUMENTS_APPROVED', () => {
      expect(canTransitionTo(PROSPECT_STATUS.DOCUMENTS_PENDING, PROSPECT_STATUS.DOCUMENTS_APPROVED)).toBe(true);
    });

    it('should allow DOCUMENTS_PENDING -> DOCUMENTS_REJECTED', () => {
      expect(canTransitionTo(PROSPECT_STATUS.DOCUMENTS_PENDING, PROSPECT_STATUS.DOCUMENTS_REJECTED)).toBe(true);
    });

    it('should allow DOCUMENTS_REJECTED -> ONBOARDING_SUBMITTED (resubmit)', () => {
      expect(canTransitionTo(PROSPECT_STATUS.DOCUMENTS_REJECTED, PROSPECT_STATUS.ONBOARDING_SUBMITTED)).toBe(true);
    });

    // Signing flow
    it('should allow DOCUMENTS_APPROVED -> DOCUSIGN_SENT', () => {
      expect(canTransitionTo(PROSPECT_STATUS.DOCUMENTS_APPROVED, PROSPECT_STATUS.DOCUSIGN_SENT)).toBe(true);
    });

    it('should allow DOCUSIGN_SENT -> DOCUSIGN_SIGNED', () => {
      expect(canTransitionTo(PROSPECT_STATUS.DOCUSIGN_SENT, PROSPECT_STATUS.DOCUSIGN_SIGNED)).toBe(true);
    });

    it('should allow DOCUSIGN_SIGNED -> CONVERTED', () => {
      expect(canTransitionTo(PROSPECT_STATUS.DOCUSIGN_SIGNED, PROSPECT_STATUS.CONVERTED)).toBe(true);
    });

    // Invalid transitions
    it('should NOT allow KYC_SENT -> PRE_QUALIFIED (must go through KYC_SUBMITTED)', () => {
      expect(canTransitionTo(PROSPECT_STATUS.KYC_SENT, PROSPECT_STATUS.PRE_QUALIFIED)).toBe(false);
    });

    it('should NOT allow KYC_SENT -> MEETING_SCHEDULED (skip steps)', () => {
      expect(canTransitionTo(PROSPECT_STATUS.KYC_SENT, PROSPECT_STATUS.MEETING_SCHEDULED)).toBe(false);
    });

    it('should NOT allow MEETING_SCHEDULED -> CONVERTED (skip steps)', () => {
      expect(canTransitionTo(PROSPECT_STATUS.MEETING_SCHEDULED, PROSPECT_STATUS.CONVERTED)).toBe(false);
    });

    it('should NOT allow CONVERTED -> any status (terminal)', () => {
      expect(canTransitionTo(PROSPECT_STATUS.CONVERTED, PROSPECT_STATUS.KYC_SENT)).toBe(false);
      expect(canTransitionTo(PROSPECT_STATUS.CONVERTED, PROSPECT_STATUS.ACCOUNT_CREATED)).toBe(false);
    });

    it('should NOT allow NOT_ELIGIBLE -> any status (terminal)', () => {
      expect(canTransitionTo(PROSPECT_STATUS.NOT_ELIGIBLE, PROSPECT_STATUS.KYC_SUBMITTED)).toBe(false);
      expect(canTransitionTo(PROSPECT_STATUS.NOT_ELIGIBLE, PROSPECT_STATUS.PRE_QUALIFIED)).toBe(false);
    });

    it('should NOT allow NOT_A_FIT -> any status (terminal)', () => {
      expect(canTransitionTo(PROSPECT_STATUS.NOT_A_FIT, PROSPECT_STATUS.CONSIDERING)).toBe(false);
      expect(canTransitionTo(PROSPECT_STATUS.NOT_A_FIT, PROSPECT_STATUS.ACCOUNT_INVITE_SENT)).toBe(false);
    });

    // Backwards transitions (generally not allowed)
    it('should NOT allow PRE_QUALIFIED -> KYC_SUBMITTED (backwards)', () => {
      expect(canTransitionTo(PROSPECT_STATUS.PRE_QUALIFIED, PROSPECT_STATUS.KYC_SUBMITTED)).toBe(false);
    });

    it('should NOT allow ACCOUNT_CREATED -> ACCOUNT_INVITE_SENT (backwards)', () => {
      expect(canTransitionTo(PROSPECT_STATUS.ACCOUNT_CREATED, PROSPECT_STATUS.ACCOUNT_INVITE_SENT)).toBe(false);
    });
  });

  describe('validateStatusTransition', () => {
    it('should return valid for allowed transition', () => {
      const result = validateStatusTransition(
        PROSPECT_STATUS.KYC_SENT,
        PROSPECT_STATUS.KYC_SUBMITTED
      );
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error for same status', () => {
      const result = validateStatusTransition(
        PROSPECT_STATUS.KYC_SENT,
        PROSPECT_STATUS.KYC_SENT
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('already set');
    });

    it('should return error for invalid transition', () => {
      const result = validateStatusTransition(
        PROSPECT_STATUS.KYC_SENT,
        PROSPECT_STATUS.CONVERTED
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Cannot transition');
    });
  });

  describe('getNextAutoStatus', () => {
    it('should return KYC_SENT for KYC_FORM_SENT event', () => {
      // Note: This tests from undefined/initial state scenario
      expect(getNextAutoStatus(PROSPECT_STATUS.KYC_SENT, PROSPECT_EVENT.KYC_FORM_SUBMITTED)).toBe(
        PROSPECT_STATUS.KYC_SUBMITTED
      );
    });

    it('should return PRE_QUALIFIED for KYC_APPROVED event', () => {
      expect(getNextAutoStatus(PROSPECT_STATUS.KYC_SUBMITTED, PROSPECT_EVENT.KYC_APPROVED)).toBe(
        PROSPECT_STATUS.PRE_QUALIFIED
      );
    });

    it('should return NOT_ELIGIBLE for KYC_REJECTED event', () => {
      expect(getNextAutoStatus(PROSPECT_STATUS.KYC_SUBMITTED, PROSPECT_EVENT.KYC_REJECTED)).toBe(
        PROSPECT_STATUS.NOT_ELIGIBLE
      );
    });

    it('should return MEETING_SCHEDULED for MEETING_BOOKED event', () => {
      expect(getNextAutoStatus(PROSPECT_STATUS.PRE_QUALIFIED, PROSPECT_EVENT.MEETING_BOOKED)).toBe(
        PROSPECT_STATUS.MEETING_SCHEDULED
      );
    });

    it('should return MEETING_COMPLETE for MEETING_COMPLETED event', () => {
      expect(getNextAutoStatus(PROSPECT_STATUS.MEETING_SCHEDULED, PROSPECT_EVENT.MEETING_COMPLETED)).toBe(
        PROSPECT_STATUS.MEETING_COMPLETE
      );
    });

    it('should return null for MEETING_NO_SHOW (manager decides)', () => {
      expect(getNextAutoStatus(PROSPECT_STATUS.MEETING_SCHEDULED, PROSPECT_EVENT.MEETING_NO_SHOW)).toBe(null);
    });

    it('should return ACCOUNT_INVITE_SENT for MARKED_PROCEED', () => {
      expect(getNextAutoStatus(PROSPECT_STATUS.MEETING_COMPLETE, PROSPECT_EVENT.MARKED_PROCEED)).toBe(
        PROSPECT_STATUS.ACCOUNT_INVITE_SENT
      );
    });

    it('should return CONSIDERING for MARKED_CONSIDERING', () => {
      expect(getNextAutoStatus(PROSPECT_STATUS.MEETING_COMPLETE, PROSPECT_EVENT.MARKED_CONSIDERING)).toBe(
        PROSPECT_STATUS.CONSIDERING
      );
    });

    it('should return NOT_A_FIT for MARKED_NOT_A_FIT', () => {
      expect(getNextAutoStatus(PROSPECT_STATUS.MEETING_COMPLETE, PROSPECT_EVENT.MARKED_NOT_A_FIT)).toBe(
        PROSPECT_STATUS.NOT_A_FIT
      );
    });

    it('should return ACCOUNT_INVITE_SENT for READY_TO_INVEST from CONSIDERING', () => {
      expect(getNextAutoStatus(PROSPECT_STATUS.CONSIDERING, PROSPECT_EVENT.READY_TO_INVEST)).toBe(
        PROSPECT_STATUS.ACCOUNT_INVITE_SENT
      );
    });

    it('should return null for invalid transition', () => {
      // Cannot go from KYC_SENT directly to PRE_QUALIFIED
      expect(getNextAutoStatus(PROSPECT_STATUS.KYC_SENT, PROSPECT_EVENT.KYC_APPROVED)).toBe(null);
    });
  });

  describe('getPossibleNextStatuses', () => {
    it('should return correct options for KYC_SENT', () => {
      const options = getPossibleNextStatuses(PROSPECT_STATUS.KYC_SENT);
      expect(options).toContain(PROSPECT_STATUS.KYC_SUBMITTED);
      expect(options).toContain(PROSPECT_STATUS.NOT_ELIGIBLE);
      expect(options).toHaveLength(2);
    });

    it('should return correct options for MEETING_COMPLETE', () => {
      const options = getPossibleNextStatuses(PROSPECT_STATUS.MEETING_COMPLETE);
      expect(options).toContain(PROSPECT_STATUS.ACCOUNT_INVITE_SENT);
      expect(options).toContain(PROSPECT_STATUS.CONSIDERING);
      expect(options).toContain(PROSPECT_STATUS.NOT_A_FIT);
      expect(options).toContain(PROSPECT_STATUS.NOT_ELIGIBLE);
      expect(options).toHaveLength(4);
    });

    it('should return empty array for terminal status', () => {
      expect(getPossibleNextStatuses(PROSPECT_STATUS.CONVERTED)).toEqual([]);
      expect(getPossibleNextStatuses(PROSPECT_STATUS.NOT_ELIGIBLE)).toEqual([]);
      expect(getPossibleNextStatuses(PROSPECT_STATUS.NOT_A_FIT)).toEqual([]);
    });
  });

  describe('isTerminalStatus', () => {
    it('should return true for CONVERTED', () => {
      expect(isTerminalStatus(PROSPECT_STATUS.CONVERTED)).toBe(true);
    });

    it('should return true for NOT_ELIGIBLE', () => {
      expect(isTerminalStatus(PROSPECT_STATUS.NOT_ELIGIBLE)).toBe(true);
    });

    it('should return true for NOT_A_FIT', () => {
      expect(isTerminalStatus(PROSPECT_STATUS.NOT_A_FIT)).toBe(true);
    });

    it('should return false for non-terminal statuses', () => {
      expect(isTerminalStatus(PROSPECT_STATUS.KYC_SENT)).toBe(false);
      expect(isTerminalStatus(PROSPECT_STATUS.MEETING_COMPLETE)).toBe(false);
      expect(isTerminalStatus(PROSPECT_STATUS.CONSIDERING)).toBe(false);
      expect(isTerminalStatus(PROSPECT_STATUS.DOCUSIGN_SIGNED)).toBe(false);
    });
  });
});

describe('Status Labels and Grouping', () => {
  describe('getStatusLabel', () => {
    it('should return human-readable labels', () => {
      expect(getStatusLabel(PROSPECT_STATUS.KYC_SENT)).toBe('KYC Sent');
      expect(getStatusLabel(PROSPECT_STATUS.PRE_QUALIFIED)).toBe('Pre-Qualified');
      expect(getStatusLabel(PROSPECT_STATUS.MEETING_SCHEDULED)).toBe('Meeting Scheduled');
      expect(getStatusLabel(PROSPECT_STATUS.CONSIDERING)).toBe('Considering');
      expect(getStatusLabel(PROSPECT_STATUS.NOT_A_FIT)).toBe('Not a Fit');
      expect(getStatusLabel(PROSPECT_STATUS.CONVERTED)).toBe('Converted to Investor');
    });

    it('should handle legacy SUBMITTED status', () => {
      expect(getStatusLabel(PROSPECT_STATUS.SUBMITTED)).toBe('KYC Submitted');
    });
  });

  describe('getStageGroup', () => {
    it('should return KYC for KYC-related statuses', () => {
      expect(getStageGroup(PROSPECT_STATUS.KYC_SENT)).toBe('KYC');
      expect(getStageGroup(PROSPECT_STATUS.KYC_SUBMITTED)).toBe('KYC');
      expect(getStageGroup(PROSPECT_STATUS.PRE_QUALIFIED)).toBe('KYC');
    });

    it('should return Meeting for meeting statuses', () => {
      expect(getStageGroup(PROSPECT_STATUS.MEETING_SCHEDULED)).toBe('Meeting');
      expect(getStageGroup(PROSPECT_STATUS.MEETING_COMPLETE)).toBe('Meeting');
    });

    it('should return Nurture for CONSIDERING', () => {
      expect(getStageGroup(PROSPECT_STATUS.CONSIDERING)).toBe('Nurture');
    });

    it('should return Onboarding for onboarding statuses', () => {
      expect(getStageGroup(PROSPECT_STATUS.ACCOUNT_INVITE_SENT)).toBe('Onboarding');
      expect(getStageGroup(PROSPECT_STATUS.ACCOUNT_CREATED)).toBe('Onboarding');
      expect(getStageGroup(PROSPECT_STATUS.ONBOARDING_SUBMITTED)).toBe('Onboarding');
    });

    it('should return Documents for document statuses', () => {
      expect(getStageGroup(PROSPECT_STATUS.DOCUMENTS_PENDING)).toBe('Documents');
      expect(getStageGroup(PROSPECT_STATUS.DOCUMENTS_APPROVED)).toBe('Documents');
      expect(getStageGroup(PROSPECT_STATUS.DOCUMENTS_REJECTED)).toBe('Documents');
    });

    it('should return Signing for signing statuses', () => {
      expect(getStageGroup(PROSPECT_STATUS.DOCUSIGN_SENT)).toBe('Signing');
      expect(getStageGroup(PROSPECT_STATUS.DOCUSIGN_SIGNED)).toBe('Signing');
    });

    it('should return Converted for CONVERTED', () => {
      expect(getStageGroup(PROSPECT_STATUS.CONVERTED)).toBe('Converted');
    });

    it('should return Closed for terminal failure statuses', () => {
      expect(getStageGroup(PROSPECT_STATUS.NOT_ELIGIBLE)).toBe('Closed');
      expect(getStageGroup(PROSPECT_STATUS.NOT_A_FIT)).toBe('Closed');
    });
  });

  describe('requiresManagerAction', () => {
    it('should return true for statuses needing review', () => {
      expect(requiresManagerAction(PROSPECT_STATUS.KYC_SUBMITTED)).toBe(true);
      expect(requiresManagerAction(PROSPECT_STATUS.MEETING_COMPLETE)).toBe(true);
      expect(requiresManagerAction(PROSPECT_STATUS.DOCUMENTS_PENDING)).toBe(true);
      expect(requiresManagerAction(PROSPECT_STATUS.DOCUSIGN_SIGNED)).toBe(true);
    });

    it('should return true for CONSIDERING (may need follow-up)', () => {
      expect(requiresManagerAction(PROSPECT_STATUS.CONSIDERING)).toBe(true);
    });

    it('should return false for automated/waiting statuses', () => {
      expect(requiresManagerAction(PROSPECT_STATUS.KYC_SENT)).toBe(false);
      expect(requiresManagerAction(PROSPECT_STATUS.MEETING_SCHEDULED)).toBe(false);
      expect(requiresManagerAction(PROSPECT_STATUS.DOCUSIGN_SENT)).toBe(false);
    });
  });
});

describe('Pipeline Metrics Calculation', () => {
  const createProspect = (overrides: Partial<Prospect>): Prospect => ({
    id: 'test-id',
    fundId: 'fund-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    phone: null,
    status: PROSPECT_STATUS.KYC_SENT,
    source: 'manual',
    investorCategory: null,
    investorType: null,
    country: null,
    state: null,
    city: null,
    entityLegalName: null,
    countryOfFormation: null,
    stateOfFormation: null,
    authorizedSignerFirstName: null,
    authorizedSignerLastName: null,
    authorizedSignerTitle: null,
    accreditationBases: [],
    indicativeCommitment: null,
    timeline: null,
    investmentGoals: [],
    likelihood: null,
    questionsForManager: null,
    preferredContact: null,
    consentGiven: false,
    kycLinkToken: null,
    calendlyEventUrl: null,
    sentBy: null,
    notes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    meetingScheduledAt: null,
    meetingCompletedAt: null,
    consideringAt: null,
    onboardingStartedAt: null,
    onboardingSubmittedAt: null,
    documentsApprovedAt: null,
    documentsRejectedAt: null,
    documentRejectionReason: null,
    meetingRecapBullets: null,
    docusignEnvelopeId: null,
    docusignSentAt: null,
    docusignSignedAt: null,
    convertedToInvestor: false,
    convertedAt: null,
    investorId: null,
    ...overrides,
  });

  it('should count total prospects', () => {
    const prospects = [
      createProspect({ status: PROSPECT_STATUS.KYC_SENT }),
      createProspect({ status: PROSPECT_STATUS.PRE_QUALIFIED }),
      createProspect({ status: PROSPECT_STATUS.MEETING_SCHEDULED }),
    ];

    const metrics = calculatePipelineMetrics(prospects, new Date());
    expect(metrics.totalProspects).toBe(3);
  });

  it('should count KYC stage prospects', () => {
    const prospects = [
      createProspect({ status: PROSPECT_STATUS.KYC_SENT }),
      createProspect({ status: PROSPECT_STATUS.KYC_SENT }),
      createProspect({ status: PROSPECT_STATUS.KYC_SUBMITTED }),
      createProspect({ status: PROSPECT_STATUS.PRE_QUALIFIED }),
    ];

    const metrics = calculatePipelineMetrics(prospects, new Date());
    expect(metrics.kycSent).toBe(2);
    expect(metrics.kycSubmitted).toBe(1);
    expect(metrics.preQualified).toBe(1);
  });

  it('should count meeting stage prospects', () => {
    const prospects = [
      createProspect({ status: PROSPECT_STATUS.MEETING_SCHEDULED }),
      createProspect({ status: PROSPECT_STATUS.MEETING_SCHEDULED }),
      createProspect({ status: PROSPECT_STATUS.MEETING_COMPLETE }),
    ];

    const metrics = calculatePipelineMetrics(prospects, new Date());
    expect(metrics.meetingsScheduled).toBe(2);
    expect(metrics.meetingsCompleted).toBe(1);
  });

  it('should count nurture stage prospects', () => {
    const prospects = [
      createProspect({ status: PROSPECT_STATUS.CONSIDERING }),
      createProspect({ status: PROSPECT_STATUS.CONSIDERING }),
    ];

    const metrics = calculatePipelineMetrics(prospects, new Date());
    expect(metrics.considering).toBe(2);
  });

  it('should count onboarding in progress', () => {
    const prospects = [
      createProspect({ status: PROSPECT_STATUS.ACCOUNT_INVITE_SENT }),
      createProspect({ status: PROSPECT_STATUS.ACCOUNT_CREATED }),
      createProspect({ status: PROSPECT_STATUS.ONBOARDING_SUBMITTED }),
    ];

    const metrics = calculatePipelineMetrics(prospects, new Date());
    expect(metrics.onboardingInProgress).toBe(3);
  });

  it('should count document stage prospects', () => {
    const prospects = [
      createProspect({ status: PROSPECT_STATUS.DOCUMENTS_PENDING }),
      createProspect({ status: PROSPECT_STATUS.DOCUMENTS_APPROVED }),
    ];

    const metrics = calculatePipelineMetrics(prospects, new Date());
    expect(metrics.documentsPending).toBe(1);
    expect(metrics.documentsApproved).toBe(1);
  });

  it('should count signing stage prospects', () => {
    const prospects = [
      createProspect({ status: PROSPECT_STATUS.DOCUSIGN_SENT }),
      createProspect({ status: PROSPECT_STATUS.DOCUSIGN_SIGNED }),
    ];

    const metrics = calculatePipelineMetrics(prospects, new Date());
    expect(metrics.docusignPending).toBe(1);
    expect(metrics.readyToConvert).toBe(1);
  });

  it('should count conversions this month', () => {
    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const prospects = [
      createProspect({
        status: PROSPECT_STATUS.CONVERTED,
        convertedAt: twoWeeksAgo.toISOString(),
      }),
      createProspect({
        status: PROSPECT_STATUS.CONVERTED,
        convertedAt: twoMonthsAgo.toISOString(),
      }),
    ];

    const metrics = calculatePipelineMetrics(prospects, now);
    expect(metrics.convertedThisMonth).toBe(1);
  });

  it('should count KYC submissions this week', () => {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const prospects = [
      createProspect({
        status: PROSPECT_STATUS.KYC_SUBMITTED,
        createdAt: threeDaysAgo.toISOString(),
      }),
      createProspect({
        status: PROSPECT_STATUS.KYC_SUBMITTED,
        createdAt: twoWeeksAgo.toISOString(),
      }),
    ];

    const metrics = calculatePipelineMetrics(prospects, now);
    expect(metrics.kycSubmitted).toBe(2);
    expect(metrics.kycSubmittedThisWeek).toBe(1);
  });

  it('should handle empty prospect list', () => {
    const metrics = calculatePipelineMetrics([], new Date());
    expect(metrics.totalProspects).toBe(0);
    expect(metrics.kycSent).toBe(0);
    expect(metrics.convertedThisMonth).toBe(0);
  });
});
