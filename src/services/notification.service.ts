import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Notification, NotificationType } from '../types/notification';

const USERS_COLLECTION = 'users';
const NOTIFICATIONS_SUBCOLLECTION = 'notifications';

/**
 * Notification service for user alerts.
 */
export const notificationService = {
  /** Create a notification for a user. */
  async createNotification(
    recipientId: string,
    type: NotificationType,
    title: string,
    message: string,
    referenceId: string,
    metadata: Record<string, string> = {},
  ): Promise<void> {
    const notificationsRef = collection(
      db,
      USERS_COLLECTION,
      recipientId,
      NOTIFICATIONS_SUBCOLLECTION,
    );

    await addDoc(notificationsRef, {
      recipientId,
      type,
      title,
      message,
      referenceId,
      metadata,
      read: false,
      createdAt: serverTimestamp(),
    });
  },

  /** Get notifications for a user. */
  async getNotifications(
    userId: string,
    limitCount: number = 20,
  ): Promise<Notification[]> {
    const q = query(
      collection(db, USERS_COLLECTION, userId, NOTIFICATIONS_SUBCOLLECTION),
      orderBy('createdAt', 'desc'),
      limit(limitCount),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Notification,
    );
  },

  /** Get count of unread notifications. */
  async getUnreadCount(userId: string): Promise<number> {
    const q = query(
      collection(db, USERS_COLLECTION, userId, NOTIFICATIONS_SUBCOLLECTION),
      where('read', '==', false),
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  },

  /** Mark a notification as read. */
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await updateDoc(
      doc(
        db,
        USERS_COLLECTION,
        userId,
        NOTIFICATIONS_SUBCOLLECTION,
        notificationId,
      ),
      { read: true },
    );
  },

  /** Mark all notifications as read. */
  async markAllAsRead(userId: string): Promise<void> {
    const q = query(
      collection(db, USERS_COLLECTION, userId, NOTIFICATIONS_SUBCOLLECTION),
      where('read', '==', false),
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach((d) => {
      batch.update(d.ref, { read: true });
    });

    await batch.commit();
  },

  /** Subscribe to real-time notification updates. */
  subscribeToNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void,
  ): () => void {
    const q = query(
      collection(db, USERS_COLLECTION, userId, NOTIFICATIONS_SUBCOLLECTION),
      orderBy('createdAt', 'desc'),
      limit(20),
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Notification,
      );
      callback(notifications);
    });
  },

  /** Subscribe to unread count changes. */
  subscribeToUnreadCount(
    userId: string,
    callback: (count: number) => void,
  ): () => void {
    const q = query(
      collection(db, USERS_COLLECTION, userId, NOTIFICATIONS_SUBCOLLECTION),
      where('read', '==', false),
    );

    return onSnapshot(q, (snapshot) => {
      callback(snapshot.size);
    });
  },
};
