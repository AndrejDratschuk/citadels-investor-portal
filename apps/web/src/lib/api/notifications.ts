import { api } from './client';

export interface Notification {
  id: string;
  userId: string;
  fundId: string | null;
  type: string;
  title: string;
  message: string;
  relatedEntityType: 'investor' | 'deal' | 'capital_call' | 'document' | 'communication' | 'kyc_application' | null;
  relatedEntityId: string | null;
  metadata: Record<string, any>;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export const notificationsApi = {
  /**
   * Get all notifications
   */
  getAll: async (options?: { limit?: number; unreadOnly?: boolean }): Promise<Notification[]> => {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.unreadOnly) params.set('unreadOnly', 'true');
    
    const queryString = params.toString();
    const url = queryString ? `/notifications?${queryString}` : '/notifications';
    
    return api.get<Notification[]>(url);
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (): Promise<number> => {
    // Backend returns { success: true, data: count } where count is a number
    const count = await api.get<number>('/notifications/unread-count');
    return count || 0;
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (id: string): Promise<Notification> => {
    return api.post<Notification>(`/notifications/${id}/read`, {});
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<void> => {
    await api.post('/notifications/mark-all-read', {});
  },

  /**
   * Delete a notification
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },
};

/**
 * Get the link for a notification based on its type and related entity
 */
export function getNotificationLink(notification: Notification, userRole?: string): string | null {
  // For investor-specific notifications, link to investor pages
  if (notification.type === 'new_communication') {
    return '/investor/communications';
  }
  
  // For manager-specific notifications
  if (notification.type === 'investor_message') {
    // Link to the investor who sent the message
    return notification.metadata?.investor_id 
      ? `/manager/investors/${notification.metadata.investor_id}`
      : '/manager/communications';
  }

  if (!notification.relatedEntityType || !notification.relatedEntityId) {
    return null;
  }

  switch (notification.relatedEntityType) {
    case 'investor':
      return `/manager/investors/${notification.relatedEntityId}`;
    case 'deal':
      return `/manager/deals/${notification.relatedEntityId}`;
    case 'capital_call':
      return userRole === 'investor' 
        ? '/investor/dashboard'
        : `/manager/capital-calls/${notification.relatedEntityId}`;
    case 'document':
      return userRole === 'investor'
        ? '/investor/documents'
        : '/manager/documents';
    case 'communication':
      return userRole === 'investor'
        ? '/investor/communications'
        : '/manager/communications';
    case 'kyc_application':
      // KYC applications link to the investor or the onboarding queue
      return notification.metadata?.investor_id 
        ? `/manager/investors/${notification.metadata.investor_id}`
        : '/manager/onboarding';
    default:
      return null;
  }
}

/**
 * Get notification icon name based on type
 */
export function getNotificationIconType(type: string): 'user' | 'building' | 'dollar' | 'file' | 'message' | 'check' {
  switch (type) {
    case 'investor_added':
    case 'investor_updated':
    case 'investor_onboarded':
      return 'user';
    case 'kyc_submitted':
    case 'kyc_approved':
    case 'kyc_rejected':
      return 'check';
    case 'capital_call_created':
    case 'capital_call_payment_received':
    case 'capital_call_completed':
      return 'dollar';
    case 'deal_created':
    case 'deal_updated':
    case 'deal_status_changed':
      return 'building';
    case 'communication_received':
    case 'investor_message':
    case 'new_communication':
      return 'message';
    case 'document_uploaded':
    case 'document_signed':
      return 'file';
    default:
      return 'message';
  }
}



