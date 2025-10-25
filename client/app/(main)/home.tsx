import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth';

export default function HomeScreen() {
  const { signOut, profile } = useAuthStore();
  const router = useRouter();
  const colorScheme = useColorScheme();

  const handleSignOut = async () => {
    try {
      await signOut();

      Toast.show({
        type: 'success',
        text1: 'Signed out successfully',
        text2: 'Hope to see you soon 👋',
        visibilityTime: 3000,
      });

      // small delay to let toast show
      setTimeout(() => {
        router.replace('/(auth)/signIn');
      }, 5000);
    } catch (err) {
      console.error('[HomeScreen] Sign-out error:', err);
      Toast.show({
        type: 'error',
        text1: 'Sign out failed',
        text2: 'Please try again.',
      });
    }
  };

  return (
    <View className="items-center justify-center flex-1 bg-white dark:bg-black">
      <Text className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
        Welcome back{profile?.displayName ? `, ${profile.displayName}` : ''}!
      </Text>

      <TouchableOpacity onPress={handleSignOut} className="px-6 py-3 rounded-2xl bg-emerald-500">
        <Text className="font-medium text-white">Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}
