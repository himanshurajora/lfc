import { FC, useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import toast from 'react-hot-toast';

import { useAuthContext } from '../../contexts';
import { analyticsService } from '../../services/analytics.service';
import { projectService } from '../../services/project.service';
import { Project } from '../../types/project';
import { ProjectAnalytics } from '../../types/analytics';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';

interface DailyViewData {
  date: string;
  views: number;
}

/**
 * Analytics dashboard for project owners to view project performance metrics.
 * Accessible via /project/:projectId/analytics.
 */
export const AnalyticsDashboard: FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuthContext();

  const [project, setProject] = useState<Project | null>(null);
  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null);
  const [authorStats, setAuthorStats] = useState<{
    totalViews: number;
    totalInterests: number;
    totalBookmarks: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [proj, projAnalytics] = await Promise.all([
        projectService.getProject(projectId),
        analyticsService.getAnalytics(projectId),
      ]);

      setProject(proj);
      setAnalytics(projAnalytics);

      // Fetch author-level stats if we're the owner
      if (proj && user && proj.authorId === user.uid) {
        const stats = await analyticsService.getAuthorAnalytics(user.uid);
        setAuthorStats(stats);
      }
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [projectId, user]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) return <LoadingSpinner message="Loading analytics..." />;

  if (!project) {
    return (
      <EmptyState
        icon="pi pi-chart-bar"
        title="Project Not Found"
        description="The project analytics you are looking for does not exist."
      />
    );
  }

  const isOwner = user?.uid === project.authorId;

  if (!isOwner) {
    return (
      <EmptyState
        icon="pi pi-lock"
        title="Access Denied"
        description="Only the project owner can view analytics."
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-3 py-4 sm:p-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to="/" className="hover:text-indigo-600">
          Home
        </Link>
        <i className="pi pi-angle-right text-xs" />
        <Link
          to={`/project/${projectId}`}
          className="hover:text-indigo-600"
        >
          {project.name}
        </Link>
        <i className="pi pi-angle-right text-xs" />
        <span className="text-gray-800 font-medium">Analytics</span>
      </div>

      <h1 className="text-2xl font-bold mb-6">
        <i className="pi pi-chart-bar text-indigo-600 mr-2" />
        Analytics – {project.name}
      </h1>

      {/* Overall Project Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Total Views"
          value={analytics?.totalViews ?? project.viewCount ?? 0}
          icon="pi pi-eye"
          color="text-blue-500"
        />
        <MetricCard
          label="Interests"
          value={project.interestCount ?? 0}
          icon="pi pi-heart"
          color="text-pink-500"
        />
        <MetricCard
          label="Bookmarks"
          value={project.bookmarkCount ?? 0}
          icon="pi pi-bookmark"
          color="text-yellow-500"
        />
        <MetricCard
          label="GitHub Clicks"
          value={analytics?.githubClicks ?? 0}
          icon="pi pi-external-link"
          color="text-green-500"
        />
      </div>

      {/* View Trend (Simple Bar/Text Representation) */}
      <Card className="mb-6">
        <h3 className="font-semibold mb-3">Views – Last 7 Days</h3>
        <ViewsChart analytics={analytics} />
      </Card>

      {/* Engagement Breakdown */}
      <Card className="mb-6">
        <h3 className="font-semibold mb-3">Engagement Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">
              Engagement Summary
            </h4>
            <ul className="space-y-1 text-sm">
              <li className="flex justify-between">
                <span className="text-gray-600">GitHub Clicks</span>
                <span className="font-medium">{analytics?.githubClicks ?? 0}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Website Clicks</span>
                <span className="font-medium">{analytics?.websiteClicks ?? 0}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Unique Viewers</span>
                <span className="font-medium">{analytics?.uniqueViewers?.length ?? 0}</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">
              Project Details
            </h4>
            <ul className="space-y-1 text-sm">
              <li className="flex justify-between">
                <span className="text-gray-600">Language</span>
                <span className="font-medium">{project.languages.join(', ')}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Category</span>
                <span className="font-medium">{project.category ?? 'N/A'}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="font-medium">{project.status ?? 'N/A'}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Contributors Needed</span>
                <span className="font-medium">
                  {project.maintainerCount ?? 'N/A'}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Author-level Stats */}
      {authorStats && (
        <>
          <Divider />
          <h2 className="text-lg font-bold mb-4">
            Your Overall Stats (All Projects)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <MetricCard
              label="All Views"
              value={authorStats.totalViews}
              icon="pi pi-eye"
              color="text-blue-500"
            />
            <MetricCard
              label="All Interests"
              value={authorStats.totalInterests}
              icon="pi pi-heart"
              color="text-pink-500"
            />
            <MetricCard
              label="All Bookmarks"
              value={authorStats.totalBookmarks}
              icon="pi pi-bookmark"
              color="text-yellow-500"
            />
          </div>
        </>
      )}
    </div>
  );
};

/** Metric card display */
const MetricCard: FC<{
  label: string;
  value: number;
  icon: string;
  color: string;
}> = ({ label, value, icon, color }) => (
  <div className="bg-white rounded-lg shadow p-4 text-center">
    <i className={`${icon} ${color} text-xl`} />
    <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
    <p className="text-xs text-gray-500">{label}</p>
  </div>
);

/**
 * Simple text-based views chart for the last 7 days.
 * Uses a CSS bar representation — no external chart library needed.
 */
const ViewsChart: FC<{ analytics: ProjectAnalytics | null }> = ({
  analytics,
}) => {
  const days: DailyViewData[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = subDays(new Date(), i);
    const key = format(day, 'yyyy-MM-dd');
    days.push({
      date: format(day, 'EEE, MMM d'),
      views: analytics?.viewsByDay?.[key] ?? 0,
    });
  }

  const maxViews = Math.max(...days.map((d) => d.views), 1);

  return (
    <div className="space-y-2">
      {days.map((day) => (
        <div key={day.date} className="flex items-center gap-3">
          <span className="w-28 text-xs text-gray-600 flex-shrink-0">
            {day.date}
          </span>
          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all"
              style={{
                width: `${(day.views / maxViews) * 100}%`,
                minWidth: day.views > 0 ? '1rem' : '0',
              }}
            />
          </div>
          <span className="w-8 text-xs font-medium text-right">
            {day.views}
          </span>
        </div>
      ))}
    </div>
  );
};
