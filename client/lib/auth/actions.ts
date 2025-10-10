// client/lib/auth/actions.ts
import { auth } from '@/lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import axios from 'axios';

export async function signInAnon() {
  console.log('Attempting anonymous sign-in...');

  const cred = await signInAnonymously(auth);
  const user = cred.user;
  const idToken = await user.getIdToken();

  console.log('Got Firebase ID token:', idToken.slice(0, 30) + '...');

  try {
    const resp = await axios.get(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    console.log('Backend verified token:', resp.data);
    return user;
  } catch (err: any) {
    console.error('Backend verification failed:', err.message);
    throw err;
  }
}
