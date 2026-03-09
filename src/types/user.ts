import { Timestamp } from 'firebase/firestore';

/**
 * User profile stored in the `users` Firestore collection.
 * The document ID matches the Firebase Auth UID.
 */
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  username: string;
  avatarUrl: string;
  bio: string;
  skills: string[];
  githubUrl: string;
  websiteUrl: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  projectsCreated: number;
  contributionsCount: number;
  /** Whether the user is banned by an admin. */
  banned?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Subset of fields allowed during profile creation/update. */
export type UserProfileFormData = Pick<
  UserProfile,
  'displayName' | 'bio' | 'skills' | 'websiteUrl' | 'experienceLevel'
>;
