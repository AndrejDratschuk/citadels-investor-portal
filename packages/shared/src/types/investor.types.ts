import {
  InvestorStatus,
  AccreditationStatus,
  EntityType,
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
  createdAt: string;
  updatedAt: string;
}

