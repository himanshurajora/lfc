import { Timestamp } from 'firebase/firestore';

/**
 * Bookmark document stored in `users/{userId}/bookmarks`.
 */
export interface Bookmark {
  id: string;
  userId: string;
  projectId: string;
  projectName: string;
  projectAuthorUsername: string;
  createdAt: Timestamp;
}
