import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { gmailService } from './gmail.service';
import { outlookService } from './outlook.service';
import { smtpService, SmtpConfig } from './smtp.service';

// Frontend URLs
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export class EmailController {
  // ==================== Gmail OAuth Endpoints ====================

  /**
   * Start Gmail OAuth flow
   */
  async gmailConnect(request: AuthenticatedRequest, reply: FastifyReply) {
    const userId = request.user?.id;
    const fundId = request.user?.fundId;

    if (!userId || !fundId) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Create state with user info (will be passed back in callback)
    const state = Buffer.from(JSON.stringify({ userId, fundId })).toString('base64');
    
    const authUrl = gmailService.getAuthUrl(state);

    return reply.send({
      success: true,
      data: { authUrl },
    });
  }

  /**
   * Gmail OAuth callback
   */
  async gmailCallback(request: FastifyRequest, reply: FastifyReply) {
    const { code, state, error } = request.query as {
      code?: string;
      state?: string;
      error?: string;
    };

    // Handle OAuth error
    if (error) {
      return reply.redirect(`${FRONTEND_URL}/manager/settings?email_error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      return reply.redirect(`${FRONTEND_URL}/manager/settings?email_error=missing_params`);
    }

    try {
      // Decode state
      const { userId, fundId } = JSON.parse(Buffer.from(state, 'base64').toString());

      // Exchange code for tokens
      const { accessToken, refreshToken, expiresAt, email } = await gmailService.exchangeCodeForTokens(code);

      // Save connection
      await gmailService.saveConnection(userId, fundId, email, accessToken, refreshToken, expiresAt);

      // Redirect back to settings with success
      return reply.redirect(`${FRONTEND_URL}/manager/settings?email_connected=gmail&email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      console.error('Gmail callback error:', err);
      return reply.redirect(`${FRONTEND_URL}/manager/settings?email_error=${encodeURIComponent(err.message || 'connection_failed')}`);
    }
  }

  // ==================== Outlook OAuth Endpoints ====================

  /**
   * Start Outlook OAuth flow
   */
  async outlookConnect(request: AuthenticatedRequest, reply: FastifyReply) {
    const userId = request.user?.id;
    const fundId = request.user?.fundId;

    if (!userId || !fundId) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Create state with user info (will be passed back in callback)
    const state = Buffer.from(JSON.stringify({ userId, fundId })).toString('base64');
    
    const authUrl = outlookService.getAuthUrl(state);

    return reply.send({
      success: true,
      data: { authUrl },
    });
  }

  /**
   * Outlook OAuth callback
   */
  async outlookCallback(request: FastifyRequest, reply: FastifyReply) {
    const { code, state, error, error_description } = request.query as {
      code?: string;
      state?: string;
      error?: string;
      error_description?: string;
    };

    // Handle OAuth error
    if (error) {
      const errorMsg = error_description || error;
      return reply.redirect(`${FRONTEND_URL}/manager/settings?email_error=${encodeURIComponent(errorMsg)}`);
    }

    if (!code || !state) {
      return reply.redirect(`${FRONTEND_URL}/manager/settings?email_error=missing_params`);
    }

    try {
      // Decode state
      const { userId, fundId } = JSON.parse(Buffer.from(state, 'base64').toString());

      // Exchange code for tokens
      const { accessToken, refreshToken, expiresAt, email } = await outlookService.exchangeCodeForTokens(code);

      // Save connection
      await outlookService.saveConnection(userId, fundId, email, accessToken, refreshToken, expiresAt);

      // Redirect back to settings with success
      return reply.redirect(`${FRONTEND_URL}/manager/settings?email_connected=outlook&email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      console.error('Outlook callback error:', err);
      return reply.redirect(`${FRONTEND_URL}/manager/settings?email_error=${encodeURIComponent(err.message || 'connection_failed')}`);
    }
  }

  // ==================== SMTP Endpoints ====================

  /**
   * Connect SMTP account
   */
  async smtpConnect(request: AuthenticatedRequest, reply: FastifyReply) {
    const userId = request.user?.id;
    const fundId = request.user?.fundId;

    if (!userId || !fundId) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
      });
    }

    const config = request.body as SmtpConfig;

    // Validate required fields
    if (!config.email || !config.host || !config.port || !config.username || !config.password) {
      return reply.status(400).send({
        success: false,
        error: 'Missing required fields: email, host, port, username, password',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(config.email)) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid email address',
      });
    }

    try {
      // Test connection first
      const testResult = await smtpService.testConnection(config);
      if (!testResult.success) {
        return reply.status(400).send({
          success: false,
          error: testResult.error || 'Failed to connect to SMTP server. Please check your settings.',
        });
      }

      // Save connection
      const connection = await smtpService.saveConnection(userId, fundId, config);

      return reply.send({
        success: true,
        data: {
          connected: true,
          provider: 'smtp',
          email: connection.email,
        },
      });
    } catch (error: any) {
      console.error('SMTP connect error:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to save SMTP connection',
      });
    }
  }

  // ==================== Shared Endpoints ====================

  /**
   * Get current email connection status
   */
  async getConnectionStatus(request: AuthenticatedRequest, reply: FastifyReply) {
    const userId = request.user?.id;

    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Check for any active connection (Gmail, Outlook, or SMTP)
    const gmailConnection = await gmailService.getActiveConnection(userId);
    if (gmailConnection) {
      return reply.send({
        success: true,
        data: {
          connected: true,
          provider: 'gmail',
          email: gmailConnection.email,
        },
      });
    }

    const outlookConnection = await outlookService.getConnection(userId);
    if (outlookConnection) {
      return reply.send({
        success: true,
        data: {
          connected: true,
          provider: 'outlook',
          email: outlookConnection.email,
        },
      });
    }

    const smtpConnection = await smtpService.getConnection(userId);
    if (smtpConnection) {
      return reply.send({
        success: true,
        data: {
          connected: true,
          provider: 'smtp',
          email: smtpConnection.email,
        },
      });
    }

    return reply.send({
      success: true,
      data: {
        connected: false,
        provider: null,
        email: null,
      },
    });
  }

  /**
   * Disconnect email account
   */
  async disconnect(request: AuthenticatedRequest, reply: FastifyReply) {
    const userId = request.user?.id;
    const { provider } = request.body as { provider?: 'gmail' | 'outlook' | 'smtp' };

    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
      });
    }

    try {
      if (provider === 'outlook') {
        await outlookService.disconnect(userId);
      } else if (provider === 'smtp') {
        await smtpService.disconnect(userId);
      } else {
        await gmailService.disconnect(userId, 'gmail');
      }

      return reply.send({
        success: true,
        data: { message: 'Email disconnected successfully' },
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to disconnect email',
      });
    }
  }

  // ==================== Email Sending ====================

  /**
   * Send an email using connected account
   */
  async send(request: AuthenticatedRequest, reply: FastifyReply) {
    const userId = request.user?.id;
    const { to, subject, body } = request.body as {
      to: string;
      subject: string;
      body: string;
    };

    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Validate required fields
    if (!to || !subject || !body) {
      return reply.status(400).send({
        success: false,
        error: 'Missing required fields: to, subject, body',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid email address',
      });
    }

    // Check for Gmail connection first
    const gmailConnection = await gmailService.getActiveConnection(userId);
    if (gmailConnection) {
      try {
        const result = await gmailService.sendEmail(gmailConnection, to, subject, body);

        if (!result.success) {
          return reply.status(500).send({
            success: false,
            error: result.error || 'Failed to send email',
          });
        }

        return reply.send({
          success: true,
          data: {
            messageId: result.messageId,
            message: 'Email sent successfully',
            from: gmailConnection.email,
          },
        });
      } catch (error: any) {
        console.error('Gmail send error:', error);
        return reply.status(500).send({
          success: false,
          error: error.message || 'Failed to send email',
        });
      }
    }

    // Check for Outlook connection
    const outlookConnection = await outlookService.getConnection(userId);
    if (outlookConnection) {
      try {
        const result = await outlookService.sendEmail(outlookConnection, to, subject, body);

        if (!result.success) {
          return reply.status(500).send({
            success: false,
            error: result.error || 'Failed to send email',
          });
        }

        return reply.send({
          success: true,
          data: {
            messageId: result.messageId,
            message: 'Email sent successfully',
            from: outlookConnection.email,
          },
        });
      } catch (error: any) {
        console.error('Outlook send error:', error);
        return reply.status(500).send({
          success: false,
          error: error.message || 'Failed to send email',
        });
      }
    }

    // Check for SMTP connection
    const smtpConnection = await smtpService.getConnection(userId);
    if (smtpConnection) {
      try {
        const result = await smtpService.sendEmail(smtpConnection, to, subject, body);

        if (!result.success) {
          return reply.status(500).send({
            success: false,
            error: result.error || 'Failed to send email',
          });
        }

        return reply.send({
          success: true,
          data: {
            messageId: result.messageId,
            message: 'Email sent successfully',
            from: smtpConnection.email,
          },
        });
      } catch (error: any) {
        console.error('SMTP send error:', error);
        return reply.status(500).send({
          success: false,
          error: error.message || 'Failed to send email',
        });
      }
    }

    // No connection found
    return reply.status(400).send({
      success: false,
      error: 'No email account connected. Please connect your email account in Settings.',
    });
  }
}

export const emailController = new EmailController();
