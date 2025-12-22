import { createSign } from 'crypto';
import { supabaseAdmin } from '../../common/database/supabase';
import type {
  DocuSignConfig,
  DocuSignTemplate,
  SendEnvelopeInput,
  EnvelopeResult,
} from './docusign.types';

// Default to DocuSign demo environment
const DOCUSIGN_BASE_URL = 'https://demo.docusign.net';

export class DocuSignService {
  // Cache credentials per fund to avoid repeated DB lookups
  private credentialsCache: Map<string, { config: DocuSignConfig; expiry: number }> = new Map();
  private accessTokens: Map<string, { token: string; expiry: number }> = new Map();

  /**
   * Check if a fund has DocuSign configured
   */
  async isConfiguredForFund(fundId: string): Promise<boolean> {
    const config = await this.getConfigForFund(fundId);
    return config !== null;
  }

  /**
   * Legacy method for backwards compatibility
   */
  isConfigured(): boolean {
    // This is now fund-specific, but we keep this for old code paths
    return false;
  }

  /**
   * Get DocuSign config for a specific fund from database
   */
  async getConfigForFund(fundId: string): Promise<DocuSignConfig | null> {
    // Check cache first (5 minute TTL)
    const cached = this.credentialsCache.get(fundId);
    if (cached && Date.now() < cached.expiry) {
      return cached.config;
    }

    const { data, error } = await supabaseAdmin
      .from('fund_docusign_credentials')
      .select('integration_key, account_id, user_id, rsa_private_key')
      .eq('fund_id', fundId)
      .single();

    if (error || !data) {
      return null;
    }

    const config: DocuSignConfig = {
      integrationKey: data.integration_key,
      accountId: data.account_id,
      userId: data.user_id,
      rsaPrivateKey: data.rsa_private_key,
      baseUrl: DOCUSIGN_BASE_URL,
    };

    // Cache for 5 minutes
    this.credentialsCache.set(fundId, {
      config,
      expiry: Date.now() + 5 * 60 * 1000,
    });

    return config;
  }

  /**
   * Connect DocuSign for a fund (save credentials)
   * Validates credentials by attempting to get an access token
   */
  async connectForFund(
    fundId: string,
    credentials: { integrationKey: string; accountId: string; userId: string; rsaPrivateKey: string }
  ): Promise<void> {
    // Basic format validation
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!credentials.integrationKey || credentials.integrationKey.length < 10) {
      throw new Error('Invalid Integration Key format');
    }
    
    if (!credentials.accountId || !uuidPattern.test(credentials.accountId)) {
      throw new Error('Invalid Account ID format. It should be a UUID (e.g., xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)');
    }
    
    if (!credentials.userId || !uuidPattern.test(credentials.userId)) {
      throw new Error('Invalid User ID format. It should be a UUID (e.g., xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)');
    }

    if (!credentials.rsaPrivateKey || !credentials.rsaPrivateKey.includes('PRIVATE KEY')) {
      throw new Error('Invalid RSA Private Key format. It should be a PEM-formatted private key.');
    }

    // Normalize the private key (handle both \\n and actual newlines)
    const normalizedPrivateKey = credentials.rsaPrivateKey
      .replace(/\\n/g, '\n')
      .trim();

    // Build test config
    const testConfig: DocuSignConfig = {
      integrationKey: credentials.integrationKey,
      accountId: credentials.accountId,
      userId: credentials.userId,
      rsaPrivateKey: normalizedPrivateKey,
      baseUrl: DOCUSIGN_BASE_URL,
    };

    // Validate by attempting to get an access token
    try {
      await this.getAccessTokenWithConfig(testConfig);
    } catch (error) {
      console.error('[DocuSign] Credential validation failed:', error);
      throw new Error('Invalid DocuSign credentials. Please verify your Integration Key, User ID, and RSA Private Key. Make sure you have granted consent for JWT authentication.');
    }

