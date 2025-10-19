import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments, usePathname } from 'expo-router';
import { ActivityIndicator, View, Pressable, Text } from 'react-native';
import { getFirebaseAuth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuthStore } from '@/store/auth';

export default function MainLayout() {
  const router = useRouter();
  const segments = useSegments() as unknown as string[];

  const { user, setUser, initializing, setInitializing, onboarding, lastStep, signOut, rehydrate } =
    useAuthStore();
  const pathname = usePathname();

  // 🧠 1️⃣ Rehydrate Zustand persisted state before doing anything
  useEffect(() => {
    console.log('[MainLayout] Rehydrating persisted auth state...');
    rehydrate();
  }, [rehydrate]);

  // 🧠 2️⃣ Watch Firebase auth changes
  useEffect(() => {
    const auth = getFirebaseAuth();
    console.log('[MainLayout] Subscribing to Firebase auth state...');

    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const { uid, email } = fbUser;
        console.log('[MainLayout] Firebase user detected:', email);
        setUser({ id: uid, email: email || '' });
      } else {
        console.log('[MainLayout] No Firebase user.');
        setUser(null);
      }
      setInitializing(false);
    });

    return () => unsubscribe();
  }, [setUser, setInitializing]);

  // 🧭 3️⃣ Navigation logic based on auth + onboarding state
  useEffect(() => {
    if (initializing) return;

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

    // 🚪 No user yet → go to signup
    if (!user && !inAuthFlow) {
      console.log('[MainLayout] Redirect → /(auth)/signup/emailPassword (no user)');
      router.replace('/(auth)/signup/emailPassword');
      return;
    }

    // 🧭 if onboarding resumed after refresh
    if (user && onboarding) {
      if (!inSignupFlow || (lastStep && pathname !== lastStep)) {
        console.log('[MainLayout] Resuming onboarding →', lastStep);
        router.replace(lastStep || ('/(auth)/signup/emailPassword' as any));
      }
      return;
    }

    // 🧩 Onboarding user → go back to their last onboarding step
    if (user && onboarding) {
      if (!inSignupFlow) {
        console.log('[MainLayout] Redirect → lastStep or first signup screen');
        if (lastStep) {
          router.replace(lastStep as any);
        } else {
          router.replace('/(auth)/signup/emailPassword');
        }
      }
      return;
    }

    // // if onboarding user - still setting up profile etc.
    // if (user && onboarding && !inSignupFlow) {
    //   console.log('[MainLayout] Redirect → lastStep or first signup screen');
    //   if (lastStep) router.replace(lastStep as any);
    //   else router.replace('/(auth)/signup/emailPassword');
    //   return;
    // }

    // 🏠 Fully onboarded → go home
    if (user && !onboarding && !inMainFlow) {
      console.log('[MainLayout] Redirect → /(main)/home');
      router.replace('/(main)/home' as any);
      return;
    }
  }, [initializing, user, onboarding, lastStep, segments, router, pathname]);

  // 🌀 Loading state
  if (initializing) {
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
