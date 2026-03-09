import * as yup from 'yup';
import { SUPPORTED_LANGUAGES, PROJECT_CATEGORIES, PROJECT_STATUSES } from '../types/project';

/** Validation schema for creating/editing a project. */
export const projectValidationSchema = yup.object({
  name: yup
    .string()
    .required('Project name is required.')
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name must be at most 100 characters.'),
  description: yup
    .string()
    .required('Description is required.')
    .min(20, 'Description must be at least 20 characters.'),
  githubRepository: yup
    .string()
    .required('GitHub repository URL is required.')
    .url('Must be a valid URL.')
    .matches(/github\.com/, 'Must be a GitHub URL.'),
  homePage: yup.string().url('Must be a valid URL.').optional(),
  languages: yup
    .array()
    .of(yup.string().oneOf([...SUPPORTED_LANGUAGES]).required())
    .min(1, 'Select at least one language.')
    .required(),
  category: yup
    .string()
    .oneOf([...PROJECT_CATEGORIES], 'Select a valid category.')
    .required('Category is required.'),
  status: yup
    .string()
    .oneOf([...PROJECT_STATUSES], 'Select a valid status.')
    .required('Status is required.'),
  skillLevel: yup
    .number()
    .required('Skill level is required.')
    .min(1, 'Minimum skill level is 1.')
    .max(10, 'Maximum skill level is 10.'),
  license: yup
    .string()
    .required('License is required.')
    .max(50, 'License identifier is too long.'),
  contributingGuideUrl: yup.string().url('Must be a valid URL.').optional(),
  timeCommitment: yup.string().optional(),
  maintainerCount: yup.number().min(0).optional(),
});

export type ProjectValidationData = yup.InferType<typeof projectValidationSchema>;

/** Validation schema for expressing interest in a project. */
export const interestValidationSchema = yup.object({
  message: yup
    .string()
    .required('Please write a message about why you want to contribute.')
    .min(20, 'Message must be at least 20 characters.')
    .max(1000, 'Message must be at most 1000 characters.'),
  skills: yup
    .array()
    .of(yup.string().required())
    .min(1, 'Select at least one skill.')
    .required(),
});

export type InterestValidationData = yup.InferType<typeof interestValidationSchema>;

/** Validation schema for creating an issue/task. */
export const issueValidationSchema = yup.object({
  title: yup
    .string()
    .required('Issue title is required.')
    .min(5, 'Title must be at least 5 characters.')
    .max(200, 'Title is too long.'),
  description: yup
    .string()
    .required('Description is required.')
    .min(10, 'Description must be at least 10 characters.'),
  githubIssueUrl: yup.string().url('Must be a valid URL.').optional(),
  difficulty: yup.string().required('Select a difficulty level.'),
  labels: yup.array().of(yup.string().required()).required(),
  contributionType: yup.string().required('Select a contribution type.'),
});

export type IssueValidationData = yup.InferType<typeof issueValidationSchema>;

/** Validation schema for adding a comment. */
export const commentValidationSchema = yup.object({
  content: yup
    .string()
    .required('Comment cannot be empty.')
    .min(3, 'Comment must be at least 3 characters.')
    .max(2000, 'Comment is too long.'),
});

export type CommentValidationData = yup.InferType<typeof commentValidationSchema>;

/** Validation schema for updating user profile. */
export const profileValidationSchema = yup.object({
  displayName: yup
    .string()
    .required('Display name is required.')
    .min(2, 'Name must be at least 2 characters.')
    .max(50, 'Name is too long.'),
  bio: yup
    .string()
    .max(500, 'Bio is too long.')
    .optional(),
  skills: yup
    .array()
    .of(yup.string().required())
    .optional(),
  websiteUrl: yup.string().url('Must be a valid URL.').optional(),
  experienceLevel: yup
    .string()
    .oneOf(['beginner', 'intermediate', 'advanced', 'expert'])
    .required('Select your experience level.'),
});

export type ProfileValidationData = yup.InferType<typeof profileValidationSchema>;
