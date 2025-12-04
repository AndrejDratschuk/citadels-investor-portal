import { api } from './client';
import { Communication, CommunicationType, CallDirection } from '@flowveda/shared';

export interface CreateCommunicationInput {
  type: CommunicationType;
  title: string;
  content?: string;
  occurredAt: string;
  // Phone call specific
  callDirection?: CallDirection;
  callDurationMinutes?: number;
  // Email specific
  emailFrom?: string;
  emailTo?: string;
  // Meeting specific
  meetingAttendees?: string[];
  meetingDurationMinutes?: number;
}

export const communicationsApi = {
  getByInvestorId: async (
    investorId: string,
    type?: CommunicationType
  ): Promise<Communication[]> => {
    const params = type ? `?type=${type}` : '';
    return api.get<Communication[]>(`/investors/${investorId}/communications${params}`);
  },

  create: async (
    investorId: string,
    input: CreateCommunicationInput
  ): Promise<Communication> => {
    return api.post<Communication>(
      `/investors/${investorId}/communications`,
      input
    );
  },

  delete: async (communicationId: string): Promise<void> => {
    return api.delete(`/communications/${communicationId}`);
  },
};


