import { Timestamp } from 'firebase/firestore';

export enum NotificationType {
  INTEREST_RECEIVED = 'interest_received',
  INTEREST_ACCEPTED = 'interest_accepted',
  INTEREST_REJECTED = 'interest_rejected',
  COMMENT_ADDED = 'comment_added',
  COMMENT_REPLY = 'comment_reply',
  PROJECT_BOOKMARKED = 'project_bookmarked',
  PROJECT_UPDATED = 'project_updated',
}

/**
 * Notification document stored in the `notifications` subcollection of a user.
 */
export interface Notification {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  /** ID of the entity that caused the notification (project, comment, etc). */
  referenceId: string;
  /** Metadata for deep linking (e.g. projectId). */
  metadata: Record<string, string>;
  read: boolean;
  createdAt: Timestamp;
}
