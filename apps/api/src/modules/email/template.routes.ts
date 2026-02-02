/**
 * Email Template Routes
 * API routes for template CRUD operations
 */

import { FastifyInstance } from 'fastify';
import { templateController } from './template.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requireManager } from '../../common/middleware/rbac.middleware';

export async function templateRoutes(fastify: FastifyInstance) {
  const managerPreHandler = [authenticate, requireManager];

  // List all templates with customization status
  fastify.get('/', { preHandler: managerPreHandler }, async (request, reply) => {
    return templateController.listTemplates(request as any, reply);
  });

  // Get a single template
  fastify.get('/:key', { preHandler: managerPreHandler }, async (request, reply) => {
    return templateController.getTemplate(request as any, reply);
  });

  // Save a custom template
  fastify.put('/:key', { preHandler: managerPreHandler }, async (request, reply) => {
    return templateController.saveTemplate(request as any, reply);
  });

  // Reset a template to default
  fastify.delete('/:key', { preHandler: managerPreHandler }, async (request, reply) => {
    return templateController.resetTemplate(request as any, reply);
  });

  // Preview a template with sample data
  fastify.post('/:key/preview', { preHandler: managerPreHandler }, async (request, reply) => {
    return templateController.previewTemplate(request as any, reply);
  });

  // Toggle template active status
  fastify.patch('/:key/active', { preHandler: managerPreHandler }, async (request, reply) => {
    return templateController.setTemplateActive(request as any, reply);
  });
}
