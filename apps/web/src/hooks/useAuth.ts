import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    setAuth,
    logout,
  } = useAuthStore();

  // Token refresh is handled automatically by the 401 interceptor in client.ts
  // No need to proactively validate on mount - if token is expired,
  // the first API call will trigger a refresh and retry

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    setAuth,
    logout,
  };
}

