import { FC, useEffect, useState } from 'react';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { Image } from 'primereact/image';
import { useAuthContext } from '../../contexts';
import { projectService } from '../../services/project.service';
import { Project } from '../../types/project';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

/**
 * Right sidebar showing sponsors, ads, and smart recommendations.
 */
export const RightSidebar: FC = () => {
  const { user } = useAuthContext();
  const [recommended, setRecommended] = useState<Project[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      setRecommended([]);
      return;
    }

    let cancelled = false;
    setLoadingRecs(true);

    projectService
      .getRecommendedProjects(
        user.skills,
        user.experienceLevel,
        user.uid,
      )
      .then((projects) => {
        if (!cancelled) setRecommended(projects);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoadingRecs(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <aside className="w-1/5 bg-slate-100 min-h-[90vh] max-h-[90vh] rounded-l-lg p-4 flex flex-col gap-3 overflow-auto">
      {/* Sponsors */}
      <Card title="Sponsors" className="text-sm">
        <p className="m-0">@himanshurajora</p>
      </Card>

      {/* Recommendations */}
      {user && (
        <Card title="Recommended For You" className="text-sm">
          {loadingRecs ? (
            <LoadingSpinner message="Finding matches..." />
          ) : recommended.length > 0 ? (
            <div className="flex flex-col gap-2">
              {recommended.map((project) => (
                <div
                  key={project.id}
                  className="p-2 bg-white rounded cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  <p className="font-semibold text-sm truncate">
                    {project.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    by {project.authorUsername} · Level {project.skillLevel}
                  </p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {project.languages.slice(0, 3).map((lang) => (
                      <span
                        key={lang}
                        className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">
              Update your profile skills to get recommendations.
            </p>
          )}
        </Card>
      )}

      {/* Promotions */}
      <Card title="Promotions" className="text-sm">
        <div className="flex flex-col justify-center">
          <p className="m-0">Place your advertisement here</p>
          <Image
            className="mt-3 flex justify-center items-center"
            src="/logo.png"
            alt="Ad placeholder"
            width="100"
            preview
          />
        </div>
        <Divider />
        <a
          className="break-words text-sm"
          href="mailto:contact@himanshujangid.com"
        >
          contact@himanshujangid.com
        </a>
      </Card>
    </aside>
  );
};
