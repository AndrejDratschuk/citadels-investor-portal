import { z } from 'zod';

// Contact preference options
export const CONTACT_PREFERENCES = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'phone', label: 'Phone Call' },
  { value: 'other', label: 'Other' },
] as const;

// Accreditation types
export const ACCREDITATION_TYPES = [
  { value: 'income', label: 'Income ($200k+ individual / $300k+ joint)' },
  { value: 'net_worth', label: 'Net Worth ($1M+ excluding primary residence)' },
  { value: 'professional', label: 'Licensed Professional (Series 7, 65, 82)' },
  { value: 'entity', label: 'Qualified Entity ($5M+ assets)' },
] as const;

// Entity types
export const ENTITY_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'joint', label: 'Joint (Married)' },
  { value: 'trust', label: 'Trust' },
  { value: 'llc', label: 'LLC' },
  { value: 'corporation', label: 'Corporation' },
] as const;

// Step 1: Personal Information
export const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(20),
  preferredContact: z.enum(['email', 'sms', 'whatsapp', 'phone', 'other']),
});

// Step 2: Address & Entity
export const addressEntitySchema = z.object({
  address1: z.string().min(1, 'Address is required').max(100),
  address2: z.string().max(100).optional(),
  city: z.string().min(1, 'City is required').max(50),
  state: z.string().min(1, 'State is required').max(50),
  zipCode: z.string().min(5, 'Zip code must be at least 5 characters').max(10),
  country: z.string().min(1, 'Country is required').max(50),
  entityType: z.enum(['individual', 'joint', 'trust', 'llc', 'corporation']),
  entityName: z.string().max(100).optional(),
});

// Step 3: Tax & Accreditation
export const taxAccreditationSchema = z.object({
  taxResidency: z.string().min(1, 'Tax residency is required'),
  taxIdType: z.enum(['ssn', 'ein']),
  taxIdLast4: z.string().length(4, 'Must be exactly 4 digits').regex(/^\d{4}$/, 'Must be 4 digits'),
  accreditationType: z.enum(['income', 'net_worth', 'professional', 'entity']),
  accreditationDetails: z.string().max(500).optional(),
});

// Step 4: Investment & Consent
export const investmentConsentSchema = z.object({
  commitmentAmount: z.number().min(25000, 'Minimum commitment is $25,000'),
  consent: z.boolean().refine((val) => val === true, 'You must agree to the terms'),
});

// Combined schema for full form
export const onboardingFormSchema = z.object({
  ...personalInfoSchema.shape,
  ...addressEntitySchema.shape,
  ...taxAccreditationSchema.shape,
  ...investmentConsentSchema.shape,
});

// Types
export type PersonalInfoData = z.infer<typeof personalInfoSchema>;
export type AddressEntityData = z.infer<typeof addressEntitySchema>;
export type TaxAccreditationData = z.infer<typeof taxAccreditationSchema>;
export type InvestmentConsentData = z.infer<typeof investmentConsentSchema>;
export type OnboardingFormData = z.infer<typeof onboardingFormSchema>;

// Onboarding application status
export type OnboardingStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';

// Full onboarding application
export interface OnboardingApplication {
  id: string;
  inviteCode: string;
  fundId: string;
  status: OnboardingStatus;
  data: Partial<OnboardingFormData>;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}








