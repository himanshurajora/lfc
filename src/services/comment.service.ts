import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Comment, CommentFormData } from '../types/comment';
import { projectService } from './project.service';

const PROJECTS_COLLECTION = 'projects';
const COMMENTS_SUBCOLLECTION = 'comments';

/**
 * Comment service for threaded discussions on projects.
 */
export const commentService = {
  /** Add a comment to a project. */
  async addComment(
    projectId: string,
    authorId: string,
    authorUsername: string,
    authorAvatarUrl: string,
    data: CommentFormData,
  ): Promise<Comment> {
    const commentsRef = collection(
      db,
      PROJECTS_COLLECTION,
      projectId,
      COMMENTS_SUBCOLLECTION,
    );

    const commentData = {
      projectId,
      authorId,
      authorUsername,
      authorAvatarUrl,
      content: data.content,
      parentId: data.parentId ?? null,
      replyCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(commentsRef, commentData);

    // Increment counters
    await projectService.incrementCounter(projectId, 'commentCount');

    // If this is a reply, increment parent's reply count
    if (data.parentId) {
      const { updateDoc } = await import('firebase/firestore');
      const { increment } = await import('firebase/firestore');
      await updateDoc(
        doc(db, PROJECTS_COLLECTION, projectId, COMMENTS_SUBCOLLECTION, data.parentId),
        { replyCount: increment(1) },
      );
    }

    return { id: docRef.id, ...commentData } as unknown as Comment;
  },

  /** Get all top-level comments for a project. */
  async getComments(projectId: string): Promise<Comment[]> {
    const q = query(
      collection(db, PROJECTS_COLLECTION, projectId, COMMENTS_SUBCOLLECTION),
      where('parentId', '==', null),
      orderBy('createdAt', 'desc'),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Comment,
    );
  },

  /** Get replies to a specific comment. */
  async getReplies(projectId: string, parentId: string): Promise<Comment[]> {
    const q = query(
      collection(db, PROJECTS_COLLECTION, projectId, COMMENTS_SUBCOLLECTION),
      where('parentId', '==', parentId),
      orderBy('createdAt', 'asc'),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Comment,
    );
  },

  /** Delete a comment. Only the author should call this. */
  async deleteComment(projectId: string, commentId: string): Promise<void> {
    await deleteDoc(
      doc(db, PROJECTS_COLLECTION, projectId, COMMENTS_SUBCOLLECTION, commentId),
    );
    await projectService.incrementCounter(projectId, 'commentCount', -1);
  },

  /** Subscribe to real-time comment updates on a project. */
  subscribeToComments(
    projectId: string,
    callback: (comments: Comment[]) => void,
  ): () => void {
    const q = query(
      collection(db, PROJECTS_COLLECTION, projectId, COMMENTS_SUBCOLLECTION),
      where('parentId', '==', null),
      orderBy('createdAt', 'desc'),
    );

    return onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Comment,
      );
      callback(comments);
    });
  },
};
