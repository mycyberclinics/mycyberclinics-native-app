import Koa from "koa";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import profileRoutes from "./routes/profile";
import verificationRoutes from "./routes/verification";
import sessionRoutes from "./routes/session";
import onboardingRoutes from "./routes/onboarding";
import preferencesRoutes from "./routes/preferences";
import { migratePlaintextPasswordsOnStartup } from "./utils/autoMigratePasswords";
import serve from "koa-static";
import mount from "koa-mount";
import path from "path";
import fs from "fs";

dotenv.config();

const app = new Koa();
app.use(cors());

// DEV: Log incoming request method + Content-Type for debugging multipart issues.
// Keep this as the very first middleware (after CORS) so we capture raw headers.
app.use(async (ctx, next) => {
  try {
    const ct = ctx.request.headers["content-type"] || "";
    if (process.env.NODE_ENV !== "production") {
      console.info(`[incoming] ${ctx.method} ${ctx.url} Content-Type: ${ct}`);
    }
  } catch (e) {
    // non-fatal logging error
    console.warn("[incoming] header logging error", e);
  }
  return next();
});

// Conditional JSON body parser:
// - Use koa-bodyparser for JSON and urlencoded requests
// - If incoming Content-Type is multipart/form-data, skip bodyparser so route-level koaBody({ multipart: true }) can parse the stream.
const jsonBodyParser = bodyParser();
app.use(async (ctx, next) => {
  const contentTypeHeader = ctx.request.headers["content-type"] || "";
  const contentType = String(contentTypeHeader).toLowerCase();
  const isMultipart = /^multipart\/form-data/i.test(contentType);
  if (isMultipart) {
    return next();
  }
  return jsonBodyParser(ctx, next);
});

// Ensure uploads directory exists for local file storage mode
const uploadsDir = path.resolve(process.cwd(), "uploads");
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.info(`[startup] created uploads directory: ${uploadsDir}`);
  }
} catch (err) {
  console.warn("[startup] could not ensure uploads directory exists:", err);
}

// Serve uploaded files at /uploads when using local storage mode
app.use(mount("/uploads", serve(uploadsDir)));

// Register routes
app.use(authRoutes.routes());
app.use(profileRoutes.routes());
app.use(verificationRoutes.routes());
app.use(sessionRoutes.routes());
app.use(onboardingRoutes.routes());
app.use(preferencesRoutes.routes());

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "";

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");

    // Optional auto-migration (enabled with AUTO_MIGRATE_PASSWORDS=true)
    try {
      await migratePlaintextPasswordsOnStartup();
    } catch (err) {
      console.error("Auto-migration error:", err);
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });