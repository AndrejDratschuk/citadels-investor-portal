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
} as const;

export type InvestorStatus = typeof INVESTOR_STATUS[keyof typeof INVESTOR_STATUS];

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

