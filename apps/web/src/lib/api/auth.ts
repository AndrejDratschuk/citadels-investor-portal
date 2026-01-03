import { api } from './client';
import { SignupInput, LoginInput, User, AuthResponse } from '@altsui/shared';

export interface OnboardingSignupResponse {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

export interface EnhancedSignupInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export const authApi = {
  signup: async (input: SignupInput): Promise<User> => {
    const data = await api.post<{ user: User }>('/auth/signup', input);
    return data.user;
  },

  /**
   * Enhanced signup for fund managers creating a new account
   * Creates user with onboarding_completed = false
   * Returns auth tokens so user can proceed to fund creation wizard
   */
  enhancedSignup: async (input: EnhancedSignupInput): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/enhanced-signup', input);
  },

  login: async (input: LoginInput): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/login', input);
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout', {});
  },

  getCurrentUser: async (): Promise<User> => {
    return api.get<User>('/auth/me');
  },

  refreshToken: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    return api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken });
  },

  // Create account during onboarding (auth user only, not investor record)
  createOnboardingAccount: async (email: string, password: string): Promise<OnboardingSignupResponse> => {
    return api.post<OnboardingSignupResponse>('/auth/onboarding-signup', { email, password });
  },
};

