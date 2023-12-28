import * as _ from 'lodash';
import { Chip } from 'primereact/chip';
import { Divider } from 'primereact/divider';
import { Panel } from 'primereact/panel';
import { Skeleton } from 'primereact/skeleton';
import { ProgressBar } from 'primereact/progressbar';

import { FC, useEffect, useState } from 'react';
import { client } from './db';
import { Collections, ProjectsResponse, UsersResponse } from './db.types';
import { getGithubProfileUrl } from './utils';
export const Dashboard: FC = () => {
  const [projects, setProjects] = useState<
    ProjectsResponse<{ author: UsersResponse }>[] | null
  >(null);

  useEffect(() => {
    client
      .collection(Collections.Projects)
      .getFullList<ProjectsResponse<{ author: UsersResponse }>>({
        expand: 'author',
      })
      .then((projects) => {
        return setProjects(projects);
      })
      .catch((err) => {
        console.log(err);
        return setProjects([]);
      });
  }, []);

  return (
    <div className="min-w-full flex justify-center">
      {/* {JSON.stringify(projects)} */}
      <div className="w-1/5"></div>
      <div className="w-full flex-1 flex flex-wrap flex-col p-5">
        {!projects && <Skeleton className="w-full min-h-40"></Skeleton>}
        {_.map(projects, (project, index) => {
          return (
            <Panel key={index} header={project.name}>
              <Chip
                label={project.expand?.author.username}
                image={getGithubProfileUrl(project.expand?.author.username)}
              />
              <p className="m-0">{project.description}</p>
              <Divider />
              <div className="flex flex-row gap-3">
                <a
                  className="p-button p-button-secondary"
                  href={project.github_repository}
                >
                  GitHub
                </a>
                {project.home_page && (
                  <a
                    className="p-button p-button-info"
                    href={project.home_page}
                  >
                    Website
                  </a>
                )}
              </div>
              <div className="flex flex-row mt-3 items-center gap-3">
                <b className="text-md" id="skill_label">
                  Required Skill Level:{' '}
                </b>
              </div>
              <ProgressBar
                className="mt-2"
                value={50}
                aria-labelledby="skill_label"
              ></ProgressBar>
              <div className="flex flex-row mt-3 items-center gap-3">
                <b className="text-md">Languages: </b>
                {_.map(project.languages, (language, index) => {
                  return (
                    <Chip
                      className="bg-slate-300"
                      key={index}
                      label={language}
                    />
                  );
                })}
              </div>
            </Panel>
          );
        })}
      </div>
      <div className="w-1/5"></div>
    </div>
  );
};
