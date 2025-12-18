import { api } from './client';

export interface CapitalCall {
  id: string;
  fundId: string;
  dealId: string;
  totalAmount: number;
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
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

