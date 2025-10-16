import React, { useEffect } from 'react';
import '@/i18n';
import { Stack } from 'expo-router';
import '../global.css';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme, LogBox, View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { ClaimsProvider } from "@/providers/ClaimsProvider";
import { useAuthStore } from '@/store/auth';
import DebugBanner from '@/components/DebuggerBanner';

// ignore Expo Router's internal warning
LogBox.ignoreLogs(['SafeAreaView has been deprecated']);

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <ThemedLayout colorScheme={colorScheme} />
    </SafeAreaProvider>
  );
}

function ThemedLayout({ colorScheme }: { colorScheme: 'light' | 'dark' | null | undefined }) {
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';
  const { initializing, rehydrate } = useAuthStore();

  // rehydrate once on mount
  useEffect(() => {
    rehydrate();
  }, []);

  if (initializing) {
    return (
      <View
        className={`flex-1 items-center justify-center ${isDark ? 'bg-[#0B0E11]' : 'bg-white'}`}
      >
        <ActivityIndicator size="large" color="#1ED28A" />
      </View>
    );
  }

  return (
    <View
      className={`flex-1 ${isDark ? 'bg-[#0B0E11]' : 'bg-white'}`}
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ClaimsProvider>
        <QueryProvider>
          <AuthProvider>
            <DebugBanner />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor: isDark ? '#0B0E11' : '#FFFFFF',
                },
              }}
            />
          </AuthProvider>
        </QueryProvider>
      </ClaimsProvider>
    </View>
  );
}