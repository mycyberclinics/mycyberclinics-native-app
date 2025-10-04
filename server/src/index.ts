import Koa from "koa";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Router from "koa-router";
import { initializeApp, cert } from "firebase-admin/app";

import indexRoutes from "./routes/index";
import profileRoutes from "./routes/profile";

dotenv.config();

const app = new Koa();
const router = new Router();

// Firebase Admin SDK
initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI!)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

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