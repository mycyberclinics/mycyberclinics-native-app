import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { Platform } from 'react-native';
import { getFirebaseAuth } from '../firebase';
import { apiBaseUrl as fallbackApiBaseUrl } from './apiConfig';

/**
 * Resolve base URL:
 * Preference order:
 * 1. process.env.EXPO_PUBLIC_API_BASE_URL (set in .env / EAS / runtime)
 * 2. fallbackApiBaseUrl (from lib/api/apiConfig.ts which handles platform specifics)
 * 3. hardcoded localhost fallback
 */
const resolvedBaseUrl =
  (process.env.EXPO_PUBLIC_API_BASE_URL && String(process.env.EXPO_PUBLIC_API_BASE_URL).trim()) ||
  fallbackApiBaseUrl ||
  (() => {
    if (Platform.OS === 'android') return 'http://10.0.2.2:4000';
    if (Platform.OS === 'ios' || Platform.OS === 'web') return 'http://localhost:4000';
    return 'http://localhost:4000';
  })();

console.log('[API CLIENT] Base URL:', resolvedBaseUrl);

/**
 * Create axios instance
 */
const api: AxiosInstance = axios.create({
  baseURL: resolvedBaseUrl,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Request interceptor:
 * - Attaches Authorization header with current Firebase ID token when available.
 */
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        if (token) {
          if (!config.headers) config.headers = {} as any;
          (config.headers as any)['Authorization'] = `Bearer ${token}`;
        }
      }
    } catch (err: any) {
      console.warn('[API CLIENT] Failed to attach ID token to request', err?.message ?? err);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Response interceptor:
 * - If we receive 401, attempt a single forced refresh of the Firebase ID token and retry the request once.
 * - Mark retried requests with config._retry to avoid infinite loops.
 */
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError & { config?: InternalAxiosRequestConfig }) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      try {
        originalRequest._retry = true;
        const auth = getFirebaseAuth();
        const user = auth.currentUser;
        if (user) {
          const freshToken = await user.getIdToken(true);
          if (freshToken) {
            if (!originalRequest.headers) originalRequest.headers = {} as any;
            (originalRequest.headers as any)['Authorization'] = `Bearer ${freshToken}`;
            console.log('[API CLIENT] Retrying request after forced token refresh');
            return api(originalRequest);
          }
        }
      } catch (refreshErr: any) {
        console.warn(
          '[API CLIENT] Token refresh failed during retry',
          refreshErr?.message ?? refreshErr,
        );
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Helper: fetchProfile
 */
export async function fetchProfile() {
  try {
    const resp = await api.get('/api/profile');
    return resp.data;
  } catch (err) {
    console.error('[API CLIENT] fetchProfile error:', err);
    throw err;
  }
}

/**
 * Small convenience: allow runtime override of baseURL (useful for debug)
 */
export function setBaseUrl(url: string) {
  api.defaults.baseURL = url;
  console.log('[API CLIENT] baseURL overridden to', url);
}

export default api;