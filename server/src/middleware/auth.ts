import { Context, Next } from "koa";
import admin from "../firebase";
import User from "../models/User";

export default async function firebaseAuth(ctx: Context, next: Next) {
  console.log('[AUTH] middleware called');
  const authHeader = ctx.headers.authorization;
  console.log('[AUTH] Header:', authHeader);

  if (!authHeader) {
    ctx.status = 401;
    ctx.body = { error: "No Authorization header" }; 
    return;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    ctx.status = 401;
    ctx.body = { error: "Invalid Authorization header format. Expected: \'Bearer <token>\'" };
    return;
  }

  const idToken = parts[1];

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    console.log('[AUTH] Decoded token:', decoded);

    const uid = decoded.uid;
    const email = decoded.email ?? "";
    const displayName = (decoded as any).name ?? (decoded as any).displayName;

    const update: any = {};
    if (displayName) update.displayName = displayName;

    const setOnInsert: any = { role: "patient", uid };
    if (email) setOnInsert.email = email;

    console.log('[AUTH] Upsert query:', { uid, email, displayName, update, setOnInsert });

    const dbUser = await User.findOneAndUpdate(
      { uid },
      {
        $set: update,
        $setOnInsert: setOnInsert,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();

    console.log('[AUTH] Upserted user:', dbUser);

    ctx.state.firebaseUser = decoded;
    ctx.state.user = dbUser;

    await next();
  } catch (err) {
    console.error('[AUTH] Error:', err);
    ctx.status = 401;
    ctx.body = { error: "Invalid or expired token" };
  }
}