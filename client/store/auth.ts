import { Platform } from 'react-native';
import { create } from 'zustand';
import type { UseBoundStore, StoreApi } from 'zustand';

import { getFirebaseAuth } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  onIdTokenChanged,
} from 'firebase/auth';
import api from '@/lib/api/client';
import { BackendUserSchema, BackendUser } from '@/lib/schemas/user';
import { SafeStorage } from '@/utils/SafeStorage';
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
  verificationSentByBackend: boolean;
  rehydrated: boolean;

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

// core state creator
const makeStore = (set: any, get: any): AuthState => ({
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
  verificationSentByBackend: false,
  rehydrated: false,

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
      await SafeStorage.setItem(TOKEN_KEY, token);

      try {
        const payload = { email: em, password, firebaseUid: uid };
        const resp = await api.post('/api/signup', payload);
        if (resp && resp.status >= 200 && resp.status < 300) {
          const sentFlag = resp.data?.sent ?? resp.data?.success ?? true;
          set({ verificationSentByBackend: Boolean(sentFlag) });
        } else {
          set({ verificationSentByBackend: false });
        }
      } catch (syncErr) {
        const e = parseError(syncErr);
        const backendMsg = String(e.response?.data?.error ?? e.message ?? '').toLowerCase();
        const isUnverifiedExists =
          /exists.*unverified|exists but is unverified|already exists.*unverified|already exists but is unverified/i.test(
            backendMsg,
          ) ||
          (/already exists/i.test(backendMsg) && /unverified/i.test(backendMsg));

        if (isUnverifiedExists) {
          try {
            const resendResp = await api.post('/api/resend-verification', {
              email: em,
              firebaseUid: uid,
            });
            if (resendResp && resendResp.status >= 200 && resendResp.status < 300) {
              set({ verificationSentByBackend: true });
            } else {
              set({
                error:
                  'Account exists but is unverified. Backend resend returned non-OK. You can request "Re-send" on the next screen.',
                verificationSentByBackend: false,
              });
            }
          } catch (resendErr) {
            set({
              error:
                'Account exists but is unverified. Backend resend failed. You can request "Re-send" on the next screen.',
              verificationSentByBackend: false,
            });
          }
        } else {
          set({ error: e.message || 'Backend sync failed', verificationSentByBackend: false });
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

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const auth = getFirebaseAuth();
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const token = await cred.user.getIdToken();
      await SafeStorage.setItem(TOKEN_KEY, token);
      set({ user: cred.user });
      // attempt to hydrate profile, but be tolerant of parse errors
      await get().loadProfile();
      const profile = get().profile;
      // only decide onboarding if profile is a valid object
      const onboardingNeeded = profile ? !profile.displayName || !profile.role : get().onboarding;
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
      if (!user) {
        console.warn('[AUTH] loadProfile: no firebase user, skipping');
        return;
      }
      const token = await user.getIdToken();
      const response = await api.get('/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data;
      // Defensive check: backend sometimes returns a string or message -> bail and log
      if (!data || typeof data === 'string') {
        console.warn('[AUTH] loadProfile unexpected response type — not an object:', typeof data, data);
        // Do NOT flip onboarding state here; keep existing store value.
        return;
      }

      // Validate with Zod — if invalid, log and bail (don't throw)
      try {
        const validated = BackendUserSchema.parse(data);
        const normalizedRole = validated.role === 'physician' ? 'doctor' : validated.role;
        set({ profile: { ...validated, role: normalizedRole } });
        // only clear onboarding if firebase shows emailVerified AND backend profile has email
        if (user.emailVerified && validated.email) {
          set({ onboarding: false, lastStep: null });
        }
      } catch (zErr) {
        console.warn('[AUTH] loadProfile Zod validation failed:', zErr);
        // Validation failed; do not set profile or change onboarding — leave store as-is
        return;
      }
    } catch (err: any) {
      const e = parseError(err);
      console.error('[AUTH] loadProfile error:', e.message ?? e);
      // do not throw further
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
      await SafeStorage.deleteItem(TOKEN_KEY);
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
        try {
          if (firebaseUser) {
            set({ user: firebaseUser });
            // attempt to load profile but be tolerant
            await get().loadProfile();
            const profile = get().profile;
            // decide onboarding only if profile is present and valid; otherwise keep existing
            const onboardingNeeded = profile ? !profile.displayName || !profile.role : get().onboarding;
            set({
              onboarding: onboardingNeeded,
              lastStep: get().lastStep ?? (onboardingNeeded ? '/(auth)/signup/emailPassword' : null),
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
        } finally {
          set({ loading: false, initializing: false, rehydrated: true });
          resolve();
        }
      });

      if (get().user?.emailVerified && get().onboarding) {
        set({ onboarding: false, lastStep: null });
      }

      onIdTokenChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const token = await firebaseUser.getIdToken();
          await SafeStorage.setItem(TOKEN_KEY, token);
        }
      });
    });
  },
});

// Create store: no top-level middleware import. Persist only on native branch.
let _useAuthStore: UseBoundStore<StoreApi<AuthState>>;

if (Platform.OS === 'web') {
  _useAuthStore = create<AuthState>(makeStore);
} else {
  const { persist, createJSONStorage } = require('zustand/middleware');
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;

  _useAuthStore = create<AuthState>()(
    persist(makeStore, {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }),
  );
}

export const useAuthStore: typeof _useAuthStore = _useAuthStore;