import React from 'react';
import { Redirect, Slot } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import { View, ActivityIndicator } from 'react-native';

export default function AuthGate() {
  const { user, initializing, tempEmail } = useAuthStore();
  const href = '/(auth)/verifyEmail' as const;

  console.log('AuthGate render', { user, initializing, tempEmail });

  if (initializing) {
    return (
      <View className="items-center justify-center flex-1 bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // ✅ If user is null but tempEmail exists, user is onboarding
  if (!user && !tempEmail) {
    return <Redirect href="/(auth)/signIn" />;
  }

  // when verification email is implemented
  // if (user && !user.emailVerified) {
  //   return <Redirect href={href} />;
  // }

  return <Slot />;
}
