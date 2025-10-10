import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth';

export default function AuthLayout() {
  const { user, initializing } = useAuthStore();

  if (initializing) return null;
  if (user) return <Redirect href="/(main)/home" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
