import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  QueryConstraint,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
  DocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Project, ProjectFormData } from '../types/project';
import { FilterOptions, OrderByOptions, FilterByOptions } from '../types/filters';

const PROJECTS_COLLECTION = 'projects';
const PAGE_SIZE = 10;

/** Cache for banned user IDs (refreshed every 2 minutes). */
let bannedUidsCache: { ids: Set<string>; timestamp: number } | null = null;
const BANNED_CACHE_TTL = 2 * 60 * 1000;

/** Fetch banned user IDs (cached). */
async function getBannedUserIds(): Promise<Set<string>> {
  if (bannedUidsCache && Date.now() - bannedUidsCache.timestamp < BANNED_CACHE_TTL) {
    return bannedUidsCache.ids;
  }
  try {
    const q = query(collection(db, 'users'), where('banned', '==', true));
    const snapshot = await getDocs(q);
    const ids = new Set(snapshot.docs.map((d) => d.id));
    bannedUidsCache = { ids, timestamp: Date.now() };
    return ids;
  } catch {
    return bannedUidsCache?.ids ?? new Set();
  }
}

/** Generate lowercase search tokens from a string for partial matching. */
function generateSearchTokens(text: string): string[] {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
  const tokens = new Set<string>();
  for (const word of words) {
    if (word.length === 0) continue;
    tokens.add(word);
    // Add prefixes for prefix-search support
    for (let i = 1; i <= Math.min(word.length, 8); i++) {
      tokens.add(word.slice(0, i));
    }
  }
  return Array.from(tokens);
}

/**
 * Project CRUD service backed by Firestore.
 */
