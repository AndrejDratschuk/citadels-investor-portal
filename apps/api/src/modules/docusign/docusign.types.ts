export type DocuSignAuthType = 'jwt' | 'oauth';

export interface DocuSignConfigBase {
  integrationKey: string;
  accountId: string;
  baseUrl: string;
  authType: DocuSignAuthType;
}

export interface DocuSignJwtConfig extends DocuSignConfigBase {
  authType: 'jwt';
  userId: string;
  rsaPrivateKey: string;
}

export interface DocuSignOAuthConfig extends DocuSignConfigBase {
  authType: 'oauth';
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  userEmail?: string;
}

export type DocuSignConfig = DocuSignJwtConfig | DocuSignOAuthConfig;

// Legacy config for backward compatibility
export interface DocuSignLegacyConfig {
  integrationKey: string;
  accountId: string;
  userId: string;
  rsaPrivateKey: string;
  baseUrl: string;
}

export interface DocuSignOAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface DocuSignUserInfo {
  sub: string;
  name: string;
  email: string;
  accounts: Array<{
    account_id: string;
    account_name: string;
    is_default: boolean;
    base_uri: string;
  }>;
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

