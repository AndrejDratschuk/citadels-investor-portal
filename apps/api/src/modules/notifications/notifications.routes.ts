import { FastifyInstance } from 'fastify';
import { notificationsController } from './notifications.controller';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth';

export async function notificationsRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  const authPreHandler = { preHandler: authMiddleware };

  // Get all notifications
  fastify.get('/', authPreHandler, async (request, reply) => {
    return notificationsController.getAll(request as AuthenticatedRequest, reply);
  });

  // Get unread count
  fastify.get('/unread-count', authPreHandler, async (request, reply) => {
    return notificationsController.getUnreadCount(request as AuthenticatedRequest, reply);
  });

  // Mark all as read
  fastify.post('/mark-all-read', authPreHandler, async (request, reply) => {
    return notificationsController.markAllAsRead(request as AuthenticatedRequest, reply);
  });

  // Mark single notification as read
  fastify.post('/:id/read', authPreHandler, async (request, reply) => {
    return notificationsController.markAsRead(request as AuthenticatedRequest, reply);
  });

  // Delete a notification
  fastify.delete('/:id', authPreHandler, async (request, reply) => {
    return notificationsController.delete(request as AuthenticatedRequest, reply);
  });
}

