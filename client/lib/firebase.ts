// import { initializeApp, getApps } from 'firebase/app';
// import { getAuth } from 'firebase/auth';

// const firebaseConfig = {
//   apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
//   authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
//   projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
// };

// const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
// export const auth = getAuth(app);

// lib/firebase.ts
// lib/firebase.ts
import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
// import { getReactNativePersistence } from 'firebase/auth/react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE!,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MSG_SENDER!,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// export const auth = initializeAuth(app, {
//   persistence: getReactNativePersistence(AsyncStorage),
// });

export const auth = initializeAuth(app);
