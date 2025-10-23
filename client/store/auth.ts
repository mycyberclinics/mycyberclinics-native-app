import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import * as SecureStore from 'expo-secure-store';

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
  // hasSeenIntro: boolean; // ✅ NEW FLAG

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
  reset: () => void;
  setOnboardingComplete: () => void;
  // setHasSeenIntro: (value: boolean) => void; // ✅ NEW SETTER

  // actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<boolean>;
  loadProfile: () => Promise<void>;
  syncProfile: (updates: Partial<BackendUser>) => Promise<void>;
  completeSignUp: () => void;
  signOut: () => Promise<void>;
  rehydrate: () => Promise<void>;
};

const TOKEN_KEY = 'mc_firebase_id_token';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      profile: null,
      initializing: true,
      loading: true,
      error: null,
      tempEmail: null,
      tempPassword: null,
      onboarding: false,
      lastStep: null,
      emailVerified: false,
      profileCompleted: false,
      // hasSeenIntro: false, // ✅ added

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
      // setHasSeenIntro: (value) => set({ hasSeenIntro: value }), // ✅ added

      reset: () => set({ user: null, lastStep: null, onboarding: true }),
      setOnboardingComplete: () =>
        set({ onboarding: false, emailVerified: true, profileCompleted: true }),

      // signUp
      signUp: async (email, password) => {
        try {
          set({ loading: true, error: null });
          const auth = getFirebaseAuth();
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          const { uid, email: em } = cred.user;

          const token = await cred.user.getIdToken();
          await SecureStore.setItemAsync(TOKEN_KEY, token);
          console.log('[AUTH] Sign-up successful:', uid);

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
            lastStep: '/(auth)/signup/verifyEmail',
          });

          return true;
        } catch (err: any) {
          console.error('[AUTH] signUp error:', err.message);
          set({ error: err.message, loading: false });
          return false;
        }
      },

      signIn: async (email, password) => {
        try {
          set({ loading: true, error: null });
          const auth = getFirebaseAuth();
          const cred = await signInWithEmailAndPassword(auth, email, password);
          const token = await cred.user.getIdToken();
          await SecureStore.setItemAsync(TOKEN_KEY, token);
          console.log('[AUTH] Sign-in successful:', email);

          set({ user: cred.user, loading: false });
          await get().loadProfile();

          const profile = get().profile;

          // Only require onboarding if key fields are missing
          const onboardingNeeded = !profile || !profile.displayName || !profile.role;

          // ✅ Only set lastStep if null
          set({
            onboarding: onboardingNeeded,
            lastStep: get().lastStep ?? '/(auth)/signup/emailPassword',
          });

          console.log(
            '[AUTH Sign-in resolved. onboardingNeeded:',
            onboardingNeeded,
            'lastStep:',
            get().lastStep,
          );
        } catch (err: any) {
          console.error('[AUTH] signIn error:', err.message);
          set({ error: err.message, loading: false });
        }
      },

      // signIn
      // signIn: async (email, password) => {
      //   try {
      //     set({ loading: true, error: null });
      //     const auth = getFirebaseAuth();
      //     const cred = await signInWithEmailAndPassword(auth, email, password);
      //     const token = await cred.user.getIdToken();
      //     await SecureStore.setItemAsync(TOKEN_KEY, token);
      //     console.log('[AUTH] Sign-in successful:', email);

      //     set({ user: cred.user, loading: false });
      //     await get().loadProfile();

      //     const profile = get().profile;
      //     const onboardingNeeded =
      //       !profile || !profile.displayName || !profile.role || !profile.age;

      //     if (cred.user.emailVerified) {
      //       console.log('[AUTH] User verified → onboarding cleared + lastStep reset');
      //       set({
      //         onboarding: false,
      //         lastStep: null,
      //       });
      //     } else if (onboardingNeeded) {
      //       // keep onboarding active and lastStep if not verified
      //       const { lastStep } = get();
      //       set({
      //         onboarding: true,
      //         lastStep: lastStep || '/signup/verifyEmail',
      //       });
      //     }

      //     console.log(
      //       '[AUTH Sign-in resolved. onboardingNeeded:',
      //       onboardingNeeded,
      //       'lastStep:',
      //       get().lastStep,
      //     );

      //     const { lastStep } = get();

      //     set({
      //       onboarding: onboardingNeeded,
      //       lastStep: lastStep || '/(auth)/signup/emailPassword',
      //     });
      //     console.log(
      //       '[AUTH Sign-in resolved. onboardingNeeded:',
      //       onboardingNeeded,
      //       'lastStep:',
      //       get().lastStep,
      //     );
      //   } catch (err: any) {
      //     console.error('[AUTH] signIn error:', err.message);
      //     set({ error: err.message, loading: false });
      //   }
      // },

      // loadProfile
      // loadProfile: async () => {
      //   try {
      //     const token = await get().user?.getIdToken?.();
      //     const response = await api.get('/api/profile', {
      //       headers: { Authorization: `Bearer ${token}` },
      //     });

      //     const validated = BackendUserSchema.parse(response.data);
      //     const normalizedRole = validated.role === 'physician' ? 'doctor' : validated.role;

      //     // ✅ If profile loads successfully, onboarding is done
      //     set({
      //       profile: { ...validated, role: normalizedRole },
      //       onboarding: false,
      //     });

      //     console.log('[AUTH] Profile loaded:', validated);
      //   } catch (err: any) {
      //     console.error('[AUTH] loadProfile error:', err.message);

      //     // optional: if 404, stay in onboarding flow
      //     if (err.response?.status === 404) {
      //       console.log('[AUTH] No profile found — onboarding continues');
      //       set({ onboarding: true });
      //     }
      //   }
      // },

      // ✅ Final loadProfile
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

          set({
            profile: { ...validated, role: normalizedRole },
          });

          console.log('[AUTH] Profile loaded:', validated);

          // ✅ If verified + profile exists, disable onboarding
          if (user.emailVerified && validated.email) {
            set({
              onboarding: false,
              lastStep: null, // ✅ clear stale step
            });
            console.log(
              '[AUTH] User verified + profile exists → onboarding cleared + lastStep reset',
            );
          }
        } catch (err: any) {
          console.error('[AUTH] loadProfile error:', err.message);
        }
      },

      // syncProfile
      syncProfile: async (updates) => {
        try {
          const auth = getFirebaseAuth();
          const token = await auth.currentUser?.getIdToken();
          // Normalize frontend role → backend naming
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

          // Normalize backend role again for store consistency
          const normalizedRole = validated.role === 'physician' ? 'doctor' : validated.role;

          set({ profile: { ...validated, role: normalizedRole } });
          console.log('[AUTH] Profile updated:', { ...validated, role: normalizedRole });
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
            token: null,
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

      // rehydrate
      rehydrate: async () => {
        const auth = getFirebaseAuth();
        return new Promise<void>((resolve) => {
          onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
              console.log('[AUTH] Firebase user detected during rehydrate:', firebaseUser.email);
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
              const auth = getFirebaseAuth();
              const cred = await signInWithEmailAndPassword(
                auth,
                get().tempEmail as string,
                get().tempPassword as string,
              );
              set({ user: cred.user });
              console.log('[AUTH] Silent sign-in successful');
            }

            set({ initializing: false });
            resolve();
          });

          // sanity check after rehydration
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
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
