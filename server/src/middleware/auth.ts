import { Context, Next } from "koa";
import admin from "../firebase";
import User from "../models/User";

export default async function firebaseAuth(ctx: Context, next: Next) {
  const authHeader = ctx.headers.authorization || ctx.request.header.authorization;

  if (!authHeader) {
    ctx.status = 401;
    ctx.body = { error: "No Authorization header" };
    return;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    ctx.status = 401;
    ctx.body = {
      error: "Invalid Authorization header format. Expected: 'Bearer <token>'",
    };
    return;
  }

  const idToken = parts[1];

  // Verify token first; do NOT wrap await next() in the same catch that handles token errors.
  let decoded: any;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch (err) {
    console.error("Auth verify error:", err);
    ctx.status = 401;
    ctx.body = { error: "Invalid or expired token" };
    return;
  }

  const uid = decoded.uid;
  const email = decoded.email ?? "";
  const displayName = (decoded as any).name ?? (decoded as any).displayName;

  // Prevent duplicate registrations at the DB level:
  // If a DB user already exists with this email but a different uid, block the request.
  if (email) {
    try {
      const existing = await User.findOne({ email }).exec();
      if (existing && existing.uid !== uid) {
        ctx.status = 409;
        ctx.body = {
          error:
            "An account already exists with this email registered to a different user. If this is your account, sign in using the original provider or contact support.",
        };
        return;
      }
    } catch (err: any) {
      console.error("DB lookup error in auth middleware:", err);
      ctx.status = 500;
      ctx.body = { error: "Internal error" };
      return;
    }
  }

  const update: any = {};
  if (displayName) update.displayName = displayName;

  const setOnInsert: any = { role: "patient", uid };
  if (email) setOnInsert.email = email;

  let dbUser;
  try {
    dbUser = await User.findOneAndUpdate(
      { uid },
      {
        $set: update,
        $setOnInsert: setOnInsert,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();
  } catch (err: any) {
    console.error("DB upsert error in auth middleware:", err);
    ctx.status = 500;
    ctx.body = { error: "Internal error" };
    return;
  }

  ctx.state.firebaseUser = decoded;
  ctx.state.user = dbUser;

  await next();
}