import { describe, it, expect, vi, beforeEach } from 'vitest';
import { githubService } from '../../services/github.service';

// Mock Octokit
vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    repos: {
      get: vi.fn().mockResolvedValue({
        data: {
          stargazers_count: 100,
          forks_count: 25,
          open_issues_count: 10,
          description: 'A great repo',
          topics: ['react', 'typescript'],
          license: { spdx_id: 'MIT' },
          updated_at: '2024-01-01T00:00:00Z',
          default_branch: 'main',
          language: 'TypeScript',
        },
      }),
      listContributors: vi.fn().mockResolvedValue({
        data: [
          { login: 'user1', avatar_url: 'https://example.com/1.png', contributions: 50 },
          { login: 'user2', avatar_url: 'https://example.com/2.png', contributions: 20 },
        ],
      }),
    },
    issues: {
      listForRepo: vi.fn().mockResolvedValue({
        data: [
          { number: 1, title: 'Bug fix', labels: [{ name: 'good first issue' }], html_url: 'https://github.com/user/repo/issues/1' },
        ],
      }),
    },
    rateLimit: {
      get: vi.fn().mockResolvedValue({
        data: { resources: { core: { remaining: 4999, limit: 5000, reset: 0 } } },
      }),
    },
  })),
}));

describe('githubService', () => {
  beforeEach(() => {
    // Clear cache between tests
    (githubService as any).cache?.clear?.();
  });

  it('parseRepoUrl extracts owner and repo from GitHub URL', () => {
    const result = githubService.parseRepoUrl(
      'https://github.com/facebook/react',
    );
    expect(result).toEqual({ owner: 'facebook', repo: 'react' });
  });

  it('parseRepoUrl returns null for non-GitHub URLs', () => {
    expect(githubService.parseRepoUrl('https://example.com')).toBeNull();
    expect(githubService.parseRepoUrl('not a url')).toBeNull();
  });

  it('parseRepoUrl handles trailing slashes', () => {
    const result = githubService.parseRepoUrl(
      'https://github.com/user/repo/',
    );
    expect(result).toEqual({ owner: 'user', repo: 'repo' });
  });
});
