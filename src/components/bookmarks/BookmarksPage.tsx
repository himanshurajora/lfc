import { FC, useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

import { useAuthContext } from '../../contexts';
import { bookmarkService } from '../../services/bookmark.service';
import { projectService } from '../../services/project.service';
import { Project } from '../../types/project';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { ProjectCard } from '../projects/ProjectCard';

/**
 * Page listing all bookmarked projects for the current user.
 */
export const BookmarksPage: FC = () => {
  const { user } = useAuthContext();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const idSet = await bookmarkService.getBookmarkedProjectIds(user.uid);
      const ids = Array.from(idSet);
      if (ids.length === 0) {
        setProjects([]);
        return;
      }

      // Fetch each project in parallel (Firestore has no native "in" over 30)
      const chunks: string[][] = [];
      for (let i = 0; i < ids.length; i += 10) {
        chunks.push(ids.slice(i, i + 10));
      }

      const results: Project[] = [];
      for (const chunk of chunks) {
        const batch = await Promise.all(
          chunk.map((id) => projectService.getProject(id))
        );
        results.push(...(batch.filter(Boolean) as Project[]));
      }

      setProjects(results);
    } catch {
      toast.error('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  if (!user) {
    return (
      <EmptyState
        icon="pi pi-bookmark"
        title="Log In Required"
        description="Please log in to see your bookmarked projects."
      />
    );
  }

  if (loading) return <LoadingSpinner message="Loading bookmarks..." />;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        <i className="pi pi-bookmark-fill text-yellow-500 mr-2" />
        Your Bookmarks
      </h1>

      {projects.length === 0 ? (
        <EmptyState
          icon="pi pi-bookmark"
          title="No Bookmarks"
          description="You haven't bookmarked any projects yet. Browse projects and bookmark the ones you like!"
        />
      ) : (
        <div className="flex flex-col gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
            />
          ))}
        </div>
      )}
    </div>
  );
};