export const projectService = {
  /** Create a new project and return the created document. */
  async createProject(
    data: ProjectFormData,
    authorId: string,
    authorUsername: string,
    authorAvatarUrl: string,
  ): Promise<Project> {
    const searchTokens = generateSearchTokens(
      `${data.name} ${data.languages.join(' ')} ${authorUsername}`,
    );

    const projectData = {
      ...data,
      homePage: data.homePage ?? '',
      contributingGuideUrl: data.contributingGuideUrl ?? '',
      timeCommitment: data.timeCommitment ?? '',
      maintainerCount: data.maintainerCount ?? 1,
      authorId,
      authorUsername,
      authorAvatarUrl,
      interestCount: 0,
      commentCount: 0,
      bookmarkCount: 0,
      viewCount: 0,
      searchTokens,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), projectData);
    return { id: docRef.id, ...projectData } as unknown as Project;
  },

  /** Get a single project by ID. */
  async getProject(projectId: string): Promise<Project | null> {
    const snapshot = await getDoc(doc(db, PROJECTS_COLLECTION, projectId));
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Project;
  },

  /** Update a project. Only the project author should call this. */
  async updateProject(
    projectId: string,
    data: Partial<ProjectFormData>,
  ): Promise<void> {
    const updateData: { [key: string]: any } = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    // Regenerate search tokens when name or languages change
    if (data.name || data.languages) {
      const existing = await this.getProject(projectId);
      if (existing) {
        const name = data.name ?? existing.name;
        const languages = data.languages ?? existing.languages;
        updateData.searchTokens = generateSearchTokens(
          `${name} ${languages.join(' ')} ${existing.authorUsername}`,
        );
      }
    }

    await updateDoc(doc(db, PROJECTS_COLLECTION, projectId), updateData);
  },

  /** Delete a project and its subcollections. */
  async deleteProject(projectId: string): Promise<void> {
    // Delete subcollection documents first
    const subcollections = ['interests', 'issues', 'comments'];
    for (const sub of subcollections) {
      const snapshot = await getDocs(
        collection(db, PROJECTS_COLLECTION, projectId, sub),
      );
      const deletePromises = snapshot.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    }

    // Delete analytics doc
    try {
      await deleteDoc(doc(db, PROJECTS_COLLECTION, projectId, 'analytics', 'summary'));
    } catch {
      // Analytics doc may not exist
    }

    await deleteDoc(doc(db, PROJECTS_COLLECTION, projectId));
  },

  /**
   * Fetch a paginated list of projects with filters applied.
   * Returns the list and the last document snapshot for cursor-based pagination.
   */
  async getProjects(
    filters: FilterOptions,
    globalSearch: string | null,
    currentUserId: string | null,
    lastDoc?: DocumentSnapshot | null,
  ): Promise<{ projects: Project[]; lastVisible: DocumentSnapshot | null; hasMore: boolean }> {
    const constraints: QueryConstraint[] = [];

    // Skill-level range
    const minSkill = filters.skillLevelRange[0] / 10;
    const maxSkill = filters.skillLevelRange[1] / 10;
    constraints.push(where('skillLevel', '>=', minSkill));
    constraints.push(where('skillLevel', '<=', maxSkill));

    // Ownership filter
    if (filters.filterOption === FilterByOptions.MINE && currentUserId) {
      constraints.push(where('authorId', '==', currentUserId));
    }
    // NOTE: OTHERS filter is applied client-side after fetch to avoid
    // multi-field inequality issues (authorId != + skillLevel range).

    // Sorting
    switch (filters.sortOption) {
      case OrderByOptions.RECENT:
        constraints.push(orderBy('skillLevel'));
        constraints.push(orderBy('createdAt', 'desc'));
        break;
      case OrderByOptions.OLDER:
        constraints.push(orderBy('skillLevel'));
        constraints.push(orderBy('createdAt', 'asc'));
        break;
      case OrderByOptions.POPULAR:
        constraints.push(orderBy('skillLevel'));
        constraints.push(orderBy('viewCount', 'desc'));
        break;
      case OrderByOptions.MOST_INTEREST:
        constraints.push(orderBy('skillLevel'));
        constraints.push(orderBy('interestCount', 'desc'));
        break;
    }

    // Pagination cursor
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    constraints.push(limit(PAGE_SIZE));

    const q = query(collection(db, PROJECTS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    let projects = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Project,
    );

    // Filter out projects from banned users
    const bannedIds = await getBannedUserIds();
    if (bannedIds.size > 0) {
      projects = projects.filter((p) => !bannedIds.has(p.authorId));
    }

    // Client-side OTHERS filter (avoids multi-field inequality in Firestore)
    if (filters.filterOption === FilterByOptions.OTHERS && currentUserId) {
      projects = projects.filter((p) => p.authorId !== currentUserId);
    }

    // Client-side filtering for features Firestore can't composite-index easily
    if (filters.languages.length > 0) {
      projects = projects.filter((p) =>
        p.languages.some((lang) => filters.languages.includes(lang)),
      );
    }

    if (filters.categories.length > 0) {
      projects = projects.filter((p) =>
        filters.categories.includes(p.category),
      );
    }

    if (filters.statuses.length > 0) {
      projects = projects.filter((p) => filters.statuses.includes(p.status));
    }

    if (globalSearch && globalSearch.trim().length > 0) {
      const token = globalSearch.toLowerCase().trim();
      projects = projects.filter(
        (p) =>
          p.searchTokens?.includes(token) ||
          p.name.toLowerCase().includes(token) ||
          p.authorUsername.toLowerCase().includes(token) ||
          p.description.toLowerCase().includes(token),
      );
    }

    const lastVisible =
      snapshot.docs.length > 0
        ? snapshot.docs[snapshot.docs.length - 1]
        : null;

    return {
      projects,
      lastVisible,
      hasMore: snapshot.docs.length === PAGE_SIZE,
    };
  },

  /** Subscribe to real-time updates for the project list. */
  subscribeToProjects(
    callback: (projects: Project[]) => void,
  ): () => void {
    const q = query(
      collection(db, PROJECTS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE),
    );

    return onSnapshot(q, async (snapshot) => {
      let projects = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Project,
      );
      // Filter out projects from banned users
      const bannedIds = await getBannedUserIds();
      if (bannedIds.size > 0) {
        projects = projects.filter((p) => !bannedIds.has(p.authorId));
      }
      callback(projects);
    });
  },

  /** Increment a counter field on a project. */
  async incrementCounter(
    projectId: string,
    field: 'interestCount' | 'commentCount' | 'bookmarkCount' | 'viewCount',
    value: number = 1,
  ): Promise<void> {
    await updateDoc(doc(db, PROJECTS_COLLECTION, projectId), {
      [field]: increment(value),
    });
  },

  /** Get projects by author for profile pages. */
  async getProjectsByAuthor(authorId: string): Promise<Project[]> {
    const q = query(
      collection(db, PROJECTS_COLLECTION),
      where('authorId', '==', authorId),
      orderBy('createdAt', 'desc'),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Project);
  },

  /**
   * Get recommended projects for a user based on their skills and experience.
   */
  async getRecommendedProjects(
    skills: string[],
    experienceLevel: string,
    currentUserId: string,
    limitCount: number = 5,
  ): Promise<Project[]> {
    // Map experience level to skill level range
    const skillRanges: Record<string, [number, number]> = {
      beginner: [1, 3],
      intermediate: [3, 6],
      advanced: [5, 8],
      expert: [7, 10],
    };
    const [minSkill, maxSkill] = skillRanges[experienceLevel] ?? [1, 10];

    const q = query(
      collection(db, PROJECTS_COLLECTION),
      where('skillLevel', '>=', minSkill),
      where('skillLevel', '<=', maxSkill),
      orderBy('skillLevel'),
      orderBy('interestCount', 'desc'),
      limit(limitCount * 3), // Over-fetch to allow client-side filtering
    );

    const snapshot = await getDocs(q);
    let projects = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Project)
      .filter((p) => p.authorId !== currentUserId); // Client-side exclusion

    // Filter out projects from banned users
    const bannedIds = await getBannedUserIds();
    if (bannedIds.size > 0) {
      projects = projects.filter((p) => !bannedIds.has(p.authorId));
    }

    // Score projects by language overlap
    if (skills.length > 0) {
      const normalizedSkills = skills.map((s) => s.toLowerCase());
      projects = projects
        .map((p) => ({
          project: p,
          score: p.languages.filter((lang) =>
            normalizedSkills.includes(lang),
          ).length,
        }))
        .sort((a, b) => b.score - a.score)
        .map((item) => item.project);
    }

    return projects.slice(0, limitCount);
  },

  /** Record a project view for analytics. */
  async recordView(projectId: string, userId: string | null): Promise<void> {
    await this.incrementCounter(projectId, 'viewCount');

    // Update analytics document
    const analyticsRef = doc(db, PROJECTS_COLLECTION, projectId, 'analytics', 'summary');
    const today = new Date().toISOString().split('T')[0];
    try {
      await updateDoc(analyticsRef, {
        totalViews: increment(1),
        [`viewsByDay.${today}`]: increment(1),
        ...(userId ? { uniqueViewers: userId } : {}),
        updatedAt: serverTimestamp(),
      });
    } catch {
      // Analytics doc doesn't exist yet — create it
      const { setDoc: setDocFn } = await import('firebase/firestore');
      await setDocFn(analyticsRef, {
        projectId,
        totalViews: 1,
        uniqueViewers: userId ? [userId] : [],
        totalInterests: 0,
        totalComments: 0,
        totalBookmarks: 0,
        githubClicks: 0,
        websiteClicks: 0,
        viewsByDay: { [today]: 1 },
        updatedAt: serverTimestamp() as Timestamp,
      });
    }
  },
};
