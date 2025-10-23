import React from 'react';
import { Slot } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/store/auth';

export default function AuthLayout() {
  const { initializing } = useAuthStore();

  if (initializing) {
    return (
      <View className="items-center justify-center flex-1 bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
}
