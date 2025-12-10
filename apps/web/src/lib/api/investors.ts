import { api } from './client';

export interface InvestorProfile {
  id: string;
  userId: string;
  fundId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: Address | null;
  entityType: string | null;
  entityName: string | null;
  taxIdType: string | null;
  accreditationStatus: string;
  accreditationType: string | null;
  accreditationDate: string | null;
  commitmentAmount: number;
  totalCalled: number;
  totalInvested: number;
  onboardingStep: number;
  onboardedAt: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface InvestorStats {
  commitmentAmount: number;
  totalCalled: number;
  totalInvested: number;
  totalInvestmentValue: number;
  activeInvestments: number;
  pendingCapitalCalls: number;
  pendingAmount: number;
}

export interface Investment {
  ownershipPercentage: number;
  joinedAt: string;
  deal: Deal | null;
}

export interface Deal {
  id: string;
  name: string;
  description: string | null;
  status: string;
  address: Address | null;
  propertyType: string | null;
  unitCount: number | null;
  squareFootage: number | null;
  acquisitionPrice: number | null;
  acquisitionDate: string | null;
  currentValue: number | null;
  totalInvestment: number | null;
  kpis: DealKPIs | null;
}

export interface DealKPIs {
  noi?: number;
  capRate?: number;
  cashOnCash?: number;
  occupancyRate?: number;
  renovationBudget?: number;
  renovationSpent?: number;
}

export interface InvestorDocument {
  id: string;
  fundId: string;
  dealId: string | null;
  investorId: string | null;
  type: string;
  name: string;
  filePath: string | null;
  requiresSignature: boolean;
  signingStatus: string | null;
  signedAt: string | null;
  createdAt: string;
}

export interface CapitalCallItem {
  id: string;
  amountDue: number;
  amountReceived: number;
  status: string;
  wireReceivedAt: string | null;
  createdAt: string;
  capitalCall: {
    id: string;
    totalAmount: number;
    deadline: string;
    status: string;
    deal: {
      id: string;
      name: string;
    } | null;
  } | null;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: Address;
  entityType?: string;
  entityName?: string;
}

export type CommunicationType = 'email' | 'meeting' | 'phone_call';

export interface InvestorCommunication {
  id: string;
  investorId: string;
  fundId: string;
  type: CommunicationType;
  title: string;
  content: string | null;
  occurredAt: string;
  emailFrom: string | null;
  emailTo: string | null;
  meetingAttendees: string[] | null;
  meetingDurationMinutes: number | null;
  callDirection: 'inbound' | 'outbound' | null;
  callDurationMinutes: number | null;
  source: string;
  externalId: string | null;
  createdBy: string | null;
  createdAt: string;
  isRead: boolean;
  readAt: string | null;
  tags: string[];
  deal: {
    id: string;
    name: string;
  } | null;
}

export const investorsApi = {
  // ==================== Investor Self-Service ====================
  
  // Get current investor profile
  getMe: async (): Promise<InvestorProfile> => {
    return api.get<InvestorProfile>('/investors/me');
  },

  // Update current investor profile
  updateMe: async (data: UpdateProfileInput): Promise<InvestorProfile> => {
    return api.patch<InvestorProfile>('/investors/me', data);
  },

  // Get dashboard stats
  getMyStats: async (): Promise<InvestorStats> => {
    return api.get<InvestorStats>('/investors/me/stats');
  },

  // Get investments
  getMyInvestments: async (): Promise<Investment[]> => {
    return api.get<Investment[]>('/investors/me/investments');
  },

  // Get documents
  getMyDocuments: async (): Promise<InvestorDocument[]> => {
    return api.get<InvestorDocument[]>('/investors/me/documents');
  },

  // Get capital calls
  getMyCapitalCalls: async (): Promise<CapitalCallItem[]> => {
    return api.get<CapitalCallItem[]>('/investors/me/capital-calls');
  },

  // Get communications
  getMyCommunications: async (): Promise<InvestorCommunication[]> => {
    return api.get<InvestorCommunication[]>('/investors/me/communications');
  },

  // Mark communication as read
  markCommunicationRead: async (communicationId: string): Promise<InvestorCommunication> => {
    return api.patch<InvestorCommunication>(`/investors/me/communications/${communicationId}/read`);
  },

  // Update communication tags
  updateCommunicationTags: async (communicationId: string, tags: string[]): Promise<InvestorCommunication> => {
    return api.patch<InvestorCommunication>(`/investors/me/communications/${communicationId}/tags`, { tags });
  },

  // Get fund contact info
  getFundContact: async (): Promise<{ fundName: string; email: string; managerName: string }> => {
    return api.get<{ fundName: string; email: string; managerName: string }>('/investors/me/fund-contact');
  },

  // Send email to fund
  sendEmailToFund: async (subject: string, body: string): Promise<{ success: boolean; messageId?: string }> => {
    return api.post<{ success: boolean; messageId?: string }>('/investors/me/send-email', { subject, body });
  },

  // ==================== Manager View ====================

  // Get all investors for the fund (manager only)
  getAll: async (): Promise<InvestorProfile[]> => {
    return api.get<InvestorProfile[]>('/investors');
  },

  // Get single investor by ID (manager only)
  getById: async (investorId: string): Promise<InvestorProfile> => {
    return api.get<InvestorProfile>(`/investors/${investorId}`);
  },
};


