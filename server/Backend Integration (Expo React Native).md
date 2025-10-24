# MyCyberClinics — Backend API Documentation

Author: Joseph (from mycyberclinics)
Last updated: 2025-10-22

This README documents every backend endpoint (both the original endpoints and the new session/onboarding endpoints), explains request/response shapes, and gives step-by-step integration instructions for Web (browser) and Mobile (Expo / React Native). It also contains Postman testing steps, troubleshooting tips, and security notes so a frontend developer — or a novice developer — can implement and test the flows.

A short note on what I changed and why (story)
- I reviewed and updated the backend to securely persist user verification and onboarding status.
- I added a Redis-backed server session system and HttpOnly cookie flow for web clients.
- I added the onboardingCompleted boolean to the User model and routes to update and synchronize it across active sessions.
- I fixed request-body parsing issues by using one global JSON body parser and keeping multipart parsing only for file uploads.
- I included migration helpers to hash plaintext passwords when needed and utilities to auto-migrate on startup (configurable).
- Below is a single combined, beginner-friendly guide describing all endpoints (old + new) and how to use them from Web and Expo mobile apps.

Table of contents
- Basics & quick start
- Environment variables
- Authentication & session model (overview)
- Endpoints (complete reference)
  - Signup & verification (existing)
  - Profile management (existing)
  - Verification codes (existing)
  - Password migration utilities (existing scripts)
  - New session & onboarding endpoints (new)
- Integration examples and snippets (Web + Expo)
- Postman testing guide (step-by-step)
- Troubleshooting & common errors
- Security considerations
- Appendix: helper snippets and useful commands

---

BASICS & QUICK START
- Base URL (development): `http://localhost:4000`
- Install dependencies:
  - npm install
- Start server (development):
  - npm run dev
- Make sure MongoDB and Redis are running and accessible using .env values.

ENVIRONMENT VARIABLES (important)
- NODE_ENV (development|production)
- MONGO_URI — MongoDB connection string
- REDIS_URL — Redis connection (e.g. redis://127.0.0.1:6379)
- FIREBASE_PROJECT_ID
- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY — make sure newline encoding is handled
- SESSION_COOKIE_NAME — default: `session`
- SESSION_TTL_SECONDS — default: `432000` (5 days)
- PASSWORD_SALT_ROUNDS — default: 12
- AUTO_MIGRATE_PASSWORDS — `true` to enable startup migration (temporary)
- FRONTEND_VERIFY_URL — used to generate Firebase email verification links
- SENDGRID_* — SendGrid settings for email sending (optional)

AUTHENTICATION & SESSION MODEL (overview)
- Primary auth in the system: Firebase Authentication used by client SDKs.
- Web flow:
  1. Client signs in with Firebase and obtains an ID token.
  2. Client POSTs { idToken } to `/api/auth/session`.
  3. Server verifies token with Firebase Admin SDK and creates a server-side session stored in Redis (payload: { uid, emailVerified, onboardingCompleted }).
  4. Server sets a HttpOnly cookie (opaque session id). Browser automatically sends it on subsequent requests.
- Mobile flow (Expo/React Native):
  - Use `expo-secure-store` to persist { verified, onboarded } locally.
  - Communicate with backend using Authorization: Bearer <idToken>.
  - Fetch `/api/me/status` on app start to sync state.

GENERAL GUIDELINES
- All communication should be over HTTPS in production.
- Cookie attributes:
  - HttpOnly: prevents JS access (good)
  - SameSite: `lax` by default
  - Secure: enabled when NODE_ENV=production
- The server stores no sensitive PII in cookies — only opaque session ids. Session data with uid and booleans lives in Redis.

ENDPOINTS (FULL REFERENCE)
The list below contains both the previously-existing endpoints and the new session / onboarding endpoints. Example requests include cURL and sample JS (fetch) usage. Replace `{{API_URL}}` with `http://localhost:4000` or your production API URL.

-------------------------------------------------------------------------------
1) Signup & Email Verification (existing)
-------------------------------------------------------------------------------

