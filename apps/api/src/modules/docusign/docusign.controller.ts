import { FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { supabaseAdmin } from '../../common/database/supabase';
import { docuSignService } from './docusign.service';

export class DocuSignController {
  /**
   * Check if DocuSign is configured
   */
  async getStatus(_request: AuthenticatedRequest, reply: FastifyReply) {
    return reply.send({
      success: true,
      data: {
        configured: docuSignService.isConfigured(),
      },
    });
  }

  /**
   * List available templates
   */
  async listTemplates(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    if (!docuSignService.isConfigured()) {
      return reply.status(400).send({
        success: false,
        error: 'DocuSign is not configured',
      });
    }

    try {
      const templates = await docuSignService.listTemplates();
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

    if (!docuSignService.isConfigured()) {
      return reply.status(400).send({
        success: false,
        error: 'DocuSign is not configured',
      });
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

