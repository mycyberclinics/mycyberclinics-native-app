# Firebase Authentication + Backend Integration (Expo React Native)
Author: Joseph (from mycyberclinics)  
Date: 2025-10-09

Purpose
- Provide a detailed, step-by-step guide for frontend developers using Expo (React Native managed workflow) to authenticate with Firebase Authentication and call the protected backend endpoints that verify Firebase ID tokens.
- Include setup instructions, example code, testing steps (Postman / curl), token refresh and best practices, common problems and troubleshooting, and security guidance.
- Format is suitable for saving as a document or exporting to PDF.

Contents
1. Overview
2. Backend endpoints (what to call, expected responses)
3. Firebase project setup (console) — web app & API key
4. Enabling sign-in methods (Email/Password)
5. Creating test users
6. Expo project setup (dependencies + configuration)
7. Sign-in flows (Email/Password example)
8. Getting ID token and calling backend (axios/fetch examples)
9. Axios interceptor example (automatic token attach)
10. Handling token refresh & auth state
11. Google sign-in (overview + notes for Expo)
12. Using Firebase Auth Emulator (local dev)
13. Testing with curl / Postman (end-to-end)
14. Troubleshooting & common errors
15. Security & deployment notes
16. Appendix — Sample one-liners and full sample files

---

1) Overview
- The frontend signs users in with Firebase client SDK (web modular SDK used in React Native / Expo).
- After successful sign-in the client obtains a Firebase ID Token (short-lived JWT).
- The client sends that ID Token to your backend on each protected request via the Authorization: Bearer <idToken> header.
- Backend verifies the token using Firebase Admin SDK, and (optionally) upserts a local user record in MongoDB. The backend then authorizes/serves protected resources.

Backend endpoints included in this project (what the frontend will call)
- GET /api/health
  - Public health check. Returns { status: "ok" }.
- GET /api/profile
  - Protected endpoint. Requires header:
    Authorization: Bearer <FIREBASE_ID_TOKEN>
  - Backend verifies ID token and returns the local MongoDB user record (attached by auth middleware).
  - Example response:
    {
      "user": {
        "_id": "63f9a5e...",
        "uid": "firebase-uid-abc",
        "email": "test@example.com",
        "role": "patient",
        ...
      }
    }

2) Firebase Console — create project & web app (quick)
- Open: https://console.firebase.google.com/
- Create/select project (e.g., mycyberclinics-a74c4).
- In Project Settings → General → “Your apps” → click `</>` (Register web app).
  - Name the app (e.g., "ExpoApp").
  - Register and copy the firebaseConfig values (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).
  - The Web API key is shown in Project Settings → General → Web API Key (you'll need this for REST tests).

3) Enable Email/Password sign-in
- Firebase Console → Build → Authentication → Sign-in method.
- Click "Email / Password" → Enable → Save.

4) Create test users (3 ways)
A. Console (manual)
- Firebase Console → Authentication → Users → Add user → enter email & password.

B. REST (scriptable)
- Sign up (create) user:
  curl -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=YOUR_WEB_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Password123","returnSecureToken":true}'
- Sign in (get idToken):
  curl -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_WEB_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Password123","returnSecureToken":true}'

C. Admin (server-side createUser)
- In backend code with firebase-admin:
```ts
import { getAuth } from "firebase-admin/auth";
await getAuth().createUser({ email, password });
```

5) Expo (React Native) setup — install packages
- In your Expo project root:
  npm install firebase axios
- (Optional) expo install expo-auth-session for Google or OAuth flows on Expo.

6) Firebase initialization in Expo (recommended file)
- Create a file src/firebase.ts (or src/firebase.js):

```ts
// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_WEB_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "mycyberclinics-a74c4",
  // storageBucket, messagingSenderId, appId (optional but copy them)
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

Notes:
- The web API key and firebaseConfig values are public; it's okay to include them in the client app.
- Do NOT include the Firebase Admin service account (private key) or backend secrets in the client.

7) Email/Password sign-in example (component or helper)
- Example sign-in function:

```ts
// src/authHelpers.ts
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

export async function signInWithEmailPassword(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const user = credential.user;
  // Acquire ID token
  const idToken = await user.getIdToken(); // short-lived token
  return { user, idToken };
}
```

8) Calling backend with ID token (axios example)
- The backend expects Authorization: Bearer <ID_TOKEN>

```ts
import axios from "axios";

