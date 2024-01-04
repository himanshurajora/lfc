import * as yup from 'yup';

export const validateAddProject = yup
  .object({
    name: yup.string().required().min(1),
    description: yup.string(),
    github_repository: yup.string().required().url(),
    home_page: yup.string().url(),
    languages: yup.array(yup.string()).min(1),
    skill_level: yup.number().required().min(1).max(10),
  })
  .required();

export type AddProjectDto = yup.InferType<typeof validateAddProject>;
