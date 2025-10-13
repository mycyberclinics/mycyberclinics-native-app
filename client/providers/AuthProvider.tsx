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
import { getFirebaseAuth } from '@/lib/firebase';
import { useAuthStore } from '@/store/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setInitializing = useAuthStore((s) => s.setInitializing);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
        });
      } else {
        setUser(null);
      }
      setInitializing(false);
    });

    return () => unsubscribe();
  }, [setUser, setInitializing]);

  return <>{children}</>;
}
