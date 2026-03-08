import { yupResolver } from '@hookform/resolvers/yup';
import _ from 'lodash';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Editor } from 'primereact/editor';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Message } from 'primereact/message';
import { MultiSelect } from 'primereact/multiselect';
import { Slider } from 'primereact/slider';
import { Dispatch, FC, SetStateAction, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useStoreContext } from '../../contexts';
import {
  SUPPORTED_LANGUAGES,
  PROJECT_CATEGORIES,
  PROJECT_STATUSES,
} from '../../types/project';
import {
  projectValidationSchema,
  ProjectValidationData,
} from '../../validation/schemas';

interface AddProjectDialogProps {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
}

const languageOptions = SUPPORTED_LANGUAGES.map((lang) => ({
  value: lang,
  label: _.startCase(lang),
}));

const categoryOptions = PROJECT_CATEGORIES.map((cat) => ({
  value: cat,
  label: _.startCase(cat),
}));

const statusOptions = PROJECT_STATUSES.map((status) => ({
  value: status,
  label: _.startCase(status),
}));

const licenseOptions = [
  'MIT',
  'Apache-2.0',
  'GPL-3.0',
  'BSD-3-Clause',
  'ISC',
  'MPL-2.0',
  'Unlicense',
  'Other',
].map((l) => ({ value: l, label: l }));

/**
 * Dialog for creating a new project with comprehensive validation.
 */
