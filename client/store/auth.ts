import { createStore } from 'zustand/vanilla';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getFirebaseAuth } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  onIdTokenChanged,
  User,
} from 'firebase/auth';
import api from '@/lib/api/client';
import { BackendUserSchema, BackendUser } from '@/lib/schemas/user';
import * as SecureStore from 'expo-secure-store';
import parseError from '@/utils/parseError';

type AppUser = any;

type AuthState = {
  token: string | null;
  user: AppUser | null;
  profile: BackendUser | null;
  initializing: boolean;
  loading: boolean;
  error: string | null;
  tempEmail: string | null;
  tempPassword: string | null;
  onboarding: boolean;
  lastStep: string | null;
  emailVerified: boolean;
  profileCompleted: boolean;
  rehydrated: boolean;
  verificationSentByBackend: boolean;

  setUser: (user: AppUser | null) => void;
  setProfile: (profile: BackendUser | null) => void;
  setInitializing: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  setError: (error: string | null) => void;
  setTempEmail: (email: string | null) => void;
  setTempPassword: (password: string | null) => void;
  setOnboarding: (value: boolean) => void;
  setLastStep: (step: string | null) => void;
  setVerificationSentByBackend: (v: boolean) => void;
  reset: () => void;
  setOnboardingComplete: () => void;

  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<boolean>;
  loadProfile: () => Promise<void>;
  syncProfile: (updates: Partial<BackendUser>) => Promise<void>;
  completeSignUp: () => void;
  signOut: () => Promise<void>;
  rehydrate: () => Promise<void>;
};

const TOKEN_KEY = 'mc_firebase_id_token';

