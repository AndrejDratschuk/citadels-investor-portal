/**
 * Email Template Controller
 * Handles HTTP requests for template operations
 */

import { FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { supabaseAdmin } from '../../common/database/supabase';
import { templateService } from './templateService';

export class TemplateController {
  /**
   * Get manager's fund ID from request
   */
  private async getFundId(request: AuthenticatedRequest): Promise<string | null> {
    if (!request.user?.id) return null;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('fund_id')
      .eq('id', request.user.id)
      .single();

    if (error || !user?.fund_id) return null;
    return user.fund_id;
  }

  /**
   * List all templates with customization status
   * GET /email/templates
   */
  async listTemplates(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = await this.getFundId(request);
    if (!fundId) {
      return reply.status(401).send({ success: false, error: 'Unauthorized or no fund found' });
    }

    try {
      const result = await templateService.listTemplates(fundId);
      return reply.send({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to list templates';
      console.error('[TemplateController] listTemplates error:', error);
      return reply.status(500).send({ success: false, error: message });
    }
  }

  /**
   * Get a single template
   * GET /email/templates/:key
   */
  async getTemplate(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = await this.getFundId(request);
    if (!fundId) {
      return reply.status(401).send({ success: false, error: 'Unauthorized or no fund found' });
    }

    const { key } = request.params as { key: string };
    if (!key) {
      return reply.status(400).send({ success: false, error: 'Template key is required' });
    }

    try {
      const template = await templateService.getTemplate(fundId, key);
      return reply.send({ success: true, data: template });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to get template';
      if (message.includes('not found')) {
        return reply.status(404).send({ success: false, error: message });
      }
      console.error('[TemplateController] getTemplate error:', error);
      return reply.status(500).send({ success: false, error: message });
    }
  }

  /**
   * Save a custom template
   * PUT /email/templates/:key
   */
  async saveTemplate(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = await this.getFundId(request);
    if (!fundId) {
      return reply.status(401).send({ success: false, error: 'Unauthorized or no fund found' });
    }

    const { key } = request.params as { key: string };
    const { subject, body } = request.body as { subject?: string; body?: string };

    if (!key) {
      return reply.status(400).send({ success: false, error: 'Template key is required' });
    }
    if (!subject || !body) {
      return reply.status(400).send({ success: false, error: 'Subject and body are required' });
    }

    try {
      const template = await templateService.saveTemplate(
        fundId,
        key,
        subject,
        body,
        request.user?.id
      );
      return reply.send({ success: true, data: template });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save template';
      if (message.includes('not found')) {
        return reply.status(404).send({ success: false, error: message });
      }
      console.error('[TemplateController] saveTemplate error:', error);
      return reply.status(500).send({ success: false, error: message });
    }
  }

  /**
   * Reset a template to default
   * DELETE /email/templates/:key
   */
  async resetTemplate(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = await this.getFundId(request);
    if (!fundId) {
      return reply.status(401).send({ success: false, error: 'Unauthorized or no fund found' });
    }

    const { key } = request.params as { key: string };
    if (!key) {
      return reply.status(400).send({ success: false, error: 'Template key is required' });
    }

    try {
      const template = await templateService.resetTemplate(fundId, key);
      return reply.send({ success: true, data: template });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to reset template';
      if (message.includes('not found')) {
        return reply.status(404).send({ success: false, error: message });
      }
      console.error('[TemplateController] resetTemplate error:', error);
      return reply.status(500).send({ success: false, error: message });
    }
  }

  /**
   * Preview a template with sample data
   * POST /email/templates/:key/preview
   */
  async previewTemplate(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = await this.getFundId(request);
    if (!fundId) {
      return reply.status(401).send({ success: false, error: 'Unauthorized or no fund found' });
    }

    const { key } = request.params as { key: string };
    const { subject, body } = request.body as { subject?: string; body?: string };

    if (!key) {
      return reply.status(400).send({ success: false, error: 'Template key is required' });
    }

    try {
      const preview = await templateService.previewTemplate(fundId, key, subject, body);
      return reply.send({ success: true, data: preview });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to preview template';
      if (message.includes('not found')) {
        return reply.status(404).send({ success: false, error: message });
      }
      console.error('[TemplateController] previewTemplate error:', error);
      return reply.status(500).send({ success: false, error: message });
    }
  }

  /**
   * Toggle template active status
   * PATCH /email/templates/:key/active
   */
  async setTemplateActive(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = await this.getFundId(request);
    if (!fundId) {
      return reply.status(401).send({ success: false, error: 'Unauthorized or no fund found' });
    }

    const { key } = request.params as { key: string };
    const { isActive } = request.body as { isActive?: boolean };

    if (!key) {
      return reply.status(400).send({ success: false, error: 'Template key is required' });
    }
    if (typeof isActive !== 'boolean') {
      return reply.status(400).send({ success: false, error: 'isActive must be a boolean' });
    }

    try {
      const template = await templateService.setTemplateActive(fundId, key, isActive);
      return reply.send({ success: true, data: template });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update template status';
      if (message.includes('not found')) {
        return reply.status(404).send({ success: false, error: message });
      }
      console.error('[TemplateController] setTemplateActive error:', error);
      return reply.status(500).send({ success: false, error: message });
    }
  }
}

export const templateController = new TemplateController();
