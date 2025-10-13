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
  tempEmail: string | null;
  tempPassword: string | null;
  onboarding: boolean;

  
  setUser: (user: AppUser | null) => void;
  setInitializing: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  setError: (error: string | null) => void;
  setTempEmail: (email: string | null) => void;
  setTempPassword: (password: string | null) => void;
  setOnboarding: (value: boolean) => void;

  // auth methods
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<boolean>;
  completeSignUp: () => void;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initializing: true,
  loading: false,
  error: null,
  tempEmail: null,
  tempPassword: null,
  onboarding: false,


  setUser: (user) => set({ user }),
  setInitializing: (v) => set({ initializing: v }),
  setLoading: (v) => set({ loading: v }),
  setError: (error) => set({ error }),
  setTempEmail: (email) => set({ tempEmail: email }),
  setTempPassword: (password) => set({ tempPassword: password }),
  setOnboarding: (value) => set({ onboarding: value }),


  signIn: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const auth = getFirebaseAuth();
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const { uid, email: em } = cred.user;
      set({
        user: { id: uid, email: em || '' },
        loading: false,
      });
      console.log('[AUTH] Sign-in successful:', uid);
    } catch (err: any) {
      console.error('[AUTH] signIn error:', err.message);
      set({ error: err.message, loading: false });
    }
  },

  signUp: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const auth = getFirebaseAuth();
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const { uid, email: em } = cred.user;

      // temp credentials for onboarding (sign up steps) continuation
      set({
        tempEmail: em || '',
        tempPassword: password,
        onboarding: true,
        loading: false,
      });

      console.log('[AUTH] Signup (partial): user created but not activated yet:', uid, em);
      return true;
    } catch (err: any) {
      console.error('[AUTH] signUp error:', err.message);
      set({ error: err.message, loading: false });
      return false;
    }
  },

  completeSignUp: () => {
    // Finalize onboarding
    set((state) => {
      const { tempEmail } = state;
      console.log('[AUTH] Onboarding complete for:', tempEmail);
      return {
        onboarding: false,
        tempEmail: null,
        tempPassword: null,
      };
    });
  },

  signOut: async () => {
    try {
      const auth = getFirebaseAuth();
      await fbSignOut(auth);
      set({
        user: null,
        onboarding: false,
        tempEmail: null,
        tempPassword: null,
      });
      console.log('[AUTH] Signed out successfully');
    } catch (err: any) {
      console.error('[AUTH] signOut error:', err.message);
      set({ error: err.message, loading: false });
    }
  },
}));
