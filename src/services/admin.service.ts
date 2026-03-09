import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile } from '../types/user';

/**
 * Admin service — manages user moderation (ban/unban).
 */
export const adminService = {
  /** Fetch all registered users, ordered by creation date descending. */
  async getAllUsers(): Promise<UserProfile[]> {
    const q = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (d) => ({ uid: d.id, ...d.data() }) as UserProfile,
    );
  },

  /** Ban a user — sets `banned: true` on their profile. */
  async banUser(uid: string): Promise<void> {
    await updateDoc(doc(db, 'users', uid), {
      banned: true,
      updatedAt: serverTimestamp(),
    });
  },

  /** Unban a user — sets `banned: false` on their profile. */
  async unbanUser(uid: string): Promise<void> {
    await updateDoc(doc(db, 'users', uid), {
      banned: false,
      updatedAt: serverTimestamp(),
    });
  },
};
