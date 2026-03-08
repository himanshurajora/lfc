import { describe, it, expect } from 'vitest';
import {
  SUPPORTED_LANGUAGES,
  PROJECT_CATEGORIES,
  PROJECT_STATUSES,
} from '../../types/project';
import { FILTER_INITIAL_VALUE, FilterByOptions, OrderByOptions } from '../../types/filters';
import { NotificationType } from '../../types/notification';
import { InterestStatus } from '../../types/interest';
import { IssueDifficulty } from '../../types/issue';

describe('Type constants', () => {
  it('has supported languages', () => {
    expect(SUPPORTED_LANGUAGES.length).toBeGreaterThan(10);
    expect(SUPPORTED_LANGUAGES).toContain('typescript');
    expect(SUPPORTED_LANGUAGES).toContain('python');
    expect(SUPPORTED_LANGUAGES).toContain('rust');
  });

  it('has project categories', () => {
    expect(PROJECT_CATEGORIES.length).toBeGreaterThan(5);
    expect(PROJECT_CATEGORIES).toContain('web');
    expect(PROJECT_CATEGORIES).toContain('mobile');
  });

  it('has project statuses', () => {
    expect(PROJECT_STATUSES).toContain('active');
    expect(PROJECT_STATUSES).toContain('archived');
  });
});

describe('Filter defaults', () => {
  it('has correct initial filter values', () => {
    expect(FILTER_INITIAL_VALUE.sortOption).toBe(OrderByOptions.RECENT);
    expect(FILTER_INITIAL_VALUE.filterOption).toBe(FilterByOptions.ALL);
    expect(FILTER_INITIAL_VALUE.languages).toEqual([]);
    expect(FILTER_INITIAL_VALUE.categories).toEqual([]);
    expect(FILTER_INITIAL_VALUE.skillLevelRange).toEqual([0, 100]);
  });
});

describe('Enums', () => {
  it('NotificationType has expected values', () => {
    expect(NotificationType.INTEREST_RECEIVED).toBe('interest_received');
    expect(NotificationType.COMMENT_ADDED).toBe('comment_added');
  });

  it('InterestStatus has expected values', () => {
    expect(InterestStatus.PENDING).toBe('pending');
    expect(InterestStatus.ACCEPTED).toBe('accepted');
    expect(InterestStatus.REJECTED).toBe('rejected');
    expect(InterestStatus.WITHDRAWN).toBe('withdrawn');
  });

  it('IssueDifficulty has expected values', () => {
    expect(IssueDifficulty.GOOD_FIRST_ISSUE).toBe('good-first-issue');
    expect(IssueDifficulty.EASY).toBe('easy');
    expect(IssueDifficulty.MEDIUM).toBe('medium');
    expect(IssueDifficulty.HARD).toBe('hard');
  });
});
