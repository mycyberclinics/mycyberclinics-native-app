import React, { useEffect } from 'react';
import { getFirebaseAuth } from '@/lib/firebase';
import { useAuthStore } from '@/store/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setInitializing = useAuthStore((s) => s.setInitializing);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      console.log('[AuthProvider] onAuthStateChanged fired', { firebaseUser });
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
        });
      } else {
        setUser(null);
      }
      setInitializing(false);
      setTimeout(() => setInitializing(false), 2000);
    });

    return () => unsubscribe();
  }, [setUser, setInitializing]);

  return <>{children}</>;
}
