import { Timestamp } from 'firebase/firestore';

export enum InterestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

/**
 * Contributor interest document stored in `projects/{projectId}/interests`.
 */
export interface ContributorInterest {
  id: string;
  projectId: string;
  userId: string;
  username: string;
  avatarUrl: string;
  message: string;
  skills: string[];
  status: InterestStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface InterestFormData {
  message: string;
  skills: string[];
}
