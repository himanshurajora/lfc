import { useCallback, useEffect, useState } from 'react';
import {
  FILTER_INITIAL_VALUE,
  FilterByOptions,
  OrderByOptions,
  ProjectsPageSize,
} from './constants';
import { Collections, ProjectsResponse, UsersResponse } from './db.types';
import { FilterOptions } from './types';
import _ from 'lodash';
import { client } from './db';
import { AddProjectDto } from './validation/addProjectValidation';

export const useProjects = () => {
  const [filters, setFilters] = useState<FilterOptions>(FILTER_INITIAL_VALUE);
  const [globalSearch, setGlobalSearch] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [projects, setProjects] = useState<
    ProjectsResponse<{ author: UsersResponse }>[]
  >([]);

  const fetch = useCallback(
    async (page?: number) => {
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

      if (filters.filterOption === FilterByOptions.MINE) {
        if (client.authStore.model)
          raw_filter += `&& author.id = '${client.authStore.model.id}'`;
      }

      if (filters.filterOption === FilterByOptions.OTHERS) {
        if (client.authStore.model)
          raw_filter += `&& author.id != '${client.authStore.model.id}'`;
      }

      if (globalSearch) {
        raw_filter += `&& (name ~ '%${globalSearch}%'
      || description ~ '%${globalSearch}%' 
      || languages ~ '%${globalSearch}%' 
      || author.username ~ '%${globalSearch}%' 
      || author.name ~ '%${globalSearch}%')`;
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

      return client
        .collection(Collections.Projects)
        .getList<ProjectsResponse<{ author: UsersResponse }>>(
          page || 1,
          ProjectsPageSize,
          {
            expand: 'author',
            filter: raw_filter,
            sort: sortBy,
          }
        )
        .then((response) => {
          if (page) setCurrentPage(page + 1);
          setProjects((projects) => [...projects, ...response.items]);
          return !!response.items.length;
        })
        .catch((err) => {
          console.log(err);
          setProjects([]);
          return false;
        });
    },
    [filters, globalSearch]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    client.collection('projects').subscribe('*', () => {
      fetch();
    });
  }, [fetch]);

  const addProject = async (project: AddProjectDto) => {
    if (client.authStore.model)
      return client
        .collection('projects')
        .create({ ...project, author: client.authStore.model.id })
        .then((record) => {
          fetch();
          return record;
        });
  };

  const deleteProject = async (projectId: string) => {
    return client
      .collection('projects')
      .delete(projectId)
      .then((result) => {
        fetch();
        return result;
      });
  };

  const nextPage = () => {
    return fetch(currentPage + 1);
  };

  return {
    projects,
    setProjects,
    loading,
    setLoading,
    filters,
    setFilters,
    globalSearch,
    setGlobalSearch,
    addProject,
    deleteProject,
    nextPage,
  };
};
