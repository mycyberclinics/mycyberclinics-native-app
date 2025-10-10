import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth';

export default function MainLayout() {
  const { user, initializing } = useAuthStore();

  if (initializing) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }
  // while Firebase resolves
  if (!user) return <Redirect href="/(auth)/signIn" />;
  // ^^^ if your file is 'sign-in.tsx' then use "/(auth)/sign-in" here.

  return <Stack screenOptions={{ headerShown: false }} />;
}
