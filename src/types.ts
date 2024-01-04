import { FilterByOptions, OrderByOptions } from './constants';
import { ProjectsResponse, UsersResponse } from './db.types';

export interface FilterOptions {
  skill_level_range: [number, number];
  languages: string[];
  sortOption: OrderByOptions;
  filterOption: FilterByOptions;
}

export interface PaginatedItems<T> {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: T[];
}

export type ProjectsPaginatedResponse = PaginatedItems<
  ProjectsResponse<{
    author: UsersResponse;
  }>
>;
