import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import { ActivityIndicator, View } from 'react-native';
import { getFirebaseAuth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function MainLayout() {
  const router = useRouter();
  const segments = useSegments() as unknown as string[];

  const {
    user,
    setUser,
    initializing,
    setInitializing,
    onboarding,
    lastStep,
    rehydrate,
  } = useAuthStore();

  // rehydrate auth state on mount
  useEffect(() => {
    rehydrate();
  }, [rehydrate]);

  // this watches for changes to Firebase auth changes 
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

  // manage navigation logic
  useEffect(() => {
    if (initializing) return;

    const inAuthFlow = segments[0] === '(auth)';
    const inMainFlow = segments[0] === '(main)';
    const inSignupFlow = inAuthFlow && segments.includes('signup');

    console.log('[MainLayout] Route:', segments.join('/'));
    console.log('[MainLayout] Auth state:', {
      user,
      onboarding,
      inAuthFlow,
      inSignupFlow,
      inMainFlow,
    });

    // if no user yet → redirect to signup
    if (!user && !inAuthFlow) {
      console.log('[MainLayout] Redirect → /(auth)/signup/emailPassword (no user)');
      router.replace('/(auth)/signup/emailPassword');
      return;
    }

    // if onboarding user - still setting up profile etc.
    if (user && onboarding && !inSignupFlow) {
      console.log('[MainLayout] Redirect → lastStep or first signup screen');
      if (lastStep) router.replace(lastStep as any);
      else router.replace('/(auth)/signup/emailPassword');
      return;
    }

    // if verified & completed onboarding 
    // watch here. this should be where user first goes home, then contiues signup - bad news ⚡
    if (user && !onboarding && !inMainFlow) {
      console.log('[MainLayout] Redirect → /(main)/home');
      router.replace('/(main)/home');
      return;
    }
  }, [initializing, user, onboarding, lastStep, segments, router]);

  if (initializing) {
    return (
      <View className="items-center justify-center flex-1 bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
