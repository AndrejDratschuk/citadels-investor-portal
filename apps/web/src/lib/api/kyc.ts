import { api } from './client';
import { KYCApplication, KYCFormData } from '@/features/kyc/types';

export const kycApi = {
  // Start a new KYC application
  start: async (fundCode: string, email: string): Promise<KYCApplication> => {
    return api.post<KYCApplication>('/kyc/start', { fundCode, email });
  },

  // Get KYC application by ID
  getById: async (id: string): Promise<KYCApplication> => {
    return api.get<KYCApplication>(`/kyc/${id}`);
  },

  // Update KYC application (autosave)
  update: async (id: string, data: KYCFormData): Promise<KYCApplication> => {
    return api.patch<KYCApplication>(`/kyc/${id}`, data);
  },

  // Submit KYC application
  submit: async (id: string): Promise<{ application: KYCApplication; eligible: boolean; message: string }> => {
    const response = await api.post<{ data: KYCApplication; eligible: boolean; message: string }>(`/kyc/${id}/submit`, {});
    return {
      application: response.data,
      eligible: response.eligible,
      message: response.message,
    };
  },

  // Update Calendly event
  updateCalendly: async (id: string, eventUrl: string): Promise<KYCApplication> => {
    return api.post<KYCApplication>(`/kyc/${id}/calendly`, { eventUrl });
  },
};

