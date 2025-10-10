import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useAuthStore } from '@/store/auth';

export default function DebugBanner() {
  const { initializing, user, loading, error } = useAuthStore();

  // Log every meaningful state change once this is mounted
  useEffect(() => {
    const unsub = useAuthStore.subscribe((state, prev) => {
      if (state.initializing !== prev.initializing) {
        console.log('[AUTH] initializing:', state.initializing);
      }
      if (state.user !== prev.user) {
        console.log('[AUTH] user:', state.user);
      }
      if (state.loading !== prev.loading) {
        console.log('[AUTH] loading:', state.loading);
      }
      if (state.error !== prev.error) {
        console.log('[AUTH] error:', state.error);
      }
    });
    return unsub;
  }, []);

  return (
    <View className="px-3 py-2" style={{ backgroundColor: error ? '#fee2e2' : '#eef2ff' }}>
      <Text className="text-xs font-semibold">
        init: {String(initializing)} | loading: {String(loading)} | user: {user?.email ?? 'null'}
      </Text>
      {error ? <Text className="mt-1 text-xs text-red-700">{error}</Text> : null}
    </View>
  );
}
