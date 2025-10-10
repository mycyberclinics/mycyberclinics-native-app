import React from 'react';
import { Redirect, Slot } from 'expo-router';
import { useAuthStore } from '@/store/auth';

export default function AuthGate() {
  const { user, initializing } = useAuthStore();

  // while firebase checks the cached session
  if (initializing) {
    return null; // could render a small loader later
  }

  // decide what to show
  if (!user) {
    // no user → this goes to signIn stack
    return <Redirect href="/(auth)/signIn" />;
  }

    // logged-in → render whatever route sits inside (main)
    // Slot is expo's placeholder guy for nested routes 
  return <Slot />;
}
