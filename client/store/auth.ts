import { create } from 'zustand';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  reload,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

type AppUser = { id: string; email: string; emailVerified: boolean } | null;

type AuthState = {
  user: AppUser;
  initializing: boolean;
  loading: boolean;
  error: string | null;

  setUser: (user: AppUser | null) => void;
  setInitializing: (value: boolean) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => {
  // Subscribe once to Firebase auth state
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      await reload(firebaseUser);
      set({
        user: {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          emailVerified: firebaseUser.emailVerified,
        },
        initializing: false,
      });
    } else {
      set({ user: null, initializing: false });
    }
  });

  return {
    user: null,
    initializing: true,
    loading: false,
    error: null,

    setUser: (user) => set({ user }),
    setInitializing: (v) => set({ initializing: v }),

    signIn: async (email, password) => {
      try {
        set({ loading: true, error: null });
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await reload(cred.user);
        set({
          user: {
            id: cred.user.uid,
            email: cred.user.email || '',
            emailVerified: cred.user.emailVerified,
          },
          loading: false,
        });
      } catch (err: any) {
        set({ error: err.message, loading: false });
      }
    },

    signUp: async (email, password) => {
      try {
        set({ loading: true, error: null });
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(cred.user);
        await fbSignOut(auth); // force verification before login
        set({ loading: false });
        return true;
      } catch (err: any) {
        set({ error: err.message, loading: false });
        return false;
      }
    },

    signOut: async () => {
      try {
        await fbSignOut(auth);
        set({ user: null });
      } catch (err) {
        console.error('[AUTH] signOut error', err);
      }
    },

    refreshUser: async () => {
      const u = auth.currentUser;
      if (u) {
        await reload(u);
        set({
          user: {
            id: u.uid,
            email: u.email || '',
            emailVerified: u.emailVerified,
          },
        });
      }
    },
  };
});
