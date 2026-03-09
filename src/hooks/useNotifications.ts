import { useCallback, useEffect, useState } from 'react';
import { notificationService } from '../services/notification.service';
import { Notification } from '../types/notification';

/**
 * Hook for managing user notifications with real-time updates.
 */
export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);

    // Subscribe to real-time notification updates
    const unsubNotifications = notificationService.subscribeToNotifications(
      userId,
      (updatedNotifications) => {
        setNotifications(updatedNotifications);
        setLoading(false);
      },
    );

    // Subscribe to unread count
    const unsubUnread = notificationService.subscribeToUnreadCount(
      userId,
      (count) => {
        setUnreadCount(count);
      },
    );

    return () => {
      unsubNotifications();
      unsubUnread();
    };
  }, [userId]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!userId) return;
      await notificationService.markAsRead(userId, notificationId);
    },
    [userId],
  );

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    await notificationService.markAllAsRead(userId);
  }, [userId]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  };
}
