import React from 'react';
import { Stack, Redirect, usePathname } from 'expo-router';
import { useAuthStore } from '@/store/auth';

export default function AuthLayout() {
  const { user, initializing } = useAuthStore();
  const pathname = usePathname();

  // Debug log
  console.log('[AuthLayout]', { initializing, pathname, user });

  if (initializing) {
    return null;
  }

  if (user) {
    console.log('[AuthLayout] redirecting verified user to main/home');
    return <Redirect href="/(main)/home" />;
  }

  //use later ⚡⚡⚡⚡⚡

  // if (user) {
  //   if (pathname !== '/(auth)/verifyEmail') {
  //     console.log('[AuthLayout] redirecting unverified user to verifyEmail');
  //     return <Redirect href="/(auth)/verifyEmail" />;
  //   }
  //   console.log('[AuthLayout] already on verifyEmail, rendering stack');
  //   return <Stack screenOptions={{ headerShown: false }} />;
  // }

  console.log('[AuthLayout] no user, rendering auth stack');
  return <Stack screenOptions={{ headerShown: false }} />;
}
