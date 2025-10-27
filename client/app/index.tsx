// import React from 'react';
// import { Redirect } from 'expo-router';
// import { useAuthStore } from '../store/auth';
// import { View, ActivityIndicator } from 'react-native';

// export default function Index() {
//   const { user, hasSeenIntro, onboarding, initializing, loading, rehydrated } = useAuthStore();

//   // Wait until auth store fully rehydrates before routing
//   if (initializing || loading || !rehydrated) {
//     return (
//       <View className="flex-1 items-center justify-center bg-white dark:bg-[#0B0E11] ">
//         <ActivityIndicator size="large" color="#1ED28A" />
//       </View>
//     );
//   }

//   // Routing logic
//   if (!hasSeenIntro) {
//     return <Redirect href="/(onboarding)/onboardingCarousel" />;
//   }

//   if (!user) {
//     return <Redirect href="/(auth)/signIn" />;
//   }

//   if (onboarding) {
//     // User is logged in but hasn’t finished onboarding
//     return <Redirect href="/(auth)/signup/emailPassword" />;
//   }

//   // Default route: user is authenticated and onboarded
//   return <Redirect href="/(main)/home" />;
// }

import React from 'react';
import Splash from './splash';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { getFirebaseAuth } from '@/lib/firebase';

export default function Index() {
  // (async () => {
  //   const auth = getFirebaseAuth();
  //   await AsyncStorage.clear(); // clears stale cached user
  //   await auth.signOut(); // ensure auth resets too
  //   console.log('🧹 Cleared old Firebase Auth session');
  // })();
  return <Splash />;
}
