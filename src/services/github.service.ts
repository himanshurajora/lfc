import { Octokit } from '@octokit/rest';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '../types/project';

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

/** Lightweight repo info returned for the "import from GitHub" picker. */
export interface UserRepo {
  name: string;
  fullName: string;
  description: string;
  htmlUrl: string;
  homepage: string;
  language: string;
  languages: SupportedLanguage[];
  license: string;
  stars: number;
  forks: number;
  openIssues: number;
  topics: string[];
  archived: boolean;
  updatedAt: string;
}

/**
 * Map a GitHub language string to the closest SupportedLanguage value.
 * Returns `'other'` if no match is found.
 */
function mapGitHubLanguage(lang: string | null): SupportedLanguage {
  if (!lang) return 'other';

  const lower = lang.toLowerCase();

  // Direct matches
  const supported = SUPPORTED_LANGUAGES as readonly string[];
  if (supported.includes(lower)) return lower as SupportedLanguage;

  // Common GitHub → LFC mappings
  const aliases: Record<string, SupportedLanguage> = {
    'c#': 'c#',
    'c++': 'c++',
    csharp: 'c#',
    cpp: 'c++',
    'objective-c': 'c++',
    shell: 'other',
    html: 'javascript',
    css: 'javascript',
    vue: 'javascript',
    scss: 'javascript',
  };

  return aliases[lower] ?? 'other';
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

  /**
   * Fetch all public repositories for a GitHub user.
   * Returns them sorted by stars (descending), excluding forks & archived repos.
   */
  async getUserRepos(username: string): Promise<UserRepo[]> {
    const cacheKey = `user-repos:${username}`;
    const cached = getCached<UserRepo[]>(cacheKey);
    if (cached) return cached;

    try {
      const octokit = createOctokit();
      const repos: UserRepo[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const { data } = await octokit.repos.listForUser({
          username,
          type: 'owner',
          sort: 'updated',
          direction: 'desc',
          per_page: 100,
          page,
        });

        for (const r of data) {
          if (r.fork || r.archived) continue;

          const primaryLang = mapGitHubLanguage(r.language ?? null);
          // Deduplicate while keeping 'other' only if nothing else fits
          const langs: SupportedLanguage[] = primaryLang !== 'other'
            ? [primaryLang]
            : [];

          repos.push({
            name: r.name,
            fullName: r.full_name,
            description: r.description ?? '',
            htmlUrl: r.html_url,
            homepage: r.homepage ?? '',
            language: r.language ?? '',
            languages: langs.length ? langs : ['other'],
            license: r.license?.spdx_id ?? '',
            stars: r.stargazers_count ?? 0,
            forks: r.forks_count ?? 0,
            openIssues: r.open_issues_count ?? 0,
            topics: r.topics ?? [],
            archived: r.archived ?? false,
            updatedAt: r.updated_at ?? '',
          });
        }

        hasMore = data.length === 100;
        page++;
      }

      // Sort by stars descending
      repos.sort((a, b) => b.stars - a.stars);

      setCache(cacheKey, repos);
      return repos;
    } catch (error) {
      console.error('Failed to fetch user repos:', error);
      return [];
    }
  },

  /**
   * Fetch the full language breakdown for a repo and return mapped SupportedLanguage array.
   */
  async getRepoLanguages(owner: string, repo: string): Promise<SupportedLanguage[]> {
    const cacheKey = `repo-langs:${owner}/${repo}`;
    const cached = getCached<SupportedLanguage[]>(cacheKey);
    if (cached) return cached;

    try {
      const octokit = createOctokit();
      const { data } = await octokit.repos.listLanguages({ owner, repo });

      const mapped = Object.keys(data)
        .map((lang) => mapGitHubLanguage(lang))
        .filter((l, i, arr) => arr.indexOf(l) === i) // dedupe
        .filter((l) => l !== 'other');

      const result = mapped.length ? mapped : ['other' as SupportedLanguage];
      setCache(cacheKey, result);
      return result;
    } catch {
      return ['other'];
    }
  },

  /**
   * Fetch the README content for a repo (raw text, first ~maxChars characters).
   * Returns `null` if no README exists.
   */
  async getRepoReadme(
    owner: string,
    repo: string,
    maxChars: number = 500,
  ): Promise<string | null> {
    const cacheKey = `readme:${owner}/${repo}`;
    const cached = getCached<string>(cacheKey);
    if (cached) return cached;

    try {
      const octokit = createOctokit();
      const { data } = await octokit.repos.getReadme({
        owner,
        repo,
        mediaType: { format: 'raw' },
      });

      // data is a string when mediaType format is 'raw'
      const raw = typeof data === 'string' ? data : String(data);
      if (!raw) return null;

      // Strip common markdown noise: badges, images, HTML tags, heading markers
      const cleaned = raw
        .replace(/!\[.*?\]\(.*?\)/g, '')       // images / badges
        .replace(/\[!\[.*?\]\(.*?\)\]\(.*?\)/g, '') // badge links
        .replace(/<[^>]+>/g, '')                // HTML tags
        .replace(/^#{1,6}\s+/gm, '')            // heading markers
        .replace(/\n{3,}/g, '\n\n')             // excessive blank lines
        .trim();

      // Take first maxChars, cut at last word boundary
      let excerpt = cleaned.slice(0, maxChars);
      if (cleaned.length > maxChars) {
        const lastSpace = excerpt.lastIndexOf(' ');
        if (lastSpace > maxChars * 0.6) excerpt = excerpt.slice(0, lastSpace);
        excerpt += '…';
      }

      setCache(cacheKey, excerpt);
      return excerpt;
    } catch {
      // 404 = no README, other errors are fine to swallow too
      return null;
    }
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
