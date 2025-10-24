# MyCyberClinics — Backend API Documentation

Author: Joseph (from mycyberclinics)
Last updated: 2025-10-22

This README documents every backend endpoint (original endpoints + session/onboarding + user preferences). It explains request/response shapes, validation rules, and gives step-by-step integration instructions for Web (browser) and Mobile (Expo / React Native). It also contains Postman testing steps, troubleshooting tips, and security notes so frontend or novice backend/mobile developers can implement and test the flows.

Summary of recent changes
- Added Redis-backed server sessions implemented with an opaque session id set in an HttpOnly cookie for web clients.
- Added onboarding tracking: `onboardingCompleted` field on User model with endpoints to update/comfirm it and sync across active sessions.
- Fixed double-body parsing issues by using a global JSON body parser and only using multipart parsing on file upload routes.
- Added auto-migration utilities to convert accidental plaintext `password` fields to bcrypt `passwordHash`.
- Added "Preferences" support:
  - New MongoDB `preferences` sub-document on the User model.
  - New endpoints:
    - POST /api/user/preferences — validate and persist user preferences and sync them into all active server sessions.
    - GET  /api/user/preferences — return the user's preferences.
  - Preferences are included in server sessions created by POST /api/auth/session and returned by GET /api/profile.

Table of contents
- Basics & quick start
- Environment variables
- Authentication & session model (overview)
- Endpoints (complete reference)
  - Signup & verification
  - Profile management
  - Verification codes
  - Password migration utilities
  - New session & onboarding endpoints
  - New preferences endpoints (this update)
- Frontend integration (Web + Expo / React Native)
- Postman testing guide for preferences (step-by-step)
- Troubleshooting & common errors
- Security considerations
- Appendix: quick examples & cURL snippets

------------------------------------------------------------
BASICS & QUICK START
------------------------------------------------------------
- Base URL (development): `http://localhost:4000`
- Install dependencies: `npm install`
- Start server (development): `npm run dev`
- Ensure MongoDB and Redis are running and accessible using .env values.

------------------------------------------------------------
ENVIRONMENT VARIABLES (important)
------------------------------------------------------------
(Only the relevant ones listed here — full set remains the same)
- NODE_ENV (development | production)
- MONGO_URI
- REDIS_URL
- FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
- SESSION_COOKIE_NAME — default `session`
- SESSION_TTL_SECONDS — default `432000` (5 days)
- PASSWORD_SALT_ROUNDS — default 12
- AUTO_MIGRATE_PASSWORDS — enable startup migration
- FRONTEND_VERIFY_URL — for verification links

------------------------------------------------------------
AUTHENTICATION & SESSION MODEL (overview)
------------------------------------------------------------
- Primary authentication: Firebase Authentication client obtains an ID token.
- Web flow (recommended):
  1. Client obtains Firebase ID token.
  2. Client POSTs { idToken } to `/api/auth/session`.
  3. Server verifies token and creates an opaque server-side session stored in Redis. Cookie stores only the session id (HttpOnly).
  4. Subsequent web calls can use the cookie (credentials included).
- Mobile flow:
  - Mobile apps use Authorization: Bearer <idToken> when calling APIs.
  - Persist small booleans/status locally in SecureStore (mobile) or call `/api/me/status` to synchronise.
- Sessions stored in Redis hold `{ uid, emailVerified, onboardingCompleted, preferences }`. This allows immediate server-side revocation/updates.

------------------------------------------------------------
DATA MODEL NOTES (User)
------------------------------------------------------------
- Collection: `User` (MongoDB)
- Important fields:
  - uid, email, role, profileCompleted, onboardingCompleted (new), preferences (new), passwordHash (bcrypt), mcdnLicense, additionalQualification, timestamps.
- New `preferences` object (defaults provided):
  - communicationMethod: "email" | "sms" | "push" (default: "email")
  - language: ISO 639-1 code (default: "en")
  - timezone?: string
  - notificationsEnabled?: boolean (default: true)
  - theme?: string (future use)
- Sensitive fields removed from JSON output (passwordHash etc).

------------------------------------------------------------
ENDPOINTS (COMPLETE REFERENCE)
------------------------------------------------------------
Below is a concise reference for the endpoints you will commonly use. Replace `{{API_URL}}` with your environment base URL.

1) POST /api/signup
- Create user and send verification email via Firebase/SendGrid.
- Body: { email, password, displayName? }
- Response: 200 message + optional verification link (dev)

2) POST /api/check-email-verification
- Body: { email }
- Response: { emailVerified: true|false }

3) POST /api/auth/session
- Purpose: Exchange Firebase ID token for server-side session cookie (HttpOnly).
- Body: { idToken }
- Response: 200 { success: true } and Set-Cookie: session=<id>
- Server session payload includes preferences fetched from DB.

4) GET /api/me/status
- Purpose: Return bootstrap booleans for routing (verified, onboarded)
- Auth:
  - Prefer cookie (session).
  - Fallback: Authorization: Bearer <idToken>.
- Response: { verified: boolean, onboarded: boolean }

