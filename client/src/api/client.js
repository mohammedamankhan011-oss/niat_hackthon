import axios from 'axios';
import { mockBackend } from './mocks.js';

export const isMockMode = typeof import.meta !== 'undefined' && import.meta.env
  ? (import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_USE_MOCK === true)
  : true;
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('scamshield_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: on 401 clear token -> redirect to /login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('scamshield_token');
      localStorage.removeItem('scamshield_user');
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Standardizes error extraction according to API contract:
 * Errors look like { error: { message, code } } - show message.
 */
export function extractErrorMessage(err) {
  if (!err) return 'An unexpected error occurred. Please try again.';
  if (typeof err === 'string') return err;
  if (err.response?.data?.error?.message) {
    return err.response.data.error.message;
  }
  if (err.response?.data?.message) {
    return err.response.data.message;
  }
  if (err.message) {
    return err.message;
  }
  return 'Connection issue. Please check your network and try again.';
}

/**
 * Simulate network latency for mock mode
 */
export const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));
