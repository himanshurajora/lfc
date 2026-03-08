import { Timestamp } from 'firebase/firestore';

export enum IssueDifficulty {
  GOOD_FIRST_ISSUE = 'good-first-issue',
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

/**
 * Issue/task document stored in `projects/{projectId}/issues`.
 */
export interface ProjectIssue {
  id: string;
  projectId: string;
  title: string;
  description: string;
  githubIssueUrl: string;
  difficulty: IssueDifficulty;
  labels: string[];
  /** "code" | "docs" | "design" | "testing" | "other" */
  contributionType: string;
  isOpen: boolean;
  assigneeId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface IssueFormData {
  title: string;
  description: string;
  githubIssueUrl?: string;
  difficulty: IssueDifficulty;
  labels: string[];
  contributionType: string;
}
