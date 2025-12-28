import { api } from './client';

export interface InvestorStatusCounts {
  paid: number;
  pending: number;
  partial: number;
  overdue: number;
}

export interface CapitalCall {
  id: string;
  fundId: string;
  dealId: string;
  totalAmount: number;
  receivedAmount: number;
  deadline: string;
  status: 'draft' | 'sent' | 'partial' | 'funded' | 'closed';
  sentAt: string | null;
  createdAt: string;
  investorCount: number;
  investorStatus: InvestorStatusCounts;
  deal: {
    id: string;
    name: string;
  };
}

export interface CreateCapitalCallInput {
  dealId: string;
  totalAmount: number;
  deadline: string;
  notes?: string;
}

export const capitalCallsApi = {
  /**
   * Get all capital calls
   */
  getAll: async (): Promise<CapitalCall[]> => {
    return api.get<CapitalCall[]>('/capital-calls');
  },

  /**
   * Get a single capital call by ID
   */
  getById: async (id: string): Promise<CapitalCall> => {
    return api.get<CapitalCall>(`/capital-calls/${id}`);
  },

  /**
   * Create a new capital call
   */
  create: async (input: CreateCapitalCallInput): Promise<CapitalCall> => {
    return api.post<CapitalCall>('/capital-calls', input);
  },
};