const store = createStore<AuthState>((set, get) => ({
  token: null,
  user: null,
  profile: null,
  initializing: true,
  loading: false,
  error: null,
  tempEmail: null,
  tempPassword: null,
  onboarding: false,
  lastStep: null,
  emailVerified: false,
  profileCompleted: false,
  rehydrated: false,
  verificationSentByBackend: false,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setInitializing: (v) => set({ initializing: v }),
  setLoading: (v) => set({ loading: v }),
  setError: (error) => set({ error }),
  setTempEmail: (email) => set({ tempEmail: email }),
  setTempPassword: (password) => set({ tempPassword: password }),
  setOnboarding: (value) => set({ onboarding: value }),
  setLastStep: (step) => set({ lastStep: step }),
  setVerificationSentByBackend: (v) => set({ verificationSentByBackend: v }),

  reset: () =>
    set({
      user: null,
      lastStep: null,
      onboarding: true,
      verificationSentByBackend: false,
    }),
  setOnboardingComplete: () =>
    set({ onboarding: false, emailVerified: true, profileCompleted: true }),

  signUp: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const auth = getFirebaseAuth();
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const { uid, email: em } = cred.user;
      const token = await cred.user.getIdToken();
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      set({ user: cred.user });

      try {
        const payload = { email: em, password, firebaseUid: uid };
        const resp = await api.post('/api/signup', payload);
        const sentFlag = resp.data?.sent ?? resp.data?.success ?? true;
        set({ verificationSentByBackend: Boolean(sentFlag) });
      } catch (syncErr) {
        const e = parseError(syncErr);
        const backendMsg = String(e.response?.data?.error ?? e.message ?? '').toLowerCase();
        const isUnverifiedExists = /exists.*unverified|already exists.*unverified/i.test(
          backendMsg,
        );

        if (isUnverifiedExists) {
          try {
            const resendResp = await api.post('/api/resend-verification', {
              email: em,
              firebaseUid: uid,
            });
            set({ verificationSentByBackend: resendResp.status >= 200 && resendResp.status < 300 });
          } catch (resendErr) {
            const r = parseError(resendErr);
            set({
              error: 'Account exists but is unverified. Backend resend failed.',
              verificationSentByBackend: false,
            });
          }
        } else {
          set({ error: e.message, verificationSentByBackend: false });
        }
      }

      set({
        tempEmail: em || '',
        tempPassword: password,
        onboarding: true,
        loading: false,
        user: cred.user,
        lastStep: '/(auth)/signup/verifyEmail',
      });

      return true;
    } catch (err: any) {
      const e = parseError(err);
      set({ error: e.message, loading: false, verificationSentByBackend: false });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // Continue from Batch 1...

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const auth = getFirebaseAuth();
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const token = await cred.user.getIdToken();
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      set({ user: cred.user });
      await get().loadProfile();
      const profile = get().profile;
      const onboardingNeeded = !profile || !profile.displayName || !profile.role;
      set({
        onboarding: onboardingNeeded,
        lastStep: get().lastStep ?? '/(auth)/signup/emailPassword',
      });
    } catch (err: any) {
      const e = parseError(err);
      set({ error: e.message, loading: false });
    }
  },

  loadProfile: async () => {
    try {
      const user = get().user;
      if (!user) throw new Error('No authenticated user found');
      const token = await user.getIdToken();
      const response = await api.get('api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const validated = BackendUserSchema.parse(response.data);
      const normalizedRole = validated.role === 'physician' ? 'doctor' : validated.role;
      set({ profile: { ...validated, role: normalizedRole } });

      if (user.emailVerified && validated.email) {
        set({ onboarding: false, lastStep: null });
      }
    } catch (err: any) {
      const e = parseError(err);
      console.error('[AUTH] loadProfile error:', e.message);
    }
  },

  syncProfile: async (updates) => {
    try {
      const auth = getFirebaseAuth();
      const token = await auth.currentUser?.getIdToken();
      const normalizedUpdates = {
        ...updates,
        role: updates.role === 'doctor' ? 'physician' : updates.role,
      };
      const response = await api.put('/api/profile', normalizedUpdates, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      const validated = BackendUserSchema.parse(response.data);
      const normalizedRole = validated.role === 'physician' ? 'doctor' : validated.role;
      set({ profile: { ...validated, role: normalizedRole } });
    } catch (err: any) {
      const e = parseError(err);
      console.error('[AUTH] syncProfile error:', e.message);
    }
  },

  completeSignUp: () => {
    set({
      onboarding: false,
      tempEmail: null,
      tempPassword: null,
      lastStep: null,
    });
  },

  signOut: async () => {
    try {
      const auth = getFirebaseAuth();
      await fbSignOut(auth);
      set({
        token: null,
        user: null,
        profile: null,
        onboarding: false,
        tempEmail: null,
        tempPassword: null,
        lastStep: null,
        verificationSentByBackend: false,
      });
    } catch (err: any) {
      const e = parseError(err);
      console.error('[AUTH] signOut error:', e.message);
    }
  },

  rehydrate: async () => {
    const auth = getFirebaseAuth();
    set({ loading: false });
    return new Promise<void>((resolve) => {
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          set({ user: firebaseUser });
          await get().loadProfile();
          const profile = get().profile;
          const onboardingNeeded = !profile || !profile.displayName || !profile.role;
          const { lastStep } = get();
          set({
            onboarding: onboardingNeeded,
            lastStep: lastStep || '/(auth)/signup/emailPassword',
          });
        }

        if (!firebaseUser && get().tempEmail && get().tempPassword) {
          try {
            const cred = await signInWithEmailAndPassword(
              auth,
              get().tempEmail as string,
              get().tempPassword as string,
            );
            set({ user: cred.user });
          } catch (err) {
            const e = parseError(err);
            console.warn('[AUTH] Silent sign-in failed:', e.message);
          }
        }

        set({ loading: false, initializing: false });
        resolve();
      });

      if (get().user?.emailVerified && get().onboarding) {
        set({ onboarding: false, lastStep: null });
      }

      onIdTokenChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const token = await firebaseUser.getIdToken();
          await SecureStore.setItemAsync(TOKEN_KEY, token);
        }
      });
    });
  },
}));

// ✅ TypeScript-safe conditional storage setup

const isWeb = Platform.OS === 'web';

const getStorage = () =>
  isWeb
    ? {
        getItem: async (key: string): Promise<string | null> => localStorage.getItem(key),
        setItem: async (key: string, value: string): Promise<void> => {
          localStorage.setItem(key, value);
        },
        removeItem: async (key: string): Promise<void> => {
          localStorage.removeItem(key);
        },
      }
    : AsyncStorage;

export const useAuthStore = create<AuthState>()(
  persist(() => store.getState(), {
    name: 'auth-storage',
    storage: createJSONStorage(getStorage),
  }),
);
