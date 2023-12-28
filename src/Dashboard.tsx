import * as _ from 'lodash';
import { Skeleton } from 'primereact/skeleton';
import { Slider, SliderChangeEvent } from 'primereact/slider';
import { FC, useEffect, useState } from 'react';
import { client } from './db';
import { Collections, ProjectsResponse, UsersResponse } from './db.types';
import { ProjectCard } from './ProjectCard';
export const Dashboard: FC = () => {
  const [projects, setProjects] = useState<
    ProjectsResponse<{ author: UsersResponse }>[] | null
  >(null);

  const [filters, setFilters] = useState<{
    skill_level_range: [number, number];
  }>({
    skill_level_range: [0, 100],
  });

  useEffect(() => {
    setProjects(null);
    client
      .collection(Collections.Projects)
      .getFullList<ProjectsResponse<{ author: UsersResponse }>>({
        expand: 'author',
        filter: `skill_level >= ${
          filters.skill_level_range[0] / 10
        } && skill_level <= ${filters.skill_level_range[1] / 10}`,
      })
      .then((projects) => {
        setProjects(projects);
      })
      .catch((err) => {
        console.log(err);
        setProjects(null);
      });
  }, [filters]);

  const handleSkillRangeChange = (sliderChangeEvent: SliderChangeEvent) => {
    setFilters({
      ...filters,
      skill_level_range: sliderChangeEvent.value as [number, number],
    });
  };

  return (
    <div className="min-w-full mt-2 flex justify-center z-10">
      <div className="w-1/5 min-h-screen bg-slate-100 rounded-r-lg py-3 px-2">
        <div className="flex flex-col gap-1 bg-slate-200 px-1 py-2">
          <b className="ml-5">Skill Level:</b>
          <Slider
            className="mt-2 mr-6"
            range
            step={10}
            value={filters.skill_level_range}
            onChange={handleSkillRangeChange}
          ></Slider>
          <div className="flex flex-row justify-between px-4 mt-1">
            <b>0</b>
            <b>10</b>
          </div>
        </div>
      </div>
      <div className="w-full flex-1 flex flex-wrap flex-col p-5">
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
      <div className="w-1/5 bg-slate-100 min-h-screen rounded-l-lg"></div>
    </div>
  );
};
