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

// Slow request detector (> 4s)
const slowRequestListeners = new Set();
let activeSlowTimers = new Map();
let slowRequestCount = 0;

function notifySlowListeners(isSlow) {
  slowRequestListeners.forEach((cb) => {
    try {
      cb(isSlow);
    } catch (e) {
      // ignore listener error
    }
  });
}

export function subscribeSlowRequest(callback) {
  slowRequestListeners.add(callback);
  callback(slowRequestCount > 0);
  return () => slowRequestListeners.delete(callback);
}

function clearSlowRequest(reqId) {
  if (!reqId) return;
  const entry = activeSlowTimers.get(reqId);
  if (!entry) return;
  clearTimeout(entry.timer);
  if (entry.triggered) {
    slowRequestCount = Math.max(0, slowRequestCount - 1);
    if (slowRequestCount === 0) {
      notifySlowListeners(false);
    }
  }
  activeSlowTimers.delete(reqId);
}

// Attach Authorization Bearer token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('scamshield_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const reqId = Math.random().toString(36).slice(2);
    config.__reqId = reqId;
    const entry = { triggered: false, timer: null };
    entry.timer = setTimeout(() => {
      entry.triggered = true;
      slowRequestCount += 1;
      notifySlowListeners(true);
    }, 4000);
    activeSlowTimers.set(reqId, entry);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: on 401 clear token -> redirect to /login
apiClient.interceptors.response.use(
  (response) => {
    clearSlowRequest(response?.config?.__reqId);
    return response;
  },
  (error) => {
    clearSlowRequest(error?.config?.__reqId);
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
  if (err.response?.status === 503) {
    return (
      err.response?.data?.error?.message ||
      err.response?.data?.message ||
      'Our AI security service is temporarily busy waking up. Please wait a few seconds and try again.'
    );
  }
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
