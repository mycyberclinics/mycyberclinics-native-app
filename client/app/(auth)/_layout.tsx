import React, { useEffect } from 'react';
import { Redirect, Slot, useSegments, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import { View, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { getFirebaseAuth } from '@/lib/firebase';

export default function AuthLayout() {
  const { user, initializing, onboarding, lastStep, reset } = useAuthStore();
  const segments = useSegments() as unknown as string[];
  const router = useRouter();

  console.log('[AuthLayout]', { initializing, onboarding, user, lastStep });

  useEffect(() => {
    // On mount, listen for sign-out events to show a toast
    const auth = getFirebaseAuth();
    const unsubscribe = auth.onAuthStateChanged((fbUser) => {
      if (!fbUser && user) {
        Toast.show({
          type: 'info',
          text1: 'Signed out',
          text2: 'Your session expired. Please sign in again.',
          visibilityTime: 3000,
        });
        reset();
        router.replace('/(auth)/signup/emailPassword');
      }
    });
    return unsubscribe;
  }, [user, reset, router]);

  if (initializing) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const inSignupFlow = segments.includes('signup');

  // User exists but onboarding not done → stay in signup
  if (user && onboarding) {
    console.log('[AuthLayout] onboarding user detected');
    if (!inSignupFlow) {
      return <Redirect href={(lastStep as any) || '/(auth)/signup/emailPassword'} />;
    }
    return <Slot />;
  }

  // Fully onboarded user → main/home
  if (user && !onboarding) {
    console.log('[AuthLayout] redirecting verified user to main/home');
    return <Redirect href="/(main)/home" />;
  }

  // No user → show normal auth screens
  return <Slot />;
}
