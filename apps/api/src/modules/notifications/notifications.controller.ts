import { FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { notificationsService } from './notifications.service';

class NotificationsController {
  /**
   * Get all notifications for the current user
   */
  async getAll(request: AuthenticatedRequest, reply: FastifyReply) {
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const limit = request.query && typeof request.query === 'object' && 'limit' in request.query
      ? parseInt(request.query.limit as string, 10)
      : 50;

    const unreadOnly = request.query && typeof request.query === 'object' && 'unreadOnly' in request.query
      ? request.query.unreadOnly === 'true'
      : false;

    try {
      const notifications = await notificationsService.getAll(userId, { limit, unreadOnly });
      return reply.send(notifications);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      return reply.status(500).send({ error: 'Failed to fetch notifications' });
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(request: AuthenticatedRequest, reply: FastifyReply) {
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    try {
      const count = await notificationsService.getUnreadCount(userId);
      return reply.send({ count });
    } catch (error: any) {
      console.error('Error fetching unread count:', error);
      return reply.status(500).send({ error: 'Failed to fetch unread count' });
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(request: AuthenticatedRequest, reply: FastifyReply) {
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const { id } = request.params as { id: string };

    try {
      const notification = await notificationsService.markAsRead(userId, id);
      return reply.send(notification);
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      return reply.status(500).send({ error: 'Failed to mark notification as read' });
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(request: AuthenticatedRequest, reply: FastifyReply) {
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    try {
      await notificationsService.markAllAsRead(userId);
      return reply.send({ success: true });
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      return reply.status(500).send({ error: 'Failed to mark all notifications as read' });
    }
  }

  /**
   * Delete a notification
   */
  async delete(request: AuthenticatedRequest, reply: FastifyReply) {
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const { id } = request.params as { id: string };

    try {
      await notificationsService.delete(userId, id);
      return reply.send({ success: true });
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      return reply.status(500).send({ error: 'Failed to delete notification' });
    }
  }
}

export const notificationsController = new NotificationsController();

