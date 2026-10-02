import axios from 'axios';
import { getSupabase } from '../lib/supabase';

// Base URL from Vite env variables with fallback-safe resolution
const rawApiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string) ||
  (import.meta.env.VITE_API_URL as string) ||
  'http://localhost:8000';

export const API_BASE_URL = String(rawApiBaseUrl).trim().replace(/\/+$/, '');

// Axios instance with standard Content-Type and Accept headers
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000, // 15 seconds
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor – attach Bearer token from Supabase auth state
api.interceptors.request.use(async (config) => {
  try {
    const supabase = getSupabase();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      if (typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${session.access_token}`);
      } else {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    }
    return config;
  } catch {
    // If token lookup fails, proceed without authorization header
    return config;
  }
});

// Response interceptor – normalize error shape with friendly messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let normalizedMessage = error.message;

    if (error.code === 'ERR_NETWORK' || error.message?.toLowerCase().includes('network error')) {
      normalizedMessage =
        'Unable to connect to backend server. Please verify the API server is active and accessible.';
    } else if (error.response?.data?.detail) {
      normalizedMessage =
        typeof error.response.data.detail === 'string'
          ? error.response.data.detail
          : JSON.stringify(error.response.data.detail);
    }

    const normalized = {
      message: normalizedMessage,
      status: error.response?.status,
      data: error.response?.data,
    } as const;
    return Promise.reject(normalized);
  }
);

export default api;
