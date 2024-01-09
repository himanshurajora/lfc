import _ from 'lodash';
import { ProgressSpinner } from 'primereact/progressspinner';
import { UIEvent, useContext, useEffect, useState } from 'react';
import { ProjectCard } from './ProjectCard';
import { StoreContext } from './StoreContext';

export const Projects = () => {
  const { projects, nextPage, loading, isLastPage } = useContext(StoreContext);
  const [end, setEnd] = useState(false);
  const handleScroll = async (e: UIEvent<HTMLDivElement>) => {
    if (loading && isLastPage) return;
    if (!e || !e.target) return;
    const target = e.target as HTMLDivElement;
    const bottom =
      target.scrollHeight - target.scrollTop === target.clientHeight;
    if (bottom) {
      const hasData = await nextPage();
      console.log({ hasData });
      if (!hasData) {
        setEnd(true);
      } else {
        setEnd(false);
      }
    }
  };

  useEffect(() => {
    if (loading) setEnd(false);
  }, [loading]);

  const noProjects = !loading && !!projects && !projects.length;

  return (
    <div
      className="w-full flex-1 flex flex-col p-5 gap-3 max-h-[90vh] overflow-auto"
      onScroll={handleScroll}
    >
      {projects &&
        _.map(projects, (project, index) => {
          return <ProjectCard project={project} key={index}></ProjectCard>;
        })}
      {!isLastPage && !noProjects && !end && (
        <div className="w-full flex flex-col gap-3">
          <ProgressSpinner />
        </div>
      )}
      {noProjects && (
        <div className="flex w-full justify-center">No Projects</div>
      )}
    </div>
  );
};