export const AddProjectDialog: FC<AddProjectDialogProps> = ({
  visible,
  setVisible,
}) => {
  const { addProject } = useStoreContext();

  const {
    register,
    setValue,
    trigger,
    formState: { errors, isValid, isSubmitting },
    watch,
    getValues,
    reset,
    handleSubmit,
  } = useForm<ProjectValidationData>({
    mode: 'onChange',
    resolver: yupResolver(projectValidationSchema),
    defaultValues: {
      skillLevel: 5,
      status: 'active',
      category: 'web',
      license: 'MIT',
      maintainerCount: 1,
    },
  });

  const handleFormSubmit = async () => {
    try {
      const values = getValues();
      await addProject({
        name: values.name,
        description: values.description,
        githubRepository: values.githubRepository,
        homePage: values.homePage,
        languages: values.languages as ProjectValidationData['languages'],
        category: values.category as ProjectValidationData['category'],
        status: values.status as ProjectValidationData['status'],
        skillLevel: values.skillLevel,
        license: values.license,
        contributingGuideUrl: values.contributingGuideUrl,
        timeCommitment: values.timeCommitment,
        maintainerCount: values.maintainerCount,
      });
      reset();
      setVisible(false);
    } catch (error) {
      console.error('Failed to add project:', error);
    }
  };

  const [description, languages, skillLevel] = [
    watch('description'),
    watch('languages'),
    watch('skillLevel'),
  ];

  useEffect(() => {
    if (languages && description) trigger();
  }, [languages, description, trigger]);

  const footerContent = (
    <div className="mt-2 flex justify-end gap-2">
      <Button
        label="Cancel"
        icon="pi pi-times"
        severity="secondary"
        outlined
        onClick={() => {
          reset();
          setVisible(false);
        }}
        type="button"
      />
      <Button
        label="Add Project"
        type="submit"
        icon="pi pi-check"
        onClick={handleSubmit(handleFormSubmit)}
        disabled={isSubmitting || !isValid}
        loading={isSubmitting}
      />
    </div>
  );

  return (
    <Dialog
      header="Add Project"
      visible={visible}
      style={{ width: '55vw' }}
      onHide={() => setVisible(false)}
      footer={footerContent}
      maximizable
      className="p-fluid"
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(handleFormSubmit)}
      >
        {/* Name */}
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="font-semibold text-sm">
            Project Name *
          </label>
          <InputText
            placeholder="My Awesome Project"
            {...register('name')}
          />
          {errors.name && (
            <Message severity="error" text={errors.name.message} />
          )}
        </div>

        {/* GitHub URL */}
        <div className="flex flex-col gap-1">
          <label htmlFor="githubRepository" className="font-semibold text-sm">
            GitHub Repository URL *
          </label>
          <InputText
            placeholder="https://github.com/user/repo"
            {...register('githubRepository')}
          />
          {errors.githubRepository && (
            <Message severity="error" text={errors.githubRepository.message} />
          )}
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-2 gap-4">
          {/* Homepage */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm">Homepage</label>
            <InputText
              placeholder="https://myproject.dev"
              {...register('homePage')}
            />
            {errors.homePage && (
              <Message severity="error" text={errors.homePage.message} />
            )}
          </div>

          {/* Contributing Guide */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm">Contributing Guide URL</label>
            <InputText
              placeholder="https://github.com/user/repo/blob/main/CONTRIBUTING.md"
              {...register('contributingGuideUrl')}
            />
            {errors.contributingGuideUrl && (
              <Message severity="error" text={errors.contributingGuideUrl.message} />
            )}
          </div>
        </div>

        {/* Languages */}
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-sm">Languages *</label>
          <MultiSelect
            value={watch('languages')}
            onChange={(e) => {
              setValue('languages', e.value);
              trigger('languages');
            }}
            options={languageOptions}
            optionLabel="label"
            placeholder="Select Languages"
            maxSelectedLabels={5}
            filter
          />
          {errors.languages && (
            <Message severity="error" text={errors.languages.message} />
          )}
        </div>

        {/* Category, Status, License */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm">Category *</label>
            <Dropdown
              value={watch('category')}
              onChange={(e) => {
                setValue('category', e.value);
                trigger('category');
              }}
              options={categoryOptions}
              optionLabel="label"
              placeholder="Select Category"
            />
            {errors.category && (
              <Message severity="error" text={errors.category.message} />
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm">Status *</label>
            <Dropdown
              value={watch('status')}
              onChange={(e) => {
                setValue('status', e.value);
                trigger('status');
              }}
              options={statusOptions}
              optionLabel="label"
              placeholder="Select Status"
            />
            {errors.status && (
              <Message severity="error" text={errors.status.message} />
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm">License *</label>
            <Dropdown
              value={watch('license')}
              onChange={(e) => {
                setValue('license', e.value);
                trigger('license');
              }}
              options={licenseOptions}
              optionLabel="label"
              placeholder="Select License"
            />
            {errors.license && (
              <Message severity="error" text={errors.license.message} />
            )}
          </div>
        </div>

        {/* Time Commitment & Maintainer Count */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm">Time Commitment</label>
            <InputText
              placeholder="e.g. 2-5 hours"
              {...register('timeCommitment')}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm">Active Maintainers</label>
            <InputNumber
              value={watch('maintainerCount') ?? 1}
              onValueChange={(e) => setValue('maintainerCount', e.value ?? 1)}
              min={0}
              max={100}
            />
          </div>
        </div>

        {/* Skill Level */}
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-sm">
            Skill Level: {skillLevel}/10
          </label>
          <Slider
            className="mx-4"
            step={1}
            min={1}
            max={10}
            value={skillLevel}
            onChange={(e) => {
              if (typeof e.value === 'number') setValue('skillLevel', e.value);
            }}
          />
          <div className="flex justify-between px-4 text-xs text-gray-400">
            <span>Beginner</span>
            <span>Expert</span>
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-sm">Description *</label>
          <Editor
            className="h-48"
            placeholder="Describe your project, what contributors would work on, and why they should join..."
            onTextChange={(e) => {
              if (e.htmlValue) {
                setValue('description', e.htmlValue);
                trigger('description');
              }
            }}
          />
          {errors.description && (
            <Message severity="error" text={errors.description.message} />
          )}
        </div>
      </form>
    </Dialog>
  );
};
