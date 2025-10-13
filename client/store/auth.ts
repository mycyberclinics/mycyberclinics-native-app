import { create } from 'zustand';
import { getFirebaseAuth } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  User as FirebaseUser,
} from 'firebase/auth';

type AppUser = { id: string; email: string } | FirebaseUser | null;

type AuthState = {
  user: AppUser;
  initializing: boolean;
  loading: boolean;
  error: string | null;

  setUser: (user: AppUser | null) => void;
  setInitializing: (value: boolean) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initializing: true,
  loading: false,
  error: null,

  setUser: (user) => set({ user }),
  setInitializing: (v) => set({ initializing: v }),

  signIn: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const auth = getFirebaseAuth();
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const { uid, email: em } = cred.user;
      set({ user: { id: uid, email: em || '' }, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  signUp: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const auth = getFirebaseAuth();
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const { uid, email: em } = cred.user;
      set({ user: { id: uid, email: em || '' }, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  signOut: async () => {
    try {
      const auth = getFirebaseAuth();
      await fbSignOut(auth);
      set({ user: null });
    } catch (err) {
      // Optionally handle error
    }
  },
}));
