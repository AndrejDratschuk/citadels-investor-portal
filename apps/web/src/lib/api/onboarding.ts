import { api } from './client';
import { OnboardingFormData } from '@/features/onboarding/types';

export interface OnboardingSubmitResponse {
  userId: string;
  investorId: string;
  email: string;
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
};

