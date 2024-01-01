import * as _ from 'lodash';
import { Checkbox, CheckboxChangeEvent } from 'primereact/checkbox';
import { RadioButton, RadioButtonChangeEvent } from 'primereact/radiobutton';
import { Skeleton } from 'primereact/skeleton';
import { Card } from 'primereact/card';
import { Slider, SliderChangeEvent } from 'primereact/slider';
import { FC, useEffect, useState } from 'react';
import { ProjectCard } from './ProjectCard';
import { client } from './db';
import {
  Collections,
  ProjectsLanguagesOptions,
  ProjectsResponse,
  UsersResponse,
} from './db.types';

export interface DashboardProps {
  globalSearch: string;
}

export const Dashboard: FC<DashboardProps> = ({ globalSearch }) => {
  const [projects, setProjects] = useState<
    ProjectsResponse<{ author: UsersResponse }>[] | null
  >(null);

  const [languages] = useState(_.values(ProjectsLanguagesOptions));
  const [sortOptions] = useState(['recent', 'oldest']);

  const [filters, setFilters] = useState<{
    skill_level_range: [number, number];
    languages: string[];
    sortOption: string;
  }>({
    skill_level_range: [0, 100],
    languages: [],
    sortOption: 'recent',
  });

  useEffect(() => {
    setProjects(null);
    let raw_filter = `skill_level >= ${
      filters.skill_level_range[0] / 10
    } && skill_level <= ${filters.skill_level_range[1] / 10}`;

    if (filters.languages.length) {
      raw_filter += `&& (${_.join(
        _.map(filters.languages, (language) => {
          return `languages~'${language}'`;
        }),
        ' || '
      )})`;
    }

    if (globalSearch) {
      raw_filter += `&& (name ~ '%${globalSearch}%' || description ~ '%${globalSearch}%' || languages ~ '%${globalSearch}%' || author.username ~ '%${globalSearch}%' || author.name ~ '%${globalSearch}%')`;
    }

    let sortBy = '';

    if (filters.sortOption) {
      if (filters.sortOption === 'recent') {
        sortBy += `-created`;
      }
      if (filters.sortOption === 'oldest') {
        sortBy += `created`;
      }
    }

    client
      .collection(Collections.Projects)
      .getFullList<ProjectsResponse<{ author: UsersResponse }>>({
        expand: 'author',
        filter: raw_filter,
        sort: sortBy,
      })
      .then((projects) => {
        setProjects(projects);
      })
      .catch((err) => {
        console.log(err);
        setProjects(null);
      });
  }, [filters, globalSearch]);

  const handleSkillRangeChange = (sliderChangeEvent: SliderChangeEvent) => {
    setFilters({
      ...filters,
      skill_level_range: sliderChangeEvent.value as [number, number],
    });
  };

  const handleLanguageSelection = (event: CheckboxChangeEvent) => {
    if (!event.checked) {
      setFilters({
        ...filters,
        languages: _.filter(
          filters.languages,
          (language) => language !== event.value
        ),
      });
    } else {
      setFilters({
        ...filters,
        languages: [...filters.languages, event.value],
      });
    }
  };

  const handleSortOptionSelection = (event: RadioButtonChangeEvent) => {
    setFilters({ ...filters, sortOption: event.value });
  };

  return (
    <div className="min-w-full mt-2 flex justify-center z-10">
      <div className="w-1/5 min-h-[90vh] max-h-[90vh] bg-slate-100 rounded-r-lg py-3 px-2 flex flex-col gap-5">
        <div className="flex flex-col gap-1 bg-slate-200 px-1 py-2">
          <b className="ml-4">Skill Level:</b>
          <Slider
            className="mt-2 mx-6"
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
        <div className="flex flex-col gap-3 px-5">
          <div>
            <b>Languages:</b>
          </div>
          <div className="flex flex-wrap justify-content-center gap-3">
            {_.map(languages, (language) => {
              return (
                <div className="flex align-items-center">
                  <Checkbox
                    inputId={language}
                    name={language}
                    value={language}
                    onChange={handleLanguageSelection}
                    checked={filters.languages.includes(language)}
                  />
                  <label htmlFor="ingredient1" className="ml-2">
                    {_.startCase(language)}
                  </label>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-3 px-5">
          <div>
            <b>Order By:</b>
          </div>
          <div className="flex flex-wrap justify-content-center gap-3">
            {_.map(sortOptions, (option) => {
              return (
                <div className="flex align-items-center">
                  <RadioButton
                    inputId={option}
                    name={option}
                    value={option}
                    onChange={handleSortOptionSelection}
                    checked={option === filters.sortOption}
                  />
                  <label htmlFor="ingredient1" className="ml-2">
                    {_.startCase(option)}
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      </div>
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
      <div className="w-1/5 bg-slate-100 min-h-[90vh] max-h-[90vh] rounded-l-lg p-4 flex flex-col gap-2 overflow-auto">
        <div className="card">
          <Card title="Sponsors">
            <p className="m-0">@himanshurajora</p>
          </Card>
        </div>
        <div className="card">
          <Card title="Promotions">
            <p className="m-0"> Place your Advertisement here</p>
          </Card>
        </div>
      </div>
    </div>
  );
};
