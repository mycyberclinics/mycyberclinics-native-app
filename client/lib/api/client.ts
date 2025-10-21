import axios from 'axios';
import { getFirebaseAuth } from '@/lib/firebase';
import * as SecureStore from 'expo-secure-store';
import { BackendUserSchema } from '@/lib/schemas/user';

const TOKEN_KEY = 'mc_firebase_id_token';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  timeout: 25000,
});

// Request interceptor
api.interceptors.request.use(async (config) => {
  config.headers = config.headers || {};

  try {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;

    if (user) {
      try {
        const token = await user.getIdToken(true); // force refresh
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      } catch (err: any) {
        const code = err?.code || err?.message || '';
        console.warn('[API] getIdToken(true) failed', code);

        if (code.includes('auth/invalid-credential')) {
          try {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
          } catch (e) {
            console.warn('[API] SecureStore delete failed', e);
          }

          try {
            await auth.signOut?.();
          } catch (e) {
            console.warn('[API] signOut after invalid credential failed', e);
          }

          return config;
        }

        // fallback to stored token
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (storedToken) config.headers.Authorization = `Bearer ${storedToken}`;
        return config;
      }
    }

    const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
    if (storedToken) config.headers.Authorization = `Bearer ${storedToken}`;
  } catch (err) {
    console.warn('[API] Token attach error:', err);
  }

  console.log('[DEBUG] OUTGOING HEADERS:', config.headers);
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('[API] Error:', error?.message ?? error);

    if (error.response?.status === 401) {
      console.warn('[API] Unauthorized — clearing auth');
      const auth = getFirebaseAuth();
      try {
        await auth.signOut?.();
      } catch (e) {
        console.warn('[API] signOut failed:', e);
      }

      // Clear local user store
      const { reset } = require('@/store/auth').useAuthStore.getState();
      reset();

      // Toast feedback
      import('react-native-toast-message').then(({ default: Toast }) => {
        Toast.show({
          type: 'info',
          text1: 'Session expired',
          text2: 'Please sign in again to continue.',
          visibilityTime: 3000,
        });
      });
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
