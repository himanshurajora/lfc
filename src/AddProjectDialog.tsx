import { yupResolver } from '@hookform/resolvers/yup';
import _ from 'lodash';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Editor } from 'primereact/editor';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { MultiSelect } from 'primereact/multiselect';
import { Slider } from 'primereact/slider';
import { Dispatch, FC, SetStateAction, useContext, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { StoreContext } from './StoreContext';
import { ProjectsLanguagesOptions } from './db.types';
import {
  AddProjectDto,
  validateAddProject,
} from './validation/addProjectValidation';
export interface AddProjectFormProps {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
}
export const AddProjectForm: FC<AddProjectFormProps> = ({
  visible,
  setVisible,
}) => {
  const { addProject } = useContext(StoreContext);
  const {
    register,
    setValue,
    trigger,
    formState: { errors, isValid, isValidating, isLoading, isSubmitting },
    watch,
    getValues,
    reset,
    handleSubmit,
  } = useForm<AddProjectDto>({
    mode: 'onChange',
    resolver: yupResolver<AddProjectDto>(validateAddProject),
    defaultValues: {
      skill_level: 5,
    },
  });

  const handleFormSubmit = async () => {
    try {
      const object = getValues();
      await addProject(object);
      reset();
      setVisible(false);
    } catch (error) {
      console.log(error);
    }
  };

  const renderHeader = () => {
    return (
      <span className="ql-formats">
        <b>Description</b>
      </span>
    );
  };

  const footerContent = (
    <div className="mt-2">
      <Button
        label="Cancel"
        icon="pi pi-times"
        onClick={() => {
          reset();
          setVisible(false);
        }}
        className="p-button-text"
        type="button"
      />
      <Button
        label="Add"
        type="submit"
        icon="pi pi-check"
        onClick={handleFormSubmit}
        disabled={isLoading || isSubmitting || isValidating || !isValid}
        autoFocus
      />
    </div>
  );

  const [description, languages, skillLevel] = [
    watch('description'),
    watch('languages'),
    watch('skill_level'),
  ];
  useEffect(() => {
    if (languages && description && typeof trigger === 'function') trigger();
  }, [languages, description, trigger]);

  return (
    <Dialog
      header="Add Project"
      visible={visible}
      style={{ width: '50vw' }}
      onHide={() => setVisible(false)}
      footer={footerContent}
      maximizable
    >
      <form
        className="flex flex-col gap-3"
        onSubmit={handleSubmit(handleFormSubmit)}
      >
        <div className="flex flex-col flex-wrap align-items-center gap-2">
          <label htmlFor="name" className="p-sr-only">
            Name
          </label>
          <InputText
            placeholder="Name"
            className="flex-1"
            {...register('name')}
            required
          />
          {errors.name && (
            <Message severity="error" text={errors.name.message} />
          )}
        </div>
        <div className="flex flex-col flex-wrap align-items-center gap-2">
          <label htmlFor="github_url" className="p-sr-only">
            Github URL
          </label>
          <InputText
            placeholder="Github URL"
            {...register('github_repository')}
            className="flex-1"
            required
          />
          {errors.github_repository && (
            <Message severity="error" text={errors.github_repository.message} />
          )}
        </div>
        <div className="flex flex-col flex-wrap align-items-center gap-2">
          <label htmlFor="home_page" className="p-sr-only">
            Home Page
          </label>

          <InputText
            placeholder="Homepage"
            className="flex-1"
            {...register('home_page')}
            required
          />
          {errors.home_page && (
            <Message severity="error" text={errors.home_page.message} />
          )}
        </div>
        <div className="flex flex-col align-items-center gap-2">
          <label htmlFor="languages" className="p-sr-only">
            Languages
          </label>
          <MultiSelect
            value={watch('languages')}
            onChange={(e) => {
              setValue('languages', e.value);
              trigger();
            }}
            options={_.map(ProjectsLanguagesOptions, (value, key) => {
              return {
                value,
                label: key,
              };
            })}
            filter
            optionLabel="label"
            placeholder="Select Languages"
            maxSelectedLabels={3}
            className="w-full md:w-20rem"
            required
          />
          {errors.languages && (
            <Message severity="error" text={errors.languages.message} />
          )}
        </div>
        <b className="ml-4">Skill Level: {skillLevel}</b>
        <Slider
          className="mt-2 mx-6"
          step={10}
          onChange={(event) => {
            if (typeof event.value === 'number')
              setValue('skill_level', event.value / 10);
          }}
          value={watch('skill_level') * 10}
          required
        ></Slider>
        <div className="flex flex-row justify-between px-4 mt-1">
          <b>0</b>
          <b>10</b>
        </div>
        <Editor
          headerTemplate={renderHeader()}
          className="h-60"
          placeholder="Write description"
          min={50}
          onTextChange={(event) => {
            if (event.htmlValue) setValue('description', event.htmlValue);
          }}
        />
        <div className="flex flex-wrap flex-1 align-items-center gap-2">
          <label htmlFor="description" className="p-sr-only">
            Description
          </label>
          {errors.description && (
            <Message severity="error" text={errors.description.message} />
          )}
        </div>
      </form>
    </Dialog>
  );
};
