import axios from 'axios';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/auth';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  timeout: 15000,
});

// add Authorization: Bearer <idToken> to every request if user is logged in
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken(); // refreshed automatically if expired
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    } catch (err) {
      console.warn('[API] Token fetch failed:', err);
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API] Error:', error.message);

    if (error.response?.status === 401) {
      console.warn('[API] Unauthorized — clearing auth');
      useAuthStore.getState().signOut();
    }

    return Promise.reject(error);
  },
);

//testing with this function, to be deleted later ⚡⚡
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
