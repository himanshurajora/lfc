import { UIEvent, useEffect, useState } from 'react';
import { useStoreContext } from '../../contexts';
import { ProjectCard } from './ProjectCard';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';

/**
 * Main project feed with infinite scrolling.
 */
export const ProjectList = () => {
  const { projects, nextPage, loading, isLastPage } = useStoreContext();
  const [reachedEnd, setReachedEnd] = useState(false);

  const handleScroll = async (e: UIEvent<HTMLDivElement>) => {
    if (loading || isLastPage) return;
    const target = e.target as HTMLDivElement;
    const bottom =
      target.scrollHeight - target.scrollTop <= target.clientHeight + 100;

    if (bottom) {
      const hasMore = await nextPage();
      setReachedEnd(!hasMore);
    }
  };

  useEffect(() => {
    if (loading) setReachedEnd(false);
  }, [loading]);

  const noProjects = !loading && projects.length === 0;

  return (
    <div
      className="flex flex-col gap-3 h-full overflow-auto"
      onScroll={handleScroll}
    >
      {projects.map((project) => (
        <ProjectCard project={project} key={project.id} defaultExpanded />
      ))}

      {loading && <LoadingSpinner message="Loading projects..." />}

      {noProjects && (
        <EmptyState
          icon="pi pi-folder-open"
          title="No Projects Found"
          description="Try adjusting your filters or add the first project!"
        />
      )}

      {reachedEnd && projects.length > 0 && (
        <p className="text-center text-gray-400 py-4 text-sm">
          You've reached the end!
        </p>
      )}
    </div>
  );
};
