import Router from "koa-router";
import firebaseAuth from "../middleware/auth";
import User, { IUser } from "../models/User";
import { redisClient } from "../utils/redisRateLimiter";

const router = new Router();

/**
 * Validation helpers
 */
function isValidCommunicationMethod(val: any) {
  return ["email", "sms", "push"].includes(val);
}

function isValidLanguage(val: any) {
  return typeof val === "string" && /^[a-z]{2}$/i.test(val);
}

/**
 * POST /api/user/preferences
 * Body: { communicationMethod?, language?, timezone?, notificationsEnabled?, theme? }
 * Auth: firebaseAuth (Authorization: Bearer <idToken>)
 *
 * Updates persisted preferences in MongoDB and updates active sessions in Redis
 * so cookie sessions reflect the latest preferences across devices.
 */
router.post("/api/user/preferences", firebaseAuth, async (ctx) => {
  const body = ctx.request.body as Record<string, any> | undefined;
  if (!body) {
    ctx.status = 400;
    ctx.body = { error: "Missing body" };
    return;
  }

  const {
    communicationMethod,
    language,
    timezone,
    notificationsEnabled,
    theme,
  } = body;

  // Validate provided fields (only validate fields that are present)
  const update: any = {};
  const prefsUpdate: any = {};

  if (communicationMethod !== undefined) {
    if (!isValidCommunicationMethod(communicationMethod)) {
      ctx.status = 400;
      ctx.body = { error: "Invalid communicationMethod. Allowed: email | sms | push" };
      return;
    }
    prefsUpdate.communicationMethod = communicationMethod;
  }

  if (language !== undefined) {
    if (!isValidLanguage(language)) {
      ctx.status = 400;
      ctx.body = { error: "Invalid language. Expected ISO 639-1 code (e.g. 'en')" };
      return;
    }
    prefsUpdate.language = language.toLowerCase();
  }

  if (timezone !== undefined) {
    if (typeof timezone !== "string") {
      ctx.status = 400;
      ctx.body = { error: "Invalid timezone" };
      return;
    }
    prefsUpdate.timezone = timezone;
  }

  if (notificationsEnabled !== undefined) {
    if (typeof notificationsEnabled !== "boolean") {
      ctx.status = 400;
      ctx.body = { error: "Invalid notificationsEnabled. Expected boolean" };
      return;
    }
    prefsUpdate.notificationsEnabled = notificationsEnabled;
  }

  if (theme !== undefined) {
    if (typeof theme !== "string") {
      ctx.status = 400;
      ctx.body = { error: "Invalid theme" };
      return;
    }
    prefsUpdate.theme = theme;
  }

  if (Object.keys(prefsUpdate).length === 0) {
    ctx.status = 400;
    ctx.body = { error: "No valid preference fields provided" };
    return;
  }

  const dbUser = ctx.state.user as IUser;
  const uid = dbUser.uid;

  try {
    // Merge with existing preferences atomically
    const updatedUser = await User.findOneAndUpdate(
      { uid },
      { $set: Object.keys(prefsUpdate).reduce((acc: any, k) => ({ ...acc, [`preferences.${k}`]: prefsUpdate[k] }), {}) },
      { new: true }
    ).exec();

    // Update active sessions for user in Redis so cookie sessions remain in sync
    const userSessionsKey = `user_sessions:${uid}`;
    const sessionIds = await redisClient.smembers(userSessionsKey);

    const tasks = sessionIds.map(async (sid) => {
      const key = `session:${sid}`;
      const raw = await redisClient.get(key);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        parsed.preferences = updatedUser?.preferences ?? parsed.preferences ?? {};
        const ttl = await redisClient.ttl(key);
        if (ttl > 0) {
          await redisClient.set(key, JSON.stringify(parsed), "EX", ttl);
        } else {
          const fallbackTtl = Number(process.env.SESSION_TTL_SECONDS) || 5 * 24 * 60 * 60;
          await redisClient.set(key, JSON.stringify(parsed), "EX", fallbackTtl);
        }
      } catch (e) {
        console.warn(`Failed to update session ${sid} for user ${uid}:`, e);
      }
    });

    await Promise.all(tasks);

    ctx.body = { success: true, preferences: updatedUser?.preferences ?? {} };
  } catch (err: any) {
    console.error("preferences update error:", err);
    ctx.status = 500;
    ctx.body = { error: "Internal error" };
  }
});

/**
 * GET /api/user/preferences
 * Auth: firebaseAuth
 */
router.get("/api/user/preferences", firebaseAuth, async (ctx) => {
  const dbUser = ctx.state.user as IUser;
  ctx.body = { preferences: dbUser.preferences ?? {} };
});

export default router;