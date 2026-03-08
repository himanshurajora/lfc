import { Timestamp } from 'firebase/firestore';

/**
 * Comment document stored in the `comments` subcollection of a project.
 */
export interface Comment {
  id: string;
  projectId: string;
  authorId: string;
  authorUsername: string;
  authorAvatarUrl: string;
  content: string;
  /** Optional parent comment ID for threaded replies. */
  parentId: string | null;
  replyCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CommentFormData {
  content: string;
  parentId?: string | null;
}
