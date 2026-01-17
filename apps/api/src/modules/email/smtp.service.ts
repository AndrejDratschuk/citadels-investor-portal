import nodemailer from 'nodemailer';
import { supabaseAdmin } from '../../common/database/supabase';

export interface SmtpConfig {
  email: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

export interface SmtpConnection {
  id: string;
  userId: string;
  fundId: string;
  provider: 'smtp';
  email: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUsername: string;
  password: string; // Stored in access_token column
  isActive: boolean;
}

export class SmtpService {
  /**
   * Test SMTP connection before saving
   * This verifies the credentials work
   */
  async testConnection(config: SmtpConfig): Promise<{ success: boolean; error?: string }> {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure, // true for 465, false for other ports
      auth: {
        user: config.username,
        pass: config.password,
      },
      // Timeout settings
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
    });

    try {
      await transporter.verify();
      return { success: true };
    } catch (error: any) {
      console.error('SMTP connection test failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to connect to SMTP server',
      };
    } finally {
      transporter.close();
    }
  }

  /**
   * Save SMTP connection to database
   */
  async saveConnection(
    userId: string,
    fundId: string,
    config: SmtpConfig
  ): Promise<SmtpConnection> {
    // First, deactivate any existing SMTP connections for this user
    await supabaseAdmin
      .from('email_connections')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('provider', 'smtp');

    // Insert new connection
    const { data, error } = await supabaseAdmin
      .from('email_connections')
      .upsert({
        user_id: userId,
        fund_id: fundId,
        provider: 'smtp',
        email: config.email,
        smtp_host: config.host,
        smtp_port: config.port,
        smtp_secure: config.secure,
        smtp_username: config.username,
        access_token: config.password, // Store password in access_token column
        refresh_token: null, // Not used for SMTP
        token_expires_at: null, // Not used for SMTP
        is_active: true,
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,provider',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving SMTP connection:', error);
      throw new Error('Failed to save SMTP connection');
    }

    return this.formatConnection(data);
  }

  /**
   * Get user's active SMTP connection
   */
  async getConnection(userId: string): Promise<SmtpConnection | null> {
    const { data, error } = await supabaseAdmin
      .from('email_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'smtp')
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return this.formatConnection(data);
  }

  /**
   * Send email via SMTP
   */
  async sendEmail(
    connection: SmtpConnection,
    to: string,
    subject: string,
    body: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const transporter = nodemailer.createTransport({
      host: connection.smtpHost,
      port: connection.smtpPort,
      secure: connection.smtpSecure,
      auth: {
        user: connection.smtpUsername,
        pass: connection.password,
      },
    });

    try {
      const result = await transporter.sendMail({
        from: connection.email,
        to,
        subject,
        html: body.replace(/\n/g, '<br>'),
        text: body, // Plain text fallback
      });

      // Update last used timestamp
      await supabaseAdmin
        .from('email_connections')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', connection.id);

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error: any) {
      console.error('SMTP send error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    } finally {
      transporter.close();
    }
  }

  /**
   * Disconnect SMTP account
   */
  async disconnect(userId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('email_connections')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('provider', 'smtp');

    if (error) {
      throw new Error('Failed to disconnect SMTP');
    }
  }

  private formatConnection(data: any): SmtpConnection {
    return {
      id: data.id,
      userId: data.user_id,
      fundId: data.fund_id,
      provider: 'smtp',
      email: data.email,
      smtpHost: data.smtp_host,
      smtpPort: data.smtp_port,
      smtpSecure: data.smtp_secure,
      smtpUsername: data.smtp_username,
      password: data.access_token,
      isActive: data.is_active,
    };
  }
}

export const smtpService = new SmtpService();

































