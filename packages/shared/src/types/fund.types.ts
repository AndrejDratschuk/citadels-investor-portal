import { FundStatus } from '../constants/status';

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface Branding {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface Fund {
  id: string;
  name: string;
  legalName: string;
  einEncrypted: string | null;
  address: Address | null;
  bankInfoEncrypted: Record<string, unknown> | null;
  wireInstructions: string | null;
  targetRaise: number | null;
  totalCommitted: number;
  branding: Branding | null;
  status: FundStatus;
  createdAt: string;
}

