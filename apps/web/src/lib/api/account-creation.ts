import { api } from './client';
import type {
  VerifyTokenResponse,
  SendCodeResponse,
  CreateAccountResponse,
  SendInviteResponse,
} from '@flowveda/shared';

export interface CreateAccountInput {
  token: string;
  password: string;
  confirmPassword: string;
  verificationCode: string;
}

export interface SendAccountInviteInput {
  kycApplicationId: string;
  fundId: string;
}

/**
 * Account Creation API Client
 */
export const accountCreationApi = {
  /**
   * Verify a token and get pre-filled data
   */
  async verifyToken(token: string): Promise<VerifyTokenResponse> {
    const response = await api.get<{ data: VerifyTokenResponse }>(
      `/account-creation/verify-token/${token}`
    );
    return response.data;
  },

  /**
   * Send a verification code to the email
   */
  async sendCode(token: string): Promise<SendCodeResponse> {
    const response = await api.post<{ data: SendCodeResponse }>('/account-creation/send-code', {
      token,
    });
    return response.data;
  },

  /**
   * Create a new investor account
   */
  async createAccount(input: CreateAccountInput): Promise<CreateAccountResponse> {
    const response = await api.post<{ data: CreateAccountResponse }>(
      '/account-creation/create',
      input
    );
    return response.data;
  },

  /**
   * Send an account creation invite (fund manager only)
   */
  async sendInvite(input: SendAccountInviteInput): Promise<SendInviteResponse> {
    const response = await api.post<{ data: SendInviteResponse }>(
      '/account-creation/send-invite',
      input
    );
    return response.data;
  },
};

