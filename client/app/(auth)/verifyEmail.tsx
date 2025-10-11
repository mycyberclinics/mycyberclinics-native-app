import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import { auth } from '@/lib/firebase';
import { sendEmailVerification } from 'firebase/auth';

export default function VerifyEmail() {
  const router = useRouter();
  const { user, refreshUser } = useAuthStore();
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Poll every 5s to check if verified
    timer.current = setInterval(async () => {
      await refreshUser();
      const u = useAuthStore.getState().user;
      if (u?.emailVerified) {
        if (timer.current) clearInterval(timer.current);
        router.replace('/(main)/home');
      }
    }, 5000);

    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const resend = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      alert('Verification email resent');
    }
  };

  const iVerified = async () => {
    await refreshUser();
    const u = useAuthStore.getState().user;
    if (u?.emailVerified) {
      router.replace('/(main)/home');
    } else {
      alert('Still not verified. Please check your inbox.');
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-white p-6">
      <Text className="mb-4 text-xl font-semibold">Verify your email</Text>
      <Text className="mb-6 text-center">
        We sent a verification link to {user?.email}. Please open it, then return here.
      </Text>

      <TouchableOpacity className="mb-3 rounded-lg bg-emerald-500 px-4 py-3" onPress={iVerified}>
        <Text className="font-semibold text-white">I’ve verified</Text>
      </TouchableOpacity>

      <TouchableOpacity className="rounded-lg bg-gray-200 px-4 py-3" onPress={resend}>
        <Text className="font-semibold">Resend verification email</Text>
      </TouchableOpacity>
    </View>
  );
}
