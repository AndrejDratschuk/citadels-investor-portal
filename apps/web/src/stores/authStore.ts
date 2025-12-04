import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@flowveda/shared';
import { authApi } from '@/lib/api/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: true, // Start as loading until hydration completes
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      setTokens: (accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ accessToken, refreshToken });
      },

      logout: async () => {
        try {
          const { accessToken } = get();
          if (accessToken) {
            await authApi.logout();
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
        }
      },

      checkAuth: async () => {
        const { accessToken } = get();
        if (!accessToken) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true });
        try {
          const user = await authApi.getCurrentUser();
          set({ user, isAuthenticated: true });
        } catch (error) {
          // Token invalid, try refresh
          const { refreshToken } = get();
          if (refreshToken) {
            try {
              const tokens = await authApi.refreshToken(refreshToken);
              get().setTokens(tokens.accessToken, tokens.refreshToken);
              const user = await authApi.getCurrentUser();
              set({ user, isAuthenticated: true });
            } catch {
              // Refresh failed, logout
              get().logout();
            }
          } else {
            get().logout();
          }
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // After hydration, set isLoading to false
        if (state) {
          // Derive isAuthenticated from stored data if not set
          const hasAuth = !!(state.accessToken && state.user);
          state.isAuthenticated = hasAuth;
          state.isLoading = false;
        }
      },
    }
  )
);

