import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Bookmark } from '../types/bookmark';
import { projectService } from './project.service';

const USERS_COLLECTION = 'users';
const BOOKMARKS_SUBCOLLECTION = 'bookmarks';

/**
 * Bookmark service for saving projects to a user's collection.
 */
export const bookmarkService = {
  /** Add a project to the user's bookmarks. */
  async addBookmark(
    userId: string,
    projectId: string,
    projectName: string,
    projectAuthorUsername: string,
  ): Promise<Bookmark> {
    // Check for existing bookmark
    const existing = await this.isBookmarked(userId, projectId);
    if (existing) {
      throw new Error('Project is already bookmarked.');
    }

    const bookmarksRef = collection(
      db,
      USERS_COLLECTION,
      userId,
      BOOKMARKS_SUBCOLLECTION,
    );

    const bookmarkData = {
      userId,
      projectId,
      projectName,
      projectAuthorUsername,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(bookmarksRef, bookmarkData);

    // Increment bookmark counter on the project
    await projectService.incrementCounter(projectId, 'bookmarkCount');

    return { id: docRef.id, ...bookmarkData } as unknown as Bookmark;
  },

  /** Remove a bookmark. */
  async removeBookmark(userId: string, projectId: string): Promise<void> {
    const q = query(
      collection(db, USERS_COLLECTION, userId, BOOKMARKS_SUBCOLLECTION),
      where('projectId', '==', projectId),
    );

    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);

    await projectService.incrementCounter(projectId, 'bookmarkCount', -1);
  },

  /** Check if a project is bookmarked by a user. */
  async isBookmarked(userId: string, projectId: string): Promise<boolean> {
    const q = query(
      collection(db, USERS_COLLECTION, userId, BOOKMARKS_SUBCOLLECTION),
      where('projectId', '==', projectId),
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  },

  /** Get all bookmarks for a user. */
  async getBookmarks(userId: string): Promise<Bookmark[]> {
    const q = query(
      collection(db, USERS_COLLECTION, userId, BOOKMARKS_SUBCOLLECTION),
      orderBy('createdAt', 'desc'),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Bookmark,
    );
  },

  /** Get bookmarked project IDs for efficient lookup. */
  async getBookmarkedProjectIds(userId: string): Promise<Set<string>> {
    const bookmarks = await this.getBookmarks(userId);
    return new Set(bookmarks.map((b) => b.projectId));
  },
};
