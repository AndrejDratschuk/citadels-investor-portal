import { createSign } from 'crypto';
import { supabaseAdmin } from '../../common/database/supabase';
import { onboardingService } from '../onboarding/onboarding.service';
import { prospectsRepository } from '../prospects/prospects.repository';
import type {
  DocuSignConfig,
  DocuSignJwtConfig,
  DocuSignOAuthConfig,
  DocuSignTemplate,
  SendEnvelopeInput,
  EnvelopeResult,
  DocuSignOAuthTokens,
  DocuSignUserInfo,
} from './docusign.types';

// DocuSign OAuth configuration from environment
const DOCUSIGN_CLIENT_ID = process.env.DOCUSIGN_CLIENT_ID;
const DOCUSIGN_CLIENT_SECRET = process.env.DOCUSIGN_CLIENT_SECRET;
const DOCUSIGN_REDIRECT_URI = process.env.DOCUSIGN_REDIRECT_URI || 'http://localhost:3001/api/docusign/callback';
const DOCUSIGN_OAUTH_BASE_URL = process.env.DOCUSIGN_OAUTH_BASE_URL || 'https://account-d.docusign.com';
const DOCUSIGN_API_BASE_URL = process.env.DOCUSIGN_API_BASE_URL || 'https://demo.docusign.net';

// Default to DocuSign demo environment (legacy)
const DOCUSIGN_BASE_URL = 'https://demo.docusign.net';

export class DocuSignService {
  // Cache credentials per fund to avoid repeated DB lookups
  private credentialsCache: Map<string, { config: DocuSignConfig; expiry: number }> = new Map();
  private accessTokens: Map<string, { token: string; expiry: number }> = new Map();

  // ==================== OAuth Methods ====================

  /**
   * Check if DocuSign OAuth is configured (client credentials in environment)
   */
  isOAuthConfigured(): boolean {
    return !!(DOCUSIGN_CLIENT_ID && DOCUSIGN_CLIENT_SECRET);
  }

