export interface DocuSignConfig {
  integrationKey: string;
  accountId: string;
  userId: string;
  rsaPrivateKey: string;
  baseUrl: string;
}

export interface DocuSignTemplate {
  id: string;
  name: string;
  description: string | null;
}

export interface SendEnvelopeInput {
  templateId: string;
  investorId: string;
  investorEmail: string;
  investorName: string;
  subject?: string;
  emailBody?: string;
}

export interface EnvelopeResult {
  envelopeId: string;
  status: string;
  documentId: string;
}

export interface RecipientViewResult {
  url: string;
}

