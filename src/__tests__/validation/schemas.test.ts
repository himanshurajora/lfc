import { describe, it, expect } from 'vitest';
import {
  projectValidationSchema,
  interestValidationSchema,
  issueValidationSchema,
  commentValidationSchema,
  profileValidationSchema,
} from '../../validation/schemas';

describe('projectValidationSchema', () => {
  it('passes with valid data', async () => {
    const valid = {
      name: 'My Project',
      description: '<p>A great project that does many things</p>',
      githubRepository: 'https://github.com/user/repo',
      languages: ['typescript'],
      skillLevel: 5,
      category: 'web',
      status: 'active',
      license: 'MIT',
    };
    await expect(projectValidationSchema.validate(valid)).resolves.toBeTruthy();
  });

  it('fails without a name', async () => {
    const invalid = {
      description: '<p>Desc</p>',
      githubRepository: 'https://github.com/user/repo',
      languages: ['TypeScript'],
      skillLevel: 5,
    };
    await expect(
      projectValidationSchema.validate(invalid),
    ).rejects.toThrow();
  });

  it('fails with invalid GitHub URL', async () => {
    const invalid = {
      name: 'My Project',
      description: '<p>Desc</p>',
      githubRepository: 'not-a-url',
      languages: ['TypeScript'],
      skillLevel: 5,
    };
    await expect(
      projectValidationSchema.validate(invalid),
    ).rejects.toThrow();
  });

  it('fails when no languages selected', async () => {
    const invalid = {
      name: 'My Project',
      description: '<p>Desc</p>',
      githubRepository: 'https://github.com/user/repo',
      languages: [],
      skillLevel: 5,
    };
    await expect(
      projectValidationSchema.validate(invalid),
    ).rejects.toThrow();
  });
});

describe('interestValidationSchema', () => {
  it('passes with valid data', async () => {
    const valid = {
      message: 'I would love to contribute!',
      skills: ['TypeScript', 'React'],
    };
    await expect(
      interestValidationSchema.validate(valid),
    ).resolves.toBeTruthy();
  });

  it('fails with empty message', async () => {
    await expect(
      interestValidationSchema.validate({ message: '', skills: [] }),
    ).rejects.toThrow();
  });
});

describe('issueValidationSchema', () => {
  it('passes with valid data', async () => {
    const valid = {
      title: 'Fix bug in auth flow',
      description: 'The login flow is broken and needs fixing',
      difficulty: 'easy',
      labels: ['bug'],
      contributionType: 'code',
    };
    await expect(issueValidationSchema.validate(valid)).resolves.toBeTruthy();
  });

  it('fails without title', async () => {
    await expect(
      issueValidationSchema.validate({ description: 'Something' }),
    ).rejects.toThrow();
  });
});

describe('commentValidationSchema', () => {
  it('passes with content', async () => {
    await expect(
      commentValidationSchema.validate({ content: 'Great project!' }),
    ).resolves.toBeTruthy();
  });

  it('fails with empty content', async () => {
    await expect(
      commentValidationSchema.validate({ content: '' }),
    ).rejects.toThrow();
  });
});

describe('profileValidationSchema', () => {
  it('passes with valid profile data', async () => {
    const valid = {
      displayName: 'John Doe',
      bio: 'Developer',
      websiteUrl: 'https://example.com',
      skills: ['TypeScript'],
      experienceLevel: 'intermediate',
    };
    await expect(
      profileValidationSchema.validate(valid),
    ).resolves.toBeTruthy();
  });

  it('fails without displayName', async () => {
    await expect(
      profileValidationSchema.validate({ bio: 'Dev' }),
    ).rejects.toThrow();
  });
});
