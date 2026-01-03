import {
  InvestorStatus,
  AccreditationStatus,
  EntityType,
  InvestorType,
  KpiDetailLevel,
} from '../constants/status';
import type { Address } from './fund.types';

export interface Investor {
  id: string;
  userId: string | null;
  fundId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: Address | null;
  entityType: EntityType | null;
  entityName: string | null;
  taxIdType: 'ssn' | 'ein' | null;
  accreditationStatus: AccreditationStatus;
  accreditationType: string | null;
  accreditationDate: string | null;
  verificationRequestId: string | null;
  commitmentAmount: number;
  totalCalled: number;
  totalInvested: number;
  onboardingStep: number;
  onboardedAt: string | null;
  status: InvestorStatus;
  investorType: InvestorType;
  createdAt: string;
  updatedAt: string;
}

/** Permission configuration for an investor type within a fund */
export interface InvestorTypePermission {
  id: string;
  fundId: string;
  investorType: InvestorType;
  canViewDetailedFinancials: boolean;
  canViewOutliers: boolean;
  canViewOtherInvestors: boolean;
  canViewPipeline: boolean;
  canViewFundDocuments: boolean;
  canViewDealDocuments: boolean;
  canViewOtherInvestorDocs: boolean;
  canViewAllCommunications: boolean;
  kpiDetailLevel: KpiDetailLevel;
  createdAt: string;
  updatedAt: string;
}

/** Effective permissions for an investor (resolved from their type) */
export interface InvestorPermissions {
  investorType: InvestorType;
  canViewDetailedFinancials: boolean;
  canViewOutliers: boolean;
  canViewOtherInvestors: boolean;
  canViewPipeline: boolean;
  canViewFundDocuments: boolean;
  canViewDealDocuments: boolean;
  canViewOtherInvestorDocs: boolean;
  canViewAllCommunications: boolean;
  kpiDetailLevel: KpiDetailLevel;
}

