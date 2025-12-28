import { FastifyInstance } from 'fastify';
import { documentsController } from './documents.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requireManager } from '../../common/middleware/rbac.middleware';

export async function documentsRoutes(fastify: FastifyInstance) {
  const managerPreHandler = [authenticate, requireManager];

  // Get all documents
  fastify.get('/', { preHandler: managerPreHandler }, async (request, reply) => {
    return documentsController.getAll(request as any, reply);
  });

  // Get documents grouped by deal
  fastify.get('/by-deal', { preHandler: managerPreHandler }, async (request, reply) => {
    return documentsController.getByDeal(request as any, reply);
  });

  // Get documents grouped by investor
  fastify.get('/by-investor', { preHandler: managerPreHandler }, async (request, reply) => {
    return documentsController.getByInvestor(request as any, reply);
  });

  // Get documents for a specific deal
  fastify.get('/deal/:dealId', { preHandler: managerPreHandler }, async (request, reply) => {
    return documentsController.getDocumentsForDeal(request as any, reply);
  });

  // Get documents for a specific investor
  fastify.get('/investor/:investorId', { preHandler: managerPreHandler }, async (request, reply) => {
    return documentsController.getDocumentsForInvestor(request as any, reply);
  });

  // Create document
  fastify.post('/', { preHandler: managerPreHandler }, async (request, reply) => {
    return documentsController.create(request as any, reply);
  });

  // Upload file
  fastify.post('/upload', { preHandler: managerPreHandler }, async (request, reply) => {
    return documentsController.uploadFile(request as any, reply);
  });

  // Delete document
  fastify.delete('/:id', { preHandler: managerPreHandler }, async (request, reply) => {
    return documentsController.delete(request as any, reply);
  });

  // ============================================================
  // Validation Documents Routes
  // ============================================================

  // Get validation documents (manager only)
  fastify.get('/validation', { preHandler: managerPreHandler }, async (request, reply) => {
    return documentsController.getValidationDocuments(request as any, reply);
  });

  // Approve validation document (manager only)
  fastify.post('/:id/approve', { preHandler: managerPreHandler }, async (request, reply) => {
    return documentsController.approveDocument(request as any, reply);
  });

  // Reject validation document (manager only)
  fastify.post('/:id/reject', { preHandler: managerPreHandler }, async (request, reply) => {
    return documentsController.rejectDocument(request as any, reply);
  });

  // Get my validation documents (investor only - authenticated)
  fastify.get('/my-validation', { preHandler: [authenticate] }, async (request, reply) => {
    return documentsController.getMyValidationDocuments(request as any, reply);
  });

  // Upload validation document (investor only - authenticated)
  fastify.post('/my-validation/upload', { preHandler: [authenticate] }, async (request, reply) => {
    return documentsController.uploadInvestorDocument(request as any, reply);
  });
}
















