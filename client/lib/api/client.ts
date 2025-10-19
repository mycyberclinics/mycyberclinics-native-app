import axios from 'axios';
import { getFirebaseAuth } from '@/lib/firebase';
import * as SecureStore from 'expo-secure-store';
import { BackendUserSchema } from '@/lib/schemas/user';

const TOKEN_KEY = 'mc_firebase_id_token';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000',
  timeout: 25000,
});

// attach Firebase ID token to request payload
api.interceptors.request.use(async (config) => {
  config.headers = config.headers || {};

  try {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;

    if (user) {
      const token = await user.getIdToken();  // force refresh if true is passed here 
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    }

    const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
    if (storedToken) {
      config.headers.Authorization = `Bearer ${storedToken}`;
    }
  } catch (err) {
    console.warn('[API] Token attach error:', err);
  }

  console.log('[DEBUG] OUTGOING HEADERS:', config.headers);

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API] Error:', error?.message ?? error);
    if (error.response?.status === 401) {
      console.warn('[API] Unauthorized — clearing auth');
      const auth = getFirebaseAuth();
      auth.signOut?.();
    }
    return Promise.reject(error);
  },
);

export async function fetchProfile() {
  try {
    const response = await api.get('/api/profile');
    const user = BackendUserSchema.parse(response.data);
    console.log('[API] profile parsed:', user);
    return user;
  } catch (error) {
    console.error('[API] profile fetch failed', error);
    throw error;
  }
}

export default api;
