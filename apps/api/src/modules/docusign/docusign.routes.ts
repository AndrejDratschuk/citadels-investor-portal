import { FastifyInstance } from 'fastify';
import { docuSignController } from './docusign.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requireManager } from '../../common/middleware/rbac.middleware';

export async function docuSignRoutes(fastify: FastifyInstance) {
  const managerPreHandler = [authenticate, requireManager];

  // Check if DocuSign is configured
  fastify.get('/status', { preHandler: managerPreHandler }, async (request, reply) => {
    return docuSignController.getStatus(request as any, reply);
  });

  // Connect DocuSign with credentials
  fastify.post('/connect', { preHandler: managerPreHandler }, async (request, reply) => {
    return docuSignController.connect(request as any, reply);
  });

  // Disconnect DocuSign
  fastify.post('/disconnect', { preHandler: managerPreHandler }, async (request, reply) => {
    return docuSignController.disconnect(request as any, reply);
  });

  // List available templates
  fastify.get('/templates', { preHandler: managerPreHandler }, async (request, reply) => {
    return docuSignController.listTemplates(request as any, reply);
  });

  // Send document for signature
  fastify.post('/send', { preHandler: managerPreHandler }, async (request, reply) => {
    return docuSignController.sendEnvelope(request as any, reply);
  });

  // DocuSign Connect webhook (no auth - DocuSign sends these)
  fastify.post('/webhook', async (request, reply) => {
    return docuSignController.handleWebhook(request as any, reply);
  });
}

