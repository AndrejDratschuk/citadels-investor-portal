import { api } from './client';

export interface DocuSignTemplate {
  id: string;
  name: string;
  description: string | null;
}

export interface DocuSignStatus {
  configured: boolean;
}

export interface DocuSignConnectInput {
  integrationKey: string;
  accountId: string;
  userId: string;
}

export interface SendEnvelopeInput {
  templateId: string;
  investorId: string;
  subject?: string;
  emailBody?: string;
}

export interface EnvelopeResult {
  envelopeId: string;
  status: string;
  documentId: string;
}

export const docuSignApi = {
  // Check if DocuSign is configured
  getStatus: async (): Promise<DocuSignStatus> => {
    return api.get<DocuSignStatus>('/docusign/status');
  },

  // Connect DocuSign with credentials
  connect: async (input: DocuSignConnectInput): Promise<{ success: boolean }> => {
    return api.post<{ success: boolean }>('/docusign/connect', input);
  },

  // Disconnect DocuSign
  disconnect: async (): Promise<{ success: boolean }> => {
    return api.post<{ success: boolean }>('/docusign/disconnect', {});
  },

  // List available templates
  listTemplates: async (): Promise<DocuSignTemplate[]> => {
    return api.get<DocuSignTemplate[]>('/docusign/templates');
  },

  // Send envelope
  sendEnvelope: async (input: SendEnvelopeInput): Promise<EnvelopeResult> => {
    return api.post<EnvelopeResult>('/docusign/send', input);
  },
};

