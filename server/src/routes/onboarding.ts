import Router from "koa-router";
import firebaseAuth from "../middleware/auth"; // verifies idToken and sets ctx.state.user
import User from "../models/User";
import { redisClient } from "../utils/redisRateLimiter";

const router = new Router();

/**
 * POST /api/user/onboarding
 * Body: { completed: boolean }
 * Auth: firebaseAuth (user must be authenticated via Firebase idToken)
 *
 * Updates DB, and updates server sessions stored in Redis for that user
 * so cookies already issued reflect the updated onboardingCompleted value.
 *
 * IMPORTANT: This uses the global body parser (koa-bodyparser). Do NOT call koaBody() here.
 */
router.post("/api/user/onboarding", firebaseAuth, async (ctx) => {
  const body = ctx.request.body as { completed?: boolean } | undefined;
  const completed = body?.completed;

  if (typeof completed !== "boolean") {
    ctx.status = 400;
    ctx.body = { error: "Missing or invalid 'completed' boolean" };
    return;
  }

  const dbUser = ctx.state.user as any; // from firebaseAuth: upserted db user
  const uid = dbUser.uid;

  try {
    await User.updateOne({ uid }, { $set: { onboardingCompleted: completed } }).exec();

    // Update all active sessions for this user in Redis so server-side session reflects new state.
    const userSessionsKey = `user_sessions:${uid}`;
    const sessionIds = await redisClient.smembers(userSessionsKey);

    const tasks = sessionIds.map(async (sid) => {
      const key = `session:${sid}`;
      const raw = await redisClient.get(key);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        parsed.onboardingCompleted = completed;
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

    ctx.body = { success: true };
  } catch (err: any) {
    console.error("onboarding update error:", err);
    ctx.status = 500;
    ctx.body = { error: "Internal error" };
  }
});

export default router;