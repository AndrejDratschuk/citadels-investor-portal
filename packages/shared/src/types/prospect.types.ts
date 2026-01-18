import { ProspectStatus, ProspectSource } from '../constants/status';

/**
 * Prospect - Anemic data structure representing a prospect in the pipeline
 * No logic, only properties
 */
export interface Prospect {
  id: string;
  fundId: string;
  
  // Contact information
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  
  // Pipeline status
  status: ProspectStatus;
  source: ProspectSource;
  
  // Investor type (from KYC)
  investorCategory: 'individual' | 'entity' | null;
  investorType: string | null;
  
  // Location info
  country: string | null;
  state: string | null;
  city: string | null;
  
  // Entity info (if entity)
  entityLegalName: string | null;
  countryOfFormation: string | null;
  stateOfFormation: string | null;
  authorizedSignerFirstName: string | null;
  authorizedSignerLastName: string | null;
  authorizedSignerTitle: string | null;
  
  // Accreditation
  accreditationBases: string[];
  
  // Investment intent
  indicativeCommitment: number | null;
  timeline: 'asap' | '30_60_days' | '60_90_days' | 'over_90_days' | null;
  investmentGoals: string[];
  likelihood: 'low' | 'medium' | 'high' | null;
  questionsForManager: string | null;
  
  // Consent
  preferredContact: 'email' | 'phone' | 'sms' | 'whatsapp' | 'other' | null;
  consentGiven: boolean;
  
  // KYC tracking
  kycLinkToken: string | null;
  calendlyEventUrl: string | null;
  
  // Pipeline metadata
  sentBy: string | null;
  notes: string | null;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  meetingScheduledAt: string | null;
  meetingCompletedAt: string | null;
  consideringAt: string | null;
  onboardingStartedAt: string | null;
  onboardingSubmittedAt: string | null;
  documentsApprovedAt: string | null;
  documentsRejectedAt: string | null;
  documentRejectionReason: string | null;
  
  // Post-meeting notes
  meetingRecapBullets: string | null;
  
  // DocuSign
  docusignEnvelopeId: string | null;
  docusignSentAt: string | null;
  docusignSignedAt: string | null;
  
  // Conversion
  convertedToInvestor: boolean;
  convertedAt: string | null;
  investorId: string | null;
  
  // Related fund info (for display)
  fundName?: string;
  fundCode?: string;
}

/**
 * Data required to create a new prospect in the database
 */
export interface CreateProspectData {
  id: string;
  fundId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  status: ProspectStatus;
  source: ProspectSource;
  sentBy: string | null;
  kycLinkToken: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data required to create an investor from a converted prospect
 */
export interface CreateInvestorFromProspectData {
  id: string;
  prospectId: string;
  fundId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: 'active';
  onboardedAt: Date;
  entityType: string | null;
  entityName: string | null;
  commitmentAmount: number;
}

/**
 * Filters for querying prospects
 */
export interface ProspectFilters {
  status?: ProspectStatus | ProspectStatus[];
  source?: ProspectSource;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Pipeline metrics summary
 */
export interface PipelineMetrics {
  totalProspects: number;
  kycSent: number;
  kycSubmitted: number;
  kycSubmittedThisWeek: number;
  preQualified: number;
  meetingsScheduled: number;
  meetingsCompleted: number;
  considering: number;
  onboardingInProgress: number;
  documentsPending: number;
  documentsApproved: number;
  docusignPending: number;
  readyToConvert: number;
  convertedThisMonth: number;
}

/**
 * Prospect status transition record
 */
export interface ProspectStatusTransition {
  fromStatus: ProspectStatus;
  toStatus: ProspectStatus;
  triggeredAt: Date;
  triggeredBy: string | null;
}

/**
 * Result of a status transition validation
 */
export interface StatusTransitionValidation {
  valid: boolean;
  error?: string;
}

