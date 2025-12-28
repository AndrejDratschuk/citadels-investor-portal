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

  // Get communications
  fastify.get('/me/communications', { preHandler: investorPreHandler }, async (request, reply) => {
    return investorsController.getMyCommunications(request as any, reply);
  });

  // Mark communication as read
  fastify.patch('/me/communications/:id/read', { preHandler: investorPreHandler }, async (request, reply) => {
    return investorsController.markCommunicationRead(request as any, reply);
  });

  // Update communication tags
  fastify.patch('/me/communications/:id/tags', { preHandler: investorPreHandler }, async (request, reply) => {
    return investorsController.updateCommunicationTags(request as any, reply);
  });

  // Get fund contact info
  fastify.get('/me/fund-contact', { preHandler: investorPreHandler }, async (request, reply) => {
    return investorsController.getFundContact(request as any, reply);
  });

  // Send email to fund
  fastify.post('/me/send-email', { preHandler: investorPreHandler }, async (request, reply) => {
    return investorsController.sendEmailToFund(request as any, reply);
  });

  // Manager routes - require manager role
  const managerPreHandler = [authenticate, requireManager];

  // Get all investors for the fund
  fastify.get('/', { preHandler: managerPreHandler }, async (request, reply) => {
    return investorsController.getAll(request as any, reply);
  });

  // Create an investor for the fund
  fastify.post('/', { preHandler: managerPreHandler }, async (request, reply) => {
    return investorsController.create(request as any, reply);
  });

  // Get single investor by ID
  fastify.get('/:id', { preHandler: managerPreHandler }, async (request, reply) => {
    return investorsController.getById(request as any, reply);
  });

  // Get investor's deal investments (manager view)
  fastify.get('/:id/investments', { preHandler: managerPreHandler }, async (request, reply) => {
    return investorsController.getInvestorDeals(request as any, reply);
  });

  // Update an investor by ID
  fastify.patch('/:id', { preHandler: managerPreHandler }, async (request, reply) => {
    return investorsController.update(request as any, reply);
  });

  // Delete an investor by ID
  fastify.delete('/:id', { preHandler: managerPreHandler }, async (request, reply) => {
    return investorsController.delete(request as any, reply);
  });
}


