import { FC, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Panel } from 'primereact/panel';
import { Button } from 'primereact/button';
import { Chip } from 'primereact/chip';
import { ProgressBar } from 'primereact/progressbar';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { TabView, TabPanel } from 'primereact/tabview';
import { formatDistanceToNow, format } from 'date-fns';
import _ from 'lodash';
import { Project } from '../../types/project';
import { projectService } from '../../services/project.service';
import { githubService, RepoInfo } from '../../services/github.service';
import { useAuthContext } from '../../contexts';
import { useBookmarks } from '../../hooks/useBookmarks';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { CommentSection } from '../comments/CommentSection';
import { InterestSection } from '../projects/InterestSection';
import { IssueList } from '../issues/IssueList';
import { analyticsService } from '../../services/analytics.service';

/**
 * Full project detail page with tabs for discussion, issues, and contributors.
 */
export const ProjectDetail: FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { isBookmarked, toggleBookmark } = useBookmarks(user?.uid ?? null);
  const [project, setProject] = useState<Project | null>(null);
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    let cancelled = false;
    setLoading(true);

    const load = async () => {
      try {
        const proj = await projectService.getProject(projectId);
        if (cancelled) return;
        setProject(proj);

        // Record view
        await projectService.recordView(projectId, user?.uid ?? null);

        // Fetch GitHub info
        if (proj?.githubRepository) {
          const info = await githubService.getRepoInfo(proj.githubRepository);
          if (!cancelled) setRepoInfo(info);
        }
      } catch (error) {
        console.error('Failed to load project:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [projectId, user?.uid]);

  if (loading) return <LoadingSpinner fullPage message="Loading project..." />;
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <i className="pi pi-times-circle text-5xl text-red-400" />
        <h2 className="text-xl font-bold text-gray-600">Project Not Found</h2>
        <Button label="Back to Home" onClick={() => navigate('/')} />
      </div>
    );
  }

  const isOwner = user?.uid === project.authorId;
  const createdDate = project.createdAt?.toDate?.()
    ? project.createdAt.toDate()
    : new Date();

  return (
    <div className="max-w-5xl mx-auto px-3 py-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
            <h1 className="text-xl sm:text-3xl font-bold">{project.name}</h1>
            <Tag value={_.startCase(project.status)} severity="info" />
            <Tag value={_.startCase(project.category)} className="bg-purple-100 text-purple-700" />
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-sm flex-wrap">
            <Chip
              label={project.authorUsername}
              image={githubService.getAvatarUrl(project.authorUsername)}
              className="cursor-pointer"
              onClick={() => navigate(`/profile/${project.authorId}`)}
            />
            <span className="hidden sm:inline">·</span>
            <span>{formatDistanceToNow(createdDate, { addSuffix: true })}</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">{format(createdDate, 'PPp')}</span>
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Button
            icon={isBookmarked(project.id) ? 'pi pi-bookmark-fill' : 'pi pi-bookmark'}
            severity="warning"
            outlined
            onClick={() =>
              toggleBookmark(project.id, project.name, project.authorUsername)
            }
          />
          <Button
            label="Back"
            icon="pi pi-arrow-left"
            severity="secondary"
            outlined
            onClick={() => navigate('/')}
          />
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
        <div className="text-center">
          <div className="text-lg font-bold">{project.viewCount}</div>
          <div className="text-xs text-gray-500">Views</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">{project.interestCount}</div>
          <div className="text-xs text-gray-500">Interested</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">{project.commentCount}</div>
          <div className="text-xs text-gray-500">Comments</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">{project.bookmarkCount}</div>
          <div className="text-xs text-gray-500">Bookmarked</div>
        </div>
        {repoInfo && (
          <>
            <div className="text-center">
              <div className="text-lg font-bold">{repoInfo.stars}</div>
              <div className="text-xs text-gray-500">GitHub Stars</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{repoInfo.forks}</div>
              <div className="text-xs text-gray-500">Forks</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{repoInfo.openIssues}</div>
              <div className="text-xs text-gray-500">Open Issues</div>
            </div>
          </>
        )}
      </div>

      {/* Project Info */}
      <Panel header="About" className="mb-4">
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: project.description }}
        />
        <Divider />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <b className="text-sm">Skill Level: {project.skillLevel}/10</b>
            <ProgressBar
              className="mt-1"
              value={project.skillLevel * 10}
              showValue={false}
            />
          </div>
          <div>
            <b className="text-sm">Languages:</b>
            <div className="flex gap-1 mt-1 flex-wrap">
              {project.languages.map((lang) => (
                <Chip key={lang} label={_.startCase(lang)} className="bg-slate-200 text-xs" />
              ))}
            </div>
          </div>
        </div>

        <Divider />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {project.license && (
            <div>
              <span className="text-gray-500">License:</span>
              <span className="ml-1 font-semibold">{project.license}</span>
            </div>
          )}
          {project.timeCommitment && (
            <div>
              <span className="text-gray-500">Time:</span>
              <span className="ml-1 font-semibold">~{project.timeCommitment}/week</span>
            </div>
          )}
          <div>
            <span className="text-gray-500">Maintainers:</span>
            <span className="ml-1 font-semibold">{project.maintainerCount}</span>
          </div>
        </div>

        <Divider />

        <div className="flex gap-2 sm:gap-3 flex-wrap">
          <Button
            label="GitHub Repository"
            icon="pi pi-github"
            severity="secondary"
            onClick={() => {
              analyticsService.recordGithubClick(project.id);
              window.open(project.githubRepository, '_blank');
            }}
          />
          {project.homePage && (
            <Button
              label="Website"
              icon="pi pi-globe"
              severity="info"
              onClick={() => {
                analyticsService.recordWebsiteClick(project.id);
                window.open(project.homePage, '_blank');
              }}
            />
          )}
          {project.contributingGuideUrl && (
            <Button
              label="Contributing Guide"
              icon="pi pi-book"
              severity="help"
              onClick={() =>
                window.open(project.contributingGuideUrl, '_blank')
              }
            />
          )}
        </div>
      </Panel>

      {/* Tabbed Sections */}
      <TabView>
        <TabPanel header="Discussion" leftIcon="pi pi-comments mr-2">
          <CommentSection projectId={project.id} />
        </TabPanel>

        <TabPanel header="Contributors" leftIcon="pi pi-users mr-2">
          <InterestSection project={project} />
        </TabPanel>

        <TabPanel header="Issues / Tasks" leftIcon="pi pi-list mr-2">
          <IssueList project={project} />
        </TabPanel>
      </TabView>
    </div>
  );
};