5) POST /api/auth/logout
- Purpose: Remove session from Redis and clear cookie.
- Response: 200 { success: true }

6) POST /api/user/onboarding
- Purpose: Mark onboardingCompleted for the user and sync active sessions in Redis.
- Auth: Authorization: Bearer <idToken>
- Body: { completed: true|false }
- Response: 200 { success: true }

7) POST /api/profile/complete
- Purpose: Complete user profile (displayName, phone, dob, gender, location, accountType, bio).
- Auth: Authorization: Bearer <idToken>
- Response: 200 { success: true, user: {...} }

8) POST /api/profile/upload-doc
- Purpose: Upload physician documents (multipart/form-data).
- Auth: Authorization: Bearer <idToken>
- Response: 200 { success: true, user: {...} }

9) GET /api/profile
- Purpose: Return user profile + preferences + firebaseClaims
- Auth: Authorization: Bearer <idToken>
- Response includes `preferences` (new)

10) POST /api/verification/create
- Purpose: Create numeric verification code (stores HMAC in Redis).
- Body: { id, purpose, debug? }
- Response: { success: true, expirySeconds, code? } // code included in dev or debug

11) POST /api/verification/verify
- Purpose: Verify code created earlier
- Body: { id, purpose, code }
- Responses: success / invalid / expired / locked

12) NEW — Preferences endpoints (added in this update)
- GET /api/user/preferences
  - Purpose: Return the user's preferences from DB.
  - Auth: Authorization: Bearer <idToken> (uses firebaseAuth middleware)
  - Response:
    {
      "preferences": {
        "communicationMethod": "email",
        "language": "en",
        "timezone": "America/New_York",
        "notificationsEnabled": true,
        "theme": "light"
      }
    }

- POST /api/user/preferences
  - Purpose: Validate and update user preferences, persist to MongoDB, and update all active sessions for the user in Redis so cookie sessions reflect the update immediately.
  - Auth: Authorization: Bearer <idToken>
  - Body: (partial updates allowed — only supplied fields updated)
    {
      "communicationMethod": "sms",     // allowed: email | sms | push
      "language": "fr",                // ISO 639-1 (2-letter)
      "timezone": "Europe/Paris",      // optional
      "notificationsEnabled": true,    // optional boolean
      "theme": "dark"                  // optional string (future)
    }
  - Validation:
    - communicationMethod must be "email"|"sms"|"push"
    - language must be a 2-letter ISO 639-1 code (case-insensitive)
    - notificationsEnabled must be boolean if provided
  - Response:
    { "success": true, "preferences": { ...updated preferences... } }
  - On success:
    - Preferences are persisted in User document.
    - Server attempts to enumerate `user_sessions:<uid>` in Redis and updates each `session:<sid>` JSON to include the updated preferences (preserving TTL where possible).

------------------------------------------------------------
FRONTEND INTEGRATION (Web)
------------------------------------------------------------
1) Web (Browser) — recommended:
- After Firebase sign-in:
  const idToken = await firebase.auth().currentUser.getIdToken();
  await fetch(`${API_URL}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ idToken })
  });

- To read profile + preferences:
  fetch(`${API_URL}/api/profile`, { credentials: 'include' })

- To update preferences (endpoint requires firebaseAuth):
  fetch(`${API_URL}/api/user/preferences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ communicationMethod: 'sms', language: 'fr' })
  });

- Note: POST /api/user/preferences requires an Authorization Bearer idToken since the route uses firebaseAuth middleware. After the update the server updates active sessions in Redis, so cookie-based calls (GET /api/profile) should reflect the new preferences.

------------------------------------------------------------
FRONTEND INTEGRATION (Expo / React Native)
------------------------------------------------------------
- On app start:
  - If user is signed-in in Firebase, obtain idToken.
  - Call GET /api/me/status with Authorization: Bearer idToken to decide routing (verified/onboarded).
  - Call GET /api/user/preferences with Authorization: Bearer idToken to fetch preferences; store locally with expo-secure-store if desired.

- To update preferences:
  - Call POST /api/user/preferences with Authorization: Bearer idToken and update local state after success.

Example SecureStore helpers:
- setUserPreferences({ preferences })
- getUserPreferences()
- clearUserPreferences()

------------------------------------------------------------
POSTMAN TESTING GUIDE FOR PREFERENCES (STEP-BY-STEP)
------------------------------------------------------------
Prerequisites:
- Backend running at API_URL (e.g., http://localhost:4000)
- A valid Firebase idToken for a test user
- Postman (or equivalent) with cookie jar enabled

Environment variables in Postman:
- API_URL = http://localhost:4000
- ID_TOKEN = (set this after obtaining idToken)

Steps:

A) Obtain idToken
- Best: from a client app (firebase.auth().currentUser.getIdToken()).
- Alternatively use REST sign-in with Firebase Web API key.

B) Create server session cookie (web cookie flow)
- POST {{API_URL}}/api/auth/session
  Headers: Content-Type: application/json
  Body: { "idToken": "{{ID_TOKEN}}" }
- Verify Set-Cookie: session appears in Postman cookie jar.

