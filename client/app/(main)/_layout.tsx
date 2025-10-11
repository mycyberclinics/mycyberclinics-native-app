import React from 'react';
import { Slot, Redirect, usePathname } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import { View, ActivityIndicator } from 'react-native';

export default function MainLayout() {
  const { user, initializing } = useAuthStore();
  const pathname = usePathname();

  console.log('[MainLayout]', { initializing, pathname, user });

  if (initializing) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    console.log('[MainLayout] no user, redirecting to signIn');
    return <Redirect href="/(auth)/signIn" />;
  }

  if (!user) {
    if (pathname !== '/(auth)/verifyEmail') {
      console.log('[MainLayout] unverified user, redirecting to verifyEmail');
      return <Redirect href="/(auth)/verifyEmail" />;
    }
  }

  console.log('[MainLayout] verified user, rendering main slot');
  return <Slot />;
}
