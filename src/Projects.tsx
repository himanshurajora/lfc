import _ from 'lodash';
import { useContext } from 'react';
import { ProjectCard } from './ProjectCard';
import { StoreContext } from './StoreContext';

export const Projects = () => {
  const { projects, nextPage } = useContext(StoreContext);

  const handleScroll = (e: any) => {
    const bottom =
      e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
    if (bottom) {
      nextPage();
    }
  };
  return (
    <div
      className="w-full flex-1 flex flex-col p-5 gap-3 max-h-[90vh] overflow-auto"
      onScroll={handleScroll}
    >
      {projects &&
        _.map(projects, (project, index) => {
          return <ProjectCard project={project} key={index}></ProjectCard>;
        })}
    </div>
  );
};
