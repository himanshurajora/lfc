import { Timestamp } from 'firebase/firestore';

/**
 * Analytics document stored alongside a project.
 * Document path: `projects/{projectId}/analytics/summary`
 */
export interface ProjectAnalytics {
  projectId: string;
  totalViews: number;
  uniqueViewers: string[];
  totalInterests: number;
  totalComments: number;
  totalBookmarks: number;
  githubClicks: number;
  websiteClicks: number;
  /** Views by day – keys are ISO date strings (YYYY-MM-DD). */
  viewsByDay: Record<string, number>;
  updatedAt: Timestamp;
}
