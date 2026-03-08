import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ContributorInterest, InterestFormData, InterestStatus } from '../types/interest';
import { projectService } from './project.service';
import { notificationService } from './notification.service';
import { NotificationType } from '../types/notification';

const PROJECTS_COLLECTION = 'projects';
const INTERESTS_SUBCOLLECTION = 'interests';

/**
 * Contributor interest service.
 * Manages applications from users who want to contribute to a project.
 */
export const interestService = {
  /** Express interest in contributing to a project. */
  async expressInterest(
    projectId: string,
    userId: string,
    username: string,
    avatarUrl: string,
    data: InterestFormData,
    projectAuthorId: string,
    projectName: string,
  ): Promise<ContributorInterest> {
    // Check for existing interest
    const existing = await this.getUserInterest(projectId, userId);
    if (existing) {
      throw new Error('You have already expressed interest in this project.');
    }

    const interestsRef = collection(
      db,
      PROJECTS_COLLECTION,
      projectId,
      INTERESTS_SUBCOLLECTION,
    );

    const interestData = {
      projectId,
      userId,
      username,
      avatarUrl,
      message: data.message,
      skills: data.skills,
      status: InterestStatus.PENDING,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(interestsRef, interestData);

    // Increment project counter
    await projectService.incrementCounter(projectId, 'interestCount');

    // Notify the project author
    await notificationService.createNotification(
      projectAuthorId,
      NotificationType.INTEREST_RECEIVED,
      'New Contributor Interest',
      `${username} wants to contribute to "${projectName}"`,
      projectId,
      { projectId, userId, username },
    );

    return { id: docRef.id, ...interestData } as unknown as ContributorInterest;
  },

  /** Get all interests for a project. */
  async getInterests(projectId: string): Promise<ContributorInterest[]> {
    const q = query(
      collection(db, PROJECTS_COLLECTION, projectId, INTERESTS_SUBCOLLECTION),
      orderBy('createdAt', 'desc'),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as ContributorInterest,
    );
  },

  /** Get a specific user's interest in a project. */
  async getUserInterest(
    projectId: string,
    userId: string,
  ): Promise<ContributorInterest | null> {
    const q = query(
      collection(db, PROJECTS_COLLECTION, projectId, INTERESTS_SUBCOLLECTION),
      where('userId', '==', userId),
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as ContributorInterest;
  },

  /** Accept a contributor interest. Only the project author should call this. */
  async acceptInterest(
    projectId: string,
    interestId: string,
    userId: string,
    projectName: string,
  ): Promise<void> {
    await updateDoc(
      doc(db, PROJECTS_COLLECTION, projectId, INTERESTS_SUBCOLLECTION, interestId),
      { status: InterestStatus.ACCEPTED, updatedAt: serverTimestamp() },
    );

    await notificationService.createNotification(
      userId,
      NotificationType.INTEREST_ACCEPTED,
      'Interest Accepted!',
      `Your interest in "${projectName}" has been accepted.`,
      projectId,
      { projectId },
    );
  },

  /** Reject a contributor interest. */
  async rejectInterest(
    projectId: string,
    interestId: string,
    userId: string,
    projectName: string,
  ): Promise<void> {
    await updateDoc(
      doc(db, PROJECTS_COLLECTION, projectId, INTERESTS_SUBCOLLECTION, interestId),
      { status: InterestStatus.REJECTED, updatedAt: serverTimestamp() },
    );

    await notificationService.createNotification(
      userId,
      NotificationType.INTEREST_REJECTED,
      'Interest Update',
      `Your interest in "${projectName}" was not accepted.`,
      projectId,
      { projectId },
    );
  },

  /** Withdraw interest (by the contributor). */
  async withdrawInterest(
    projectId: string,
    interestId: string,
  ): Promise<void> {
    await deleteDoc(
      doc(db, PROJECTS_COLLECTION, projectId, INTERESTS_SUBCOLLECTION, interestId),
    );
    await projectService.incrementCounter(projectId, 'interestCount', -1);
  },

  /** Get all projects a user has expressed interest in. */
  async getUserInterests(userId: string): Promise<ContributorInterest[]> {
    // This requires a collection group query
    const q = query(
      collection(db, PROJECTS_COLLECTION),
    );

    // For user's interests across projects, we query each project.
    // A more scalable approach uses a top-level "interests" collection.
    // For now, we use the denormalized approach.
    const projectsSnapshot = await getDocs(q);
    const allInterests: ContributorInterest[] = [];

    for (const projectDoc of projectsSnapshot.docs) {
      const interestQuery = query(
        collection(db, PROJECTS_COLLECTION, projectDoc.id, INTERESTS_SUBCOLLECTION),
        where('userId', '==', userId),
      );
      const interestSnapshot = await getDocs(interestQuery);
      interestSnapshot.docs.forEach((d) => {
        allInterests.push({ id: d.id, ...d.data() } as ContributorInterest);
      });
    }

    return allInterests;
  },
};
