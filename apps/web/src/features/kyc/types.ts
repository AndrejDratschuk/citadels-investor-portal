import { z } from 'zod';

// Investor categories and types
export const INVESTOR_CATEGORIES = [
  { value: 'individual', label: 'Individual Investor' },
  { value: 'entity', label: 'Entity / Organization' },
] as const;

export const INDIVIDUAL_TYPES = [
  { value: 'hnw', label: 'High Net Worth Individual' },
  { value: 'joint', label: 'Joint Investment' },
  { value: 'foreign_individual', label: 'Foreign Individual' },
] as const;

export const ENTITY_TYPES = [
  { value: 'corp_llc', label: 'Corporation / LLC' },
  { value: 'trust', label: 'Trust' },
  { value: 'family_office', label: 'Family Office' },
  { value: 'family_client', label: 'Family Client' },
  { value: 'erisa', label: 'ERISA Plan' },
  { value: '501c3', label: '501(c)(3) Organization' },
  { value: 'entity_5m', label: 'Entity with >$5M Assets' },
  { value: 'foreign_entity', label: 'Foreign Entity' },
] as const;

// SEC Accreditation basis options (verbatim from SEC)
export const ACCREDITATION_OPTIONS = [
  {
    id: 'income_200k',
    label: 'You are a natural person who had individual income in excess of $200,000 in each of the two most recent years, or joint income with that person\'s spouse or spousal equivalent in excess of $300,000 in each of those years, and has a reasonable expectation of reaching the same income level in the current year',
  },
  {
    id: 'net_worth_1m',
    label: 'You are a natural person whose individual Net Worth, or joint Net Worth with that person\'s spouse or spousal equivalent, exceeds $1,000,000 at the time of purchase of Units',
  },
  {
    id: 'trust_5m',
    label: 'You represent a trust with total assets in excess of $5,000,000, not formed for the specific purpose of acquiring Units, whose purchase is directed by a person who has such knowledge and experience in financial and business matters that he/she is capable of evaluating the merits and risks of an investment in Units',
  },
  {
    id: 'entity_5m',
    label: 'You represent a 501(c)(3), corporation, business trust, partnership, or limited liability company with total assets in excess of $5,000,000, not formed for the specific purpose of acquiring Units',
  },
  {
    id: 'investments_5m',
    label: 'You represent an entity not formed for the specific purpose of acquiring the securities offered, owning investments in excess of $5,000,000',
  },
  {
    id: 'erisa_plan',
    label: 'You are an employee benefit plan within the meaning of ERISA, in which the investment decision is made by a plan fiduciary (as defined in Section 3(21) of ERISA) which is either a bank, savings and loan association, insurance company, or registered investment adviser; or the employee benefit plan has total assets in excess of $5,000,000; or is a self-directed plan in which investment decisions are made solely by persons who are Accredited Investors',
  },
  {
    id: 'all_equity_owners',
    label: 'You represent an entity (including an Individual Retirement Account trust) in which all of the equity owners are Accredited Investors as defined above',
  },
  {
    id: 'licensed_professional',
    label: 'You are a natural person holding in good standing a Series 7, 65, or 82 license or one or more professional certifications or designations or credentials from an accredited educational institution that the SEC has designated as qualifying an individual for accredited investor status',
  },
  {
    id: 'family_office',
    label: 'You represent a "family office" as defined in the Investment Advisers Act of 1940 and (i) with assets under management in excess of $5,000,000, (ii) that is not formed for the specific purpose of acquiring the securities offered, and (iii) whose prospective investment is directed by a person who has such knowledge and experience in financial and business matters that such family office is capable of evaluating the merits and risks of the prospective investment',
  },
  {
    id: 'family_client',
    label: 'You are a "family client" of a family office whose prospective investment is directed by the family office',
  },
  {
    id: 'financial_institution',
    label: 'You represent a bank, savings and loan association, or insurance company',
  },
  {
    id: 'investment_company',
    label: 'You represent a registered investment company or a business development company',
  },
  {
    id: 'sbic_rbic',
    label: 'You represent a small business investment company (SBIC) or a rural business investment company (RBIC)',
  },
] as const;

