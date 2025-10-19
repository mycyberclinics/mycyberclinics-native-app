import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, usePathname } from 'expo-router';
import { ActivityIndicator, View, Pressable, Text } from 'react-native';
import { getFirebaseAuth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuthStore } from '@/store/auth';

export default function MainLayout() {
  const router = useRouter();
  const segments = useSegments() as unknown as string[];
  const pathname = usePathname();

  const { user, setUser, initializing, setInitializing, onboarding, lastStep, signOut, rehydrate } =
    useAuthStore();

  /** Track Firebase readiness */
  const [firebaseReady, setFirebaseReady] = useState(false);

  // Rehydrate Zustand persisted state
  useEffect(() => {
    console.log('[MainLayout] Rehydrating persisted auth state...');
    rehydrate();
  }, [rehydrate]);

  //  Wait for Firebase auth to rehydrate before proceeding
  useEffect(() => {
    const auth = getFirebaseAuth();
    console.log('[MainLayout] Subscribing to Firebase auth state...');

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const { uid, email } = fbUser;
        console.log('[MainLayout] Firebase user detected:', email);
        setUser({ id: uid, email: email || '' });

        // refresh & persist token for axios fallback
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

      // mark firebase ready AFTER it emits first state
      setFirebaseReady(true);
      setInitializing(false);
    });

    return () => unsubscribe();
  }, [setUser, setInitializing]);

  // Run navigation logic only when Firebase is ready
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

    // No user yet → go to signup
    if (!user && !inAuthFlow) {
      console.log('[MainLayout] Redirect → /(auth)/signup/emailPassword (no user)');
      router.replace('/(auth)/signup/emailPassword');
      return;
    }

    // Resume onboarding
    if (user && onboarding) {
      if (!inSignupFlow || (lastStep && pathname !== lastStep)) {
        console.log('[MainLayout] Resuming onboarding →', lastStep);
        router.replace('/(auth)/signup/emailPassword');
      }
      return;
    }

    // Fully onboarded → go home
    if (user && !onboarding && !inMainFlow) {
      console.log('[MainLayout] Redirect → /(main)/home');
      router.replace('/(main)/home');
      return;
    }
  }, [initializing, firebaseReady, user, onboarding, lastStep, segments, router, pathname]);

  // Loading UI while waiting for Firebase
  if (initializing || !firebaseReady) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
        <Pressable onPress={() => signOut()}>
          <Text>Log out</Text>
        </Pressable>
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
