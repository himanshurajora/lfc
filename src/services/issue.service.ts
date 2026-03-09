import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ProjectIssue, IssueFormData } from '../types/issue';

const PROJECTS_COLLECTION = 'projects';
const ISSUES_SUBCOLLECTION = 'issues';

/**
 * Issue/task service for managing contribution opportunities on a project.
 */
export const issueService = {
  /** Create an issue/task for a project. */
  async createIssue(
    projectId: string,
    data: IssueFormData,
  ): Promise<ProjectIssue> {
    const issuesRef = collection(
      db,
      PROJECTS_COLLECTION,
      projectId,
      ISSUES_SUBCOLLECTION,
    );

    const issueData = {
      projectId,
      title: data.title,
      description: data.description,
      githubIssueUrl: data.githubIssueUrl ?? '',
      difficulty: data.difficulty,
      labels: data.labels,
      contributionType: data.contributionType,
      isOpen: true,
      assigneeId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(issuesRef, issueData);
    return { id: docRef.id, ...issueData } as unknown as ProjectIssue;
  },

  /** Get all issues for a project. */
  async getIssues(projectId: string, onlyOpen?: boolean): Promise<ProjectIssue[]> {
    const collectionRef = collection(db, PROJECTS_COLLECTION, projectId, ISSUES_SUBCOLLECTION);

    const q = onlyOpen
      ? query(collectionRef, where('isOpen', '==', true), orderBy('createdAt', 'desc'))
      : query(collectionRef, orderBy('createdAt', 'desc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as ProjectIssue,
    );
  },

  /** Update an issue. */
  async updateIssue(
    projectId: string,
    issueId: string,
    data: Partial<IssueFormData & { isOpen: boolean; assigneeId: string | null }>,
  ): Promise<void> {
    await updateDoc(
      doc(db, PROJECTS_COLLECTION, projectId, ISSUES_SUBCOLLECTION, issueId),
      { ...data, updatedAt: serverTimestamp() },
    );
  },

  /** Delete an issue. */
  async deleteIssue(projectId: string, issueId: string): Promise<void> {
    await deleteDoc(
      doc(db, PROJECTS_COLLECTION, projectId, ISSUES_SUBCOLLECTION, issueId),
    );
  },

  /** Assign a user to an issue. */
  async assignIssue(
    projectId: string,
    issueId: string,
    userId: string,
  ): Promise<void> {
    await updateDoc(
      doc(db, PROJECTS_COLLECTION, projectId, ISSUES_SUBCOLLECTION, issueId),
      { assigneeId: userId, updatedAt: serverTimestamp() },
    );
  },

  /** Close an issue. */
  async closeIssue(projectId: string, issueId: string): Promise<void> {
    await updateDoc(
      doc(db, PROJECTS_COLLECTION, projectId, ISSUES_SUBCOLLECTION, issueId),
      { isOpen: false, updatedAt: serverTimestamp() },
    );
  },
};
