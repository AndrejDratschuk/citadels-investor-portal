import { FastifyInstance } from 'fastify';
import { KYCController } from './kyc.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requireManager } from '../../common/middleware/rbac.middleware';

const kycController = new KYCController();

export async function kycRoutes(fastify: FastifyInstance) {
  // ==================== Public Routes ====================
  
  // Start a new KYC application (no auth required - public form)
  fastify.post('/start', async (request, reply) => {
    return kycController.start(request, reply);
  });

  // Get KYC application by ID (no auth required - using ID as token)
  fastify.get('/:id', async (request, reply) => {
    return kycController.getById(request, reply);
  });

  // Update KYC application (autosave)
  fastify.patch('/:id', async (request, reply) => {
    return kycController.update(request, reply);
  });

  // Submit KYC application
  fastify.post('/:id/submit', async (request, reply) => {
    return kycController.submit(request, reply);
  });

  // Update Calendly event
  fastify.post('/:id/calendly', async (request, reply) => {
    return kycController.updateCalendly(request, reply);
  });

  // ==================== Manager Routes ====================
  const managerPreHandler = [authenticate, requireManager];

  // Get all KYC applications for the fund
  fastify.get('/', { preHandler: managerPreHandler }, async (request, reply) => {
    return kycController.getAll(request as any, reply);
  });

  // Approve a KYC application
  fastify.patch('/:id/approve', { preHandler: managerPreHandler }, async (request, reply) => {
    return kycController.approve(request as any, reply);
  });

  // Reject a KYC application
  fastify.patch('/:id/reject', { preHandler: managerPreHandler }, async (request, reply) => {
    return kycController.reject(request as any, reply);
  });
}

