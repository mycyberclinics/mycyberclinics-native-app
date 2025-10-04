import { getAuth } from "firebase-admin/auth";
import { Context, Next } from "koa";

export default async function firebaseAuth(ctx: Context, next: Next) {
  const authHeader = ctx.headers.authorization;
  if (!authHeader) {
    ctx.status = 401;
    ctx.body = { error: "No Authorization header" };
    return;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = await getAuth().verifyIdToken(token);
    ctx.state.user = decoded;
    await next();
  } catch (e) {
    ctx.status = 401;
    ctx.body = { error: "Invalid token" };
  }
}