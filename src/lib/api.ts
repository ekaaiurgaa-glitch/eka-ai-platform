import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Auth Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sb-access-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle Rate Limits (Phase 3 Protection)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      console.error("⛔ Rate Limit Exceeded. Please slow down.");
      // Optional: Trigger a toast notification here
    }
    return Promise.reject(error);
  }
);

export default api;
