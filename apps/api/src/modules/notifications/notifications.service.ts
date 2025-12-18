import { supabaseAdmin } from '../../common/database/supabase';

export interface Notification {
  id: string;
  userId: string;
  fundId: string | null;
  type: string;
  title: string;
  message: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  metadata: Record<string, any>;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface CreateNotificationInput {
  userId: string;
  fundId?: string;
  type: string;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: Record<string, any>;
}

class NotificationsService {
  /**
   * Get all notifications for a user
   */
  async getAll(userId: string, options?: { limit?: number; unreadOnly?: boolean }): Promise<Notification[]> {
    console.log('[NotificationsService] Getting notifications for user:', userId, 'options:', options);
    
    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[NotificationsService] Error fetching notifications:', error);
      console.error('[NotificationsService] Error details:', JSON.stringify(error, null, 2));
      // Return empty array instead of throwing to prevent blocking the UI
      return [];
    }

    console.log('[NotificationsService] Found', data?.length || 0, 'notifications');
    return (data || []).map(this.formatNotification);
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    console.log('[NotificationsService] Getting unread count for user:', userId);
    
    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('[NotificationsService] Error fetching unread count:', error);
      console.error('[NotificationsService] Error details:', JSON.stringify(error, null, 2));
      // Don't throw, return 0 instead to prevent blocking the UI
      return 0;
    }

    console.log('[NotificationsService] Unread count:', count);
    return count || 0;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<Notification> {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }

    return this.formatNotification(data);
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  /**
   * Create a notification
   */
  async create(input: CreateNotificationInput): Promise<Notification> {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: input.userId,
        fund_id: input.fundId || null,
        type: input.type,
        title: input.title,
        message: input.message,
        related_entity_type: input.relatedEntityType || null,
        related_entity_id: input.relatedEntityId || null,
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }

    return this.formatNotification(data);
  }

  /**
   * Delete a notification
   */
  async delete(userId: string, notificationId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Failed to delete notification');
    }
  }

  /**
   * Delete all read notifications older than a certain number of days
   */
  async cleanupOldNotifications(userId: string, daysOld: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('is_read', true)
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      console.error('Error cleaning up old notifications:', error);
    }
  }

  private formatNotification(data: any): Notification {
    return {
      id: data.id,
      userId: data.user_id,
      fundId: data.fund_id,
      type: data.type,
      title: data.title,
      message: data.message,
      relatedEntityType: data.related_entity_type,
      relatedEntityId: data.related_entity_id,
      metadata: data.metadata || {},
      isRead: data.is_read,
      readAt: data.read_at,
      createdAt: data.created_at,
    };
  }
}

export const notificationsService = new NotificationsService();



