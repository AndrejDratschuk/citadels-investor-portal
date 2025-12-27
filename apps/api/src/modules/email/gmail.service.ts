import { google } from 'googleapis';
import { supabaseAdmin } from '../../common/database/supabase';

// Gmail OAuth configuration
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const GMAIL_REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || 'http://localhost:3001/api/email/gmail/callback';

// Create OAuth2 client
function createOAuth2Client() {
  return new google.auth.OAuth2(
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET,
    GMAIL_REDIRECT_URI
  );
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

export class GmailService {
  /**
   * Generate OAuth URL for Gmail authorization
   */
  getAuthUrl(state: string): string {
    const oauth2Client = createOAuth2Client();
    
    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state,
      prompt: 'consent', // Force consent to get refresh token
    });
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
    const oauth2Client = createOAuth2Client();
    
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to get tokens from Google');
    }

    // Get user email
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    const expiresAt = new Date(tokens.expiry_date || Date.now() + 3600 * 1000);

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
      email: userInfo.data.email || '',
    };
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
        provider: 'gmail',
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
   * Get user's email connection
   */
  async getConnection(userId: string, provider: 'gmail' | 'outlook' = 'gmail'): Promise<EmailConnection | null> {
    const { data, error } = await supabaseAdmin
      .from('email_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return this.formatConnection(data);
  }

  /**
   * Get any active email connection for user
   */
  async getActiveConnection(userId: string): Promise<EmailConnection | null> {
    const { data, error } = await supabaseAdmin
      .from('email_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('connected_at', { ascending: false })
      .limit(1)
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
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
      refresh_token: connection.refreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    
    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token');
    }

    const expiresAt = new Date(credentials.expiry_date || Date.now() + 3600 * 1000);

    // Update in database
    const { data, error } = await supabaseAdmin
      .from('email_connections')
      .update({
        access_token: credentials.access_token,
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
   * Send email using Gmail API
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

      const oauth2Client = createOAuth2Client();
      oauth2Client.setCredentials({
        access_token: connection.accessToken,
        refresh_token: connection.refreshToken,
      });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      // Create email message
      const emailLines = [
        `From: ${connection.email}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        body.replace(/\n/g, '<br>'),
      ];

      const email = emailLines.join('\r\n');
      const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const result = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail,
        },
      });

      // Update last used
      await supabaseAdmin
        .from('email_connections')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', connection.id);

      return {
        success: true,
        messageId: result.data.id || undefined,
      };
    } catch (error: any) {
      console.error('Gmail send error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }
  }

  /**
   * Disconnect email account
   */
  async disconnect(userId: string, provider: 'gmail' | 'outlook' = 'gmail'): Promise<void> {
    const { error } = await supabaseAdmin
      .from('email_connections')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('provider', provider);

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

export const gmailService = new GmailService();






















