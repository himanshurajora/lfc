import { ProjectCategory, ProjectStatus } from './project';

export enum OrderByOptions {
  RECENT = 'recent',
  OLDER = 'older',
  POPULAR = 'popular',
  MOST_INTEREST = 'most_interest',
}

export enum FilterByOptions {
  ALL = 'all',
  MINE = 'mine',
  OTHERS = 'others',
  BOOKMARKED = 'bookmarked',
}

export { type ProjectCategory, type ProjectStatus } from './project';

export interface FilterOptions {
  skillLevelRange: [number, number];
  languages: string[];
  categories: ProjectCategory[];
  statuses: ProjectStatus[];
  sortOption: OrderByOptions;
  filterOption: FilterByOptions;
}

export const FILTER_INITIAL_VALUE: FilterOptions = {
  skillLevelRange: [0, 100],
  languages: [],
  categories: [],
  statuses: [],
  sortOption: OrderByOptions.RECENT,
  filterOption: FilterByOptions.ALL,
};
