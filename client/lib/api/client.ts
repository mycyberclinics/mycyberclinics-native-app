import axios from 'axios';
import { apiBaseUrl } from './apiConfig'; // <-- import the helper
import { getFirebaseAuth } from '@/lib/firebase';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'mc_firebase_id_token';

const api = axios.create({
  baseURL: apiBaseUrl, // <-- use the config value here!
  timeout: 15000,
});

// Axios request interceptor: Always await getFirebaseAuth() before accessing currentUser!
api.interceptors.request.use(async (config) => {
  config.headers = config.headers || {};

  const auth = await getFirebaseAuth();
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    } catch (err) {
      console.warn('[API] Token fetch from currentUser failed:', err);
      // fallthrough to SecureStore
    }
  }

  // Fallback: SecureStore
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn('[API] SecureStore token read failed:', err);
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API] Error:', error?.message ?? error);
    if (error.response?.status === 401) {
      console.warn('[API] Unauthorized — clearing auth');
      getFirebaseAuth().then((auth) => auth.signOut?.());
    }
    return Promise.reject(error);
  },
);

/** Convenience API function for /api/profile */
export async function fetchProfile() {
  try {
    const response = await api.get('/api/profile');
    console.log('[API] profile:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] profile fetch failed', error);
    throw error;
  }
}

export default api;
