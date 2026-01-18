// Fund statuses
export const FUND_STATUS = {
  RAISING: 'raising',
  CLOSED: 'closed',
  ACTIVE: 'active',
  LIQUIDATING: 'liquidating',
} as const;

export type FundStatus = typeof FUND_STATUS[keyof typeof FUND_STATUS];

// Investor statuses
export const INVESTOR_STATUS = {
  PROSPECT: 'prospect',
  ONBOARDING: 'onboarding',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  EXITED: 'exited',
} as const;

export type InvestorStatus = typeof INVESTOR_STATUS[keyof typeof INVESTOR_STATUS];

// Investor types (controls permissions and dashboard views)
export const INVESTOR_TYPE = {
  LIMITED_PARTNER: 'limited_partner',
  GENERAL_PARTNER: 'general_partner',
  SERIES_A: 'series_a',
  SERIES_B: 'series_b',
  SERIES_C: 'series_c',
  INSTITUTIONAL: 'institutional',
  INDIVIDUAL_ACCREDITED: 'individual_accredited',
  FAMILY_OFFICE: 'family_office',
  CUSTOM: 'custom',
} as const;

export type InvestorType = typeof INVESTOR_TYPE[keyof typeof INVESTOR_TYPE];

// Display labels for investor types
export const INVESTOR_TYPE_LABELS: Record<InvestorType, string> = {
  [INVESTOR_TYPE.LIMITED_PARTNER]: 'Limited Partner (LP)',
  [INVESTOR_TYPE.GENERAL_PARTNER]: 'General Partner (GP)',
  [INVESTOR_TYPE.SERIES_A]: 'Series A Investor',
  [INVESTOR_TYPE.SERIES_B]: 'Series B Investor',
  [INVESTOR_TYPE.SERIES_C]: 'Series C Investor',
  [INVESTOR_TYPE.INSTITUTIONAL]: 'Institutional Investor',
  [INVESTOR_TYPE.INDIVIDUAL_ACCREDITED]: 'Individual Accredited',
  [INVESTOR_TYPE.FAMILY_OFFICE]: 'Family Office',
  [INVESTOR_TYPE.CUSTOM]: 'Custom',
};

// Short labels for table display
export const INVESTOR_TYPE_SHORT_LABELS: Record<InvestorType, string> = {
  [INVESTOR_TYPE.LIMITED_PARTNER]: 'LP',
  [INVESTOR_TYPE.GENERAL_PARTNER]: 'GP',
  [INVESTOR_TYPE.SERIES_A]: 'Series A',
  [INVESTOR_TYPE.SERIES_B]: 'Series B',
  [INVESTOR_TYPE.SERIES_C]: 'Series C',
  [INVESTOR_TYPE.INSTITUTIONAL]: 'Institutional',
  [INVESTOR_TYPE.INDIVIDUAL_ACCREDITED]: 'Individual',
  [INVESTOR_TYPE.FAMILY_OFFICE]: 'Family Office',
  [INVESTOR_TYPE.CUSTOM]: 'Custom',
};

// KPI detail levels for permission-based filtering
export const KPI_DETAIL_LEVEL = {
  SUMMARY: 'summary',
  DETAILED: 'detailed',
  FULL: 'full',
} as const;

export type KpiDetailLevel = typeof KPI_DETAIL_LEVEL[keyof typeof KPI_DETAIL_LEVEL];

// Accreditation statuses
export const ACCREDITATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
} as const;

export type AccreditationStatus = typeof ACCREDITATION_STATUS[keyof typeof ACCREDITATION_STATUS];

// Deal statuses
export const DEAL_STATUS = {
  PROSPECTIVE: 'prospective',
  UNDER_CONTRACT: 'under_contract',
  ACQUIRED: 'acquired',
  RENOVATING: 'renovating',
  STABILIZED: 'stabilized',
  FOR_SALE: 'for_sale',
  SOLD: 'sold',
} as const;

export type DealStatus = typeof DEAL_STATUS[keyof typeof DEAL_STATUS];

// Document types
export const DOCUMENT_TYPE = {
  PPM: 'ppm',
  SUBSCRIPTION: 'subscription',
  K1: 'k1',
  REPORT: 'report',
  CAPITAL_CALL: 'capital_call',
  KYC: 'kyc',
  OTHER: 'other',
} as const;

export type DocumentType = typeof DOCUMENT_TYPE[keyof typeof DOCUMENT_TYPE];

// Signing statuses
export const SIGNING_STATUS = {
  NOT_SENT: 'not_sent',
  SENT: 'sent',
  VIEWED: 'viewed',
  SIGNED: 'signed',
  DECLINED: 'declined',
} as const;

