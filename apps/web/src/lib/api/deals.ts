import { api } from './client';

export interface Deal {
  id: string;
  fundId: string;
  name: string;
  description: string | null;
  status: 'prospective' | 'under_contract' | 'acquired' | 'renovating' | 'stabilized' | 'for_sale' | 'sold';
  address: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  } | null;
  propertyType: 'multifamily' | 'office' | 'retail' | 'industrial' | 'other' | null;
  unitCount: number | null;
  squareFootage: number | null;
  acquisitionPrice: number | null;
  acquisitionDate: string | null;
  currentValue: number | null;
  createdAt: string;
  updatedAt: string;
  investorCount?: number;
  documentCount?: number;
}

export interface CreateDealInput {
  name: string;
  description?: string;
  status?: Deal['status'];
  address?: Deal['address'];
  propertyType?: Deal['propertyType'];
  unitCount?: number;
  squareFootage?: number;
  acquisitionPrice?: number;
  acquisitionDate?: string;
}

export const dealsApi = {
  // Get all deals
  getAll: async (): Promise<Deal[]> => {
    return api.get<Deal[]>('/deals');
  },

  // Get a single deal
  getById: async (id: string): Promise<Deal> => {
    return api.get<Deal>(`/deals/${id}`);
  },

  // Create a deal
  create: async (input: CreateDealInput): Promise<Deal> => {
    return api.post<Deal>('/deals', input);
  },

  // Update a deal
  update: async (id: string, input: Partial<CreateDealInput>): Promise<Deal> => {
    return api.patch<Deal>(`/deals/${id}`, input);
  },

  // Delete a deal
  delete: async (id: string): Promise<void> => {
    await api.delete(`/deals/${id}`);
  },
};

export const statusLabels: Record<string, string> = {
  prospective: 'Prospective',
  under_contract: 'Under Contract',
  acquired: 'Acquired',
  renovating: 'Renovating',
  stabilized: 'Stabilized',
  for_sale: 'For Sale',
  sold: 'Sold',
};

export const propertyTypeLabels: Record<string, string> = {
  multifamily: 'Multifamily',
  office: 'Office',
  retail: 'Retail',
  industrial: 'Industrial',
  other: 'Other',
};



