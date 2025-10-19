import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirebaseAuth } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import api from '@/lib/api/client';
import { BackendUserSchema, BackendUser } from '@/lib/schemas/user';

type AppUser = any;

type AuthState = {
  user: AppUser | null;
  profile: BackendUser | null;
  initializing: boolean;
  loading: boolean;
  error: string | null;
  tempEmail: string | null;
  tempPassword: string | null;
  onboarding: boolean;
  lastStep: string | null;

  // setters
  setUser: (user: AppUser | null) => void;
  setProfile: (profile: BackendUser | null) => void;
  setInitializing: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  setError: (error: string | null) => void;
  setTempEmail: (email: string | null) => void;
  setTempPassword: (password: string | null) => void;
  setOnboarding: (value: boolean) => void;
  setLastStep: (step: string | null) => void;

  // actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<boolean>;
  loadProfile: () => Promise<void>;
  syncProfile: (updates: Partial<BackendUser>) => Promise<void>;
  completeSignUp: () => void;
  signOut: () => Promise<void>;
  rehydrate: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      initializing: true,
      loading: false,
      error: null,
      tempEmail: null,
      tempPassword: null,
      onboarding: false,
      lastStep: null,

      // setters
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setInitializing: (v) => set({ initializing: v }),
      setLoading: (v) => set({ loading: v }),
      setError: (error) => set({ error }),
      setTempEmail: (email) => set({ tempEmail: email }),
      setTempPassword: (password) => set({ tempPassword: password }),
      setOnboarding: (value) => set({ onboarding: value }),
      setLastStep: (step) => set({ lastStep: step }),

      // signUp
      signUp: async (email, password) => {
        try {
          set({ loading: true, error: null });
          const auth = getFirebaseAuth();
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          const { uid, email: em } = cred.user;

          // sync with backend
          try {
            await api.post('/api/signup', { email: em, firebaseUid: uid });
            console.log('[AUTH] User synced with backend');
          } catch (syncErr: any) {
            console.error('[AUTH] Backend sync failed:', syncErr.response?.data || syncErr.message);
            set({ error: syncErr.message });
          }

          set({
            tempEmail: em || '',
            tempPassword: password,
            onboarding: true,
            loading: false,
            user: cred.user,
            lastStep: '/(auth)/signup/emailPassword',
          });

          return true;
        } catch (err: any) {
          console.error('[AUTH] signUp error:', err.message);
          set({ error: err.message, loading: false });
          return false;
        }
      },

      // signIn
      signIn: async (email, password) => {
        try {
          set({ loading: true, error: null });
          const auth = getFirebaseAuth();
          const cred = await signInWithEmailAndPassword(auth, email, password);
          set({ user: cred.user, loading: false });
          await get().loadProfile();
          console.log('[AUTH] Sign-in successful:', cred.user.uid);
        } catch (err: any) {
          console.error('[AUTH] signIn error:', err.message);
          set({ error: err.message, loading: false });
        }
      },

      // loadProfile
      loadProfile: async () => {
        try {
          const response = await api.get('/api/profile');
          const validated = BackendUserSchema.parse(response.data);
          set({ profile: validated });
          console.log('[AUTH] Profile loaded:', validated);
        } catch (err: any) {
          console.error('[AUTH] loadProfile error:', err.message);
        }
      },

      // syncProfile
      syncProfile: async (updates) => {
        try {
          const response = await api.put('/api/profile', updates);
          const validated = BackendUserSchema.parse(response.data);
          set({ profile: validated });
          console.log('[AUTH] Profile updated:', validated);
        } catch (err: any) {
          console.error('[AUTH] syncProfile error:', err.message);
        }
      },

      // completeSignUp
      completeSignUp: () => {
        set({
          onboarding: false,
          tempEmail: null,
          tempPassword: null,
          lastStep: null,
        });
        console.log('[AUTH] Onboarding complete.');
      },

      // signOut
      signOut: async () => {
        try {
          const auth = getFirebaseAuth();
          await fbSignOut(auth);
          set({
            user: null,
            profile: null,
            onboarding: false,
            tempEmail: null,
            tempPassword: null,
            lastStep: null,
          });
          console.log('[AUTH] Signed out successfully');
        } catch (err: any) {
          console.error('[AUTH] signOut error:', err.message);
        }
      },

      // rehydrate -> called by MainLayout on mount
      rehydrate: async () => {
        const auth = getFirebaseAuth();
        return new Promise<void>((resolve) => {
          onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
              console.log('[AUTH] Firebase user detected during rehydrate:', firebaseUser.email);
              set({ user: firebaseUser });

              // load remote profile to decide onboarding state
              await get().loadProfile();
              const profile = get().profile;

              const onboardingNeeded = !profile || !profile.name || !profile.role || !profile.age;

              const { lastStep } = get();
              set({
                onboarding: onboardingNeeded,
                lastStep: lastStep || '/(auth)/signup/emailPassword',
              });

              console.log('[AUTH] Rehydrated state', {
                onboarding: onboardingNeeded,
                lastStep: lastStep || '/(auth)/signup/emailPassword',
              });
            }

            set({ initializing: false });
            resolve();
          });
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // optionally whitelist specific keys:
      // partialize: (state) => ({ user: state.user, onboarding: state.onboarding, lastStep: state.lastStep })
    },
  ),
);
