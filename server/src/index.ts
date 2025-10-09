import Koa from "koa";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Router from "koa-router";
import { initializeApp, cert } from "firebase-admin/app";
import fs from "fs";
import path from "path";

import indexRoutes from "./routes/index";
import profileRoutes from "./routes/profile";

dotenv.config();

const app = new Koa();
const router = new Router();

// Firebase Admin SDK initialization with fallback options
try {
  const serviceAccountPath = path.resolve(process.cwd(), "firebase-service-account.json");
  let credentialData: any;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    // If you provide the entire JSON as an env var (useful for some CI/CD)
    credentialData = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } else if (fs.existsSync(serviceAccountPath)) {
    credentialData = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    credentialData = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  } else {
    throw new Error("No Firebase service account configuration found. Provide firebase-service-account.json or FIREBASE_* env vars.");
  }

  initializeApp({
    credential: cert(credentialData),
  });

  console.log("Firebase Admin initialized");
} catch (err) {
  console.error("Firebase initialization error:", err);
  process.exit(1);
}

// MongoDB connection
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error("MONGO_URI is not set in the environment.");
  process.exit(1);
}
mongoose
  .connect(mongoUri)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Middlewares
app.use(cors());
app.use(bodyParser());

// Routes
router.use(indexRoutes.routes());
router.use(profileRoutes.routes());
app.use(router.routes()).use(router.allowedMethods());

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});