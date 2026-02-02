import { api } from './client';

export interface DocuSignTemplate {
  id: string;
  name: string;
  description: string | null;
}

export interface DocuSignStatus {
  configured: boolean;
  authType: 'jwt' | 'oauth' | null;
  email?: string;
  oauthSupported: boolean;
}

export interface DocuSignConnectInput {
  integrationKey: string;
  accountId: string;
  userId: string;
  rsaPrivateKey: string;
}

export interface OAuthConnectResult {
  authUrl: string;
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
  // Check if DocuSign is configured (returns auth type and OAuth support)
  getStatus: async (): Promise<DocuSignStatus> => {
    return api.get<DocuSignStatus>('/docusign/status');
  },

  // Start OAuth connection flow - returns URL to redirect user to
  connectOAuth: async (): Promise<OAuthConnectResult> => {
    return api.get<OAuthConnectResult>('/docusign/oauth/connect');
  },

  // Connect DocuSign with credentials (legacy JWT Grant flow)
  connect: async (input: DocuSignConnectInput): Promise<{ success: boolean }> => {
    return api.post<{ success: boolean }>('/docusign/connect', input);
  },

  // Disconnect DocuSign (works for both OAuth and JWT)
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

