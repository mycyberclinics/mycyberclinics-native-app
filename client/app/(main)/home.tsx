// //this is a test screen. it is suppsoed to fetch user profile from BE
// // it is a protected route ⚡

// import React, { useState } from 'react';
// import { View, Text, TouchableOpacity } from 'react-native';
// import api from '@/lib/api/client';

// export default function Home() {
//   const [profile, setProfile] = useState<any>(null);
//   const [error, setError] = useState<string | null>(null);

//   const fetchProfile = async () => {
//     try {
//       setError(null);
//       const res = await api.get('/api/profile');
//       setProfile(res.data.user);
//     } catch (err: any) {
//       console.error('[API] profile fetch failed', err.response?.data || err);
//       setError(err.message);
//     }
//   };

//   return (
//     <View className="items-center justify-center flex-1 gap-8 bg-white">
//       <View className="w-full ">
//         <Text className="w-full text-2xl text-center "> WELCOME TO MY DASHBOARD 🎉</Text>
//       </View>
//       <TouchableOpacity onPress={fetchProfile} className="px-6 py-3 mb-4 rounded-lg bg-emerald-500">
//         <Text className="font-semibold text-white">Fetch Profile</Text>
//       </TouchableOpacity>

//       {profile && <Text className="px-4 text-center">{JSON.stringify(profile, null, 2)}</Text>}
//       {error && <Text className="text-red-500">{error}</Text>}
//     </View>
//   );
// }

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
        visibilityTime: 1800,
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