async function fetchProfile(idToken: string) {
  const resp = await axios.get("http://<BACKEND_HOST>:4000/api/profile", {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
  return resp.data; // { user: ... }
}
```

Important:
- If running Expo on a device/emulator and your backend is on your dev machine, use your machine LAN IP (e.g., http://192.168.1.10:4000) rather than localhost. Or use ngrok to expose a public URL.

9) Axios interceptor (recommended)
- Attach token automatically to every request if user is signed in. This avoids manually adding the header each time.

```ts
// src/api.ts
import axios from "axios";
import { auth } from "./firebase";

const api = axios.create({
  baseURL: "http://<BACKEND_HOST>:4000"
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    // getIdToken() will auto-refresh if necessary
    const token = await user.getIdToken();
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

10) Token refresh and auth state handling
- The Firebase client SDK refreshes tokens automatically for signed-in users. Use:
  - onAuthStateChanged(auth, user => { /* track sign-in or sign-out */ })
  - calling user.getIdToken() returns a fresh token, calling getIdToken(true) forces refresh.
- For long-lived sessions, rely on SDK's built-in refresh. Do not store idToken in localStorage or AsyncStorage for long-term use; always call getIdToken() or use the currentUser object to retrieve it on-demand.

11) Google sign-in (Expo specific notes)
- For Expo managed apps, using "expo-auth-session" with Firebase is common:
  - Use Google OAuth via expo-auth-session to get an identity token or access token.
  - Convert the OAuth credentials to Firebase credentials via signInWithCredential() using GoogleAuthProvider. Then call user.getIdToken() as usual.
- Google on Android/iOS within Expo has additional steps (reverse client IDs, SHA fingerprints for Android). If you want a complete example, instruct and I can provide a sample.

12) Using Firebase Auth Emulator (local dev)
- Install firebase-tools: npm i -g firebase-tools
- firebase init emulators (choose Auth)
- firebase emulators:start
- In your Expo app during development connect the SDK to emulator:

```ts
import { connectAuthEmulator } from "firebase/auth";
connectAuthEmulator(auth, "http://10.0.2.2:9099"); // emulator URL (10.0.2.2 for Android emulator)
```

- This avoids making requests to live Firebase and is safe for testing.

13) End-to-end testing (Postman / curl)
A) Create user & sign in via REST (if you don't have frontend yet)
- Create user:
  curl -s -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=YOUR_WEB_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Password123","returnSecureToken":true}' | jq

- Sign in to get idToken:
  curl -s -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_WEB_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Password123","returnSecureToken":true}' | jq

- Use idToken to call backend:
  curl -H "Authorization: Bearer <ID_TOKEN>" http://localhost:4000/api/profile | jq

B) If the backend runs in Docker and you call from host:
- Use machine IP (or expose port). Example: http://192.168.1.10:4000/api/profile

C) Postman instructions
- For REST signIn: POST JSON body as shown.
- For backend call: set header Authorization: Bearer <idToken> (no quotes).

14) Troubleshooting & common errors
- MISSING_EMAIL: Your POST body isn't valid JSON or Content-Type header missing. Ensure you send JSON in request body (not headers).
- EMAIL_NOT_FOUND: The email doesn't exist. Create the user first.
- INVALID_PASSWORD: Wrong password.
- API_KEY_INVALID: Wrong Web API key. Use the Web API key from Firebase Project Settings.
- "Invalid or expired token" from backend:
  - Token expired: call getIdToken(true) to force refresh or sign in again.
  - Token is not an ID token: ensure you are passing the idToken, not an OAuth access token.
  - Token malformed: ensure no trailing/leading characters were added when copying.
- CORS issues from a browser / web Expo: backend must allow origin. Your backend uses @koa/cors with default allowing all; for production restrict specific origins.

15) Security & production recommendations
- Never put firebase-admin service account JSON or private keys into the frontend.
- Rotate private keys if they were committed or shared publicly.
- Keep .env and firebase-service-account.json out of source control. Your .gitignore should already include .env and firebase-service-account.json.
- In production, use HTTPS for API calls.
- Use least-privilege service accounts. Limit the Admin service account permissions if possible.
- Use environment secret managers for production secrets (GCP Secret Manager, AWS Secrets Manager, Vercel/Netlify environment variables).
- Consider verifying additional claims (custom claims) for role-based access control.

16) Appendix — Useful one-liners & sample files

A) Create user (REST) + call profile in one bash pipeline (requires jq)
```bash
WEB_API_KEY="YOUR_WEB_API_KEY"
EMAIL="test@example.com"
PASSWORD="Password123"

ID_TOKEN=$(curl -s -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$WEB_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"returnSecureToken\":true}" | jq -r '.idToken')

curl -H "Authorization: Bearer $ID_TOKEN" http://localhost:4000/api/profile | jq
```

B) Minimal Expo sign-in + backend call example (React component)
```tsx
// App.tsx (simplified)
import React, { useState } from "react";
import { Button, TextInput, View, Text } from "react-native";
import { auth } from "./src/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import axios from "axios";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState<any>(null);

  async function handleSignIn() {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      const resp = await axios.get("http://192.168.1.10:4000/api/profile", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      setProfile(resp.data.user);
    } catch (err) {
      console.error(err);
      alert("Sign-in failed");
    }
  }

  return (
    <View style={{ padding: 20 }}>
      <TextInput placeholder="email" value={email} onChangeText={setEmail} />
      <TextInput placeholder="password" value={password} secureTextEntry onChangeText={setPassword} />
      <Button title="Sign in & fetch profile" onPress={handleSignIn} />
      {profile && <Text>{JSON.stringify(profile, null, 2)}</Text>}
    </View>
  );
}
```

C) Backend call examples (curl)
- Health:
  curl http://localhost:4000/api/health
- Profile (protected):
  curl -H "Authorization: Bearer <ID_TOKEN>" http://localhost:4000/api/profile
