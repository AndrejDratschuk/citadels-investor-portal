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
  provider: 'gmail' | 'outlook' | 'smtp' | null;
  email: string | null;
}

export interface OAuthConnectResult {
  authUrl: string;
}

export interface SmtpConfig {
  email: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

export const emailApi = {
  // Get connection status
  getStatus: async (): Promise<EmailConnectionStatus> => {
    return api.get<EmailConnectionStatus>('/email/status');
  },

  // Start Gmail OAuth flow
  connectGmail: async (): Promise<OAuthConnectResult> => {
    return api.get<OAuthConnectResult>('/email/gmail/connect');
  },

  // Start Outlook OAuth flow
  connectOutlook: async (): Promise<OAuthConnectResult> => {
    return api.get<OAuthConnectResult>('/email/outlook/connect');
  },

  // Connect SMTP account
  connectSmtp: async (config: SmtpConfig): Promise<EmailConnectionStatus> => {
    return api.post<EmailConnectionStatus>('/email/smtp/connect', config);
  },

  // Disconnect email account
  disconnect: async (provider: 'gmail' | 'outlook' | 'smtp' = 'gmail'): Promise<void> => {
    await api.post('/email/disconnect', { provider });
  },

  // Send email
  send: async (input: SendEmailInput): Promise<SendEmailResult> => {
    return api.post<SendEmailResult>('/email/send', input);
  },
};
