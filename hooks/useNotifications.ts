import { useState, useEffect, useCallback } from 'react';
import { notificationsService } from '@/services/notifications';
import { Notification } from '@/types';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

export function useNotifications(userId: string | null) {
  const [notificationsState, setNotificationsState] = useState<NotificationsState>({
    notifications: [],
    unreadCount: 0,
    isLoading: true,
    error: null,
  });

  const loadNotifications = useCallback(async () => {
    if (!userId) {
      setNotificationsState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    setNotificationsState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { notifications, error } = await notificationsService.getUserNotifications(userId);
      
      if (error) {
        setNotificationsState(prev => ({ ...prev, error, isLoading: false }));
        return;
      }

      const unreadCount = notifications.filter(n => !n.read).length;

      setNotificationsState({
        notifications,
        unreadCount,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setNotificationsState(prev => ({
        ...prev,
        error: 'Failed to load notifications',
        isLoading: false,
      }));
    }
  }, [userId]);

  function markAsRead(notificationId: string) {
    return notificationsService.markAsRead(notificationId).then(({ error }) => {
      if (!error) {
        setNotificationsState(prev => ({
          ...prev,
          notifications: prev.notifications.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, prev.unreadCount - 1),
        }));
      }
      return { error };
    });
  }

  function markAllAsRead() {
    if (!userId) return Promise.resolve({ error: 'No user logged in' });

    return notificationsService.markAllAsRead(userId).then(({ error }) => {
      if (!error) {
        setNotificationsState(prev => ({
          ...prev,
          notifications: prev.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      }
      return { error };
    });
  }

  function deleteNotification(notificationId: string) {
    return notificationsService.deleteNotification(notificationId).then(({ error }) => {
      if (!error) {
        setNotificationsState(prev => {
          const notification = prev.notifications.find(n => n.id === notificationId);
          const wasUnread = notification && !notification.read;
          
          return {
            ...prev,
            notifications: prev.notifications.filter(n => n.id !== notificationId),
            unreadCount: wasUnread ? Math.max(0, prev.unreadCount - 1) : prev.unreadCount,
          };
        });
      }
      return { error };
    });
  }

  const addNotification = useCallback((notification: Notification) => {
    setNotificationsState(prev => ({
      ...prev,
      notifications: [notification, ...prev.notifications],
      unreadCount: notification.read ? prev.unreadCount : prev.unreadCount + 1,
    }));
  }, []);

  useEffect(() => {
    if (!userId) {
      setNotificationsState(prev => ({ ...prev, isLoading: false }));
      return;
    }
    loadNotifications();

    // Subscribe to real-time notifications
    const unsubscribe = notificationsService.subscribeToNotifications(userId, addNotification);
    
    return unsubscribe;
  }, [userId, loadNotifications, addNotification]);

  return {
    ...notificationsState,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications: loadNotifications,
  };
}
