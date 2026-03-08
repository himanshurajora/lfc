import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext, AuthContextValue } from '../../contexts/AuthContext';
import { StoreContext, StoreContextValue } from '../../contexts/StoreContext';
import { FILTER_INITIAL_VALUE } from '../../types/filters';
import { ProjectCard } from '../../components/projects/ProjectCard';
import { Project } from '../../types/project';

const mockProject: Project = {
  id: 'project-1',
  name: 'Test Project',
  description: '<p>A test project description</p>',
  githubRepository: 'https://github.com/user/repo',
  homePage: '',
  languages: ['typescript', 'javascript'],
  category: 'web',
  status: 'active',
  skillLevel: 5,
  authorId: 'user-1',
  authorUsername: 'Test User',
  authorAvatarUrl: 'https://example.com/avatar.png',
  license: 'MIT',
  contributingGuideUrl: '',
  timeCommitment: '',
  maintainerCount: 1,
  interestCount: 5,
  commentCount: 8,
  bookmarkCount: 3,
  viewCount: 42,
  searchTokens: ['test', 'project'],
  createdAt: { toDate: () => new Date('2024-01-01') } as any,
  updatedAt: { toDate: () => new Date('2024-01-02') } as any,
};

const defaultAuth: AuthContextValue = {
  user: null,
  firebaseUser: null,
  loading: false,
  login: vi.fn(),
  logout: vi.fn(),
  updateProfile: vi.fn(),
};

const defaultStore: StoreContextValue = {
  projects: [],
  loading: false,
  filters: FILTER_INITIAL_VALUE,
  setFilters: vi.fn(),
  globalSearch: null,
  setGlobalSearch: vi.fn(),
  addProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  nextPage: vi.fn(),
  isLastPage: false,
  refetch: vi.fn(),
  lastDoc: null,
};

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={defaultAuth}>
        <StoreContext.Provider value={defaultStore}>{ui}</StoreContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe('ProjectCard', () => {
  it('renders the project name', () => {
    renderWithProviders(
      <ProjectCard project={mockProject} />,
    );
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('displays view and interest counts in header', () => {
    renderWithProviders(
      <ProjectCard project={mockProject} />,
    );
    // View count and interest count should both be shown
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('displays bookmark count in header', () => {
    renderWithProviders(
      <ProjectCard project={mockProject} />,
    );
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
