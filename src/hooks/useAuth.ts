import { useCallback, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { authService } from '../services/auth.service';
import { UserProfile } from '../types/user';
import toast from 'react-hot-toast';

/**
 * Hook that manages Firebase authentication state and user profile.
 */
export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const profile = await authService.getProfile(fbUser.uid);
          if (profile?.banned) {
            // Force logout banned users
            await authService.logout();
            setUser(null);
            setFirebaseUser(null);
          } else {
            setUser(profile);
          }
        } catch (error) {
          console.error('Failed to load user profile:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = useCallback(async () => {
    try {
      setLoading(true);
      const profile = await authService.loginWithGithub();
      setUser(profile);
      toast.success(`Welcome, ${profile.displayName || profile.username}!`);
    } catch (error) {
      console.error('Login failed:', error);
      if (error instanceof Error && error.message === 'BANNED') {
        toast.error('Your account has been banned. Contact the administrator.');
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
      setFirebaseUser(null);
      toast.success('Logged out successfully.');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed.');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(
    async (data: Partial<UserProfile>) => {
      if (!user) return;
      try {
        await authService.updateProfile(user.uid, data);
        setUser((prev) => (prev ? { ...prev, ...data } : null));
        toast.success('Profile updated.');
      } catch (error) {
        console.error('Profile update failed:', error);
        toast.error('Failed to update profile.');
      }
    },
    [user],
  );

  return {
    user,
    firebaseUser,
    loading,
    login,
    logout,
    updateProfile,
  };
}
