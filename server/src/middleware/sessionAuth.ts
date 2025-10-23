import { Context, Next } from "koa";
import { redisClient } from "../utils/redisRateLimiter";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";

/**
 * sessionAuth middleware:
 * - reads HttpOnly cookie (session id)
 * - loads session data from Redis
 * - attaches ctx.state.session = { uid, emailVerified, onboardingCompleted }
 * - if no session found responds 401
 *
 * Use this middleware on routes that rely on server session.
 */
export default async function sessionAuth(ctx: Context, next: Next) {
  const sid = ctx.cookies.get(COOKIE_NAME);
  if (!sid) {
    ctx.status = 401;
    ctx.body = { error: "No session cookie" };
    return;
  }

  try {
    const raw = await redisClient.get(`session:${sid}`);
    if (!raw) {
      ctx.status = 401;
      ctx.body = { error: "Session expired or invalid" };
      return;
    }

    const session = JSON.parse(raw);
    ctx.state.session = session; // { uid, emailVerified, onboardingCompleted }
    ctx.state.sessionId = sid;
    await next();
  } catch (err: any) {
    console.error("sessionAuth error:", err);
    ctx.status = 500;
    ctx.body = { error: "Internal error" };
  }
}