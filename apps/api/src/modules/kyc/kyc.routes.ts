import { FastifyInstance } from 'fastify';
import { KYCController } from './kyc.controller';

const kycController = new KYCController();

export async function kycRoutes(fastify: FastifyInstance) {
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
}

