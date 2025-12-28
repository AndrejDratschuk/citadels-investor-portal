import { api } from './client';
import { SignupInput, LoginInput, User, AuthResponse } from '@altsui/shared';

export interface OnboardingSignupResponse {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  signup: async (input: SignupInput): Promise<User> => {
    const data = await api.post<{ user: User }>('/auth/signup', input);
    return data.user;
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

