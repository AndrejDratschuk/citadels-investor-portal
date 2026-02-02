import { FastifyInstance } from 'fastify';
import { docuSignController } from './docusign.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requireManager } from '../../common/middleware/rbac.middleware';

export async function docuSignRoutes(fastify: FastifyInstance) {
  const managerPreHandler = [authenticate, requireManager];

  // Check if DocuSign is configured (includes OAuth status)
  fastify.get('/status', { preHandler: managerPreHandler }, async (request, reply) => {
    return docuSignController.getStatus(request as any, reply);
  });

  // ==================== OAuth Flow ====================
  
  // Start OAuth flow - get authorization URL
  fastify.get('/oauth/connect', { preHandler: managerPreHandler }, async (request, reply) => {
    return docuSignController.oauthConnect(request as any, reply);
  });

  // OAuth callback - NO AUTH (DocuSign redirects here)
  fastify.get('/callback', async (request, reply) => {
    return docuSignController.oauthCallback(request, reply);
  });

  // ==================== Legacy JWT Flow ====================

  // Connect DocuSign with credentials (legacy JWT Grant flow)
  fastify.post('/connect', { preHandler: managerPreHandler }, async (request, reply) => {
    return docuSignController.connect(request as any, reply);
  });

  // Disconnect DocuSign (works for both OAuth and JWT)
  fastify.post('/disconnect', { preHandler: managerPreHandler }, async (request, reply) => {
    return docuSignController.disconnect(request as any, reply);
  });

  // ==================== DocuSign Operations ====================

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

