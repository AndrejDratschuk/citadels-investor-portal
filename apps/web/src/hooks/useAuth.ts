import { useEffect, useRef } from 'react';
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

  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    // Always validate token on initial mount to handle expired tokens
    // This ensures tokens are refreshed even when localStorage has stored credentials
    // Don't check isLoading - we want to run checkAuth even while loading (after rehydration)
    if (!hasCheckedAuth.current && accessToken) {
      hasCheckedAuth.current = true;
      checkAuth();
    }
  }, [accessToken, checkAuth]);

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    setAuth,
    logout,
  };
}

