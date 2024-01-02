import { useContext } from 'react';
import { StoreContext } from './StoreContext';
import _ from 'lodash';
import { CheckboxChangeEvent, Checkbox } from 'primereact/checkbox';
import { RadioButtonChangeEvent, RadioButton } from 'primereact/radiobutton';
import { SliderChangeEvent, Slider } from 'primereact/slider';
import { supportedLanguages, OrderByOptions } from './constants';

export const LeftSidebar = () => {
  const { filters, setFilters } = useContext(StoreContext);

  const handleSkillRangeChange = (sliderChangeEvent: SliderChangeEvent) => {
    setFilters({
      ...filters,
      skill_level_range: sliderChangeEvent.value as [number, number],
    });
  };

  const handleLanguageSelection = (event: CheckboxChangeEvent) => {
    if (!event.checked) {
      setFilters({
        ...filters,
        languages: _.filter(
          filters.languages,
          (language) => language !== event.value
        ),
      });
    } else {
      setFilters({
        ...filters,
        languages: [...filters.languages, event.value],
      });
    }
  };

  const handleSortOptionSelection = (event: RadioButtonChangeEvent) => {
    setFilters({ ...filters, sortOption: event.value });
  };
  return (
    <div className="w-1/5 min-h-[90vh] max-h-[90vh] bg-slate-100 rounded-r-lg py-3 px-2 flex flex-col gap-5">
      <div className="flex flex-col gap-1 bg-slate-200 px-1 py-2">
        <b className="ml-4">Skill Level:</b>
        <Slider
          className="mt-2 mx-6"
          range
          step={10}
          value={filters.skill_level_range}
          onChange={handleSkillRangeChange}
        ></Slider>
        <div className="flex flex-row justify-between px-4 mt-1">
          <b>0</b>
          <b>10</b>
        </div>
      </div>
      <div className="flex flex-col gap-3 px-5">
        <div>
          <b>Languages:</b>
        </div>
        <div className="flex flex-wrap justify-content-center gap-3">
          {_.map(supportedLanguages, (language) => {
            return (
              <div className="flex align-items-center" key={language}>
                <Checkbox
                  inputId={language}
                  name={language}
                  value={language}
                  onChange={handleLanguageSelection}
                  checked={filters.languages.includes(language)}
                />
                <label htmlFor="ingredient1" className="ml-2">
                  {_.startCase(language)}
                </label>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col gap-3 px-5">
        <div>
          <b>Order By:</b>
        </div>
        <div className="flex flex-wrap justify-content-center gap-3">
          {_.map(OrderByOptions, (option) => {
            return (
              <div className="flex align-items-center" key={option}>
                <RadioButton
                  inputId={option}
                  name={option}
                  value={option}
                  onChange={handleSortOptionSelection}
                  checked={option === filters.sortOption}
                />
                <label htmlFor="ingredient1" className="ml-2">
                  {_.startCase(option)}
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
