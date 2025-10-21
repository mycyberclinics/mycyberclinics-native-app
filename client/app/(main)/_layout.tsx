import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, usePathname } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { getFirebaseAuth, forceRefreshIdToken } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuthStore } from '@/store/auth';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Toast from 'react-native-toast-message';

export default function MainLayout() {
  const router = useRouter();
  const segments = useSegments() as unknown as string[];
  const pathname = usePathname();

  const { user, setUser, initializing, setInitializing, onboarding, lastStep, rehydrate } =
    useAuthStore();

  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await forceRefreshIdToken();
      } catch (e) {
        console.warn('[MainLayout] forceRefreshIdToken failed', e);
      }
    })();
  }, []);

  // Rehydrate Zustand state
  useEffect(() => {
    console.log('[MainLayout] Rehydrating persisted auth state...');
    rehydrate();
  }, [rehydrate]);

  // Firebase auth listener
  useEffect(() => {
    const auth = getFirebaseAuth();
    console.log('[MainLayout] Subscribing to Firebase auth state...');

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const { uid, email } = fbUser;
        console.log('[MainLayout] Firebase user detected:', email);
        setUser({ id: uid, email: email || '' });

        try {
          const token = await fbUser.getIdToken();
          const { default: SecureStore } = await import('expo-secure-store');
          await SecureStore.setItemAsync('mc_firebase_id_token', token);
        } catch (err) {
          console.warn('[MainLayout] Failed to cache token:', err);
        }
      } else {
        console.log('[MainLayout] No Firebase user.');
        setUser(null);
      }

      setFirebaseReady(true);
      setInitializing(false);
    });

    return () => unsubscribe();
  }, [setUser, setInitializing]);

  // Navigation control
  useEffect(() => {
    if (initializing || !firebaseReady) return;

    const inAuthFlow = segments[0] === '(auth)';
    const inMainFlow = segments[0] === '(main)';
    const inSignupFlow = inAuthFlow && segments.includes('signup');

    console.log('[MainLayout] Route:', segments.join('/'));
    console.log('[MainLayout] Auth state:', {
      user,
      onboarding,
      lastStep,
      inAuthFlow,
      inSignupFlow,
      inMainFlow,
    });

    // No user → start signup flow
    if (!user && !inAuthFlow) {
      console.log('[MainLayout] Redirect → /(auth)/signup/emailPassword (no user)');
      router.replace('/(auth)/signup/emailPassword');
      return;
    }

    // Onboarding in progress → resume last step
    if (user && onboarding) {
      if (!inSignupFlow || (lastStep && pathname !== lastStep)) {
        console.log('[MainLayout] Resuming onboarding →', lastStep);
        router.replace('/(auth)/signup/emailPassword');
      }
      return;
    }

    // Fully onboarded → home
    if (user && !onboarding && !inMainFlow) {
      console.log('[MainLayout] Redirect → /(main)/home');
      router.replace('/(main)/home');
      return;
    }
  }, [initializing, firebaseReady, user, onboarding, lastStep, segments, router, pathname]);

  if (initializing || !firebaseReady) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
