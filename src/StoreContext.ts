import { createContext } from 'react';
import { FilterOptions } from './types';
import { ProjectsResponse, UsersResponse } from './db.types';
import { FILTER_INITIAL_VALUE } from './constants';
import { AddProjectDto } from './validation/addProjectValidation';

interface StoreContext {
  filters: FilterOptions;
  setFilters: (filters: FilterOptions) => void;
  projects: ProjectsResponse<{ author: UsersResponse }>[] | null;
  setProjects: (
    projects: ProjectsResponse<{ author: UsersResponse }>[] | null
  ) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  globalSearch: string | null;
  setGlobalSearch: (text: string) => void;
  addProject: (project: AddProjectDto) => Promise<ProjectsResponse | void>;
  deleteProject: (projectId: string) => Promise<boolean>;
  nextPage: () => Promise<boolean>;
  isLastPage: boolean;
}

export const StoreContext = createContext<StoreContext>({
  filters: FILTER_INITIAL_VALUE,
  setFilters: () => {},
  loading: false,
  projects: null,
  setProjects: () => {},
  setLoading: () => {},
  globalSearch: null,
  setGlobalSearch: () => {},
  addProject: () => Promise.resolve(),
  deleteProject: () => Promise.resolve(false),
  nextPage: () => Promise.resolve(false),
  isLastPage: false,
});
