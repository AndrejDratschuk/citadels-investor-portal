import { FastifyInstance } from 'fastify';
import { emailController } from './email.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requireManager } from '../../common/middleware/rbac.middleware';

export async function emailRoutes(fastify: FastifyInstance) {
  const managerPreHandler = [authenticate, requireManager];

  // ==================== Gmail OAuth Routes ====================
  
  // Start Gmail OAuth flow
  fastify.get('/gmail/connect', { preHandler: managerPreHandler }, async (request, reply) => {
    return emailController.gmailConnect(request as any, reply);
  });

  // Gmail OAuth callback (no auth - Google redirects here)
  fastify.get('/gmail/callback', async (request, reply) => {
    return emailController.gmailCallback(request, reply);
  });

  // ==================== Outlook OAuth Routes ====================

  // Start Outlook OAuth flow
  fastify.get('/outlook/connect', { preHandler: managerPreHandler }, async (request, reply) => {
    return emailController.outlookConnect(request as any, reply);
  });

  // Outlook OAuth callback (no auth - Microsoft redirects here)
  fastify.get('/outlook/callback', async (request, reply) => {
    return emailController.outlookCallback(request, reply);
  });

  // ==================== Shared Routes ====================

  // Get connection status
  fastify.get('/status', { preHandler: managerPreHandler }, async (request, reply) => {
    return emailController.getConnectionStatus(request as any, reply);
  });

  // Disconnect email account
  fastify.post('/disconnect', { preHandler: managerPreHandler }, async (request, reply) => {
    return emailController.disconnect(request as any, reply);
  });

  // ==================== Email Sending ====================
  
  // Send an email
  fastify.post('/send', { preHandler: managerPreHandler }, async (request, reply) => {
    return emailController.send(request as any, reply);
  });
}
