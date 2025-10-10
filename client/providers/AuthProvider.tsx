// import React, { useEffect } from 'react';
// import { onAuthStateChanged } from 'firebase/auth';
// import { auth } from '@/lib/firebase';
// import { useAuthStore } from '@/store/auth';

// export default function AuthProvider({ children }: { children: React.ReactNode }) {
//   const setUser = useAuthStore((s) => s.setUser);
//   const setInitializing = useAuthStore((s) => s.setInitializing);

// useEffect(() => {
//   const unsub = onAuthStateChanged(auth, (user) => {
//     // Defensive guard against undefined or half-initialized user objects
//     if (!user || typeof user.uid !== 'string') {
//       setUser(null);
//       setInitializing(false);
//       return;
//     }

//     try {
//       const { uid, email } = user;
//       setUser({ id: uid, email: email ?? '' });
//     } catch (err) {
//       console.error('[AuthProvider] safe user parse error:', err);
//       setUser(null);
//     } finally {
//       setInitializing(false);
//     }
//   });

//   return () => unsub();
// }, [setUser, setInitializing]);

//   return <>{children}</>;
// }

import React, { useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/auth';

const TOKEN_KEY = 'mc_firebase_id_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // const setUser = useAuthStore((s) => s.setUser);
  // const setInitializing = useAuthStore((s) => s.setInitializing);

  const setUser = useAuthStore((s) => s.setUser);
  const setInitializing = useAuthStore((s) => s.setInitializing);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // setUser(firebaseUser);
      // setInitializing(false);

      if (firebaseUser) {
        const simplifiedUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
        };
        setUser(simplifiedUser);

        const token = await firebaseUser.getIdToken();
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
      setInitializing(false);
    });

    return unsubscribe;
  }, [setUser, setInitializing]);

  return <>{children}</>;
}
