import { api } from './client';

export interface FundBranding {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface Fund {
  id: string;
  name: string;
  legalName: string;
  branding: FundBranding;
  status: string;
}

export interface FundBrandingPublic {
  name: string;
  branding: FundBranding;
}

export const fundsApi = {
  // Get current fund (for authenticated managers)
  getCurrent: async (): Promise<Fund> => {
    return api.get<Fund>('/funds/current');
  },

  // Get fund branding (public - for forms)
  getBranding: async (fundId: string): Promise<FundBrandingPublic> => {
    return api.get<FundBrandingPublic>(`/funds/branding/${fundId}`);
  },

  // Update branding (colors)
  updateBranding: async (branding: Partial<FundBranding>): Promise<Fund> => {
    return api.patch<Fund>('/funds/branding', branding);
  },

  // Upload logo
  uploadLogo: async (file: File): Promise<{ logoUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    // Use fetch directly for multipart
    const token = localStorage.getItem('accessToken');
    const API_URL = import.meta.env.PROD
      ? 'https://citadel-investor-portal-production.up.railway.app/api'
      : (import.meta.env.VITE_API_URL || '/api');

    const response = await fetch(`${API_URL}/funds/logo`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload logo');
    }

    const data = await response.json();
    return data.data;
  },

  // Delete logo
  deleteLogo: async (): Promise<void> => {
    await api.delete('/funds/logo');
  },
};

