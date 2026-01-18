import { FastifyInstance } from 'fastify';
import { capitalCallsController } from './capital-calls.controller';
import { authenticate, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { requireManager } from '../../common/middleware/rbac.middleware';
import { runCapitalCallSummaryCron } from './capitalCallSummaryCron';

export async function capitalCallsRoutes(fastify: FastifyInstance) {
  const managerPreHandler = [authenticate, requireManager];

  // Get all capital calls
  fastify.get('/', { preHandler: managerPreHandler }, async (request, reply) => {
    return capitalCallsController.getAll(request as AuthenticatedRequest, reply);
  });

  // Get a single capital call
  fastify.get('/:id', { preHandler: managerPreHandler }, async (request, reply) => {
    return capitalCallsController.getById(request as AuthenticatedRequest, reply);
  });

  // Create a new capital call
  fastify.post('/', { preHandler: managerPreHandler }, async (request, reply) => {
    return capitalCallsController.create(request as AuthenticatedRequest, reply);
  });

  // Get capital call items for a specific capital call
  fastify.get('/:id/items', { preHandler: managerPreHandler }, async (request, reply) => {
    return capitalCallsController.getItems(request as AuthenticatedRequest, reply);
  });

  // Confirm wire received for a capital call item
  fastify.post('/:id/items/:itemId/confirm-wire', { preHandler: managerPreHandler }, async (request, reply) => {
    return capitalCallsController.confirmWire(request as AuthenticatedRequest, reply);
  });

  // Report wire issue for a capital call item
  fastify.post('/:id/items/:itemId/report-issue', { preHandler: managerPreHandler }, async (request, reply) => {
    return capitalCallsController.reportWireIssue(request as AuthenticatedRequest, reply);
  });

  // Admin endpoint to trigger capital call summary cron
  // Can be called by external scheduler (Railway cron, Vercel cron, etc.)
  // Protected by API key for security
  fastify.post('/admin/run-summary-cron', async (request, reply) => {
    // Verify admin API key
    const authHeader = request.headers.authorization;
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey) {
      return reply.status(503).send({ error: 'Admin API key not configured' });
    }

    if (authHeader !== `Bearer ${adminKey}`) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    try {
      const timestamp = new Date();
      await runCapitalCallSummaryCron(timestamp);
      return reply.send({ success: true, timestamp: timestamp.toISOString() });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[CapCallSummaryCron] Admin trigger failed:', message);
      return reply.status(500).send({ error: message });
    }
  });
}

