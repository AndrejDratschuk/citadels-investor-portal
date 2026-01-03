import { api } from './client';
import type { CreateFundInput, CreateFundResponse, FundType, DisplayRole } from '@altsui/shared';

export const fundCreationApi = {
  /**
   * Create a new fund after signup
   * This is called from the fund creation wizard
   * Sets the user's onboarding_completed = true
   */
  createFund: async (input: CreateFundInput): Promise<CreateFundResponse> => {
    return api.post<CreateFundResponse>('/funds/create', input);
  },

  /**
   * Check if a fund name/slug is available
   */
  checkSlugAvailability: async (name: string): Promise<{ available: boolean; slug: string }> => {
    return api.get<{ available: boolean; slug: string }>(
      `/funds/check-slug?name=${encodeURIComponent(name)}`
    );
  },
};

export type { CreateFundInput, CreateFundResponse, FundType, DisplayRole };

