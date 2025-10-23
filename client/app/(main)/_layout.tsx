import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { useAuthStore } from '@/store/auth';

export default function MainLayout() {
  const router = useRouter();
  const { user, onboarding, lastStep, setUser, initializing, rehydrate } = useAuthStore();
  const [rehydrated, setRehydrated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // ✅ Rehydrate Zustand store once on app load
  useEffect(() => {
    (async () => {
      try {
        await rehydrate();
        setRehydrated(true);
      } catch (err) {
        console.error('[MainLayout] Rehydrate error:', err);
        setRehydrated(true);
      }
    })();
  }, [rehydrate]);

  // ✅ Firebase Auth state listener
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, [setUser]);

  // ✅ Routing logic based on user, onboarding, and lastStep
  useEffect(() => {
    if (initializing || !rehydrated || checkingAuth) return;

    console.log('[MainLayout] Deciding navigation...', {
      user: user?.email,
      onboarding: false,
      lastStep: null,
    });

    try {
      if (!user) {
        router.replace('/(auth)/signIn');
      } else if (onboarding && lastStep) {
        // Resume from the last onboarding step
        router.replace(lastStep as any);
      } else if (onboarding && !lastStep) {
        // Start onboarding at first step if no lastStep
        router.replace('/(auth)/signup/emailPassword');
      } else if (!onboarding) {
        // Fully onboarded → go home
        router.replace('/(main)/home');
      }
    } catch (err) {
      console.error('[MainLayout] Routing error:', err);
    }
  }, [user, onboarding, lastStep, initializing, rehydrated, checkingAuth, router]);

  // ✅ Loader while checking auth or rehydrating
  if (checkingAuth || initializing || !rehydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator size="large" color="#1ED28A" />
        <Text className="mt-3 text-gray-500 dark:text-gray-300">Preparing app...</Text>
      </View>
    );
  }

  // ✅ Default render: slot for children
  return (
    <View className="flex-1">
      <Slot />
      <Toast position="bottom" />
    </View>
  );
}
