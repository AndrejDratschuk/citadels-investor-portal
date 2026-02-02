import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { supabaseAdmin } from '../../common/database/supabase';
import { docuSignService } from './docusign.service';

// Frontend URL for redirects
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export class DocuSignController {
  /**
   * Check if DocuSign is configured for the manager's fund
   * Returns auth type and connection details
   */
  async getStatus(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    // Get manager's fund
    const { data: manager, error: managerError } = await supabaseAdmin
      .from('users')
      .select('fund_id')
      .eq('id', request.user.id)
      .single();

    if (managerError || !manager?.fund_id) {
      return reply.status(404).send({ success: false, error: 'Fund not found' });
    }

    const status = await docuSignService.getStatusForFund(manager.fund_id);

    return reply.send({
      success: true,
      data: {
        configured: status.configured,
        authType: status.authType,
        email: status.email,
        oauthSupported: docuSignService.isOAuthConfigured(),
      },
    });
  }

  // ==================== OAuth Flow ====================

  /**
   * Start DocuSign OAuth flow
   * Returns the authorization URL to redirect the user to
   */
  async oauthConnect(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    // Check if OAuth is configured
    if (!docuSignService.isOAuthConfigured()) {
      return reply.status(400).send({
        success: false,
        error: 'DocuSign OAuth is not configured. Please contact support.',
      });
    }

    // Get manager's fund
    const { data: manager, error: managerError } = await supabaseAdmin
      .from('users')
      .select('fund_id')
      .eq('id', request.user.id)
      .single();

    if (managerError || !manager?.fund_id) {
      return reply.status(404).send({ success: false, error: 'Fund not found' });
    }

    // Create state with user and fund info (will be passed back in callback)
    const state = Buffer.from(JSON.stringify({
      userId: request.user.id,
      fundId: manager.fund_id,
    })).toString('base64');

    const authUrl = docuSignService.getOAuthUrl(state);

    return reply.send({
      success: true,
      data: { authUrl },
    });
  }

  /**
   * DocuSign OAuth callback
   * Handles the redirect from DocuSign after user authorization
   */
  async oauthCallback(request: FastifyRequest, reply: FastifyReply) {
    const { code, state, error, error_description } = request.query as {
      code?: string;
      state?: string;
      error?: string;
      error_description?: string;
    };

    // Handle OAuth error
    if (error) {
      const errorMsg = error_description || error;
      console.error('[DocuSign OAuth] Error from DocuSign:', errorMsg);
      return reply.redirect(`${FRONTEND_URL}/manager/settings?docusign_error=${encodeURIComponent(errorMsg)}`);
    }

    if (!code || !state) {
      return reply.redirect(`${FRONTEND_URL}/manager/settings?docusign_error=missing_params`);
    }

    try {
      // Decode state to get user and fund info
      const { userId, fundId } = JSON.parse(Buffer.from(state, 'base64').toString());

      if (!userId || !fundId) {
        throw new Error('Invalid state parameter');
      }

      // Exchange code for tokens
      const tokens = await docuSignService.exchangeCodeForTokens(code);

      // Get user info from DocuSign
      const userInfo = await docuSignService.getUserInfo(tokens.accessToken);

      // Save OAuth credentials for the fund
      const { email, accountId } = await docuSignService.connectOAuth(fundId, tokens, userInfo);

      console.log(`[DocuSign OAuth] Successfully connected for fund ${fundId}, email: ${email}`);

      // Redirect back to settings with success
      return reply.redirect(`${FRONTEND_URL}/manager/settings?docusign_connected=true&docusign_email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      console.error('[DocuSign OAuth] Callback error:', err);
      return reply.redirect(`${FRONTEND_URL}/manager/settings?docusign_error=${encodeURIComponent(err.message || 'connection_failed')}`);
    }
  }

  // ==================== Legacy JWT Flow ====================

  /**
   * Connect DocuSign for the manager's fund
   */
  async connect(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { integrationKey, accountId, userId, rsaPrivateKey } = request.body as {
      integrationKey?: string;
      accountId?: string;
      userId?: string;
      rsaPrivateKey?: string;
    };

    if (!integrationKey || !accountId || !userId || !rsaPrivateKey) {
      return reply.status(400).send({
        success: false,
        error: 'Missing required fields: integrationKey, accountId, userId, rsaPrivateKey',
      });
    }

    // Get manager's fund
    const { data: manager, error: managerError } = await supabaseAdmin
      .from('users')
      .select('fund_id')
      .eq('id', request.user.id)
      .single();

    if (managerError || !manager?.fund_id) {
      return reply.status(404).send({ success: false, error: 'Fund not found' });
    }

    try {
      await docuSignService.connectForFund(manager.fund_id, {
        integrationKey,
        accountId,
        userId,
        rsaPrivateKey,
      });

      return reply.send({
        success: true,
        data: { message: 'DocuSign connected successfully' },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to connect DocuSign';
      console.error('[DocuSign] Connect error:', error);
      return reply.status(400).send({ success: false, error: message });
    }
  }

  /**
   * Disconnect DocuSign for the manager's fund
   */
  async disconnect(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    // Get manager's fund
    const { data: manager, error: managerError } = await supabaseAdmin
      .from('users')
      .select('fund_id')
      .eq('id', request.user.id)
      .single();

    if (managerError || !manager?.fund_id) {
      return reply.status(404).send({ success: false, error: 'Fund not found' });
    }

    try {
      await docuSignService.disconnectForFund(manager.fund_id);

      return reply.send({
        success: true,
        data: { message: 'DocuSign disconnected successfully' },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to disconnect DocuSign';
      console.error('[DocuSign] Disconnect error:', error);
      return reply.status(500).send({ success: false, error: message });
    }
  }

  /**
   * List available templates for the manager's fund
   */
  async listTemplates(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    // Get manager's fund
    const { data: manager, error: managerError } = await supabaseAdmin
      .from('users')
      .select('fund_id')
      .eq('id', request.user.id)
      .single();

    if (managerError || !manager?.fund_id) {
      return reply.status(404).send({ success: false, error: 'Fund not found' });
    }

    const isConfigured = await docuSignService.isConfiguredForFund(manager.fund_id);
    if (!isConfigured) {
      return reply.status(400).send({
        success: false,
        error: 'DocuSign is not configured. Please connect DocuSign in Settings > Integrations.',
      });
    }

    try {
      const templates = await docuSignService.listTemplatesForFund(manager.fund_id);
      return reply.send({
        success: true,
        data: templates,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch templates';
      return reply.status(500).send({ success: false, error: message });
    }
  }

  /**
   * Send document for signature
   */
  async sendEnvelope(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const {
      templateId,
      investorId,
      subject,
      emailBody,
    } = request.body as {
      templateId: string;
      investorId: string;
      subject?: string;
      emailBody?: string;
    };

    if (!templateId || !investorId) {
      return reply.status(400).send({
        success: false,
        error: 'Missing required fields: templateId, investorId',
      });
    }

    // Get manager's fund
    const { data: manager, error: managerError } = await supabaseAdmin
      .from('users')
      .select('fund_id')
      .eq('id', request.user.id)
      .single();

    if (managerError || !manager?.fund_id) {
      return reply.status(404).send({ success: false, error: 'Fund not found' });
    }

    const isConfigured = await docuSignService.isConfiguredForFund(manager.fund_id);
    if (!isConfigured) {
      return reply.status(400).send({
        success: false,
        error: 'DocuSign is not configured. Please connect DocuSign in Settings > Integrations.',
      });
    }

    // Get investor info
    const { data: investor, error: investorError } = await supabaseAdmin
      .from('investors')
      .select('id, email, first_name, last_name')
      .eq('id', investorId)
      .eq('fund_id', manager.fund_id)
      .single();

    if (investorError || !investor) {
      return reply.status(404).send({ success: false, error: 'Investor not found' });
    }

    try {
      const result = await docuSignService.sendEnvelope(
        {
          templateId,
          investorId: investor.id,
          investorEmail: investor.email,
          investorName: `${investor.first_name} ${investor.last_name}`,
          subject,
          emailBody,
        },
        manager.fund_id
      );

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send envelope';
      console.error('[DocuSign] Send envelope error:', error);
      return reply.status(500).send({ success: false, error: message });
    }
  }

  /**
   * Handle DocuSign Connect webhook
   */
  async handleWebhook(request: AuthenticatedRequest, reply: FastifyReply) {
    // DocuSign sends XML by default, but we can configure JSON
    const payload = request.body as {
      envelopeId?: string;
      status?: string;
      completedDateTime?: string;
    };

    if (!payload.envelopeId || !payload.status) {
      return reply.status(400).send({ error: 'Invalid webhook payload' });
    }

    try {
      await docuSignService.handleWebhook({
        envelopeId: payload.envelopeId,
        status: payload.status,
        completedDateTime: payload.completedDateTime,
      });

      return reply.send({ success: true });
    } catch (error: unknown) {
      console.error('[DocuSign] Webhook error:', error);
      return reply.status(500).send({ error: 'Webhook processing failed' });
    }
  }
}

export const docuSignController = new DocuSignController();

