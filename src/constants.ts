import _ from 'lodash';
import { FilterOptions } from './types';
import { ProjectsLanguagesOptions } from './db.types';

export enum OrderByOptions {
  RECENT = 'recent',
  OLDER = 'older',
  POPULAR = 'popular',
}

export enum FilterByOptions {
  ALL = 'all',
  MINE = 'mine',
  OTHERS = 'others',
}

export const FILTER_INITIAL_VALUE: FilterOptions = {
  skill_level_range: [0, 100],
  languages: [],
  sortOption: OrderByOptions.RECENT,
  filterOption: FilterByOptions.ALL,
};

export const supportedLanguages = _.values(ProjectsLanguagesOptions);

export const ProjectsPageSize = 3;
