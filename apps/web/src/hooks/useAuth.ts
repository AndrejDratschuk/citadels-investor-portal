import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    setAuth,
    logout,
    checkAuth,
  } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      checkAuth();
    }
  }, [isAuthenticated, isLoading, checkAuth]);

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    setAuth,
    logout,
  };
}