POST /api/signup
- Purpose: Create a new user (Firebase + MongoDB) and send a verification email.
- Auth: Not required
- Request:
  - Headers: Content-Type: application/json
  - Body:
    {
      "email": "user@example.com",
      "password": "password123",
      "displayName": "John Doe" // optional
    }
- Response:
  - 200 { message: "User created. Please verify your email.", verificationLink?: "<firebase link>" }
  - 400 when required fields missing or invalid
- Example cURL:
  ```bash
  curl -X POST {{API_URL}}/api/signup \
    -H "Content-Type: application/json" \
    -d '{"email":"me@example.com","password":"secret","displayName":"Me"}'
  ```

POST /api/check-email-verification
- Purpose: Check whether a user's email has been verified (via Firebase).
- Auth: Not required
- Request body:
  { "email": "user@example.com" }
- Response:
  { "emailVerified": true | false }
- cURL:
  ```bash
  curl -X POST {{API_URL}}/api/check-email-verification \
    -H "Content-Type: application/json" \
    -d '{"email":"me@example.com"}'
  ```

Notes:
- Verification emails use Firebase Admin SDK (and optionally SendGrid for templating).
- The frontend should show a verification prompt if emailVerified === false.

-------------------------------------------------------------------------------
2) Profile Management (existing)
-------------------------------------------------------------------------------

POST /api/profile/complete
- Purpose: Complete user profile (after email verified)
- Auth: Required (Authorization: Bearer <Firebase_ID_Token>)
- Request:
  - Headers:
    Authorization: Bearer <ID_TOKEN>
    Content-Type: application/json
  - Body example:
    {
      "displayName": "Jane Doe",
      "phone": "08012345678",
      "dob": "1990-01-01",
      "gender": "female",
      "location": "Lagos",
      "accountType": "patient", // or "physician", "regular"
      "bio": "Details..." // only used for physician
    }
- Behavior:
  - Only allowed if user's Firebase email is verified.
  - profileCompleted is set true for regular/patient accounts; for physicians it is true only after document upload.
- Response:
  - 200 { success: true, user: { ...updated user... } }
  - 403 if email not verified

POST /api/profile/upload-doc
- Purpose: Upload physician documents to Firebase Storage and update the user document
- Auth: Required (Authorization: Bearer <ID_TOKEN>)
- Request:
  - multipart/form-data
    - mcdnLicense: File (required for physicians)
    - additionalQualification: File (optional)
  - Do NOT set Content-Type manually in client
- Response:
  - 200 { success: true, user: {...} } with storage URLs
- Example Postman:
  - Body -> form-data -> add file fields.

GET /api/profile
- Purpose: Return profile info (DB + firebase claims)
- Auth: Required
- Response:
  - 200 { id, email, role, displayName, phone, dob, gender, location, profileCompleted, bio, mcdnLicense, additionalQualification, createdAt, updatedAt, firebaseClaims }

-------------------------------------------------------------------------------
3) Verification Codes (existing)
-------------------------------------------------------------------------------

POST /api/verification/create
- Purpose: Create a short numeric code for a purpose (email, phone, etc.)
- Auth: Not required
- Request:
  - Body: { id: "<email-or-phone-or-id>", purpose: "<purpose>", debug?: boolean }
- Response:
  - 200 { success: true, expirySeconds, code? } // code only included when NODE_ENV !== 'production' or debug=true
- Notes:
  - Stores HMAC(code) in Redis; maxAttempts/lockout enforced.

POST /api/verification/verify
- Purpose: Verify previously-generated code
- Request:
  - Body: { id: "<id>", purpose: "<purpose>", code: "123456" }
- Response cases:
  - 200 { success: true } (ok)
  - 401 { success: false, error: "invalid", attempts: n }
  - 423 locked (with retryAfterSeconds)
  - 410 expired

