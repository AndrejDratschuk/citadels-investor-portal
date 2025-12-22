import { FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { supabaseAdmin } from '../../common/database/supabase';
import { docuSignService } from './docusign.service';

export class DocuSignController {
  /**
   * Check if DocuSign is configured for the manager's fund
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

    const configured = await docuSignService.isConfiguredForFund(manager.fund_id);

    return reply.send({
      success: true,
      data: {
        configured,
      },
    });
  }

  /**
   * Connect DocuSign for the manager's fund
   */
  async connect(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { integrationKey, accountId, userId } = request.body as {
      integrationKey?: string;
      accountId?: string;
      userId?: string;
    };

    if (!integrationKey || !accountId || !userId) {
      return reply.status(400).send({
        success: false,
        error: 'Missing required fields: integrationKey, accountId, userId',
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