// Timeline options
export const TIMELINE_OPTIONS = [
  { value: 'asap', label: 'ASAP' },
  { value: '30_60_days', label: '30-60 days' },
  { value: '60_90_days', label: '60-90 days' },
  { value: 'over_90_days', label: '>90 days' },
] as const;

// Investment goals
export const INVESTMENT_GOALS = [
  { value: 'income', label: 'Income' },
  { value: 'total_return', label: 'Total Return' },
  { value: 'diversification', label: 'Diversification' },
  { value: 'inflation_hedge', label: 'Inflation Hedge' },
  { value: 'tax_efficiency', label: 'Tax Efficiency' },
  { value: 'principal_protection', label: 'Principal Protection' },
  { value: 'other', label: 'Other' },
] as const;

// Likelihood options
export const LIKELIHOOD_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
] as const;

// Contact preference options
export const CONTACT_PREFERENCES = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'other', label: 'Other' },
] as const;

// Zod schemas for each step
export const investorTypeSchema = z.object({
  investorCategory: z.enum(['individual', 'entity']),
  investorType: z.string().min(1, 'Please select an investor type'),
});

export const individualIdentitySchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number is required'),
  country: z.string().min(1, 'Country is required'),
  state: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
});

export const entityIdentitySchema = z.object({
  entityLegalName: z.string().min(1, 'Entity legal name is required'),
  countryOfFormation: z.string().min(1, 'Country of formation is required'),
  stateOfFormation: z.string().optional(),
  authorizedSignerFirstName: z.string().min(1, 'First name is required'),
  authorizedSignerLastName: z.string().min(1, 'Last name is required'),
  authorizedSignerTitle: z.string().min(1, 'Title is required'),
  workEmail: z.string().email('Invalid email address'),
  workPhone: z.string().min(10, 'Phone number is required'),
  principalOfficeCity: z.string().min(1, 'City is required'),
  principalOfficeState: z.string().optional(),
  principalOfficeCountry: z.string().min(1, 'Country is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
});

export const accreditationSchema = z.object({
  accreditationBases: z.array(z.string()).min(1, 'Please select at least one accreditation basis'),
});

export const investmentIntentSchema = z.object({
  indicativeCommitment: z.number().min(0).optional(),
  timeline: z.enum(['asap', '30_60_days', '60_90_days', 'over_90_days']).optional(),
  investmentGoals: z.array(z.string()).optional(),
  likelihood: z.enum(['low', 'medium', 'high']).optional(),
  questionsForManager: z.string().optional(),
});

export const consentSchema = z.object({
  preferredContact: z.enum(['email', 'phone', 'sms', 'whatsapp', 'other']),
  consentGiven: z.boolean().refine((val) => val === true, 'You must consent to continue'),
});

// Types
export type InvestorTypeData = z.infer<typeof investorTypeSchema>;
export type IndividualIdentityData = z.infer<typeof individualIdentitySchema>;
export type EntityIdentityData = z.infer<typeof entityIdentitySchema>;
export type AccreditationData = z.infer<typeof accreditationSchema>;
export type InvestmentIntentData = z.infer<typeof investmentIntentSchema>;
export type ConsentData = z.infer<typeof consentSchema>;

export interface KYCApplication {
  id: string;
  fundId: string;
  investorCategory: 'individual' | 'entity';
  investorType: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  country?: string;
  state?: string;
  city?: string;
  postalCode?: string;
  entityLegalName?: string;
  countryOfFormation?: string;
  stateOfFormation?: string;
  authorizedSignerFirstName?: string;
  authorizedSignerLastName?: string;
  authorizedSignerTitle?: string;
  workEmail?: string;
  workPhone?: string;
  principalOfficeCity?: string;
  principalOfficeState?: string;
  principalOfficeCountry?: string;
  accreditationBases: string[];
  indicativeCommitment?: number;
  timeline?: string;
  investmentGoals: string[];
  likelihood?: string;
  questionsForManager?: string;
  preferredContact?: string;
  consentGiven: boolean;
  status: 'draft' | 'submitted' | 'pre_qualified' | 'not_eligible' | 'meeting_scheduled' | 'meeting_complete';
  calendlyEventUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type KYCFormData = Partial<
  InvestorTypeData &
  IndividualIdentityData &
  EntityIdentityData &
  AccreditationData &
  InvestmentIntentData &
  ConsentData
>;

