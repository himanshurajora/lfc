import { FilterByOptions, OrderByOptions } from './constants';

export interface FilterOptions {
  skill_level_range: [number, number];
  languages: string[];
  sortOption: OrderByOptions;
  filterOption: FilterByOptions;
}
