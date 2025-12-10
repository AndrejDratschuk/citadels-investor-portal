import { api } from './client';

export type CommunicationType = 'email' | 'meeting' | 'phone_call';

export interface Communication {
  id: string;
  investorId: string;
  fundId: string;
  type: CommunicationType;
  title: string;
  content: string | null;
  occurredAt: string;
  emailFrom: string | null;
  emailTo: string | null;
  meetingAttendees: string[] | null;
  meetingDurationMinutes: number | null;
  callDirection: 'inbound' | 'outbound' | null;
  callDurationMinutes: number | null;
  source: string;
  externalId: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface CreateCommunicationInput {
  type: CommunicationType;
  title: string;
  content?: string;
  occurredAt: string;
  // Phone call specific
  callDirection?: 'inbound' | 'outbound';
  callDurationMinutes?: number;
  // Email specific
  emailFrom?: string;
  emailTo?: string;
  // Meeting specific
  meetingAttendees?: string[];
  meetingDurationMinutes?: number;
}

export const communicationsApi = {
  // Get communications for an investor
  getByInvestorId: async (investorId: string, type?: CommunicationType): Promise<Communication[]> => {
    const params = type ? `?type=${type}` : '';
    return api.get<Communication[]>(`/investors/${investorId}/communications${params}`);
  },

  // Create a communication log
  create: async (investorId: string, input: CreateCommunicationInput): Promise<Communication> => {
    return api.post<Communication>(`/investors/${investorId}/communications`, input);
  },

  // Delete a communication
  delete: async (communicationId: string): Promise<void> => {
    await api.delete(`/communications/${communicationId}`);
  },
};
