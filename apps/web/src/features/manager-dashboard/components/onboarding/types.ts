import { KYCApplication } from '@/features/kyc/types';

export type OnboardingTabType = 'kyc' | 'investor';

export interface InvestorApplication {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  entityType: string;
  entityName?: string;
  taxResidency: string;
  taxIdType: string;
  taxIdNumber: string;
  accreditationType: string;
  commitmentAmount: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export interface OnboardingStats {
  pending: number;
  approved: number;
  rejected: number;
}

export const entityLabels: Record<string, string> = {
  individual: 'Individual',
  joint: 'Joint',
  trust: 'Trust',
  llc: 'LLC',
  corporation: 'Corporation',
  hnw: 'High Net Worth',
  qp: 'Qualified Purchaser',
  ia: 'Institutional Investor',
  ria: 'RIA',
};

export const investorTypeLabels: Record<string, string> = {
  hnw: 'High Net Worth',
  qp: 'Qualified Purchaser',
  ia: 'Institutional Investor',
  ria: 'RIA',
};

export const accreditationLabels: Record<string, string> = {
  income: 'Income ($200k+ individual / $300k+ joint)',
  net_worth: 'Net Worth ($1M+ excluding primary residence)',
  professional: 'Licensed Professional',
  entity: 'Qualified Entity ($5M+ assets)',
};

export type { KYCApplication };

