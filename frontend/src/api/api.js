import axios from 'axios';

// Pull VITE_API_URL, default to local docker backend host port
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Automatically inject JWT token into header if it exists in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('manivtha_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Gracefully handle global HTTP errors (like 401 Unauthorized logouts)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Authentication token expired or invalid. Clearing session...');
      localStorage.removeItem('manivtha_token');
      localStorage.removeItem('manivtha_user');
      // Only redirect to login if we are inside the dashboard protected routes
      if (window.location.pathname.startsWith('/dashboard')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
