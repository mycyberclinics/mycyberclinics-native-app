import { initializeApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.MESSAGING_SENDER_ID!,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export async function getFirebaseAuth() {
  if (Platform.OS === 'web') {
    // Web: use default persistence
    return getAuth(app);
  } else {
    // Native: dynamically import native-only modules
    const { getReactNativePersistence } = await import('firebase/auth/react-native');
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
}