    // Save credentials
    const { error } = await supabaseAdmin
      .from('fund_docusign_credentials')
      .upsert({
        fund_id: fundId,
        integration_key: credentials.integrationKey,
        account_id: credentials.accountId,
        user_id: credentials.userId,
        rsa_private_key: normalizedPrivateKey,
      }, {
        onConflict: 'fund_id',
      });

    if (error) {
      console.error('[DocuSign] Error saving credentials:', error);
      throw new Error('Failed to save DocuSign credentials');
    }

    // Clear cache
    this.credentialsCache.delete(fundId);
  }

  /**
   * Disconnect DocuSign for a fund (remove credentials)
   */
  async disconnectForFund(fundId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('fund_docusign_credentials')
      .delete()
      .eq('fund_id', fundId);

    if (error) {
      console.error('[DocuSign] Error deleting credentials:', error);
      throw new Error('Failed to remove DocuSign credentials');
    }

    // Clear cache
    this.credentialsCache.delete(fundId);
    this.accessTokens.delete(fundId);
  }

  /**
   * Get config, throws if not configured
   */
  getConfig(): DocuSignConfig {
    throw new Error('DocuSign is not configured. Please connect DocuSign in Settings > Integrations.');
  }

  /**
   * Get OAuth access token using JWT Grant flow with specific config
   */
  private async getAccessTokenWithConfig(config: DocuSignConfig): Promise<string> {
    // For JWT Grant flow, we create a JWT assertion
    // DocuSign demo account uses account-d.docusign.com for auth
    const tokenUrl = config.baseUrl.includes('demo')
      ? 'https://account-d.docusign.com/oauth/token'
      : 'https://account.docusign.com/oauth/token';

    // Create JWT for DocuSign (simplified version - in production use proper RSA)
    // For now, we use the Integration Key Grant flow which works for demo
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: this.createJwtAssertion(config),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DocuSign] Token request failed:', response.status, errorText);
      throw new Error(`DocuSign authentication failed: ${response.status}`);
    }

    const data = await response.json() as { access_token: string; expires_in: number };
    return data.access_token;
  }

  /**
   * Create JWT assertion for DocuSign authentication
   * Signs the JWT with the RSA private key using RS256 algorithm
   */
  private createJwtAssertion(config: DocuSignConfig): string {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: config.integrationKey,
      sub: config.userId,
      aud: config.baseUrl.includes('demo') ? 'account-d.docusign.com' : 'account.docusign.com',
      iat: now,
      exp: now + 3600,
      scope: 'signature impersonation',
    };

    // Base64url encode header and payload
    const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signatureInput = `${base64Header}.${base64Payload}`;
    
    // Sign with RSA private key using SHA-256
    const sign = createSign('RSA-SHA256');
    sign.update(signatureInput);
    sign.end();
    
    const signature = sign.sign(config.rsaPrivateKey, 'base64url');
    
    return `${signatureInput}.${signature}`;
  }

  /**
   * Get access token for a specific fund
   */
  private async getAccessTokenForFund(fundId: string): Promise<string> {
    // Check cache
    const cached = this.accessTokens.get(fundId);
    if (cached && Date.now() < cached.expiry - 300000) {
      return cached.token;
    }

    const config = await this.getConfigForFund(fundId);
    if (!config) {
      throw new Error('DocuSign is not configured for this fund');
    }

    const token = await this.getAccessTokenWithConfig(config);
    
    // Cache for 55 minutes (tokens last 1 hour)
    this.accessTokens.set(fundId, {
      token,
      expiry: Date.now() + 55 * 60 * 1000,
    });

    return token;
  }

  /**
   * Make authenticated request to DocuSign API for a specific fund
   */
  private async apiRequestForFund<T>(
    fundId: string,
    method: string,
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const config = await this.getConfigForFund(fundId);
    if (!config) {
      throw new Error('DocuSign is not configured for this fund');
    }

    const token = await this.getAccessTokenForFund(fundId);
    const url = `${config.baseUrl}/restapi/v2.1/accounts/${config.accountId}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[DocuSign] API request failed: ${method} ${endpoint}`, response.status, errorText);
      throw new Error(`DocuSign API error: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * List available templates for a fund
   */
  async listTemplatesForFund(fundId: string): Promise<DocuSignTemplate[]> {
    const isConfigured = await this.isConfiguredForFund(fundId);
    if (!isConfigured) {
      return [];
    }

    try {
      const response = await this.apiRequestForFund<{
        envelopeTemplates?: Array<{
          templateId: string;
          name: string;
          description: string | null;
        }>;
      }>(fundId, 'GET', '/templates');

      return (response.envelopeTemplates || []).map((t) => ({
        id: t.templateId,
        name: t.name,
        description: t.description,
      }));
    } catch (error) {
      console.error('[DocuSign] Error listing templates:', error);
      return [];
    }
  }

  /**
   * Legacy method - throws error since no fund context
   */
  async listTemplates(): Promise<DocuSignTemplate[]> {
    throw new Error('listTemplates requires fund context. Use listTemplatesForFund instead.');
  }

  /**
   * Send envelope using a template
   */
  async sendEnvelope(input: SendEnvelopeInput, fundId: string): Promise<EnvelopeResult> {
    // Create envelope from template using fund-specific credentials
    const envelopeResponse = await this.apiRequestForFund<{
      envelopeId: string;
      status: string;
    }>(fundId, 'POST', '/envelopes', {
      templateId: input.templateId,
      templateRoles: [
        {
          email: input.investorEmail,
          name: input.investorName,
          roleName: 'Investor', // Must match role name in template
        },
      ],
      status: 'sent',
      emailSubject: input.subject || 'Please sign your investment documents',
      emailBlurb: input.emailBody || 'Please review and sign the attached documents.',
    });

    // Create document record in database
    const { data: doc, error: docError } = await supabaseAdmin
      .from('documents')
      .insert({
        fund_id: fundId,
        investor_id: input.investorId,
        type: 'subscription', // Default type, could be passed in
        name: input.subject || 'Investment Document',
        requires_signature: true,
        docusign_envelope_id: envelopeResponse.envelopeId,
        signing_status: 'sent',
      })
      .select('id')
      .single();

    if (docError) {
      console.error('[DocuSign] Error creating document record:', docError);
      throw new Error('Failed to create document record');
    }

    return {
      envelopeId: envelopeResponse.envelopeId,
      status: envelopeResponse.status,
      documentId: doc.id,
    };
  }

  /**
   * Get recipient view URL (embedded signing)
   */
  async getRecipientViewUrl(
    fundId: string,
    envelopeId: string,
    investorEmail: string,
    investorName: string,
    returnUrl: string
  ): Promise<string> {
    const response = await this.apiRequestForFund<{ url: string }>(
      fundId,
      'POST',
      `/envelopes/${envelopeId}/views/recipient`,
      {
        email: investorEmail,
        userName: investorName,
        clientUserId: investorEmail, // For embedded signing
        authenticationMethod: 'none',
        returnUrl,
      }
    );

    return response.url;
  }

  /**
   * Handle DocuSign webhook (Connect) callback
   */
  async handleWebhook(payload: {
    envelopeId: string;
    status: string;
    completedDateTime?: string;
  }): Promise<void> {
    const { envelopeId, status, completedDateTime } = payload;

    // Map DocuSign status to our signing_status
    let signingStatus: string;
    switch (status.toLowerCase()) {
      case 'completed':
        signingStatus = 'signed';
        break;
      case 'declined':
        signingStatus = 'declined';
        break;
      case 'sent':
        signingStatus = 'sent';
        break;
      case 'delivered':
        signingStatus = 'viewed';
        break;
      default:
        signingStatus = 'sent';
    }

    const updateData: Record<string, unknown> = {
      signing_status: signingStatus,
    };

    if (signingStatus === 'signed' && completedDateTime) {
      updateData.signed_at = completedDateTime;
    }

    const { error } = await supabaseAdmin
      .from('documents')
      .update(updateData)
      .eq('docusign_envelope_id', envelopeId);

    if (error) {
      console.error('[DocuSign] Error updating document status:', error);
      throw new Error('Failed to update document status');
    }
  }
}

export const docuSignService = new DocuSignService();

