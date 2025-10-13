//there is no persistence, meaning users gets logged out on app refresh 
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

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

let authInstance: Auth | undefined;

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(app);
  }
  return authInstance;
<<<<<<< HEAD
}
=======
}
>>>>>>> 7702349103e189d416663b034e1f6b1acb004c3b
