import { getAuth } from "firebase-admin/auth";
import { Context, Next } from "koa";
import User from "../models/User";

/**
 * Firebase authentication middleware:
 * - expects Authorization: Bearer <idToken>
 * - verifies ID token with Firebase Admin
 * - upserts (create/update) a User document in MongoDB with uid and email
 * - attaches ctx.state.firebaseUser (decoded token) and ctx.state.user (DB user)
 */
export default async function firebaseAuth(ctx: Context, next: Next) {
  const authHeader = ctx.headers.authorization;
  if (!authHeader) {
    ctx.status = 401;
    ctx.body = { error: "No Authorization header" };
    return;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    ctx.status = 401;
    ctx.body = { error: "Invalid Authorization header format. Expected: 'Bearer <token>'" };
    return;
  }

  const idToken = parts[1];

  try {
    const decoded = await getAuth().verifyIdToken(idToken);

    const uid = decoded.uid;
    const email = decoded.email ?? "";

    // Upsert user into MongoDB (keeps a local user record)
    const dbUser = await User.findOneAndUpdate(
      { uid },
      { $set: { email }, $setOnInsert: { role: "patient" } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();

    ctx.state.firebaseUser = decoded;
    ctx.state.user = dbUser;

    await next();
  } catch (err) {
    console.error("Auth verification failed:", err);
    ctx.status = 401;
    ctx.body = { error: "Invalid or expired token" };
  }
}