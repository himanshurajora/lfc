import { useEffect } from 'react';
import { client } from './db';
import { useLocalStorage } from './useLocalStorage';
import { useUser } from './useUser';
import { loginWithGithub } from './utils';

export const useAuth = () => {
  const { user, addUser, removeUser, setUser, setLoading, loading } = useUser();
  const { getItem } = useLocalStorage();

  useEffect(() => {
    setLoading(true);
    const user = getItem('user');
    if (user) {
      addUser(JSON.parse(user));
    }
    setLoading(false);
  }, []);

  const login = async () => {
    setLoading(true);
    await loginWithGithub();
    addUser(client.authStore.model);
    setLoading(false);
  };

  const logout = () => {
    setLoading(true);
    removeUser();
    setLoading(false);
  };

  return { user, login, logout, setUser, loading };
};
