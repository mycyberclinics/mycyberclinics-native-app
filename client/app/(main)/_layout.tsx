import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { ActivityIndicator, View } from 'react-native';

export default function MainLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { user, setUser, initializing, setInitializing, onboarding, setOnboarding } =
    useAuthStore();

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

  useEffect(() => {
    if (initializing) return; // Wait until auth state is resolved

    const inAuthFlow = segments[0] === '(auth)';
    const inMainFlow = segments[0] === '(main)';
    const inOnboardingFlow = segments[0] === '(onboarding)';

    console.log('[MainLayout] Route:', segments.join('/'));
    console.log('[MainLayout] Auth state:', {
      user,
      onboarding,
      inAuthFlow,
      inMainFlow,
      inOnboardingFlow,
    });

    if (!user && !inAuthFlow) {
      console.log('[MainLayout] Redirect → /signup/emailPassword (no user)');
      router.replace('/signup/emailPassword');
      return;
    }

    if (user && onboarding && !inOnboardingFlow) {
      console.log('[MainLayout] Redirect → /onboarding/start');
      router.replace('/(auth)/signup/emailPassword');
      return;
    }

    if (user && !onboarding && !inMainFlow) {
      console.log('[MainLayout] Redirect → /main/home');
      router.replace('/(main)/home');
      return;
    }
  }, [initializing, user, onboarding, segments, router]);

  if (initializing) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
