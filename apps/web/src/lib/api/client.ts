const API_URL = import.meta.env.VITE_API_URL || '/api';

// Debug: Log the API URL being used
console.log('🔗 API_URL:', API_URL);
console.log('🔗 VITE_API_URL env:', import.meta.env.VITE_API_URL);

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

async function getAuthToken(): Promise<string | null> {
  // Get token from auth store or localStorage
  const token = localStorage.getItem('accessToken');
  return token;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  
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

