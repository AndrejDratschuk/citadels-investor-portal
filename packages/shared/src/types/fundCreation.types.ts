/**
 * Fund Creation Types
 * Types for the multi-tenant fund creation wizard
 */

export type FundType = 
  | 'vc' 
  | 'pe' 
  | 'real_estate' 
  | 'hedge_fund' 
  | 'family_office' 
  | 'search_fund' 
  | 'other';

export type DisplayRole = 
  | 'general_partner'
  | 'managing_partner'
  | 'fund_manager'
  | 'fund_administrator'
  | 'cfo'
  | 'other';

export interface CreateFundInput {
  name: string;
  fundType: FundType;
  displayRole: DisplayRole;
  entityName?: string;
  country: string;
}

export interface EnhancedSignupInput {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
}

export interface CreateFundResponse {
  success: boolean;
  fund: {
    id: string;
    name: string;
    slug: string;
    fundType: FundType;
    country: string;
  };
}

export interface FundTypeOption {
  value: FundType;
  label: string;
  description: string;
}

export interface DisplayRoleOption {
  value: DisplayRole;
  label: string;
}

export const FUND_TYPE_OPTIONS: FundTypeOption[] = [
  { value: 'vc', label: 'Venture Capital', description: 'Early-stage and growth equity investments' },
  { value: 'pe', label: 'Private Equity', description: 'Buyouts and mature company investments' },
  { value: 'real_estate', label: 'Real Estate', description: 'Property and real estate investments' },
  { value: 'hedge_fund', label: 'Hedge Fund', description: 'Alternative investment strategies' },
  { value: 'family_office', label: 'Family Office', description: 'Private wealth management' },
  { value: 'search_fund', label: 'Search Fund', description: 'Entrepreneurial acquisition vehicle' },
  { value: 'other', label: 'Other', description: 'Other investment vehicle type' },
];

export const DISPLAY_ROLE_OPTIONS: DisplayRoleOption[] = [
  { value: 'general_partner', label: 'General Partner' },
  { value: 'managing_partner', label: 'Managing Partner' },
  { value: 'fund_manager', label: 'Fund Manager' },
  { value: 'fund_administrator', label: 'Fund Administrator' },
  { value: 'cfo', label: 'CFO / Finance Lead' },
  { value: 'other', label: 'Other' },
];

export const COUNTRY_OPTIONS = [
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'SG', label: 'Singapore' },
  { value: 'HK', label: 'Hong Kong' },
  { value: 'AU', label: 'Australia' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'LU', label: 'Luxembourg' },
  { value: 'IE', label: 'Ireland' },
  { value: 'KY', label: 'Cayman Islands' },
  { value: 'BVI', label: 'British Virgin Islands' },
  { value: 'JE', label: 'Jersey' },
  { value: 'GG', label: 'Guernsey' },
  // Add more as needed
];

