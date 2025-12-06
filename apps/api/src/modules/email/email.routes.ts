import { FastifyInstance } from 'fastify';
import { emailController } from './email.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requireManager } from '../../common/middleware/rbac.middleware';

export async function emailRoutes(fastify: FastifyInstance) {
  // Only managers can send emails
  const managerPreHandler = [authenticate, requireManager];

  // Send an email
  fastify.post('/send', { preHandler: managerPreHandler }, async (request, reply) => {
    return emailController.send(request as any, reply);
  });
}

