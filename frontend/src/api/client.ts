import axios from 'axios';
import { getSupabase } from '../lib/supabase';

// Base URL from Vite env variable
const API_BASE_URL = import.meta.env.VITE_API_URL as string;

// Axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000, // 10 seconds
  // No credentials: we send JWT in Authorization header
});

// Request interceptor – attach Bearer token from Supabase auth state
api.interceptors.request.use(async (config) => {
  try {
    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      if (typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${session.access_token}`);
      } else {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    }
    return config;
  } catch (err) {
    // If we cannot get a token, proceed without it (backend will reject)
    return config;
  }
});

// Response interceptor – normalize error shape
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    } as const;
    return Promise.reject(normalized);
  }
);

export default api;
