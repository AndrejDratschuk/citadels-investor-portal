import { FastifyInstance } from 'fastify';
import { InvestorsController } from './investors.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requireInvestor } from '../../common/middleware/rbac.middleware';

const investorsController = new InvestorsController();

export async function investorsRoutes(fastify: FastifyInstance) {
  // All routes require authentication and investor role
  const preHandler = [authenticate, requireInvestor];

  // Get current investor profile
  fastify.get('/me', { preHandler }, async (request, reply) => {
    return investorsController.getMe(request as any, reply);
  });

  // Update current investor profile
  fastify.patch('/me', { preHandler }, async (request, reply) => {
    return investorsController.updateMe(request as any, reply);
  });

  // Get dashboard stats
  fastify.get('/me/stats', { preHandler }, async (request, reply) => {
    return investorsController.getMyStats(request as any, reply);
  });

  // Get investments
  fastify.get('/me/investments', { preHandler }, async (request, reply) => {
    return investorsController.getMyInvestments(request as any, reply);
  });

  // Get documents
  fastify.get('/me/documents', { preHandler }, async (request, reply) => {
    return investorsController.getMyDocuments(request as any, reply);
  });

  // Get capital calls
  fastify.get('/me/capital-calls', { preHandler }, async (request, reply) => {
    return investorsController.getMyCapitalCalls(request as any, reply);
  });
}


