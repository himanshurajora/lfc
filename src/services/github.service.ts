import { Octokit } from '@octokit/rest';

/** Cache expiry in milliseconds (5 minutes). */
const CACHE_TTL = 5 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/** Create an Octokit instance, optionally using a user-provided token. */
function createOctokit(): Octokit {
  const token = import.meta.env.VITE_GITHUB_TOKEN;
  return new Octokit(token ? { auth: token } : {});
}

export interface RepoInfo {
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string;
  license: string;
  updatedAt: string;
  topics: string[];
  defaultBranch: string;
}

export interface RepoContributor {
  login: string;
  avatarUrl: string;
  contributions: number;
  profileUrl: string;
}

/**
 * GitHub API service with caching and rate-limit awareness.
 */
export const githubService = {
  /** Parse owner/repo from a GitHub URL. */
  parseRepoUrl(url: string): { owner: string; repo: string } | null {
    try {
      const parsed = new URL(url);
      if (!parsed.hostname.includes('github.com')) return null;
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length < 2) return null;
      return { owner: parts[0], repo: parts[1].replace('.git', '') };
    } catch {
      return null;
    }
  },

  /** Fetch repository information. */
  async getRepoInfo(repoUrl: string): Promise<RepoInfo | null> {
    const parsed = this.parseRepoUrl(repoUrl);
    if (!parsed) return null;

    const cacheKey = `repo:${parsed.owner}/${parsed.repo}`;
    const cached = getCached<RepoInfo>(cacheKey);
    if (cached) return cached;

    try {
      const octokit = createOctokit();
      const { data } = await octokit.repos.get({
        owner: parsed.owner,
        repo: parsed.repo,
      });

      const info: RepoInfo = {
        fullName: data.full_name,
        description: data.description ?? '',
        stars: data.stargazers_count,
        forks: data.forks_count,
        openIssues: data.open_issues_count,
        language: data.language ?? 'Unknown',
        license: data.license?.spdx_id ?? 'None',
        updatedAt: data.updated_at,
        topics: data.topics ?? [],
        defaultBranch: data.default_branch,
      };

      setCache(cacheKey, info);
      return info;
    } catch (error) {
      console.error('Failed to fetch repo info:', error);
      return null;
    }
  },

  /** Fetch repository contributors. */
  async getContributors(
    repoUrl: string,
    limitCount: number = 10,
  ): Promise<RepoContributor[]> {
    const parsed = this.parseRepoUrl(repoUrl);
    if (!parsed) return [];

    const cacheKey = `contributors:${parsed.owner}/${parsed.repo}`;
    const cached = getCached<RepoContributor[]>(cacheKey);
    if (cached) return cached;

    try {
      const octokit = createOctokit();
      const { data } = await octokit.repos.listContributors({
        owner: parsed.owner,
        repo: parsed.repo,
        per_page: limitCount,
      });

      const contributors: RepoContributor[] = data.map((c) => ({
        login: c.login ?? 'unknown',
        avatarUrl: c.avatar_url ?? '',
        contributions: c.contributions,
        profileUrl: c.html_url ?? '',
      }));

      setCache(cacheKey, contributors);
      return contributors;
    } catch (error) {
      console.error('Failed to fetch contributors:', error);
      return [];
    }
  },

  /** Fetch open issues from the repository. */
  async getOpenIssues(
    repoUrl: string,
    labels?: string[],
    limitCount: number = 10,
  ): Promise<Array<{
    number: number;
    title: string;
    url: string;
    labels: string[];
    createdAt: string;
  }>> {
    const parsed = this.parseRepoUrl(repoUrl);
    if (!parsed) return [];

    const labelStr = labels?.join(',') ?? '';
    const cacheKey = `issues:${parsed.owner}/${parsed.repo}:${labelStr}`;
    const cached = getCached<Array<{ number: number; title: string; url: string; labels: string[]; createdAt: string }>>(cacheKey);
    if (cached) return cached;

    try {
      const octokit = createOctokit();
      const { data } = await octokit.issues.listForRepo({
        owner: parsed.owner,
        repo: parsed.repo,
        state: 'open',
        labels: labelStr || undefined,
        per_page: limitCount,
        sort: 'created',
        direction: 'desc',
      });

      const issues = data
        .filter((issue) => !issue.pull_request)
        .map((issue) => ({
          number: issue.number,
          title: issue.title,
          url: issue.html_url ?? '',
          labels: issue.labels
            .map((l) => (typeof l === 'string' ? l : l.name ?? ''))
            .filter(Boolean),
          createdAt: issue.created_at,
        }));

      setCache(cacheKey, issues);
      return issues;
    } catch (error) {
      console.error('Failed to fetch issues:', error);
      return [];
    }
  },

  /** Get the GitHub avatar URL for a username. */
  getAvatarUrl(username: string): string {
    return `https://github.com/${username}.png`;
  },

  /** Get the rate-limit status. */
  async getRateLimit(): Promise<{ remaining: number; limit: number; reset: Date } | null> {
    try {
      const octokit = createOctokit();
      const { data } = await octokit.rateLimit.get();
      return {
        remaining: data.resources.core.remaining,
        limit: data.resources.core.limit,
        reset: new Date(data.resources.core.reset * 1000),
      };
    } catch {
      return null;
    }
  },
};
