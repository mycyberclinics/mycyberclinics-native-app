import { create } from 'zustand';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';

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
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const { uid, email: em } = cred.user;
      set({ user: { id: uid, email: em || '' }, loading: false });
      console.log('[AUTH] Firebase signIn success:', uid);
    } catch (err: any) {
      console.error('[AUTH] signIn error', err);
      set({ error: err.message, loading: false });
    }
  },

  signUp: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const { uid, email: em } = cred.user;
      set({ user: { id: uid, email: em || '' }, loading: false });
      console.log('[AUTH] Firebase signUp success:', uid);
    } catch (err: any) {
      console.error('[AUTH] signUp error', err);
      set({ error: err.message, loading: false });
    }
  },

  signOut: async () => {
    try {
      await fbSignOut(auth);
      set({ user: null });
      console.log('[AUTH] Signed out');
    } catch (err) {
      console.error('[AUTH] signOut error', err);
    }
  },
}));
