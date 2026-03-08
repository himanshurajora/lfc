import { doc, getDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ProjectAnalytics } from '../types/analytics';

const PROJECTS_COLLECTION = 'projects';

/**
 * Analytics service for project engagement metrics.
 */
export const analyticsService = {
  /** Get analytics summary for a project. */
  async getAnalytics(projectId: string): Promise<ProjectAnalytics | null> {
    const ref = doc(db, PROJECTS_COLLECTION, projectId, 'analytics', 'summary');
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;
    return snapshot.data() as ProjectAnalytics;
  },

  /** Record a click on the GitHub link. */
  async recordGithubClick(projectId: string): Promise<void> {
    const ref = doc(db, PROJECTS_COLLECTION, projectId, 'analytics', 'summary');
    try {
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(ref, {
        githubClicks: increment(1),
        updatedAt: serverTimestamp(),
      });
    } catch {
      // Analytics doc may not exist; view recording creates it
    }
  },

  /** Record a click on the website link. */
  async recordWebsiteClick(projectId: string): Promise<void> {
    const ref = doc(db, PROJECTS_COLLECTION, projectId, 'analytics', 'summary');
    try {
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(ref, {
        websiteClicks: increment(1),
        updatedAt: serverTimestamp(),
      });
    } catch {
      // Analytics doc may not exist
    }
  },

  /** Get analytics for all projects owned by a user. */
  async getAuthorAnalytics(
    authorId: string,
  ): Promise<{ totalViews: number; totalInterests: number; totalBookmarks: number }> {
    const { projectService } = await import('./project.service');
    const projects = await projectService.getProjectsByAuthor(authorId);

    let totalViews = 0;
    let totalInterests = 0;
    let totalBookmarks = 0;

    for (const project of projects) {
      totalViews += project.viewCount;
      totalInterests += project.interestCount;
      totalBookmarks += project.bookmarkCount;
    }

    return { totalViews, totalInterests, totalBookmarks };
  },
};
