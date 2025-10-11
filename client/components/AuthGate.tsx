import React from 'react';
import { Redirect, Slot } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import { View, ActivityIndicator } from 'react-native';

export default function AuthGate() {
  const { user, initializing } = useAuthStore();
  const href = '/(auth)/verifyEmail' as const;

  console.log('AuthGate render', { user, initializing });

  if (initializing) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/signIn" />;
  }

  if (!user.emailVerified) {
    return <Redirect href={href} />;
  }

  return <Slot />;
}
