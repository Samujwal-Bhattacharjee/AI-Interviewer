import axios from 'axios';

/**
 * Central API client.
 * Phase 1: baseURL is unused — all services return mock data.
 * Phase 2: Set VITE_API_URL env variable to point at FastAPI.
 *
 * Future WebSocket integration:
 *   const ws = new WebSocket(`${VITE_WS_URL}/ws/sessions/${sessionId}`);
 *   ws.onmessage = (event) => handleInterviewEvent(JSON.parse(event.data));
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Future auth token injection
// apiClient.interceptors.request.use((config) => {
//   const token = getAuthToken();
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
