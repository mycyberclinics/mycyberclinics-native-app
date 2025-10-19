import React from 'react';
import { Redirect, Slot, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import { View, ActivityIndicator } from 'react-native';

export default function AuthLayout() {
  const { user, initializing, onboarding, lastStep } = useAuthStore();
  const segments = useSegments() as unknown as string[];

  console.log('[AuthLayout]', { initializing, onboarding, user, lastStep });

  if (initializing) {
    return (
      <View className="items-center justify-center flex-1 bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const inSignupFlow = segments.includes('signup'); 

  // if user exists but still onboarding, we stay inside signup flow
  if (user && onboarding) {
    console.log('[AuthLayout] onboarding user detected');
    if (!inSignupFlow) {
      // resume from lastStep or first signup screen
      return <Redirect href={(lastStep as any) || '/(auth)/signup/emailPassword'} />;
    }
    return <Slot />;
  }

  // if fully signed in & done onboarding → go to main/home
  if (user && !onboarding) {
    console.log('[AuthLayout] redirecting verified user to main/home');
    return <Redirect href="/(main)/home" />;
  }

  // unauthenticated → stay in auth routes
  return <Slot />; 
}
