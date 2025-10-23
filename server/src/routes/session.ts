import Router from "koa-router";
import admin from "../firebase";
import { redisClient } from "../utils/redisRateLimiter";
import User from "../models/User";
import { v4 as uuidv4 } from "uuid";

const router = new Router();

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";
const TTL_SECONDS = Number(process.env.SESSION_TTL_SECONDS) || 5 * 24 * 60 * 60; // 5 days
const COOKIE_SECURE = process.env.NODE_ENV === "production";
const USER_SESSIONS_SET = (uid: string) => `user_sessions:${uid}`;

/**
 * POST /api/auth/session
 * Body: { idToken: string }
 * Uses the global body parser (koa-bodyparser). Do NOT use koa-body here to avoid double-reading the stream.
 */
router.post("/api/auth/session", async (ctx) => {
  const body = ctx.request.body as { idToken?: string } | undefined;
  const idToken = body?.idToken;

  if (!idToken) {
    ctx.status = 400;
    ctx.body = { error: "Missing idToken" };
    return;
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;
    const emailVerified = Boolean((decoded as any).email_verified || (decoded as any).emailVerified);

    // Load onboarding status and preferences from DB (source-of-truth)
    const dbUser = await User.findOne({ uid }).lean().exec();
    const onboardingCompleted = Boolean(dbUser?.onboardingCompleted);
    const preferences = dbUser?.preferences ?? {};

    const sessionData = { uid, emailVerified, onboardingCompleted, preferences };

    const sessionId = uuidv4();
    const sessionKey = `session:${sessionId}`;

    await redisClient.set(sessionKey, JSON.stringify(sessionData), "EX", TTL_SECONDS);
    await redisClient.sadd(USER_SESSIONS_SET(uid), sessionId);
    await redisClient.expire(USER_SESSIONS_SET(uid), TTL_SECONDS);

    ctx.cookies.set(COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: "lax",
      maxAge: TTL_SECONDS * 1000,
      path: "/",
    });

    ctx.body = { success: true };
  } catch (err: any) {
    console.error("create session error:", err);
    ctx.status = 401;
    ctx.body = { error: "Invalid idToken" };
  }
});

/**
 * GET /api/me/status
 * Return session-based status (cookie) or fallback to Authorization Bearer idToken.
 */
router.get("/api/me/status", async (ctx) => {
  const cookie = ctx.cookies.get(COOKIE_NAME);
  const authHeader = ctx.headers.authorization || ctx.request.header.authorization;
  try {
    if (cookie) {
      const sessionKey = `session:${cookie}`;
      const raw = await redisClient.get(sessionKey);
      if (!raw) {
        ctx.status = 401;
        ctx.body = { error: "Session not found or expired" };
        return;
      }
      const data = JSON.parse(raw);
      ctx.body = {
        verified: Boolean(data.emailVerified),
        onboarded: Boolean(data.onboardingCompleted),
      };
      return;
    }

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const idToken = authHeader.split(" ")[1];
      const decoded = await admin.auth().verifyIdToken(idToken);
      const uid = decoded.uid;
      const emailVerified = Boolean((decoded as any).email_verified || (decoded as any).emailVerified);
      const dbUser = await User.findOne({ uid }).lean().exec();
      const onboardingCompleted = Boolean(dbUser?.onboardingCompleted);
      ctx.body = { verified: emailVerified, onboarded: onboardingCompleted };
      return;
    }

    ctx.status = 401;
    ctx.body = { error: "No session or idToken provided" };
  } catch (err: any) {
    console.error("me/status error:", err);
    ctx.status = 500;
    ctx.body = { error: "Internal error" };
  }
});

/**
 * POST /api/auth/logout
 */
router.post("/api/auth/logout", async (ctx) => {
  const cookie = ctx.cookies.get(COOKIE_NAME);
  if (!cookie) {
    ctx.body = { success: true };
    return;
  }

  try {
    const sessionKey = `session:${cookie}`;
    const raw = await redisClient.get(sessionKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      const uid = parsed.uid;
      await redisClient.srem(USER_SESSIONS_SET(uid), cookie);
    }
    await redisClient.del(sessionKey);
    ctx.cookies.set(COOKIE_NAME, "", { httpOnly: true, maxAge: 0, path: "/" });
    ctx.body = { success: true };
  } catch (err: any) {
    console.error("logout error:", err);
    ctx.status = 500;
    ctx.body = { error: "Internal error" };
  }
});

export default router;