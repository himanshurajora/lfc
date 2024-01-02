import { useEffect, useState } from 'react';
import { FILTER_INITIAL_VALUE, OrderByOptions } from './constants';
import { Collections, ProjectsResponse, UsersResponse } from './db.types';
import { FilterOptions } from './types';
import _ from 'lodash';
import { client } from './db';

export const useProjects = () => {
  const [filters, setFilters] = useState<FilterOptions>(FILTER_INITIAL_VALUE);
  const [globalSearch, setGlobalSearch] = useState<string | null>(null);

  const [projects, setProjects] = useState<
    ProjectsResponse<{ author: UsersResponse }>[] | null
  >(null);

  useEffect(() => {
    setProjects(null);
    let raw_filter = `skill_level >= ${
      filters.skill_level_range[0] / 10
    } && skill_level <= ${filters.skill_level_range[1] / 10}`;

    if (filters.languages.length) {
      raw_filter += `&& (${_.join(
        _.map(filters.languages, (language) => {
          return `languages~'${language}'`;
        }),
        ' || '
      )})`;
    }

    if (globalSearch) {
      raw_filter += `&& (name ~ '%${globalSearch}%' || description ~ '%${globalSearch}%' || languages ~ '%${globalSearch}%' || author.username ~ '%${globalSearch}%' || author.name ~ '%${globalSearch}%')`;
    }

    let sortBy = '';

    if (filters.sortOption) {
      if (filters.sortOption === OrderByOptions.RECENT) {
        sortBy += `-created`;
      }
      if (filters.sortOption === OrderByOptions.OLDER) {
        sortBy += `created`;
      }
    }

    client
      .collection(Collections.Projects)
      .getFullList<ProjectsResponse<{ author: UsersResponse }>>({
        expand: 'author',
        filter: raw_filter,
        sort: sortBy,
      })
      .then((projects) => {
        setProjects(projects);
      })
      .catch((err) => {
        console.log(err);
        setProjects(null);
      });
  }, [filters, globalSearch]);

  const [loading, setLoading] = useState(false);

  return {
    projects,
    setProjects,
    loading,
    setLoading,
    filters,
    setFilters,
    globalSearch,
    setGlobalSearch,
  };
};
