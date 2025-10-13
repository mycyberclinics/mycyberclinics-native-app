import React from 'react';
import { Redirect, Slot } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import { View, ActivityIndicator } from 'react-native';

export default function AuthLayout() {
  const { user, initializing, onboarding } = useAuthStore();

  console.log('[AuthLayout]', { initializing, onboarding, user });

  if (initializing) {
    return (
      <View className="items-center justify-center flex-1 bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 🟡 Only redirect to /home when not onboarding
  if (user && !onboarding) {
    console.log('[AuthLayout] redirecting verified user to main/home');
    return <Redirect href="/home" />;
  }

  console.log('[AuthLayout] user is still onboarding or unauthenticated, render auth stack');
  return <Slot />;
}
