import { api } from './client';

export interface DealKPIs {
  noi?: number;
  capRate?: number;
  cashOnCash?: number;
  occupancyRate?: number;
  renovationBudget?: number;
  renovationSpent?: number;
}

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
  imageUrl: string | null;
  kpis?: DealKPIs | null;
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
  currentValue?: number;
  kpis?: DealKPIs;
}

export interface DealInvestor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  ownershipPercentage: number;
  commitmentAmount: number;
  joinedAt: string;
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

  // Get investors for a deal
  getDealInvestors: async (dealId: string): Promise<DealInvestor[]> => {
    return api.get<DealInvestor[]>(`/deals/${dealId}/investors`);
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

  // Upload deal image
  uploadImage: async (dealId: string, file: File): Promise<{ imageUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    // Use fetch directly for multipart
    const token = localStorage.getItem('accessToken');
    const API_URL = import.meta.env.PROD
      ? 'https://citadel-investor-portal-production.up.railway.app/api'
      : (import.meta.env.VITE_API_URL || '/api');

    const response = await fetch(`${API_URL}/deals/${dealId}/image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload deal image');
    }

    const data = await response.json();
    return data.data;
  },

  // Delete deal image
  deleteImage: async (dealId: string): Promise<void> => {
    await api.delete(`/deals/${dealId}/image`);
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







