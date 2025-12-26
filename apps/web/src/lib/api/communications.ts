import { api } from './client';
import { Communication, CommunicationType } from '@flowveda/shared';

export type { Communication, CommunicationType };

export interface CommunicationWithInvestor extends Communication {
  investor: {
    id: string;
    name: string;
    email: string;
  };
  deal: {
    id: string;
    name: string;
  } | null;
  tags: string[];
  managerRead: boolean;
  managerReadAt: string | null;
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

export interface SendEmailInput {
  investorIds?: string[];
  recipientEmails?: string[];
  subject: string;
  body: string;
}

export const communicationsApi = {
  // Get all communications for the fund (manager view)
  getAll: async (): Promise<CommunicationWithInvestor[]> => {
    return api.get<CommunicationWithInvestor[]>('/communications');
  },

  // Get communications for an investor
  getByInvestorId: async (investorId: string, type?: CommunicationType): Promise<Communication[]> => {
    const params = type ? `?type=${type}` : '';
    return api.get<Communication[]>(`/investors/${investorId}/communications${params}`);
  },

  // Create a communication log
  create: async (investorId: string, input: CreateCommunicationInput): Promise<Communication> => {
    return api.post<Communication>(`/investors/${investorId}/communications`, input);
  },

  // Send email to investors or recipients (manager)
  send: async (input: SendEmailInput): Promise<{ success: boolean; messageId?: string }> => {
    return api.post<{ success: boolean; messageId?: string }>('/communications/send', input);
  },

  // Mark a communication as read (manager)
  markAsRead: async (communicationId: string): Promise<void> => {
    await api.patch(`/communications/${communicationId}/read`, {});
  },

  // Get unread communication count (manager)
  getUnreadCount: async (): Promise<number> => {
    return api.get<number>('/communications/unread-count');
  },

  // Delete a communication
  delete: async (communicationId: string): Promise<void> => {
    await api.delete(`/communications/${communicationId}`);
  },
};
