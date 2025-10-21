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
