import { api } from './client';
import { OnboardingFormData } from '@/features/onboarding/types';

export interface OnboardingSubmitResponse {
  userId: string;
  investorId: string;
  email: string;
}

export interface OnboardingApplication {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  entityType?: string;
  entityName?: string;
  commitmentAmount?: number;
}

export const onboardingApi = {
  // Submit onboarding application
  submit: async (
    inviteCode: string,
    data: Partial<OnboardingFormData>,
    password?: string,
    kycApplicationId?: string
  ): Promise<OnboardingSubmitResponse> => {
    return api.post<OnboardingSubmitResponse>('/onboarding/submit', {
      inviteCode,
      ...data,
      password,
      kycApplicationId,
    });
  },

  // Get onboarding status
  getStatus: async (inviteCode: string) => {
    return api.get(`/onboarding/status/${inviteCode}`);
  },

  // Get all onboarding applications (manager view)
  getAll: async (): Promise<OnboardingApplication[]> => {
    return api.get<OnboardingApplication[]>('/onboarding/applications');
  },

  // Approve an onboarding application (manager)
  approve: async (id: string): Promise<OnboardingApplication> => {
    return api.patch<OnboardingApplication>(`/onboarding/applications/${id}/approve`, {});
  },

  // Reject an onboarding application (manager)
  reject: async (id: string, reason: string): Promise<OnboardingApplication> => {
    return api.patch<OnboardingApplication>(`/onboarding/applications/${id}/reject`, { reason });
  },
};

















