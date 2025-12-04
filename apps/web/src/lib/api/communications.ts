import { api } from './client';
import { Communication, CommunicationType, CreatePhoneCallInput } from '@flowveda/shared';

export const communicationsApi = {
  getByInvestorId: async (
    investorId: string,
    type?: CommunicationType
  ): Promise<Communication[]> => {
    const params = type ? `?type=${type}` : '';
    return api.get<Communication[]>(`/investors/${investorId}/communications${params}`);
  },

  createPhoneCall: async (
    investorId: string,
    input: Omit<CreatePhoneCallInput, 'investorId'>
  ): Promise<Communication> => {
    return api.post<Communication>(
      `/investors/${investorId}/communications/phone-call`,
      input
    );
  },

  delete: async (communicationId: string): Promise<void> => {
    return api.delete(`/communications/${communicationId}`);
  },
};


