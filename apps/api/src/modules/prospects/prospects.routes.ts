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

  // Post-meeting: Mark as Proceed (ready to invest)
  fastify.post('/:id/proceed', { preHandler }, async (request, reply) => {
    return prospectsController.markProceed(request as any, reply);
  });

  // Post-meeting: Mark as Considering (needs time to decide)
  fastify.post('/:id/considering', { preHandler }, async (request, reply) => {
    return prospectsController.markConsidering(request as any, reply);
  });

  // Post-meeting: Mark as Not a Fit
  fastify.post('/:id/not-fit', { preHandler }, async (request, reply) => {
    return prospectsController.markNotFit(request as any, reply);
  });

  // KYC: Mark as Not Eligible
  fastify.post('/:id/not-eligible', { preHandler }, async (request, reply) => {
    return prospectsController.markNotEligible(request as any, reply);
  });

  // Public endpoint: Ready to Invest (from nurture email)
  // No auth required - redirects to account creation
  fastify.get('/:id/ready-to-invest', async (request, reply) => {
    return prospectsController.readyToInvest(request as any, reply);
  });
}

