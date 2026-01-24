// Use Railway API URL in production, fallback to /api for local dev
export const API_URL = import.meta.env.PROD 
  ? 'https://citadel-investor-portal-production.up.railway.app/api'
  : (import.meta.env.VITE_API_URL || '/api');

export interface ApiError {
  success: false;
  error: string;
  message?: string;
  details?: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Track if a token refresh is in progress to prevent multiple simultaneous refreshes
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

function getAuthToken(): string | null {
  return localStorage.getItem('accessToken');
}

function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken');
}

function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

function clearTokens(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as ApiResponse<{ accessToken: string; refreshToken: string }>;
    
    if (data.success && data.data) {
      // Update localStorage
      setTokens(data.data.accessToken, data.data.refreshToken);
      // Also sync with zustand store so state stays consistent
      const { useAuthStore } = await import('@/stores/authStore');
      useAuthStore.getState().setTokens(data.data.accessToken, data.data.refreshToken);
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
}

async function handleTokenRefresh(): Promise<boolean> {
  // If already refreshing, wait for that to complete
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = refreshAccessToken().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized - attempt token refresh and retry
  if (response.status === 401 && !isRetry && !endpoint.includes('/auth/refresh')) {
    const refreshed = await handleTokenRefresh();
    
    if (refreshed) {
      // Retry the original request with the new token
      return apiRequest<T>(endpoint, options, true);
    }
    
    // Refresh failed - clear tokens and let the error propagate
    clearTokens();
    // Update auth store state
    const { useAuthStore } = await import('@/stores/authStore');
    useAuthStore.getState().logout();
    throw new Error('Unauthorized');
  }

  const data = (await response.json()) as ApiResponse<T> | ApiError;

  if (!response.ok || !('success' in data) || !data.success) {
    const error = data as ApiError;
    throw new Error(error.error || error.message || 'API request failed');
  }

  return (data as ApiResponse<T>).data as T;
}

export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(endpoint: string, body?: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  patch: <T>(endpoint: string, body?: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};

