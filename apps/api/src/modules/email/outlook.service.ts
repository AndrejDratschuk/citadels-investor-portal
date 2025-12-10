import { ConfidentialClientApplication } from '@azure/msal-node';
import { supabaseAdmin } from '../../common/database/supabase';

// Outlook/Microsoft OAuth configuration
const OUTLOOK_CLIENT_ID = process.env.OUTLOOK_CLIENT_ID || '';
const OUTLOOK_CLIENT_SECRET = process.env.OUTLOOK_CLIENT_SECRET || '';
const OUTLOOK_REDIRECT_URI = process.env.OUTLOOK_REDIRECT_URI || 'http://localhost:3001/api/email/outlook/callback';

// Microsoft Graph API endpoint
const GRAPH_API_ENDPOINT = 'https://graph.microsoft.com/v1.0';

// MSAL configuration
const msalConfig = {
  auth: {
    clientId: OUTLOOK_CLIENT_ID,
    clientSecret: OUTLOOK_CLIENT_SECRET,
    authority: 'https://login.microsoftonline.com/common',
  },
};

// Create MSAL client
function createMsalClient() {
  return new ConfidentialClientApplication(msalConfig);
}

export interface EmailConnection {
  id: string;
  userId: string;
  fundId: string;
  provider: 'gmail' | 'outlook';
  email: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: string;
  isActive: boolean;
}

export class OutlookService {
  /**
   * Generate OAuth URL for Microsoft authorization
   */
  getAuthUrl(state: string): string {
    const scopes = [
      'https://graph.microsoft.com/Mail.Send',
      'https://graph.microsoft.com/User.Read',
      'offline_access', // Required for refresh tokens
    ];

    const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    authUrl.searchParams.set('client_id', OUTLOOK_CLIENT_ID);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', OUTLOOK_REDIRECT_URI);
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('response_mode', 'query');
    authUrl.searchParams.set('prompt', 'consent'); // Force consent to get refresh token

    return authUrl.toString();
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    email: string;
  }> {
    const msalClient = createMsalClient();

    const tokenRequest = {
      code,
      scopes: [
        'https://graph.microsoft.com/Mail.Send',
        'https://graph.microsoft.com/User.Read',
        'offline_access',
      ],
      redirectUri: OUTLOOK_REDIRECT_URI,
    };

    const response = await msalClient.acquireTokenByCode(tokenRequest);

    if (!response || !response.accessToken) {
      throw new Error('Failed to get tokens from Microsoft');
    }

    // Get user email from Microsoft Graph
    const userInfo = await this.getUserInfo(response.accessToken);

    // Calculate expiry (MSAL returns expiresOn as Date)
    const expiresAt = response.expiresOn || new Date(Date.now() + 3600 * 1000);

    return {
      accessToken: response.accessToken,
      refreshToken: response.account?.homeAccountId || '', // MSAL handles refresh differently
      expiresAt: expiresAt instanceof Date ? expiresAt : new Date(expiresAt),
      email: userInfo.mail || userInfo.userPrincipalName || '',
    };
  }

  /**
   * Get user info from Microsoft Graph
   */
  private async getUserInfo(accessToken: string): Promise<{ mail: string; userPrincipalName: string }> {
    const response = await fetch(`${GRAPH_API_ENDPOINT}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info from Microsoft');
    }

    return response.json();
  }

  /**
   * Save email connection to database
   */
  async saveConnection(
    userId: string,
    fundId: string,
    email: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: Date
  ): Promise<EmailConnection> {
    // Upsert - update if exists, insert if not
    const { data, error } = await supabaseAdmin
      .from('email_connections')
      .upsert({
        user_id: userId,
        fund_id: fundId,
        provider: 'outlook',
        email,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: expiresAt.toISOString(),
        is_active: true,
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,provider',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving email connection:', error);
      throw new Error('Failed to save email connection');
    }

    return this.formatConnection(data);
  }

  /**
   * Get user's Outlook email connection
   */
  async getConnection(userId: string): Promise<EmailConnection | null> {
    const { data, error } = await supabaseAdmin
      .from('email_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'outlook')
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return this.formatConnection(data);
  }

  /**
   * Refresh access token if expired
   */
  async refreshAccessToken(connection: EmailConnection): Promise<EmailConnection> {
    const msalClient = createMsalClient();

    // For MSAL, we need to use the silent token acquisition
    // This requires the account to be cached, which we don't have in a stateless API
    // Alternative: Use the refresh token directly with Microsoft's token endpoint

    const tokenEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
    
    const params = new URLSearchParams({
      client_id: OUTLOOK_CLIENT_ID,
      client_secret: OUTLOOK_CLIENT_SECRET,
      refresh_token: connection.refreshToken,
      grant_type: 'refresh_token',
      scope: 'https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read offline_access',
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Token refresh failed:', error);
      throw new Error('Failed to refresh access token');
    }

    const tokens = await response.json();

    const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);

    // Update in database
    const { data, error } = await supabaseAdmin
      .from('email_connections')
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || connection.refreshToken,
        token_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection.id)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update access token');
    }

    return this.formatConnection(data);
  }

  /**
   * Send email using Microsoft Graph API
   */
  async sendEmail(
    connection: EmailConnection,
    to: string,
    subject: string,
    body: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Check if token is expired
      const tokenExpires = new Date(connection.tokenExpiresAt);
      if (tokenExpires <= new Date()) {
        connection = await this.refreshAccessToken(connection);
      }

      // Create email message in Microsoft Graph format
      const message = {
        message: {
          subject: subject,
          body: {
            contentType: 'HTML',
            content: body.replace(/\n/g, '<br>'),
          },
          toRecipients: [
            {
              emailAddress: {
                address: to,
              },
            },
          ],
        },
        saveToSentItems: true,
      };

      const response = await fetch(`${GRAPH_API_ENDPOINT}/me/sendMail`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Microsoft Graph send error:', error);
        return {
          success: false,
          error: 'Failed to send email via Outlook',
        };
      }

      // Update last used
      await supabaseAdmin
        .from('email_connections')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', connection.id);

      return {
        success: true,
        messageId: `outlook-${Date.now()}`, // Microsoft doesn't return message ID from sendMail
      };
    } catch (error: any) {
      console.error('Outlook send error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }
  }

  /**
   * Disconnect email account
   */
  async disconnect(userId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('email_connections')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('provider', 'outlook');

    if (error) {
      throw new Error('Failed to disconnect email');
    }
  }

  private formatConnection(data: any): EmailConnection {
    return {
      id: data.id,
      userId: data.user_id,
      fundId: data.fund_id,
      provider: data.provider,
      email: data.email,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiresAt: data.token_expires_at,
      isActive: data.is_active,
    };
  }
}

export const outlookService = new OutlookService();




