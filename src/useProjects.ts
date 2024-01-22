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
import { ClientResponseError } from 'pocketbase';

export const useProjects = () => {
  const [filters, setFilters] = useState<FilterOptions>(FILTER_INITIAL_VALUE);
  const [globalSearch, setGlobalSearch] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLastPage, setIsLastPage] = useState(false);

  const [projects, setProjects] = useState<
    ProjectsResponse<{ author: UsersResponse }>[] | null
  >(null);

  const fetch = useCallback(
    async (page?: number) => {
      setLoading(true);
      setIsLastPage(false);
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
          if (response.page <= response.totalPages) {
            setProjects(
              (projects) => projects && [...projects, ...response.items]
            );
          }

          // Keep at right after the last page always
          if (response.page > response.totalPages) {
            setCurrentPage(response.totalPages);
          }
          setLoading(false);
          setIsLastPage(response.page >= response.totalPages);
          return response.page < response.totalPages;
        })
        .catch((err) => {
          console.log(err);
          if (!(err instanceof ClientResponseError)) {
            setLoading(false);
            return false;
          }
          return true;
        });
    },
    [filters, globalSearch]
  );

  useEffect(() => {
    setCurrentPage(1);
    setProjects([]);
  }, [filters, globalSearch]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    client.collection('projects').subscribe('*', () => {
      fetch();
    });
  }, [fetch]);

  const refetch = () => {
    if (typeof fetch === 'function') {
      setProjects([]);
      fetch();
    }
  };

  const addProject = async (project: AddProjectDto) => {
    if (client.authStore.model)
      return client
        .collection('projects')
        .create({ ...project, author: client.authStore.model.id })
        .then((record) => {
          return record;
        })
        .finally(refetch);
  };

  const deleteProject = async (projectId: string) => {
    return client
      .collection('projects')
      .delete(projectId)
      .then((result) => {
        fetch();
        return result;
      })
      .finally(refetch);
  };

  const nextPage = async () => {
    const hasData = await fetch(currentPage + 1);
    setCurrentPage((currentPage) => currentPage + 1);
    return hasData;
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
    isLastPage,
    refetch,
  };
};
