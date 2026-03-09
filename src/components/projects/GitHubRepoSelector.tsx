import { Button } from 'primereact/button';
import { DataView } from 'primereact/dataview';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { githubService, UserRepo } from '../../services/github.service';

interface GitHubRepoSelectorProps {
  /** GitHub username to fetch repos for. */
  username: string;
  /** Called when the user selects a repo to import. */
  onSelect: (repo: UserRepo) => void;
  /** Called to dismiss/collapse the selector. */
  onClose: () => void;
}

/**
 * Fetches and displays the user's public GitHub repos.
 * Allows filtering and selection to pre-fill the Add Project form.
 */
export const GitHubRepoSelector: FC<GitHubRepoSelectorProps> = ({
  username,
  onSelect,
  onClose,
}) => {
  const [repos, setRepos] = useState<UserRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  const fetchRepos = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    setError('');
    try {
      const data = await githubService.getUserRepos(username);
      setRepos(data);
      if (data.length === 0) {
        setError('No public repositories found.');
      }
    } catch {
      setError('Failed to fetch repositories. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchRepos();
  }, [fetchRepos]);

  const filteredRepos = useMemo(() => {
    if (!filter.trim()) return repos;
    const q = filter.toLowerCase();
    return repos.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.language.toLowerCase().includes(q) ||
        r.topics.some((t) => t.includes(q)),
    );
  }, [repos, filter]);

  const repoTemplate = (repo: UserRepo) => (
    <div
      key={repo.fullName}
      className="flex items-start gap-3 p-3 border-b border-gray-200 hover:bg-blue-50 transition-colors cursor-pointer rounded"
      onClick={() => onSelect(repo)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(repo);
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-blue-700 truncate">
            {repo.name}
          </span>
          {repo.language && (
            <Tag
              value={repo.language}
              severity="info"
              className="text-xs"
            />
          )}
          {repo.license && (
            <Tag
              value={repo.license}
              severity="success"
              className="text-xs"
            />
          )}
        </div>
        {repo.description && (
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
            {repo.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <i className="pi pi-star-fill text-yellow-500" style={{ fontSize: '0.7rem' }} />
            {repo.stars}
          </span>
          <span className="flex items-center gap-1">
            <i className="pi pi-code" style={{ fontSize: '0.7rem' }} />
            {repo.forks} forks
          </span>
          <span className="flex items-center gap-1">
            <i className="pi pi-exclamation-circle" style={{ fontSize: '0.7rem' }} />
            {repo.openIssues} issues
          </span>
        </div>
      </div>
      <Button
        icon="pi pi-download"
        severity="info"
        text
        rounded
        size="small"
        tooltip="Import this repository"
        tooltipOptions={{ position: 'left' }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(repo);
        }}
      />
    </div>
  );

  return (
    <div className="border border-blue-200 rounded-lg bg-blue-50/50 p-3 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <i className="pi pi-github text-lg" />
          <span className="font-semibold text-sm">
            Import from GitHub
          </span>
          <span className="text-xs text-gray-500">
            ({filteredRepos.length} repos)
          </span>
        </div>
        <Button
          icon="pi pi-times"
          text
          rounded
          size="small"
          severity="secondary"
          onClick={onClose}
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-6">
          <ProgressSpinner style={{ width: '32px', height: '32px' }} />
          <span className="ml-2 text-sm text-gray-600">
            Fetching repositories…
          </span>
        </div>
      )}

      {error && !loading && (
        <Message severity="warn" text={error} className="w-full mb-2" />
      )}

      {!loading && repos.length > 0 && (
        <>
          <InputText
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter repositories…"
            className="w-full mb-2 p-inputtext-sm"
          />
          <div className="max-h-64 overflow-y-auto">
            <DataView
              value={filteredRepos}
              itemTemplate={repoTemplate}
              emptyMessage="No repos match your filter."
            />
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Click a repository to auto-fill the form below
          </p>
        </>
      )}
    </div>
  );
};
