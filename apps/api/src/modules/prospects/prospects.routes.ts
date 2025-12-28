/**
 * Prospects Routes
 * API routes for managing prospects/pipeline
 */

import { FastifyInstance } from 'fastify';
import { ProspectsController, prospectsController } from './prospects.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requireManager } from '../../common/middleware/rbac.middleware';

export async function prospectsRoutes(fastify: FastifyInstance): Promise<void> {
  // All prospect routes require manager role
  const preHandler = [authenticate, requireManager];

  // Send KYC form to a new prospect
  fastify.post('/send-kyc', { preHandler }, async (request, reply) => {
    return prospectsController.sendKYC(request as any, reply);
  });

  // Get all prospects for the fund
  fastify.get('/', { preHandler }, async (request, reply) => {
    return prospectsController.getAll(request as any, reply);
  });

  // Get pipeline statistics
  fastify.get('/stats', { preHandler }, async (request, reply) => {
    return prospectsController.getStats(request as any, reply);
  });

  // Get a single prospect by ID
  fastify.get('/:id', { preHandler }, async (request, reply) => {
    return prospectsController.getById(request as any, reply);
  });

  // Update prospect status
  fastify.patch('/:id/status', { preHandler }, async (request, reply) => {
    return prospectsController.updateStatus(request as any, reply);
  });

  // Update prospect notes
  fastify.patch('/:id/notes', { preHandler }, async (request, reply) => {
    return prospectsController.updateNotes(request as any, reply);
  });

  // Approve prospect documents
  fastify.post('/:id/approve-documents', { preHandler }, async (request, reply) => {
    return prospectsController.approveDocuments(request as any, reply);
  });

  // Reject prospect documents
  fastify.post('/:id/reject-documents', { preHandler }, async (request, reply) => {
    return prospectsController.rejectDocuments(request as any, reply);
  });

  // Convert prospect to investor
  fastify.post('/:id/convert', { preHandler }, async (request, reply) => {
    return prospectsController.convertToInvestor(request as any, reply);
  });

  // Send reminder to prospect
  fastify.post('/:id/send-reminder', { preHandler }, async (request, reply) => {
    return prospectsController.sendReminder(request as any, reply);
  });

  // Send DocuSign to prospect
  fastify.post('/:id/send-docusign', { preHandler }, async (request, reply) => {
    return prospectsController.sendDocuSign(request as any, reply);
  });
}

