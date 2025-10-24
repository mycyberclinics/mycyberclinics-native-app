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

  // hasSeenIntro: boolean;
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
  // setHasSeenIntro: (value: boolean) => void;

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
      loading: false,
      error: null,
      tempEmail: null,
      tempPassword: null,
      onboarding: false,
      lastStep: null,
      emailVerified: false,
      profileCompleted: false,
      // hasSeenIntro: false,
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
      // setHasSeenIntro: (value: boolean) => set({ hasSeenIntro: value }),
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

      // SIGN UP flow:
      signUp: async (email, password) => {
        try {
          set({ loading: true, error: null });
          const auth = getFirebaseAuth();

          // 1) Create Firebase client user
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          const { uid, email: em } = cred.user;
          const token = await cred.user.getIdToken();
          await SecureStore.setItemAsync(TOKEN_KEY, token);
          console.log('[AUTH] Sign-up successful:', uid);

          // 2) Call backend to create profile and send SendGrid template
          try {
            const payload = { email: em, password, firebaseUid: uid };
            console.log('[AUTH] calling backend /api/signup payload:', {
              email: em,
              firebaseUid: uid,
            });
            const resp = await api.post('/api/signup', payload);
            if (resp && resp.status >= 200 && resp.status < 300) {
              console.log('[AUTH] Backend signup response:', resp.data);
              const sentFlag = resp.data?.sent ?? resp.data?.success ?? true;
              set({ verificationSentByBackend: Boolean(sentFlag) });
            } else {
              console.warn('[AUTH] Backend signup returned non-OK', resp.status, resp.data);
              set({ verificationSentByBackend: false });
            }
          } catch (syncErr) {
            const e = parseError(syncErr);
            console.error('[AUTH] Backend sync failed:', e.response ?? e.message);

            // Detect "exists but unverified" variants robustly
            const backendMsg = String(e.response?.data?.error ?? e.message ?? '').toLowerCase();
            const isUnverifiedExists =
              /exists.*unverified|exists but is unverified|already exists.*unverified|already exists but is unverified/i.test(
                backendMsg,
              ) ||
              (/already exists/i.test(backendMsg) && /unverified/i.test(backendMsg));

            if (isUnverifiedExists) {
              console.log(
                '[AUTH] Backend indicates existing unverified user — attempting backend resend (/api/signup/resend)',
              );
              try {
                // Attempt single, explicit resend endpoint your backend should implement
                const resendResp = await api.post('/api/resend-verification', {
                  email: em,
                  firebaseUid: uid,
                });
                if (resendResp && resendResp.status >= 200 && resendResp.status < 300) {
                  console.log('[AUTH] Backend resend success', resendResp.data);
                  set({ verificationSentByBackend: true });
                } else {
                  console.warn(
                    '[AUTH] Backend resend returned non-OK',
                    resendResp.status,
                    resendResp.data,
                  );
                  set({
                    error:
                      'Account exists but is unverified. Backend resend returned non-OK. You can request "Re-send" on the next screen.',
                    verificationSentByBackend: false,
                  });
                }
              } catch (resendErr) {
                const r = parseError(resendErr);
                console.error('[AUTH] Backend resend failed:', r.response ?? r.message);
                set({
                  error:
                    'Account exists but is unverified. Backend resend failed. You can request "Re-send" on the next screen.',
                  verificationSentByBackend: false,
                });
              }
            } else {
              // Generic backend failure — allow client fallback on verify screen
              set({ error: e.message || 'Backend sync failed', verificationSentByBackend: false });
            }
          }

          // 3) Update local state and go to verifyEmail screen
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
          console.error('[AUTH] signUp error:', e.message);
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
          await SecureStore.setItemAsync(TOKEN_KEY, token);
          set({ user: cred.user });
          await get().loadProfile();
          const profile = get().profile;
          const onboardingNeeded = !profile || !profile.displayName || !profile.role;

          // Only set lastStep if null

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

          set({
            profile: { ...validated, role: normalizedRole },
          });

          console.log('[AUTH] Profile loaded:', validated);

          // If verified + profile exists, disable onboarding
          if (user.emailVerified && validated.email) {
            set({
              onboarding: false,
              lastStep: null, //
            });
            console.log(
              '[AUTH] User verified + profile exists → onboarding cleared + lastStep reset',
            );
            // =======
            //           set({ profile: { ...validated, role: normalizedRole } });
            //           if (user.emailVerified && validated.email) {
            //             set({ onboarding: false, lastStep: null });
            // >>>>>>> a0493b04df4825bc579aa741406e23138339d9dd
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
          // Normalize frontend role to match backend naming

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

      // rehydrate: async () => {
      //   const auth = getFirebaseAuth();
      //   set({ loading: true });
      //   return new Promise<void>((resolve) => {
      //     onAuthStateChanged(auth, async (firebaseUser) => {
      //       if (firebaseUser) {
      //         console.log('[AUTH] Firebase user detected during rehydrate:', firebaseUser.email);
      //         set({ user: firebaseUser });

      //         await get().loadProfile();
      //         const profile = get().profile;
      //         const onboardingNeeded = !profile || !profile.displayName || !profile.role;
      //         const { lastStep } = get();

      //         set({
      //           onboarding: onboardingNeeded,
      //           lastStep: lastStep || '/(auth)/signup/emailPassword',
      //         });
      //       } else {
      //         console.log('[AUTH] No Firebase user during rehydrate → clearing persisted state.');
      //         // Clear any stale data from AsyncStorage/Zustand
      //         await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
      //         set({
      //           user: null,
      //           profile: null,
      //           onboarding: true,
      //           lastStep: '/(auth)/signup/emailPassword',
      //         });
      //       }

      //       // Clear any temporary loading flags and mark rehydration complete
      //       set({ initializing: false, loading: false, rehydrated: true });

      //       console.log('[AUTH] Rehydrate complete → clearing loading and initializing');
      //       resolve();
      //     });

      //     onIdTokenChanged(auth, async (firebaseUser) => {
      //       if (firebaseUser) {
      //         const token = await firebaseUser.getIdToken();
      //         await SecureStore.setItemAsync(TOKEN_KEY, token);
      //       }
      //     });
      //   });
      // },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
