import { createContext, useContext } from 'react';
import { Project, ProjectFormData } from '../types/project';
import { FilterOptions, FILTER_INITIAL_VALUE } from '../types/filters';
import { DocumentSnapshot } from 'firebase/firestore';

export interface StoreContextValue {
  projects: Project[];
  loading: boolean;
  filters: FilterOptions;
  setFilters: (filters: FilterOptions) => void;
  globalSearch: string | null;
  setGlobalSearch: (text: string) => void;
  addProject: (data: ProjectFormData) => Promise<Project | void>;
  updateProject: (projectId: string, data: Partial<ProjectFormData>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  nextPage: () => Promise<boolean>;
  isLastPage: boolean;
  refetch: () => void;
  lastDoc: DocumentSnapshot | null;
}

export const StoreContext = createContext<StoreContextValue>({
  projects: [],
  loading: false,
  filters: FILTER_INITIAL_VALUE,
  setFilters: () => {},
  globalSearch: null,
  setGlobalSearch: () => {},
  addProject: async () => {},
  updateProject: async () => {},
  deleteProject: async () => {},
  nextPage: async () => false,
  isLastPage: false,
  refetch: () => {},
  lastDoc: null,
});

export const useStoreContext = () => useContext(StoreContext);
