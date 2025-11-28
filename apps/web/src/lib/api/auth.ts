import { api } from './client';
import { SignupInput, LoginInput, User, AuthResponse } from '@flowveda/shared';

export const authApi = {
  signup: async (input: SignupInput): Promise<User> => {
    const data = await api.post<{ user: User }>('/auth/signup', input);
    return data.user;
  },

  login: async (input: LoginInput): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/login', input);
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getCurrentUser: async (): Promise<User> => {
    return api.get<User>('/auth/me');
  },

  refreshToken: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    return api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken });
  },
};

