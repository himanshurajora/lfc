import { AuthModel } from 'pocketbase';
import { useState } from 'react';

export function useUserState() {
  const [user, setUser] = useState<AuthModel | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  return {
    user,
    setUser,
    loading,
    setLoading,
  };
}
