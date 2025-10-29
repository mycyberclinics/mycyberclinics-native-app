import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '@/store/auth';

/**
 * MainLayout (root) — rehydrate + routing guard
 *
 * Key change:
 * - Only run the automatic routing decision when the app is at the root entry path
 *   (pathname === '/' or '/index' or empty). If the user is already navigating to an
 *   explicit route (e.g. '/signup/emailPassword' or '/signIn'), the layout will NOT
 *   replace the route. This prevents the layout from "stealing" navigation you initiated.
 *
 * Also: defensive checks to avoid redundant router.replace when already on the target path.
 */

export default function MainLayout() {
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const { user, onboarding, lastStep, setUser, initializing, rehydrate } = useAuthStore();

  const [rehydrated, setRehydrated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Run rehydrate once (store will set rehydrated true when ready)
  useEffect(() => {
    (async () => {
      console.log('[MainLayout] starting rehydrate()');
      try {
        await rehydrate();
        setRehydrated(true);
        console.log('[MainLayout] rehydrate() completed — rehydrated=true');
      } catch (err) {
        console.error('[MainLayout] rehydrate error', err);
        setRehydrated(true);
      }
    })();
  }, [rehydrate]);

  // Listen to Firebase auth state changes and surface them to the store
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('[MainLayout] onAuthStateChanged fired — firebaseUser:', firebaseUser?.email ?? null);
      setUser(firebaseUser || null);
      setCheckingAuth(false);
    });
    return () => unsub();
  }, [setUser]);

  // Helper: only perform automatic routing when at the app "root" (entry) path.
  const isAtRootEntry = () => {
    // Some router setups use "/" or "/index". Also treat empty string as root.
    const p = pathname || '/';
    return p === '/' || p === '/index' || p === '';
  };

  // Routing decision — only when rehydration + auth check done AND we're at root entry
  useEffect(() => {
    // Wait until the store & firebase finished initializing
    if (initializing || !rehydrated || checkingAuth) {
      console.log('[MainLayout] waiting before routing', { initializing, rehydrated, checkingAuth, pathname });
      return;
    }

    // If the user is not at root entry, do NOT perform automatic redirects.
    // That allows manual navigation to sign-in / signup routes without being overridden.
    if (!isAtRootEntry()) {
      console.log('[MainLayout] skipping auto-route because user is at explicit path:', pathname);
      return;
    }

    console.log('[MainLayout] routing decision inputs', { user: user?.email ?? null, onboarding, lastStep, pathname });

    try {
      // If no authenticated user, send to sign in
      if (!user) {
        const target = '/(auth)/signIn';
        if (pathname !== target) {
          console.log('[MainLayout] no user -> route to sign in');
          router.replace(target);
        } else {
          console.log('[MainLayout] already at signIn, skipping replace');
        }
        return;
      }

      // If user needs onboarding, resume at lastStep or start at step 1
      if (onboarding) {
        const resume = (lastStep as string) || '/(auth)/signup/emailPassword';
        if (pathname !== resume) {
          console.log('[MainLayout] user onboarding -> go to', resume);
          router.replace(resume as any);
        } else {
          console.log('[MainLayout] already at onboarding step, skipping replace');
        }
        return;
      }

      // Otherwise user is onboarded -- go to home
      const home = '/(main)/home';
      if (pathname !== home) {
        console.log('[MainLayout] user onboarded -> go to home');
        router.replace(home);
      } else {
        console.log('[MainLayout] already at home, skipping replace');
      }
    } catch (err) {
      console.error('[MainLayout] routing error:', err);
    }
  }, [user, onboarding, lastStep, initializing, rehydrated, checkingAuth, router, pathname]);

  // While we're checking auth / rehydration show a loader
  if (checkingAuth || initializing || !rehydrated) {
    return (
      <View className="items-center justify-center flex-1 bg-white dark:bg-black">
        <ActivityIndicator size="large" color="#1ED28A" />
        <Text className="mt-3 text-gray-500 dark:text-gray-300">Preparing app...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <Slot />
      <Toast position="bottom" />
    </View>
  );
}