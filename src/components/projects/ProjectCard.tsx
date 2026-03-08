import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel } from 'primereact/panel';
import { Chip } from 'primereact/chip';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { confirmDialog } from 'primereact/confirmdialog';
import { formatDistanceToNow, format } from 'date-fns';
import _ from 'lodash';
import { Project } from '../../types/project';
import { useAuthContext, useStoreContext } from '../../contexts';
import { useBookmarks } from '../../hooks/useBookmarks';
import { analyticsService } from '../../services/analytics.service';
import { githubService } from '../../services/github.service';

interface ProjectCardProps {
  project: Project;
}

const STATUS_SEVERITY: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
  active: 'success',
  new: 'info',
  'seeking-maintainer': 'warning',
  archived: 'danger',
};

/**
 * Expandable project card showing all key project information.
 */
export const ProjectCard: FC<ProjectCardProps> = ({ project }) => {
  const { user } = useAuthContext();
  const { deleteProject } = useStoreContext();
  const { isBookmarked, toggleBookmark } = useBookmarks(user?.uid ?? null);
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const isOwner = user?.uid === project.authorId;
  const createdDate = project.createdAt?.toDate?.()
    ? project.createdAt.toDate()
    : new Date();

  const handleDelete = () => {
    confirmDialog({
      message: 'Are you sure you want to delete this project?',
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: () => deleteProject(project.id),
    });
  };

  const handleGithubClick = () => {
    analyticsService.recordGithubClick(project.id);
    window.open(project.githubRepository, '_blank');
  };

  const handleWebsiteClick = () => {
    analyticsService.recordWebsiteClick(project.id);
    window.open(project.homePage, '_blank');
  };

  const headerTemplate = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <span className="font-bold text-lg">{project.name}</span>
        <Tag
          value={_.startCase(project.status)}
          severity={STATUS_SEVERITY[project.status] ?? 'info'}
          className="text-xs"
        />
        <Tag
          value={_.startCase(project.category)}
          className="text-xs bg-purple-100 text-purple-700"
        />
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <i className="pi pi-eye" /> {project.viewCount}
        </span>
        <span className="flex items-center gap-1">
          <i className="pi pi-heart" /> {project.interestCount}
        </span>
        <span className="flex items-center gap-1">
          <i className="pi pi-comments" /> {project.commentCount}
        </span>
        <span className="flex items-center gap-1">
          <i className="pi pi-bookmark" /> {project.bookmarkCount}
        </span>
      </div>
    </div>
  );

  return (
    <Panel
      header={headerTemplate}
      toggleable
      collapsed={!expanded}
      onToggle={(e) => setExpanded(!e.value)}
    >
      {/* Author & Meta */}
      <div className="flex flex-wrap gap-2 items-center">
        <Chip
          label={project.authorUsername}
          image={githubService.getAvatarUrl(project.authorUsername)}
          className="cursor-pointer"
          onClick={() => navigate(`/profile/${project.authorId}`)}
        />
        <Chip
          label={formatDistanceToNow(createdDate, { addSuffix: true })}
          icon="pi pi-clock"
        />
        <Chip label={format(createdDate, 'PPp')} icon="pi pi-calendar" />
        {project.license && (
          <Chip label={project.license} icon="pi pi-file" />
        )}
        {project.timeCommitment && (
          <Chip
            label={`~${project.timeCommitment}/week`}
            icon="pi pi-hourglass"
          />
        )}
        {project.maintainerCount > 0 && (
          <Chip
            label={`${project.maintainerCount} maintainer${project.maintainerCount > 1 ? 's' : ''}`}
            icon="pi pi-users"
          />
        )}
      </div>

      {/* Description */}
      <div
        className="mt-3 mx-2 prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: project.description }}
      />

      <Divider />

      {/* Links */}
      <div className="flex flex-row gap-3">
        <Button
          label="GitHub"
          icon="pi pi-github"
          severity="secondary"
          size="small"
          onClick={handleGithubClick}
        />
        {project.homePage && (
          <Button
            label="Website"
            icon="pi pi-globe"
            severity="info"
            size="small"
            onClick={handleWebsiteClick}
          />
        )}
        {project.contributingGuideUrl && (
          <Button
            label="Contributing Guide"
            icon="pi pi-book"
            severity="help"
            size="small"
            onClick={() =>
              window.open(project.contributingGuideUrl, '_blank')
            }
          />
        )}
      </div>

      {/* Skill Level */}
      <div className="mt-3">
        <b className="text-sm">Required Skill Level: {project.skillLevel}/10</b>
        <ProgressBar
          className="mt-1"
          value={project.skillLevel * 10}
          showValue={false}
        />
      </div>

      {/* Languages */}
      <div className="flex flex-row mt-3 items-center gap-2 flex-wrap">
        <b className="text-sm">Languages:</b>
        {project.languages.map((language) => (
          <Chip
            className="bg-slate-300 text-xs"
            key={language}
            label={_.startCase(language)}
          />
        ))}
      </div>

      <Divider />

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            label="Details"
            icon="pi pi-info-circle"
            size="small"
            severity="info"
            outlined
            onClick={() => navigate(`/project/${project.id}`)}
          />
          <Button
            icon={isBookmarked(project.id) ? 'pi pi-bookmark-fill' : 'pi pi-bookmark'}
            size="small"
            severity="warning"
            outlined
            tooltip={isBookmarked(project.id) ? 'Remove Bookmark' : 'Bookmark'}
            onClick={() =>
              toggleBookmark(
                project.id,
                project.name,
                project.authorUsername,
              )
            }
          />
        </div>

        {isOwner && (
          <div className="flex gap-2">
            <Button
              label="Analytics"
              icon="pi pi-chart-line"
              size="small"
              severity="help"
              outlined
              onClick={() => navigate(`/project/${project.id}/analytics`)}
            />
            <Button
              label="Delete"
              icon="pi pi-trash"
              size="small"
              severity="danger"
              onClick={handleDelete}
            />
          </div>
        )}
      </div>
    </Panel>
  );
};