export type SigningStatus = typeof SIGNING_STATUS[keyof typeof SIGNING_STATUS];

// Capital call statuses
export const CAPITAL_CALL_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  PARTIAL: 'partial',
  FUNDED: 'funded',
  CLOSED: 'closed',
} as const;

export type CapitalCallStatus = typeof CAPITAL_CALL_STATUS[keyof typeof CAPITAL_CALL_STATUS];

// Capital call item statuses
export const CAPITAL_CALL_ITEM_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  COMPLETE: 'complete',
} as const;

export type CapitalCallItemStatus = typeof CAPITAL_CALL_ITEM_STATUS[keyof typeof CAPITAL_CALL_ITEM_STATUS];

// Email statuses
export const EMAIL_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  OPENED: 'opened',
  FAILED: 'failed',
} as const;

export type EmailStatus = typeof EMAIL_STATUS[keyof typeof EMAIL_STATUS];

// Entity types
export const ENTITY_TYPE = {
  INDIVIDUAL: 'individual',
  JOINT: 'joint',
  TRUST: 'trust',
  LLC: 'llc',
  CORPORATION: 'corporation',
} as const;

export type EntityType = typeof ENTITY_TYPE[keyof typeof ENTITY_TYPE];

// Property types
export const PROPERTY_TYPE = {
  MULTIFAMILY: 'multifamily',
  OFFICE: 'office',
  RETAIL: 'retail',
  INDUSTRIAL: 'industrial',
  OTHER: 'other',
} as const;

export type PropertyType = typeof PROPERTY_TYPE[keyof typeof PROPERTY_TYPE];

// Prospect statuses (pipeline stages)
export const PROSPECT_STATUS = {
  KYC_SENT: 'kyc_sent',
  KYC_SUBMITTED: 'kyc_submitted',
  SUBMITTED: 'submitted', // Legacy status - treat same as kyc_submitted
  PRE_QUALIFIED: 'pre_qualified',
  NOT_ELIGIBLE: 'not_eligible',
  MEETING_SCHEDULED: 'meeting_scheduled',
  MEETING_COMPLETE: 'meeting_complete',
  CONSIDERING: 'considering',
  NOT_A_FIT: 'not_a_fit',
  ACCOUNT_INVITE_SENT: 'account_invite_sent',
  ACCOUNT_CREATED: 'account_created',
  ONBOARDING_SUBMITTED: 'onboarding_submitted',
  DOCUMENTS_PENDING: 'documents_pending',
  DOCUMENTS_APPROVED: 'documents_approved',
  DOCUMENTS_REJECTED: 'documents_rejected',
  DOCUSIGN_SENT: 'docusign_sent',
  DOCUSIGN_SIGNED: 'docusign_signed',
  CONVERTED: 'converted',
} as const;

export type ProspectStatus = typeof PROSPECT_STATUS[keyof typeof PROSPECT_STATUS];

// Prospect source (how they entered the pipeline)
export const PROSPECT_SOURCE = {
  MANUAL: 'manual',
  WEBSITE: 'website',
  INTEREST_FORM: 'interest_form',
} as const;

export type ProspectSource = typeof PROSPECT_SOURCE[keyof typeof PROSPECT_SOURCE];

// Prospect event types (for status transitions)
export const PROSPECT_EVENT = {
  KYC_FORM_SENT: 'kyc_form_sent',
  KYC_FORM_SUBMITTED: 'kyc_form_submitted',
  KYC_APPROVED: 'kyc_approved',
  KYC_REJECTED: 'kyc_rejected',
  MEETING_BOOKED: 'meeting_booked',
  MEETING_COMPLETED: 'meeting_completed',
  MEETING_NO_SHOW: 'meeting_no_show',
  MARKED_PROCEED: 'marked_proceed',
  MARKED_CONSIDERING: 'marked_considering',
  MARKED_NOT_A_FIT: 'marked_not_a_fit',
  READY_TO_INVEST: 'ready_to_invest',
  ACCOUNT_INVITE_SENT: 'account_invite_sent',
  ACCOUNT_CREATED: 'account_created',
  ONBOARDING_SUBMITTED: 'onboarding_submitted',
  DOCUMENTS_UPLOADED: 'documents_uploaded',
  DOCUMENTS_APPROVED: 'documents_approved',
  DOCUMENTS_REJECTED: 'documents_rejected',
  DOCUSIGN_SENT: 'docusign_sent',
  DOCUSIGN_SIGNED: 'docusign_signed',
  CONVERTED_TO_INVESTOR: 'converted_to_investor',
} as const;

export type ProspectEvent = typeof PROSPECT_EVENT[keyof typeof PROSPECT_EVENT];

