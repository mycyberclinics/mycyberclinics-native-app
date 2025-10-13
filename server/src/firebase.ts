import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  throw new Error(
    "Missing Firebase credentials in environment (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)"
  );
}

privateKey = privateKey
  .replace(/\\n/g, "\n")
  .replace(/^"(.*)"$/, "$1")
  .replace(/^'(.*)'$/, "$1");

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey,
  }),
});

export default admin;
export const auth = admin.auth();