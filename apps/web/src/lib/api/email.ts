import { api } from './client';

export interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
}

export interface SendEmailResult {
  messageId: string;
  message: string;
  from: string;
}

export interface EmailConnectionStatus {
  connected: boolean;
  provider: 'gmail' | 'outlook' | null;
  email: string | null;
}

export interface GmailConnectResult {
  authUrl: string;
}

export const emailApi = {
  // Get connection status
  getStatus: async (): Promise<EmailConnectionStatus> => {
    return api.get<EmailConnectionStatus>('/email/status');
  },

  // Start Gmail OAuth flow
  connectGmail: async (): Promise<GmailConnectResult> => {
    return api.get<GmailConnectResult>('/email/gmail/connect');
  },

  // Disconnect email account
  disconnect: async (provider: 'gmail' | 'outlook' = 'gmail'): Promise<void> => {
    await api.post('/email/disconnect', { provider });
  },

  // Send email
  send: async (input: SendEmailInput): Promise<SendEmailResult> => {
    return api.post<SendEmailResult>('/email/send', input);
  },
};
