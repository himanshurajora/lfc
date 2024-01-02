import { useContext } from 'react';
import { StoreContext } from './StoreContext';
import _ from 'lodash';
import { Skeleton } from 'primereact/skeleton';
import { ProjectCard } from './ProjectCard';

export const Projects = () => {
  const { projects } = useContext(StoreContext);
  return (
    <div className="w-full flex-1 flex flex-col p-5 gap-3 max-h-[90vh] overflow-auto">
      {!projects && (
        <div className="w-full flex flex-col gap-3">
          <Skeleton className="w-full min-h-40"></Skeleton>
          <Skeleton className="w-full min-h-40"></Skeleton>
        </div>
      )}
      {projects &&
        _.map(projects, (project, index) => {
          return <ProjectCard project={project} key={index}></ProjectCard>;
        })}
    </div>
  );
};
