import { Platform } from 'react-native';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator, Functions } from 'firebase/functions';
import getLocalHost from 'react-native-localhost';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase config (required even in emulator mode)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Emulator config
const USE_EMULATOR = process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
const defaultHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const customHost = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST;
const detectedHost = customHost || getLocalHost || defaultHost;
const emulatorHost = USE_EMULATOR ? detectedHost : undefined;

console.log(`[🔥 Firebase] Emulator=${USE_EMULATOR} Host=${emulatorHost}`);

// ---------------------------------------------------------------------------
// AUTH
// ---------------------------------------------------------------------------
let authInstance: Auth;

(function initAuth() {
  try {
    // Dynamic import for persistence
    const rnAuth = require('firebase/auth/react-native') as {
      initializeAuth: typeof initializeAuth;
      getReactNativePersistence: (storage: any) => any;
    };

    const ReactNativeAsyncStorage = require('@react-native-async-storage/async-storage').default;

    authInstance = rnAuth.initializeAuth(app, {
      persistence: rnAuth.getReactNativePersistence(ReactNativeAsyncStorage),
    });

    console.log('[🔥 Firebase] Auth initialized with AsyncStorage persistence.');
  } catch (err: any) {
    console.warn('[⚠️ Firebase] RN persistence failed, falling back to memory auth:', err?.message);
    authInstance = getAuth(app);
  }

  if (USE_EMULATOR && emulatorHost) {
    try {
      connectAuthEmulator(authInstance, `http://${emulatorHost}:9099`, { disableWarnings: true });
      console.log('[🔥 Firebase] Connected to Auth emulator at', `http://${emulatorHost}:9099`);
    } catch (e) {
      console.warn('[⚠️ Firebase] Failed to connect Auth emulator:', e);
    }
  }
})();

export function getFirebaseAuth(): Auth {
  return authInstance;
}

export async function forceRefreshIdToken(): Promise<void> {
  try {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) return; 

    // Force refresh to ensure token claims (email_verified etc) are current
    await user.getIdToken(true);
    // success — nothing else to do
  } catch (err: any) {
    // Detect firebase invalid credential error and clear local session if it happens
    const code = err?.code || err?.message || '';
    if (code.includes('auth/invalid-credential') || code.includes('invalid-credential')) {
      console.warn('[firebase] invalid credential detected — clearing local session');
      try {
        await AsyncStorage.clear(); // clear RN storage
      } catch (e) {
        console.warn('[firebase] failed to clear AsyncStorage', e);
      }
      try {
        const auth = getFirebaseAuth();
        await auth.signOut?.();
      } catch (e) {
        console.warn('[firebase] signOut failed after invalid credential', e);
      }
      // Optionally rethrow or just swallow — we swallow to avoid crashing startup
      return;
    }
    // If it's some other transient error, log and rethrow if you want (we'll just log)
    console.warn('[firebase] getIdToken(true) error:', err);
  }
}

// ---------------------------------------------------------------------------
// FIRESTORE
// ---------------------------------------------------------------------------
let firestoreInstance: Firestore | undefined;
export function getFirebaseFirestore(): Firestore {
  if (!firestoreInstance) {
    firestoreInstance = getFirestore(app);
    if (USE_EMULATOR && emulatorHost) {
      connectFirestoreEmulator(firestoreInstance, emulatorHost, 8080);
      console.log('[🔥 Firebase] Connected to Firestore emulator');
    }
  }
  return firestoreInstance;
}

// ---------------------------------------------------------------------------
// STORAGE
// ---------------------------------------------------------------------------
let storageInstance: FirebaseStorage | undefined;
export function getFirebaseStorage(): FirebaseStorage {
  if (!storageInstance) {
    storageInstance = getStorage(app);
    if (USE_EMULATOR && emulatorHost) {
      connectStorageEmulator(storageInstance, emulatorHost, 9199);
      console.log('[🔥 Firebase] Connected to Storage emulator');
    }
  }
  return storageInstance;
}

// ---------------------------------------------------------------------------
// FUNCTIONS
// ---------------------------------------------------------------------------
let functionsInstance: Functions | undefined;
export function getFirebaseFunctions(): Functions {
  if (!functionsInstance) {
    functionsInstance = getFunctions(app);
    if (USE_EMULATOR && emulatorHost) {
      connectFunctionsEmulator(functionsInstance, emulatorHost, 5001);
      console.log('[🔥 Firebase] Connected to Functions emulator');
    }
  }
  return functionsInstance;
}
