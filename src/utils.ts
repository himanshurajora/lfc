import { client } from './db';

export const loginWithGithub = () => {
  return client.collection('users').authWithOAuth2({ provider: 'github' });
};

export const logoutUser = () => {
  client.authStore.clear();
};

export const getGithubProfileUrl = (username?: string) => {
  if (!username) return '';
  return `https://github.com/${username}.png`;
};
