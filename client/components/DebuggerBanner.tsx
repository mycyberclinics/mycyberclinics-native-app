import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useAuthStore } from '@/store/auth';

export default function DebuggerBanner() {
  const { initializing, user, loading, error, onboarding, lastStep, rehydrated, profile } =
    useAuthStore();

  useEffect(() => {
    const unsub = useAuthStore.subscribe((s, p) => {
      if (s.onboarding !== p.onboarding || s.user !== p.user || s.rehydrated !== p.rehydrated) {
        console.log('[DebuggerBanner] store snapshot', {
          onboarding: s.onboarding,
          user: s.user?.email ?? null,
          rehydrated: s.rehydrated,
          lastStep: s.lastStep,
        });
      }
    });
    return unsub;
  }, []);

  return (
    <View style={{ padding: 8, backgroundColor: '#f6f6f8' }}>
      <Text style={{ fontSize: 12 }}>
        init:{String(initializing)} loading:{String(loading)} rehydrated:{String(rehydrated)} onboarding:{String(onboarding)}
      </Text>
      <Text style={{ fontSize: 12 }}>user:{user?.email ?? 'null'} profile:{profile ? 'yes' : 'no'}</Text>
      {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}
      <Text style={{ fontSize: 11, color: '#666' }}>lastStep: {lastStep ?? 'null'}</Text>
    </View>
  );
}