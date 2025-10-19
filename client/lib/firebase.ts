import { AsyncStorage } from '@react-native-async-storage/async-storage';
// import { Platform } from 'react-native';
// import { initializeApp, getApps } from 'firebase/app';
// import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
// import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
// import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';
// import { getFunctions, connectFunctionsEmulator, Functions } from 'firebase/functions';
// import getLocalHost from 'react-native-localhost'; // 🧠 auto-detects local IP on LAN

// const firebaseConfig = {
//   apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
//   authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
//   projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
//   storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
//   messagingSenderId: process.env.MESSAGING_SENDER_ID!,
//   appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
//   measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
// };

// const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// // 🧩 Decide if we’re using emulators or live backend
// const USE_EMULATOR = process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

// // 🧠 Auto-detect local IP for emulator host
// // Fallback logic for safety
// const defaultHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
// const detectedHost = getLocalHost || defaultHost;
// console.log('Detected host:', getLocalHost);

// const emulatorHost = USE_EMULATOR ? detectedHost : undefined;

// console.log(`[firebase] Using emulator=${USE_EMULATOR} host=${emulatorHost}`);

// // AUTH
// let authInstance: Auth | undefined;
// export function getFirebaseAuth(): Auth {
//   if (!authInstance) {
//     authInstance = getAuth(app);

//     if (USE_EMULATOR && emulatorHost) {
//       connectAuthEmulator(authInstance, `http://${emulatorHost}:9099`, {
//         disableWarnings: true,
//       });
//     }
//   }
//   return authInstance;
// }

// // FIRESTORE
// let firestoreInstance: Firestore | undefined;
// export function getFirebaseFirestore(): Firestore {
//   if (!firestoreInstance) {
//     firestoreInstance = getFirestore(app);

//     if (USE_EMULATOR && emulatorHost) {
//       connectFirestoreEmulator(firestoreInstance, emulatorHost, 8080);
//     }
//   }
//   return firestoreInstance;
// }

// // STORAGE
// let storageInstance: FirebaseStorage | undefined;
// export function getFirebaseStorage(): FirebaseStorage {
//   if (!storageInstance) {
//     storageInstance = getStorage(app);

//     if (USE_EMULATOR && emulatorHost) {
//       connectStorageEmulator(storageInstance, emulatorHost, 9199);
//     }
//   }
//   return storageInstance;
// }

// // FUNCTIONS
// let functionsInstance: Functions | undefined;
// export function getFirebaseFunctions(): Functions {
//   if (!functionsInstance) {
//     functionsInstance = getFunctions(app);

//     if (USE_EMULATOR && emulatorHost) {
//       connectFunctionsEmulator(functionsInstance, emulatorHost, 5001);
//     }
//   }
//   return functionsInstance;
// }

import { Platform } from 'react-native';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator, Functions } from 'firebase/functions';
import getLocalHost from 'react-native-localhost';

/**
 * NOTE:
 * We *try* to initialize React Native persistence for firebase auth using
 * 'firebase/auth/react-native' at runtime via require(). That module path
 * sometimes confuses metro/eslint/static analysis, so we limit eslint rule
 * disables to *only* the single require line below.
 *
 * This keeps TypeScript and eslint happy, while still enabling persistence
 * when the runtime environment supports it.
 */

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


// emulator support detection
const USE_EMULATOR = process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
const defaultHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const detectedHost = getLocalHost || defaultHost;
const emulatorHost = USE_EMULATOR ? detectedHost : undefined;

console.log(`[firebase] Using emulator=${USE_EMULATOR} host=${emulatorHost}`);

// -------------------- AUTH (with optional RN persistence) --------------------
let authInstance: Auth; // we ensure this is assigned below in all code paths

(function initAuth() {
  // Try to initialize with React Native persistence (AsyncStorage).
  // Use guarded require so bundlers/linters won't fail at static analysis time.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, import/no-unresolved, @typescript-eslint/no-require-imports
    const rnAuth = require('firebase/auth/react-native') as {
      initializeAuth: typeof initializeAuth;
      getReactNativePersistence: (storage: any) => any;
    };

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ReactNativeAsyncStorage = require('@react-native-async-storage/async-storage').default;

    // initializeAuth (will throw if initializeAuth already called; catch below)
    // This is synchronous and returns an Auth instance.
    authInstance = rnAuth.initializeAuth(app, {
      persistence: rnAuth.getReactNativePersistence(ReactNativeAsyncStorage),
    });

    console.log('[firebase] Auth initialized with ReactNative persistence (AsyncStorage).');
  } catch (err: any) {
    // Fallback: initializeAuth import path not available or already initialized
    // Try to use getAuth(app). This will work in any environment but may have memory persistence only.
    try {
      // authInstance = getAuth(app) as Auth | AsyncStorage;
      authInstance = getAuth(app);
      console.warn(
        '[firebase] ReactNative persistence not enabled. Falling back to getAuth(app).',
        err?.message || err,
      );
    } catch (inner) {
      // As a last-resort, ensure app is defined and then getAuth
      console.error('[firebase] Failed to initialize auth:', inner || err);
      // rethrow to surface critical failure (this should not happen normally)
      throw inner || err;
    }
  }

  // Connect to emulator if configured
  if (USE_EMULATOR && emulatorHost) {
    try {
      connectAuthEmulator(authInstance, `http://${emulatorHost}:9099`, { disableWarnings: true });
      console.log('[firebase] Connected to Auth emulator at', `http://${emulatorHost}:9099`);
    } catch (e) {
      console.warn('[firebase] Failed to connect Auth emulator:', e);
    }
  }
})();

// Export getter so other modules can import the function they expect
export function getFirebaseAuth(): Auth {
  return authInstance;
}

// FIRESTORE 
let firestoreInstance: Firestore | undefined;
export function getFirebaseFirestore(): Firestore {
  if (!firestoreInstance) {
    firestoreInstance = getFirestore(app);
    if (USE_EMULATOR && emulatorHost) {
      try {
        connectFirestoreEmulator(firestoreInstance, emulatorHost, 8080);
        console.log('[firebase] Connected to Firestore emulator');
      } catch (e) {
        console.warn('[firebase] Firestore emulator connect failed:', e);
      }
    }
  }
  return firestoreInstance;
}

// STORAGE 
let storageInstance: FirebaseStorage | undefined;
export function getFirebaseStorage(): FirebaseStorage {
  if (!storageInstance) {
    storageInstance = getStorage(app);
    if (USE_EMULATOR && emulatorHost) {
      try {
        connectStorageEmulator(storageInstance, emulatorHost, 9199);
        console.log('[firebase] Connected to Storage emulator');
      } catch (e) {
        console.warn('[firebase] Storage emulator connect failed:', e);
      }
    }
  }
  return storageInstance;
}

// FUNCTIONS 
let functionsInstance: Functions | undefined;
export function getFirebaseFunctions(): Functions {
  if (!functionsInstance) {
    functionsInstance = getFunctions(app);
    if (USE_EMULATOR && emulatorHost) {
      try {
        connectFunctionsEmulator(functionsInstance, emulatorHost, 5001);
        console.log('[firebase] Connected to Functions emulator');
      } catch (e) {
        console.warn('[firebase] Functions emulator connect failed:', e);
      }
    }
  }
  return functionsInstance;
}