C) View profile + preferences with cookie
- GET {{API_URL}}/api/profile (cookie sent automatically)
- Confirm `preferences` field exists.

D) View preferences using Authorization fallback
- GET {{API_URL}}/api/user/preferences
  Headers: Authorization: Bearer {{ID_TOKEN}}
- Confirm returned preferences match DB.

E) Update preferences (happy path)
- POST {{API_URL}}/api/user/preferences
  Headers: Content-Type: application/json
           Authorization: Bearer {{ID_TOKEN}}
  Body example:
  { "communicationMethod": "sms", "language": "fr", "timezone":"Europe/Paris" }
- Expect 200 { success: true, preferences: { ... } }

F) Confirm session sync
- After the POST above, run GET {{API_URL}}/api/profile using cookie-based request — preferences should be updated.
- To further validate, inspect Redis with redis-cli:
  SMEMBERS user_sessions:<uid>
  GET session:<sessionId>
  -> verify `preferences` exists and contains updated values

G) Validation & security tests
- Send invalid communicationMethod => expect 400 with descriptive error.
- Send invalid language (not 2-letter) => expect 400.
- Omit Authorization on POST /api/user/preferences => expect 401.
- Use a bad idToken => expect 401 from firebaseAuth.

H) Logout & cleanup
- POST {{API_URL}}/api/auth/logout (cookie sent automatically) — should clear cookie and delete session key.

Optional Postman Collection:
- Suggested requests: sign-in (REST), create-session, get-profile, get-preferences, post-preferences, logout, negative tests.
- Add a pre-request script to set Authorization header from environment variable:
  pm.request.headers.upsert({key:'Authorization', value:`Bearer ${pm.environment.get("ID_TOKEN")}`});

------------------------------------------------------------
TROUBLESHOOTING & COMMON ERRORS
------------------------------------------------------------
- 401 Invalid/expired token: obtain fresh idToken from the client SDK.
- No Set-Cookie after /api/auth/session: if NODE_ENV=production the cookie has Secure; ensure testing over HTTPS or set NODE_ENV=development.
- Preference update not visible via cookie GET /api/profile: ensure POST /api/user/preferences was called using Authorization: Bearer idToken (the route requires firebaseAuth) — once update completes, server updates Redis sessions and cookie-based calls should reflect new preferences.
- "stream is not readable": caused by parsing the request body twice — ensure only koa-bodyparser is used globally and koa-body (multipart) only on upload routes.

------------------------------------------------------------
SECURITY CONSIDERATIONS
------------------------------------------------------------
- Cookies carry only an opaque session id; session data is in Redis.
- Cookies are HttpOnly and SameSite=lax by default; Secure is set in production.
- Preferences are not sensitive PII; still validate all inputs server-side.
- Preferences route uses firebaseAuth and will upsert a DB user if not present — existing-email/uid conflicts are handled in the middleware.

------------------------------------------------------------
TESTING RECOMMENDATIONS (unit & integration)
------------------------------------------------------------
- Unit tests:
  - Validate preferences schema rejects invalid values.
  - Validate POST /api/user/preferences returns 400 for invalid input.
  - Mock firebaseAuth to test endpoints accept valid tokens and reject invalid tokens.
- Integration tests:
  - Create session A and session B for same uid (simulate two devices).
  - POST preferences with Authorization (idToken).
  - GET /api/profile using cookie on both sessions — both should show updated preferences.
  - Confirm redis `session:<id>` objects include `preferences` after update.
- Manual QA:
  - Update language / communication method in the app → reload on another device → settings persist.

------------------------------------------------------------
APPENDIX: QUICK EXAMPLES (cURL)
------------------------------------------------------------
Create session (cURL)
curl -i -X POST http://localhost:4000/api/auth/session \
  -H "Content-Type: application/json" \
  -d '{"idToken":"<ID_TOKEN>"}'

Get profile (cookie-based)
curl -i -X GET http://localhost:4000/api/profile --cookie "session=<SESSION_ID>"

Get preferences (Authorization)
curl -X GET http://localhost:4000/api/user/preferences \
  -H "Authorization: Bearer <ID_TOKEN>"

Update preferences (Authorization)
curl -X POST http://localhost:4000/api/user/preferences \
  -H "Authorization: Bearer <ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"communicationMethod":"sms","language":"fr"}'

Logout (cookie-based)
curl -X POST http://localhost:4000/api/auth/logout --cookie "session=<SESSION_ID>"

------------------------------------------------------------
CLOSING NOTES
------------------------------------------------------------
- The preferences feature is implemented end-to-end: DB schema, API routes, validation, and session sync.
- Web: call POST /api/auth/session after Firebase sign-in to set HttpOnly cookie, then call cookie-based endpoints.
- Mobile: use Authorization: Bearer idToken to call preferences endpoints and persist the small preferences object locally if offline.
- If you want, I can:
  - produce an importable Postman collection JSON for all endpoints (with example requests),
  - scaffold Jest + supertest integration tests that simulate sessions and verify Redis sync,
  - or provide a tiny Expo example that calls GET/POST preferences and persists them to SecureStore.
 