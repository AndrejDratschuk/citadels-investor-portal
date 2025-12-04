import { FastifyInstance } from 'fastify';
import { InvestorsController } from './investors.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requireInvestor, requireManager } from '../../common/middleware/rbac.middleware';

const investorsController = new InvestorsController();

export async function investorsRoutes(fastify: FastifyInstance) {
  // Investor routes - require investor role
  const investorPreHandler = [authenticate, requireInvestor];

  // Get current investor profile
  fastify.get('/me', { preHandler: investorPreHandler }, async (request, reply) => {
    return investorsController.getMe(request as any, reply);
  });

  // Update current investor profile
  fastify.patch('/me', { preHandler: investorPreHandler }, async (request, reply) => {
    return investorsController.updateMe(request as any, reply);
  });

  // Get dashboard stats
  fastify.get('/me/stats', { preHandler: investorPreHandler }, async (request, reply) => {
    return investorsController.getMyStats(request as any, reply);
  });

  // Get investments
  fastify.get('/me/investments', { preHandler: investorPreHandler }, async (request, reply) => {
    return investorsController.getMyInvestments(request as any, reply);
  });

  // Get documents
  fastify.get('/me/documents', { preHandler: investorPreHandler }, async (request, reply) => {
    return investorsController.getMyDocuments(request as any, reply);
  });

  // Get capital calls
  fastify.get('/me/capital-calls', { preHandler: investorPreHandler }, async (request, reply) => {
    return investorsController.getMyCapitalCalls(request as any, reply);
  });

  // Manager routes - require manager role
  const managerPreHandler = [authenticate, requireManager];

  // Get all investors for the fund
  fastify.get('/', { preHandler: managerPreHandler }, async (request, reply) => {
    return investorsController.getAll(request as any, reply);
  });

  // Get single investor by ID
  fastify.get('/:id', { preHandler: managerPreHandler }, async (request, reply) => {
    return investorsController.getById(request as any, reply);
  });
}


