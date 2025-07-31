import { supabase, handleSupabaseError, subscribeToTable } from '@/lib/supabase';
import { Notification } from '@/types';

export interface CreateNotificationData {
  userId: string;
  type: Notification['type'];
  title: string;
  message: string;
  priority?: Notification['priority'];
  actionUrl?: string;
}

export const notificationsService = {
  // Create notification
  async createNotification(data: CreateNotificationData): Promise<{ notification: Notification | null; error: string | null }> {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          priority: data.priority || 'medium',
          action_url: data.actionUrl,
        })
        .select()
        .single();

      if (error) {
        return { notification: null, error: handleSupabaseError(error) };
      }

      return {
        notification: this.mapNotificationRecord(notification),
        error: null,
      };
    } catch (error) {
      return { notification: null, error: handleSupabaseError(error) };
    }
  },

  // Get user notifications
  async getUserNotifications(userId: string): Promise<{ notifications: Notification[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) {
        return { notifications: [], error: handleSupabaseError(error) };
      }

      const notifications = data.map(notification => this.mapNotificationRecord(notification));
      return { notifications, error: null };
    } catch (error) {
      return { notifications: [], error: handleSupabaseError(error) };
    }
  },

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      return { error: error ? handleSupabaseError(error) : null };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  },

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('read', false);

      return { error: error ? handleSupabaseError(error) : null };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  },

  // Delete notification
  async deleteNotification(notificationId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      return { error: error ? handleSupabaseError(error) : null };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  },

  // Subscribe to real-time notifications
  subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    return subscribeToTable(
      'notifications',
      (payload) => {
        if (payload.eventType === 'INSERT' && payload.new.user_id === userId) {
          const notification = this.mapNotificationRecord(payload.new);
          callback(notification);
        }
      },
      `user_id=eq.${userId}`
    );
  },

  // Helper function to map database record to Notification
  mapNotificationRecord(data: any): Notification {
    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      title: data.title,
      message: data.message,
      timestamp: new Date(data.timestamp),
      read: data.read,
      priority: data.priority,
      actionUrl: data.action_url,
    };
  },
};