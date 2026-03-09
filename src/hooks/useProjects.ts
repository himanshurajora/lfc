import { useCallback, useEffect, useState, useRef } from 'react';
import { DocumentSnapshot } from 'firebase/firestore';
import { projectService } from '../services/project.service';
import { Project, ProjectFormData } from '../types/project';
import { FilterOptions, FILTER_INITIAL_VALUE } from '../types/filters';
import { UserProfile } from '../types/user';
import toast from 'react-hot-toast';

/**
 * Hook that manages the project list, filtering, pagination, and CRUD.
 */
export function useProjects(currentUser: UserProfile | null) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filters, setFilters] = useState<FilterOptions>(FILTER_INITIAL_VALUE);
  const [globalSearch, setGlobalSearch] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLastPage, setIsLastPage] = useState(false);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);

  /** Debounce ref to prevent rapid-fire filter changes. */
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchProjects = useCallback(
    async (cursor?: DocumentSnapshot | null, append = false) => {
      setLoading(true);
      try {
        const result = await projectService.getProjects(
          filters,
          globalSearch,
          currentUser?.uid ?? null,
          cursor,
        );

        setProjects((prev) =>
          append ? [...prev, ...result.projects] : result.projects,
        );
        setLastDoc(result.lastVisible);
        setIsLastPage(!result.hasMore);
        return result.hasMore;
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        toast.error('Failed to load projects.');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [filters, globalSearch, currentUser?.uid],
  );

  /** Reset and refetch when filters or search change. */
  useEffect(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(() => {
      setProjects([]);
      setLastDoc(null);
      setIsLastPage(false);
      fetchProjects(null, false);
    }, 300);

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [fetchProjects]);

  const nextPage = useCallback(async (): Promise<boolean> => {
    if (isLastPage || loading) return false;
    const hasMore = await fetchProjects(lastDoc, true);
    return hasMore ?? false;
  }, [isLastPage, loading, lastDoc, fetchProjects]);

  const refetch = useCallback(() => {
    setProjects([]);
    setLastDoc(null);
    setIsLastPage(false);
    fetchProjects(null, false);
  }, [fetchProjects]);

  const addProject = useCallback(
    async (data: ProjectFormData): Promise<Project | void> => {
      if (!currentUser) {
        toast.error('You must be logged in to add a project.');
        return;
      }
      try {
        const project = await projectService.createProject(
          data,
          currentUser.uid,
          currentUser.username,
          currentUser.avatarUrl,
        );
        toast.success('Project added successfully!');
        refetch();
        return project;
      } catch (error) {
        console.error('Failed to create project:', error);
        toast.error('Failed to create project.');
      }
    },
    [currentUser, refetch],
  );

  const updateProject = useCallback(
    async (projectId: string, data: Partial<ProjectFormData>) => {
      try {
        await projectService.updateProject(projectId, data);
        toast.success('Project updated.');
        refetch();
      } catch (error) {
        console.error('Failed to update project:', error);
        toast.error('Failed to update project.');
      }
    },
    [refetch],
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      try {
        await projectService.deleteProject(projectId);
        toast.success('Project deleted.');
        refetch();
      } catch (error) {
        console.error('Failed to delete project:', error);
        toast.error('Failed to delete project.');
      }
    },
    [refetch],
  );

  return {
    projects,
    loading,
    filters,
    setFilters,
    globalSearch,
    setGlobalSearch,
    addProject,
    updateProject,
    deleteProject,
    nextPage,
    isLastPage,
    refetch,
    lastDoc,
  };
}
