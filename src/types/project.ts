import { Timestamp } from 'firebase/firestore';

/** Supported programming languages for project tagging. */
export const SUPPORTED_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'rust',
  'go',
  'java',
  'c++',
  'c#',
  'ruby',
  'swift',
  'kotlin',
  'php',
  'dart',
  'markdown',
  'other',
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Project categories. */
export const PROJECT_CATEGORIES = [
  'web',
  'mobile',
  'desktop',
  'cli',
  'library',
  'ai-ml',
  'devops',
  'data',
  'security',
  'game',
  'iot',
  'blockchain',
  'other',
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

/** Project lifecycle status. */
export const PROJECT_STATUSES = [
  'active',
  'seeking-maintainer',
  'new',
  'archived',
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/**
 * Project document stored in the `projects` Firestore collection.
 */
export interface Project {
  id: string;
  name: string;
  description: string;
  githubRepository: string;
  homePage: string;
  languages: SupportedLanguage[];
  category: ProjectCategory;
  status: ProjectStatus;
  skillLevel: number; // 1–10
  authorId: string;
  authorUsername: string;
  authorAvatarUrl: string;

  /** License identifier (e.g. "MIT", "Apache-2.0"). */
  license: string;
  /** Link to CONTRIBUTING.md or similar guide. */
  contributingGuideUrl: string;
  /** Estimated weekly hours needed from a contributor. */
  timeCommitment: string;
  /** Number of active maintainers. */
  maintainerCount: number;

  /** Denormalised counters for efficient queries. */
  interestCount: number;
  commentCount: number;
  bookmarkCount: number;
  viewCount: number;

  /** Search-friendly lowercase array for Firestore queries. */
  searchTokens: string[];

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Fields accepted when creating or editing a project. */
export interface ProjectFormData {
  name: string;
  description: string;
  githubRepository: string;
  homePage?: string;
  languages: SupportedLanguage[];
  category: ProjectCategory;
  status: ProjectStatus;
  skillLevel: number;
  license: string;
  contributingGuideUrl?: string;
  timeCommitment?: string;
  maintainerCount?: number;
}
