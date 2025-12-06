import { api } from './client';
import { KYCApplication, KYCFormData } from '@/features/kyc/types';

export const kycApi = {
  // ==================== Public (Investor) Routes ====================

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
    // The API returns { application, eligible, message } inside data
    return api.post<{ application: KYCApplication; eligible: boolean; message: string }>(`/kyc/${id}/submit`, {});
  },

  // Update Calendly event
  updateCalendly: async (id: string, eventUrl: string): Promise<KYCApplication> => {
    return api.post<KYCApplication>(`/kyc/${id}/calendly`, { eventUrl });
  },

  // ==================== Manager Routes ====================

  // Get all KYC applications for the fund
  getAll: async (): Promise<KYCApplication[]> => {
    return api.get<KYCApplication[]>('/kyc');
  },

  // Approve a KYC application
  approve: async (id: string): Promise<KYCApplication> => {
    return api.patch<KYCApplication>(`/kyc/${id}/approve`, {});
  },

  // Reject a KYC application
  reject: async (id: string, reason?: string): Promise<KYCApplication> => {
    return api.patch<KYCApplication>(`/kyc/${id}/reject`, { reason });
  },
};

