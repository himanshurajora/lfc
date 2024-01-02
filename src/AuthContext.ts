import { AuthModel } from 'pocketbase';
import { createContext } from 'react';

interface AuthContext {
  user: AuthModel | null;
  setUser: (user: AuthModel | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const AuthContext = createContext<AuthContext>({
  user: null,
  setUser: () => {},
  loading: false,
  setLoading: () => {},
});
