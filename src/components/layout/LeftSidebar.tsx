import { FC } from 'react';
import { Checkbox, CheckboxChangeEvent } from 'primereact/checkbox';
import { RadioButton, RadioButtonChangeEvent } from 'primereact/radiobutton';
import { Slider, SliderChangeEvent } from 'primereact/slider';
import _ from 'lodash';
import { useStoreContext } from '../../contexts';
import { SUPPORTED_LANGUAGES } from '../../types/project';
import { OrderByOptions, FilterByOptions } from '../../types/filters';
import { PROJECT_CATEGORIES, PROJECT_STATUSES } from '../../types/project';

/**
 * Left sidebar with filter controls for project discovery.
 */
export const LeftSidebar: FC = () => {
  const { filters, setFilters } = useStoreContext();

  const handleSkillRangeChange = (e: SliderChangeEvent) => {
    setFilters({
      ...filters,
      skillLevelRange: e.value as [number, number],
    });
  };

  const handleLanguageSelection = (e: CheckboxChangeEvent) => {
    const updated = e.checked
      ? [...filters.languages, e.value]
      : filters.languages.filter((l) => l !== e.value);
    setFilters({ ...filters, languages: updated });
  };

  const handleCategorySelection = (e: CheckboxChangeEvent) => {
    const updated = e.checked
      ? [...filters.categories, e.value]
      : filters.categories.filter((c) => c !== e.value);
    setFilters({ ...filters, categories: updated });
  };

  const handleStatusSelection = (e: CheckboxChangeEvent) => {
    const updated = e.checked
      ? [...filters.statuses, e.value]
      : filters.statuses.filter((s) => s !== e.value);
    setFilters({ ...filters, statuses: updated });
  };

  const handleSortChange = (e: RadioButtonChangeEvent) => {
    setFilters({ ...filters, sortOption: e.value });
  };

  const handleFilterChange = (e: RadioButtonChangeEvent) => {
    setFilters({ ...filters, filterOption: e.value });
  };

  return (
    <aside className="w-1/5 min-h-[90vh] max-h-[90vh] bg-slate-100 rounded-r-lg py-3 px-2 flex flex-col gap-5 overflow-auto">
      {/* Skill Level */}
      <section className="flex flex-col gap-1 bg-slate-200 px-1 py-2 rounded">
        <b className="ml-4">Skill Level:</b>
        <Slider
          className="mt-2 mx-6"
          range
          step={10}
          value={filters.skillLevelRange}
          onChange={handleSkillRangeChange}
        />
        <div className="flex justify-between px-4 mt-1">
          <b>0</b>
          <b>10</b>
        </div>
      </section>

      {/* Languages */}
      <section className="flex flex-col gap-3 px-5">
        <b>Languages:</b>
        <div className="flex flex-wrap gap-3">
          {SUPPORTED_LANGUAGES.map((language) => (
            <div className="flex items-center" key={language}>
              <Checkbox
                inputId={`lang-${language}`}
                value={language}
                onChange={handleLanguageSelection}
                checked={filters.languages.includes(language)}
              />
              <label htmlFor={`lang-${language}`} className="ml-2 text-sm">
                {_.startCase(language)}
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="flex flex-col gap-3 px-5">
        <b>Categories:</b>
        <div className="flex flex-wrap gap-3">
          {PROJECT_CATEGORIES.map((category) => (
            <div className="flex items-center" key={category}>
              <Checkbox
                inputId={`cat-${category}`}
                value={category}
                onChange={handleCategorySelection}
                checked={filters.categories.includes(category)}
              />
              <label htmlFor={`cat-${category}`} className="ml-2 text-sm">
                {_.startCase(category)}
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Project Status */}
      <section className="flex flex-col gap-3 px-5">
        <b>Status:</b>
        <div className="flex flex-wrap gap-3">
          {PROJECT_STATUSES.map((status) => (
            <div className="flex items-center" key={status}>
              <Checkbox
                inputId={`status-${status}`}
                value={status}
                onChange={handleStatusSelection}
                checked={filters.statuses.includes(status)}
              />
              <label htmlFor={`status-${status}`} className="ml-2 text-sm">
                {_.startCase(status)}
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Sort Order */}
      <section className="flex flex-col gap-3 px-5">
        <b>Order By:</b>
        <div className="flex flex-wrap gap-3">
          {Object.values(OrderByOptions).map((option) => (
            <div className="flex items-center" key={option}>
              <RadioButton
                inputId={`sort-${option}`}
                value={option}
                onChange={handleSortChange}
                checked={filters.sortOption === option}
              />
              <label htmlFor={`sort-${option}`} className="ml-2 text-sm">
                {_.startCase(option)}
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Filter By */}
      <section className="flex flex-col gap-3 px-5">
        <b>Filter By:</b>
        <div className="flex flex-wrap gap-3">
          {Object.values(FilterByOptions).map((option) => (
            <div className="flex items-center" key={option}>
              <RadioButton
                inputId={`filter-${option}`}
                value={option}
                onChange={handleFilterChange}
                checked={filters.filterOption === option}
              />
              <label htmlFor={`filter-${option}`} className="ml-2 text-sm">
                {_.startCase(option)}
              </label>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
};