-------------------------------------------------------------------------------
4) Password migration utilities (existing scripts)
-------------------------------------------------------------------------------
- src/scripts/migrate-hash-passwords.ts — one-off migration script to find documents with plaintext `password` and set bcrypt `passwordHash`, then unset `password`.
  - Run dry-run: `DRY_RUN=1 npx ts-node src/scripts/migrate-hash-passwords.ts`
  - Real run: `npx ts-node src/scripts/migrate-hash-passwords.ts`
- src/utils/autoMigratePasswords.ts — optional startup auto-migration (enable with AUTO_MIGRATE_PASSWORDS=true in .env)

-------------------------------------------------------------------------------
5) New Session & Onboarding Endpoints (new)
-------------------------------------------------------------------------------

POST /api/auth/session
- Purpose: Create a server-side session and set an HttpOnly cookie for web clients.
- Auth: Provide Firebase ID token in request JSON body (not header).
  Request:
    - POST /api/auth/session
    - Headers: Content-Type: application/json
    - Body: { "idToken": "<FIREBASE_ID_TOKEN>" }
- Behavior:
  - Verify idToken with Firebase Admin.
  - Read `email_verified` from idToken payload.
  - Read `onboardingCompleted` from MongoDB User record (upserted by firebaseAuth middleware or existing user).
  - Create session id (uuid), store session data in Redis at key `session:<sessionId>` with TTL = SESSION_TTL_SECONDS.
  - Add sessionId to `user_sessions:<uid>` set to enumerate active sessions.
  - Set cookie named SESSION_COOKIE_NAME (default `session`) with HttpOnly and SameSite=lax. Cookie value = sessionId.
- Response:
  - 200 { success: true } with Set-Cookie header
  - 400 missing idToken
  - 401 invalid token

GET /api/me/status
- Purpose: Client obtains the two status booleans used to route the user:
  - verified (boolean) — email verified in Firebase
  - onboarded (boolean) — onboardingCompleted in DB
- Auth:
  - Prefer cookie (session) — cookie is automatically read by server.
  - Fallback: Authorization: Bearer <idToken> (server will verify token and read DB).
- Response:
  - 200 { verified: true|false, onboarded: true|false }
  - 401 if no session and no idToken
  - 500 server error if underlying issue

POST /api/user/onboarding
- Purpose: Mark a user as having completed onboarding and sync across active sessions.
- Auth: Required — Authorization: Bearer <idToken> (firebaseAuth)
- Request:
  - Body: { "completed": true } // boolean
- Behavior:
  - Update User document: `onboardingCompleted: <completed>`
  - Fetch `user_sessions:<uid>` set from Redis; update every `session:<sid>` JSON to set onboardingCompleted accordingly (preserve TTL where possible).
- Response:
  - 200 { success: true }
  - 400 missing/invalid completed
  - 401 invalid token
  - 500 on DB/Redis error

POST /api/auth/logout
- Purpose: Remove session from Redis and clear cookie.
- Auth: The cookie is used, but if missing returns success: true.
- Behavior:
  - Read cookie session id; delete `session:<sid>` and remove sid from `user_sessions:<uid>` set.
  - Clear cookie (set Max-Age=0).
- Response:
  - 200 { success: true }

Middleware: sessionAuth
- Middleware available at `src/middleware/sessionAuth.ts`. Reads HttpOnly cookie (name SESSION_COOKIE_NAME) and loads session from Redis. On success `ctx.state.session` is set { uid, emailVerified, onboardingCompleted } and `ctx.state.sessionId` is available for downstream handlers.

-------------------------------------------------------------------------------
FRONTEND INTEGRATION (DETAILED)
-------------------------------------------------------------------------------

