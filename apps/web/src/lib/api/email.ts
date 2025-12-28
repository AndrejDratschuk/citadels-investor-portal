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

// Automation log types
export type AutomationType =
  | 'document_approval'
  | 'document_rejection'
  | 'documents_approved_docusign'
  | 'capital_call_request'
  | 'capital_call_reminder'
  | 'wire_confirmation'
  | 'wire_issue'
  | 'welcome_investor'
  | 'account_invite'
  | 'verification_code'
  | 'kyc_invite'
  | 'kyc_reminder'
  | 'meeting_invite'
  | 'onboarding_reminder'
  | 'password_reset'
  | 'manual_send';

export type EmailStatus = 'sent' | 'delivered' | 'opened' | 'failed';

export interface AutomationLogRecord {
  id: string;
  fundId: string | null;
  investorId: string | null;
  emailType: string;
  automationType: AutomationType | null;
  triggerEvent: string | null;
  recipientEmail: string;
  subject: string;
  status: EmailStatus;
  messageId: string | null;
  errorMessage: string | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  metadata: Record<string, unknown>;
  sentAt: string;
}

export interface AutomationLogFilters {
  automationType?: AutomationType;
  status?: EmailStatus;
  startDate?: string;
  endDate?: string;
  investorId?: string;
  limit?: number;
  offset?: number;
}

export interface AutomationLogPagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface AutomationLogsResponse {
  logs: AutomationLogRecord[];
  pagination: AutomationLogPagination;
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

  // Get automation logs
  getAutomationLogs: async (filters?: AutomationLogFilters): Promise<AutomationLogsResponse> => {
    const params = new URLSearchParams();
    if (filters?.automationType) params.append('automationType', filters.automationType);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.investorId) params.append('investorId', filters.investorId);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    const url = queryString ? `/email/automation-logs?${queryString}` : '/email/automation-logs';
    
    const response = await api.get<{ data: AutomationLogRecord[]; pagination: AutomationLogPagination }>(url);
    return {
      logs: response.data,
      pagination: response.pagination,
    };
  },

  // Get a single automation log by ID
  getAutomationLogById: async (id: string): Promise<AutomationLogRecord> => {
    return api.get<AutomationLogRecord>(`/email/automation-logs/${id}`);
  },
};
