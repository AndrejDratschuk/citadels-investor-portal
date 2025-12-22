import { env } from '../../config/env';
import { supabaseAdmin } from '../../common/database/supabase';
import type {
  DocuSignConfig,
  DocuSignTemplate,
  SendEnvelopeInput,
  EnvelopeResult,
} from './docusign.types';

export class DocuSignService {
  private config: DocuSignConfig | null = null;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.loadConfig();
  }

  private loadConfig(): void {
    const envRecord = env as unknown as Record<string, string | undefined>;
    const integrationKey = envRecord.DOCUSIGN_INTEGRATION_KEY;
    const secretKey = envRecord.DOCUSIGN_SECRET_KEY;
    const accountId = envRecord.DOCUSIGN_ACCOUNT_ID;
    const baseUrl = envRecord.DOCUSIGN_BASE_URL;

    if (integrationKey && secretKey && accountId && baseUrl) {
      this.config = {
        integrationKey,
        secretKey,
        accountId,
        baseUrl,
      };
    }
  }

  isConfigured(): boolean {
    return this.config !== null;
  }

  getConfig(): DocuSignConfig {
    if (!this.config) {
      throw new Error('DocuSign is not configured. Please set the required environment variables.');
    }
    return this.config;
  }

  /**
   * Get OAuth access token using JWT Grant flow
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 5 min buffer)
    if (this.accessToken && Date.now() < this.tokenExpiry - 300000) {
      return this.accessToken;
    }

    const config = this.getConfig();

    // For JWT Grant, we need a user consent flow first, then can use refresh tokens
    // For demo/dev purposes, we'll use the secret key as a refresh token approach
    // In production, you'd use proper JWT with RSA key
    
    const tokenUrl = config.baseUrl.includes('demo')
      ? 'https://account-d.docusign.com/oauth/token'
      : 'https://account.docusign.com/oauth/token';

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${config.integrationKey}:${config.secretKey}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: config.secretKey, // In production, this should be a proper JWT
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DocuSign] Token request failed:', response.status, errorText);
      throw new Error(`DocuSign authentication failed: ${response.status}`);
    }

    const data = await response.json() as { access_token: string; expires_in: number };
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);

    return this.accessToken;
  }

  /**
   * Make authenticated request to DocuSign API
   */
  private async apiRequest<T>(
    method: string,
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const config = this.getConfig();
    const token = await this.getAccessToken();
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
   * List available templates
   */
  async listTemplates(): Promise<DocuSignTemplate[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const response = await this.apiRequest<{
        envelopeTemplates?: Array<{
          templateId: string;
          name: string;
          description: string | null;
        }>;
      }>('GET', '/templates');

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
   * Send envelope using a template
   */
  async sendEnvelope(input: SendEnvelopeInput, fundId: string): Promise<EnvelopeResult> {
    const config = this.getConfig();

    // Create envelope from template
    const envelopeResponse = await this.apiRequest<{
      envelopeId: string;
      status: string;
    }>('POST', '/envelopes', {
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
    envelopeId: string,
    investorEmail: string,
    investorName: string,
    returnUrl: string
  ): Promise<string> {
    const response = await this.apiRequest<{ url: string }>(
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