Web (Browser) — recommended flow
1) Firebase sign-in using client SDK (web).
```js
// Example (Firebase JS SDK)
const user = firebase.auth().currentUser;
const idToken = await user.getIdToken();
```
2) Exchange idToken for server session cookie:
```js
await fetch(`${API_URL}/api/auth/session`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // important for cookies
  body: JSON.stringify({ idToken })
});
```
- The server will set HttpOnly cookie. From then on, use cookie-based requests in the browser:
```js
const res = await fetch(`${API_URL}/api/me/status`, { credentials: 'include' });
```

3) To update onboarding:
- The onboarding endpoint requires firebaseAuth middleware (Authorization: Bearer idToken). While cookie exists, endpoint expects a validated idToken to ensure user identity before changing DB. So send Authorization header (the backend will also update server sessions).
```js
await fetch(`${API_URL}/api/user/onboarding`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
  body: JSON.stringify({ completed: true })
});
```

4) Logout:
```js
await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
```

Mobile (Expo / React Native)
- Use `expo-secure-store` to persist a small object with `verified` and `onboarded`.
- On app start:
  - If current user exists in Firebase, fetch `idToken`.
  - Call `/api/me/status` with Authorization: Bearer <idToken>.
  - Persist JSON to SecureStore.
- Example SecureStore helpers:
```js
import * as SecureStore from 'expo-secure-store';
const STATUS_KEY = 'user_status';

export async function setUserStatus(status) {
  await SecureStore.setItemAsync(STATUS_KEY, JSON.stringify(status));
}
export async function getUserStatus() {
  const raw = await SecureStore.getItemAsync(STATUS_KEY);
  return raw ? JSON.parse(raw) : { verified: false, onboarded: false };
}
export async function clearUserStatus() {
  await SecureStore.deleteItemAsync(STATUS_KEY);
}
```

Decision logic on app start (both web & mobile)
1. Get local stored status (mobile) or trust cookie (web).
2. If missing or stale: call `/api/me/status`.
3. Navigate:
   - If verified === false => show verification UI.
   - Else if onboarded === false => show onboarding flow.
   - Else => go to main app.

-------------------------------------------------------------------------------
POSTMAN / TESTING GUIDE (step-by-step)
-------------------------------------------------------------------------------
Pre-requirements:
- Backend running at API_URL
- Valid Firebase ID token for test user (get from client or REST sign-in)
- Postman configured for cookies (cookies tab)

1) Create server session (web)
- Request:
  - POST {{API_URL}}/api/auth/session
  - Body JSON: { "idToken": "{{ID_TOKEN}}" }
  - Set Content-Type: application/json, credentials set is not required in Postman; Postman will capture Set-Cookie.
- Expect:
  - 200 { success: true }
  - Set-Cookie header with name `session` or SESSION_COOKIE_NAME
- If 500 "stream is not readable": ensure your request is application/json and you are not sending multipart.

2) Get status (cookie)
- Request:
  - GET {{API_URL}}/api/me/status
  - Ensure cookie from step 1 is present in Postman's cookie jar.
- Expect:
  - 200 { verified: true|false, onboarded: true|false }

3) Get status (Authorization fallback)
- If cookie not present, send:
  - GET {{API_URL}}/api/me/status with header Authorization: Bearer {{ID_TOKEN}}
- Expect same JSON response.

4) Update onboarding
- Request:
  - POST {{API_URL}}/api/user/onboarding
  - Header Authorization: Bearer {{ID_TOKEN}}
  - Body JSON: { "completed": true }
- Expect:
  - 200 { success: true }
- Then call GET /api/me/status using cookie to ensure onboarded is now true.

5) Logout
- Request:
  - POST {{API_URL}}/api/auth/logout (with cookie)
- Expect:
  - 200 { success: true }
  - Redis session removed; subsequent GET /api/me/status returns 401 unless idToken provided.

6) Profile endpoints
- POST /api/profile/complete, GET /api/profile, POST /api/profile/upload-doc — test as described earlier. Use Authorization: Bearer <ID_TOKEN>.

7) Verification endpoints
- POST /api/verification/create — returns code in dev/debug mode.
- POST /api/verification/verify — feed code to test verification.

