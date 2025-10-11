// client/lib/auth/actions.ts
import { signInAnonymously } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import api from '@/lib/api/client';

export async function signInAnon() {
  console.log('Attempting anonymous sign-in...');

  const cred = await signInAnonymously(auth);
  const user = cred.user;
  const idToken = await user.getIdToken();

  console.log('Got Firebase ID token:', idToken.slice(0, 30) + '...');

  try {
    // since auth.currentUser is now set, api instance interceptor should add the token automatically,
    // but we call the profile endpoint to let backend verify and persist the user in MongoDB
    const resp = await api.get('/api/profile');
    console.log('Backend verified token:', resp.data);
    return user;
  } catch (err: any) {
    console.error('Backend verification failed:', err.message ?? err);
    throw err;
  }
}