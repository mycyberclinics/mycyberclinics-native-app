import { Platform } from 'react-native';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';

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

// Emulator host (LAN IP for Android, localhost for iOS/web/dev)
const emulatorHost =
  Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

// Auth
let authInstance: Auth | undefined;
export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(app);

    // Connect Auth Emulator in development
    if (__DEV__) {
      connectAuthEmulator(authInstance, `http://${emulatorHost}:9099`, { disableWarnings: true });
    }
  }
  return authInstance;
}

// Firestore
let firestoreInstance: Firestore | undefined;
export function getFirebaseFirestore(): Firestore {
  if (!firestoreInstance) {
    firestoreInstance = getFirestore(app);

    // Connect Firestore Emulator in development
    if (__DEV__) {
      connectFirestoreEmulator(firestoreInstance, emulatorHost, 8080);
    }
  }
  return firestoreInstance;
}

// For Storage
let storageInstance: FirebaseStorage | undefined;
export function getFirebaseStorage(): FirebaseStorage {
  if (!storageInstance) {
    storageInstance = getStorage(app);

    // Connect Storage Emulator in development
    if (__DEV__) {
      connectStorageEmulator(storageInstance, emulatorHost, 9199);
    }
  }
  return storageInstance;
}