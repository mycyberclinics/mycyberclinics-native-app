import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

if (!projectId || !clientEmail || !privateKey) {
  throw new Error(
    "Missing Firebase credentials in environment (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)"
  );
}

privateKey = privateKey
  .replace(/\\n/g, "\n")
  .replace(/^"(.*)"$/, "$1")
  .replace(/^'(.*)'$/, "$1");

const initOptions: any = {
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey,
  }),
};

// If a bucket is configured via env, include it (so admin.storage() has a default)
if (storageBucket) {
  initOptions.storageBucket = storageBucket;
}

admin.initializeApp(initOptions);

export default admin;
export const auth = admin.auth();
export const defaultStorageBucket = storageBucket;