import { Chip } from 'primereact/chip';
import { Divider } from 'primereact/divider';
import { Panel } from 'primereact/panel';
import { ProgressBar } from 'primereact/progressbar';
import { FC } from 'react';
import { ProjectsResponse, UsersResponse } from './db.types';
import { getGithubProfileUrl } from './utils';
import _ from 'lodash';

export interface ProjectCardProps {
  project: ProjectsResponse<{ author: UsersResponse }>;
  key: string | number;
}

export const ProjectCard: FC<ProjectCardProps> = ({ project }) => {
  return (
    <Panel header={project.name}>
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
          target="_blank"
        >
          GitHub
        </a>
        {project.home_page && (
          <a
            className="p-button p-button-info"
            href={project.home_page}
            target="_blank"
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
          return <Chip className="bg-slate-300" key={index} label={language} />;
        })}
      </div>
    </Panel>
  );
};
