import { useEffect } from 'react';
import { client } from './db';
import { useLocalStorage } from './useLocalStorage';
import { useUser } from './useUser';
import { loginWithGithub } from './utils';

export const useAuth = () => {
  const { user, addUser, removeUser, setUser } = useUser();
  const { getItem } = useLocalStorage();

  useEffect(() => {
    const user = getItem('user');
    if (user) {
      addUser(JSON.parse(user));
    }
  }, []);

  const login = async () => {
    await loginWithGithub();
    addUser(client.authStore.model);
  };

  const logout = () => {
    removeUser();
  };

  return { user, login, logout, setUser };
};
