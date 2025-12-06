import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { gmailService } from './gmail.service';

// Frontend URLs
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export class EmailController {
  // ==================== OAuth Endpoints ====================

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

    const connection = await gmailService.getActiveConnection(userId);

    return reply.send({
      success: true,
      data: {
        connected: !!connection,
        provider: connection?.provider || null,
        email: connection?.email || null,
      },
    });
  }

  /**
   * Disconnect email account
   */
  async disconnect(request: AuthenticatedRequest, reply: FastifyReply) {
    const userId = request.user?.id;
    const { provider } = request.body as { provider?: 'gmail' | 'outlook' };

    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
      });
    }

    try {
      await gmailService.disconnect(userId, provider || 'gmail');

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

    // Get connected email account
    const connection = await gmailService.getActiveConnection(userId);

    if (!connection) {
      return reply.status(400).send({
        success: false,
        error: 'No email account connected. Please connect your Gmail or Outlook account in Settings.',
      });
    }

    try {
      const result = await gmailService.sendEmail(connection, to, subject, body);

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
          from: connection.email,
        },
      });
    } catch (error: any) {
      console.error('Email send error:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to send email',
      });
    }
  }
}

export const emailController = new EmailController();