  /**
   * Generate OAuth authorization URL for DocuSign
   * User will be redirected to this URL to authorize the connection
   */
  getOAuthUrl(state: string): string {
    if (!this.isOAuthConfigured()) {
      throw new Error('DocuSign OAuth is not configured. Set DOCUSIGN_CLIENT_ID and DOCUSIGN_CLIENT_SECRET environment variables.');
    }

    const scopes = ['signature', 'impersonation'].join(' ');
    
    const params = new URLSearchParams({
      response_type: 'code',
      scope: scopes,
      client_id: DOCUSIGN_CLIENT_ID!,
      redirect_uri: DOCUSIGN_REDIRECT_URI,
      state: state,
    });

    return `${DOCUSIGN_OAUTH_BASE_URL}/oauth/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access and refresh tokens
   */
  async exchangeCodeForTokens(code: string): Promise<DocuSignOAuthTokens> {
    if (!this.isOAuthConfigured()) {
      throw new Error('DocuSign OAuth is not configured');
    }

    const tokenUrl = `${DOCUSIGN_OAUTH_BASE_URL}/oauth/token`;
    
    // Create Basic auth header
    const credentials = Buffer.from(`${DOCUSIGN_CLIENT_ID}:${DOCUSIGN_CLIENT_SECRET}`).toString('base64');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: DOCUSIGN_REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DocuSign OAuth] Token exchange failed:', response.status, errorText);
      throw new Error(`Failed to exchange code for tokens: ${errorText}`);
    }

    const data = await response.json() as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      token_type: string;
    };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
    };
  }

  /**
   * Get user info from DocuSign using access token
   */
  async getUserInfo(accessToken: string): Promise<DocuSignUserInfo> {
    const userInfoUrl = `${DOCUSIGN_OAUTH_BASE_URL}/oauth/userinfo`;

    const response = await fetch(userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DocuSign OAuth] Failed to get user info:', response.status, errorText);
      throw new Error('Failed to get DocuSign user info');
    }

    return response.json() as Promise<DocuSignUserInfo>;
  }

  /**
   * Connect DocuSign for a fund using OAuth (save OAuth credentials)
   */
  async connectOAuth(
    fundId: string,
    tokens: DocuSignOAuthTokens,
    userInfo: DocuSignUserInfo
  ): Promise<{ email: string; accountId: string }> {
    // Get the default account (or first account)
    const account = userInfo.accounts.find(a => a.is_default) || userInfo.accounts[0];
    
    if (!account) {
      throw new Error('No DocuSign account found for this user');
    }

    const tokenExpiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

    // Upsert OAuth credentials
    const { error } = await supabaseAdmin
      .from('fund_docusign_credentials')
      .upsert({
        fund_id: fundId,
        auth_type: 'oauth',
        integration_key: DOCUSIGN_CLIENT_ID,
        account_id: account.account_id,
        user_id: userInfo.sub, // DocuSign user ID from userinfo
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        token_expires_at: tokenExpiresAt.toISOString(),
        docusign_user_email: userInfo.email,
        base_url: account.base_uri || DOCUSIGN_API_BASE_URL,
        // Leave rsa_private_key null for OAuth
        rsa_private_key: null,
      }, {
        onConflict: 'fund_id',
      });

    if (error) {
      console.error('[DocuSign OAuth] Error saving credentials:', error);
      throw new Error('Failed to save DocuSign OAuth credentials');
    }

    // Clear cache
    this.credentialsCache.delete(fundId);
    this.accessTokens.delete(fundId);

    return {
      email: userInfo.email,
      accountId: account.account_id,
    };
  }

  /**
   * Refresh OAuth access token using refresh token
   */
  async refreshOAuthToken(fundId: string): Promise<string> {
    const config = await this.getConfigForFund(fundId);
    
    if (!config || config.authType !== 'oauth') {
      throw new Error('No OAuth credentials found for this fund');
    }

    const oauthConfig = config as DocuSignOAuthConfig;
    
    const tokenUrl = `${DOCUSIGN_OAUTH_BASE_URL}/oauth/token`;
    const credentials = Buffer.from(`${DOCUSIGN_CLIENT_ID}:${DOCUSIGN_CLIENT_SECRET}`).toString('base64');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: oauthConfig.refreshToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DocuSign OAuth] Token refresh failed:', response.status, errorText);
      
      // If refresh fails, connection needs to be re-established
      if (response.status === 400 || response.status === 401) {
        throw new Error('DocuSign session expired. Please reconnect your DocuSign account.');
      }
      throw new Error(`Failed to refresh DocuSign token: ${errorText}`);
    }

    const data = await response.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    const tokenExpiresAt = new Date(Date.now() + data.expires_in * 1000);

    // Update tokens in database
    const updateData: Record<string, unknown> = {
      access_token: data.access_token,
      token_expires_at: tokenExpiresAt.toISOString(),
    };

    // DocuSign may return a new refresh token
    if (data.refresh_token) {
      updateData.refresh_token = data.refresh_token;
    }

    await supabaseAdmin
      .from('fund_docusign_credentials')
      .update(updateData)
      .eq('fund_id', fundId);

    // Update cache
    this.accessTokens.set(fundId, {
      token: data.access_token,
      expiry: tokenExpiresAt.getTime() - 300000, // 5 min buffer
    });

    // Clear credentials cache to pick up new tokens
    this.credentialsCache.delete(fundId);

    return data.access_token;
  }

  // ==================== End OAuth Methods ====================

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
   * Supports both JWT and OAuth auth types
   */
  async getConfigForFund(fundId: string): Promise<DocuSignConfig | null> {
    // Check cache first (5 minute TTL)
    const cached = this.credentialsCache.get(fundId);
    if (cached && Date.now() < cached.expiry) {
      return cached.config;
    }

    const { data, error } = await supabaseAdmin
      .from('fund_docusign_credentials')
      .select('integration_key, account_id, user_id, rsa_private_key, auth_type, access_token, refresh_token, token_expires_at, docusign_user_email, base_url')
      .eq('fund_id', fundId)
      .single();

    if (error || !data) {
      return null;
    }

    let config: DocuSignConfig;

    // Determine auth type (default to 'jwt' for backward compatibility)
    const authType = data.auth_type || 'jwt';

    if (authType === 'oauth') {
      config = {
        authType: 'oauth',
        integrationKey: data.integration_key,
        accountId: data.account_id,
        baseUrl: data.base_url || DOCUSIGN_API_BASE_URL,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        tokenExpiresAt: new Date(data.token_expires_at),
        userEmail: data.docusign_user_email,
      } as DocuSignOAuthConfig;
    } else {
      config = {
        authType: 'jwt',
        integrationKey: data.integration_key,
        accountId: data.account_id,
        userId: data.user_id,
        rsaPrivateKey: data.rsa_private_key,
        baseUrl: data.base_url || DOCUSIGN_BASE_URL,
      } as DocuSignJwtConfig;
    }

    // Cache for 5 minutes
    this.credentialsCache.set(fundId, {
      config,
      expiry: Date.now() + 5 * 60 * 1000,
    });

    return config;
  }

  /**
   * Connect DocuSign for a fund (save credentials)
   * Credentials are validated when actually using DocuSign features
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

    // Save credentials (validation happens when using DocuSign features)
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
   * Get DocuSign status for a fund (with auth type info)
   */
  async getStatusForFund(fundId: string): Promise<{
    configured: boolean;
    authType: 'jwt' | 'oauth' | null;
    email?: string;
    accountId?: string;
  }> {
    const config = await this.getConfigForFund(fundId);
    
    if (!config) {
      return { configured: false, authType: null };
    }

    const result: {
      configured: boolean;
      authType: 'jwt' | 'oauth';
      email?: string;
      accountId?: string;
    } = {
      configured: true,
      authType: config.authType,
      accountId: config.accountId,
    };

    if (config.authType === 'oauth') {
      const oauthConfig = config as DocuSignOAuthConfig;
      result.email = oauthConfig.userEmail;
    }

    return result;
  }

  /**
   * Get OAuth access token using JWT Grant flow with specific config
   */
  private async getAccessTokenWithConfig(config: DocuSignJwtConfig): Promise<string> {
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
      
      // Provide helpful error message based on error type
      if (response.status === 400 && errorText.includes('consent_required')) {
        throw new Error('DocuSign consent required. Please visit DocuSign Admin to grant JWT consent for this integration.');
      } else if (response.status === 400 && errorText.includes('invalid_grant')) {
        throw new Error('Invalid DocuSign credentials. Please check your Integration Key, User ID, and RSA Private Key.');
      } else {
        throw new Error(`DocuSign authentication failed: ${errorText || response.status}`);
      }
    }

    const data = await response.json() as { access_token: string; expires_in: number };
    return data.access_token;
  }

  /**
   * Create JWT assertion for DocuSign authentication
   * Signs the JWT with the RSA private key using RS256 algorithm
   */
  private createJwtAssertion(config: DocuSignJwtConfig): string {
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
   * Handles both JWT and OAuth auth types
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

    let token: string;

    if (config.authType === 'oauth') {
      const oauthConfig = config as DocuSignOAuthConfig;
      
      // Check if OAuth token is expired
      if (oauthConfig.tokenExpiresAt <= new Date()) {
        // Refresh the token
        token = await this.refreshOAuthToken(fundId);
      } else {
        token = oauthConfig.accessToken;
        
        // Cache the token
        this.accessTokens.set(fundId, {
          token,
          expiry: oauthConfig.tokenExpiresAt.getTime() - 300000, // 5 min buffer
        });
      }
    } else {
      // JWT auth type
      const jwtConfig = config as DocuSignJwtConfig;
      token = await this.getAccessTokenWithConfig(jwtConfig);
      
      // Cache for 55 minutes (tokens last 1 hour)
      this.accessTokens.set(fundId, {
        token,
        expiry: Date.now() + 55 * 60 * 1000,
      });
    }

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
      throw new Error('DocuSign is not configured');
    }

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

    // Get the document to find the investor ID
    const { data: document } = await supabaseAdmin
      .from('documents')
      .select('investor_id')
      .eq('docusign_envelope_id', envelopeId)
      .single();

    const { error } = await supabaseAdmin
      .from('documents')
      .update(updateData)
      .eq('docusign_envelope_id', envelopeId);

    if (error) {
      console.error('[DocuSign] Error updating document status:', error);
      throw new Error('Failed to update document status');
    }

    // If signing is complete, check if investor's onboarding is now complete
    if (signingStatus === 'signed' && document?.investor_id) {
      try {
        await onboardingService.checkAndUpdateStatus(document.investor_id);
      } catch (err) {
        console.error('[DocuSign] Error checking onboarding status:', err);
        // Don't throw - document update was successful
      }
    }

    // Also check if this is a prospect's DocuSign (from pipeline flow)
    if (signingStatus === 'signed') {
      try {
        await this.handleProspectDocuSignSigned(envelopeId);
      } catch (err) {
        console.error('[DocuSign] Error handling prospect DocuSign:', err);
        // Don't throw - main document update was successful
      }
    }
  }

  /**
   * Handle prospect's DocuSign being signed
   * Updates prospect status from docusign_sent to docusign_signed
   */
  private async handleProspectDocuSignSigned(envelopeId: string): Promise<void> {
    // Find prospect by docusign envelope ID
    const { data: prospect } = await supabaseAdmin
      .from('kyc_applications')
      .select('id, status, fund_id')
      .eq('docusign_envelope_id', envelopeId)
      .single();

    if (!prospect) {
      // Not a prospect envelope, that's OK
      return;
    }

    if (prospect.status !== 'docusign_sent') {
      // Already processed or wrong status
      console.log(`[DocuSign] Prospect ${prospect.id} not in docusign_sent status, skipping`);
      return;
    }

    // Update prospect status to docusign_signed
    const now = new Date();
    await prospectsRepository.updateStatus(
      prospect.id,
      'docusign_signed',
      now,
      { docusignSignedAt: now }
    );

    console.log(`[DocuSign] Updated prospect ${prospect.id} to docusign_signed`);
  }
}

export const docuSignService = new DocuSignService();

