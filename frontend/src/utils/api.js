import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send HttpOnly auth cookie automatically
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer token header if present in localStorage (fallback for cross-origin setups)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kanban_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept 401 errors for session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      // Clear token and let store handle redirection
      localStorage.removeItem('kanban_token');
    }
    return Promise.reject(error);
  }
);
