import axios from 'axios';

/**
 * api.ts — Central API client and data mode configuration.
 *
 * VITE_DATA_MODE:
 *   "mock" (default) — All services return local mock data. Safe for frontend development.
 *   "api"            — All services call the FastAPI backend. Requires backend running.
 *
 * RULES:
 *   - Production MUST use VITE_DATA_MODE=api.
 *   - API mode NEVER silently falls back to mock data.
 *   - If the backend is unavailable in api mode, an error state is shown — not fake data.
 *
 * SECURITY:
 *   - All secrets (LLM keys, DB credentials, Graphiti config) live on the backend.
 *   - The frontend only receives API responses.
 */

export const DATA_MODE = (import.meta.env.VITE_DATA_MODE ?? 'mock') as 'mock' | 'api';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Timeout: don't wait indefinitely for a backend that isn't running
  timeout: 10000,
});

// Response interceptor: surface clear errors in api mode
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (DATA_MODE === 'api') {
      // In api mode: do not silently swallow errors
      const message =
        error.response?.data?.detail ??
        error.message ??
        'Assessment service unavailable.';
      return Promise.reject(new Error(message));
    }
    return Promise.reject(error);
  }
);

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
