import Router from "koa-router";
import admin from "../firebase";
import User from "../models/User";

const router = new Router();

// Signup: create user in Firebase and send verification email
router.post("/api/signup", async (ctx) => {
  const { email, password, displayName } = ctx.request.body as Record<
    string,
    string
  >;

  if (!email || !password) {
    ctx.status = 400;
    ctx.body = { error: "Email and password required" };
    return;
  }

  try {
    // Create Firebase user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
    });

    // Send email verification link
    const link = await admin.auth().generateEmailVerificationLink(email);

    // Create user in MongoDB
    await User.create({
      uid: userRecord.uid,
      email,
      displayName,
      role: "patient",
    });

    ctx.body = {
      message: "User created. Please verify your email.",
      verificationLink: link,
    };
  } catch (err: any) {
    ctx.status = 400;
    ctx.body = { error: err.message || "Signup failed" };
  }
});

// Check email verification
router.post("/api/check-email-verification", async (ctx) => {
  const { email } = ctx.request.body as Record<string, string>;
  if (!email) {
    ctx.status = 400;
    ctx.body = { error: "Email required" };
    return;
  }

  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    ctx.body = { emailVerified: userRecord.emailVerified };
  } catch (err: any) {
    ctx.status = 400;
    ctx.body = { error: err.message || "Check failed" };
  }
});

export default router;