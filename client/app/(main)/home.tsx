import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth';

/**
 * Home screen
 *
 * Improvements:
 * - Show a robust display name using fallbacks:
 *   1) profile.displayName
 *   2) profile.display_name / profile.fullName
 *   3) profile.firstName + profile.lastName
 *   4) firebase user.displayName
 *   5) firebase user.email local-part
 *   6) "User" as last resort
 *
 * - Log profile shape once (useful for debugging backend fields).
 */

export default function HomeScreen() {
  const { signOut, profile, user } = useAuthStore();
  const router = useRouter();
  const colorScheme = useColorScheme();

  // Debug log to help identify what the backend returned for profile
  // (remove or reduce log level in production)
  React.useEffect(() => {
    console.log('[HomeScreen] profile snapshot:', profile);
    console.log('[HomeScreen] firebase user snapshot:', user);
  }, [profile, user]);

  const formatFromProfile = (p: any) => {
    if (!p) return null;
    // Common fields from various backends
    if (typeof p.displayName === 'string' && p.displayName.trim()) return p.displayName.trim();
    if (typeof p.display_name === 'string' && p.display_name.trim()) return p.display_name.trim();
    if (typeof p.fullName === 'string' && p.fullName.trim()) return p.fullName.trim();
    // firstName / lastName variants
    const first = (p.firstName ?? p.first_name ?? p.givenName) as string | undefined;
    const last = (p.lastName ?? p.last_name ?? p.familyName) as string | undefined;
    if ((first && first.trim()) || (last && last.trim())) {
      return `${(first ?? '').trim()} ${(last ?? '').trim()}`.trim();
    }
    return null;
  };

  const getDisplayName = () => {
    // 1) Try profile-derived name(s)
    const profName = formatFromProfile(profile as any);
    if (profName) return profName;

    // 2) Try firebase user.displayName
    if (user && typeof user === 'object') {
      // firebase user may have displayName property
      if ('displayName' in user && user.displayName) return user.displayName;
      // fallback: use email local-part
      if ('email' in user && typeof user.email === 'string' && user.email.includes('@')) {
        return user.email.split('@')[0];
      }
    }

    // 3) final fallback
    return 'User';
  };

  const displayName = getDisplayName();

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
      }, 500);
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
    <View className="items-center justify-center flex-1" style={{ backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }}>
      <Text
        className="mb-4 text-lg font-semibold"
        style={{ color: colorScheme === 'dark' ? '#fff' : '#111827' }}
      >
        {`Welcome back${displayName ? `, ${displayName}` : ''}!`}
      </Text>

      <TouchableOpacity onPress={handleSignOut} className="px-6 py-3 rounded-2xl" style={{ backgroundColor: '#059669' }}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}