-------------------------------------------------------------------------------
TROUBLESHOOTING & COMMON ERRORS
-------------------------------------------------------------------------------
- 401 Invalid/expired token:
  - Obtain a fresh idToken from Firebase client SDK (short lived tokens).
- 500 "stream is not readable":
  - Caused by reading the request body twice. Use `Content-Type: application/json` for JSON endpoints and do NOT call multipart parser for JSON endpoints. Only the profile upload route should use multipart.
- No cookie set after /api/auth/session:
  - If NODE_ENV === 'production' the cookie is `Secure` and will only be set over HTTPS. Use NODE_ENV=development for local HTTP testing.
- Session missing:
  - Check Redis connectivity and TTL: use `redis-cli GET session:<sid>`.
- Onboarding update not applying to other sessions:
  - Check `user_sessions:<uid>` set in Redis. The endpoint updates all listed sessions; if some session ids are missing it means they were not added earlier.

-------------------------------------------------------------------------------
SECURITY CONSIDERATIONS
-------------------------------------------------------------------------------
- Cookie contains only opaque session id; session data is in Redis.
- HttpOnly cookie prevents JavaScript access.
- Use HTTPS in production to enable Secure cookies.
- Do not store PII or passwords in plaintext in cookies or client storage.
- Onboarding updates require a verified user via Firebase token.
- Server enforces SameSite=lax for general protection; adjust only if your use-case requires cross-site requests.

-------------------------------------------------------------------------------
APPENDIX: EXAMPLE FETCH / CURL SNIPPETS
-------------------------------------------------------------------------------

Create session (Web)
```bash
curl -X POST http://localhost:4000/api/auth/session \
  -H "Content-Type: application/json" \
  -d '{"idToken":"<ID_TOKEN>"}' -i
```

Get status (cookie-based fetch)
```js
const res = await fetch(`${API_URL}/api/me/status`, { credentials: 'include' });
console.log(await res.json());
```

Get status (mobile - Authorization)
```js
const res = await fetch(`${API_URL}/api/me/status`, {
  headers: { Authorization: `Bearer ${idToken}` }
});
console.log(await res.json());
```

Update onboarding (mobile / web, Authorization)
```bash
curl -X POST http://localhost:4000/api/user/onboarding \
  -H "Authorization: Bearer <ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'
```

Upload profile doc (multipart)
```bash
curl -X POST http://localhost:4000/api/profile/upload-doc \
  -H "Authorization: Bearer <ID_TOKEN>" \
  -F "mcdnLicense=@/path/to/license.pdf"
```

-------------------------------------------------------------------------------
WHAT I DID (again briefly) AND NEXT
-------------------------------------------------------------------------------
I reviewed and updated the backend code paths, added a secure Redis-backed session flow with HttpOnly cookies, added onboarding tracking and server-side sync across sessions, fixed request-body parsing errors, and included helpful scripts and migration utilities to harden password storage. I also prepared the combined API documentation above so frontend and mobile developers can integrate quickly.

Next steps (what you or the team might want to do)
- Frontend: implement the `/api/auth/session` call immediately after Firebase sign-in for web; use `/api/me/status` on app start for mobile and persist to SecureStore.
- QA: run through Postman steps and confirm session cookie behavior and onboarding update propagation for multiple open browsers/devices.
- Ops: ensure Redis & MongoDB are healthy and accessible; in production set NODE_ENV=production and use HTTPS for cookie security.
- Optional: add a small dev-only endpoint (protected by NODE_ENV !== 'production') to create sessions for testing without a real idToken.

If you want, I can:
- export a Postman collection JSON that contains example requests for all endpoints,
- provide a minimal React Native (Expo) example that signs in, calls `/api/me/status` and stores result in SecureStore,
- or open a PR with the README file added to the repo.

Thanks — paste this README.md into your repository root (or I can prepare a direct file block for you). If you want the Postman collection next, tell me and I'll generate it and provide instructions to import.  
