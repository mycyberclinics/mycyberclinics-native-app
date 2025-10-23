import Router from "koa-router";
import admin from "../firebase";
import User from "../models/User";
import { sendCustomVerificationEmail } from "../services/sendgrid";
import { signupIpLimiter, resendEmailLimiter, resendIpLimiter, checkIpLimiter, consumeLimiter } from "../utils/redisRateLimiter";

const router = new Router();

function respondRateLimited(ctx: any, retryAfterSeconds: number, message: string) {
  ctx.set("Retry-After", String(retryAfterSeconds));
  ctx.status = 429;
  ctx.body = {
    error: "Too many requests",
    message,
    retryAfterSeconds,
  };
}

/**
 * POST /api/signup
 * Body: { email, password, displayName }
 *
 * Protected by IP rate limiting using Redis.
 */
router.post("/api/signup", async (ctx) => {
  const { email, password } = ctx.request.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    ctx.status = 400;
    ctx.body = { error: "Missing email or password" };
    return;
  }

  const ip = (ctx.request.ip || ctx.ip || ctx.headers["x-forwarded-for"] || "unknown").toString();
  const ipKey = `signup:ip:${ip}`;

  // Redis-backed IP rate limiting
  const ipCheck = await consumeLimiter(signupIpLimiter, ipKey);
  if (!ipCheck.allowed) {
    respondRateLimited(ctx, ipCheck.retryAfterSeconds ?? 3600, "Too many signup attempts from your IP. Please wait before trying again.");
    return;
  }

  // DB check for existing email
  try {
    const existingDbUser = await User.findOne({ email }).exec();
    if (existingDbUser) {
      try {
        const fbUser = await admin.auth().getUserByEmail(email);
        if (fbUser.emailVerified) {
          ctx.status = 409;
          ctx.body = { error: "Email already registered and verified" };
          return;
        } else {
          ctx.status = 409;
          ctx.body = {
            error:
              "An account exists with this email but is not verified. Please verify that account or request a verification resend.",
          };
          return;
        }
      } catch (err: any) {
        if (err.code === "auth/user-not-found") {
          ctx.status = 409;
          ctx.body = {
            error:
              "An account record exists in our system for this email. Please contact support to resolve this conflict.",
          };
          return;
        }
        console.error("Error checking Firebase user during signup (db-exists path):", err);
        ctx.status = 500;
        ctx.body = { error: "Server error checking existing account" };
        return;
      }
    }
  } catch (err) {
    console.error("DB lookup error during signup:", err);
    ctx.status = 500;
    ctx.body = { error: "Server error" };
    return;
  }

  // Firebase check
  try {
    const fbExisting = await admin.auth().getUserByEmail(email);
    if (fbExisting) {
      if (fbExisting.emailVerified) {
        ctx.status = 409;
        ctx.body = { error: "Email already in use" };
        return;
      } else {
        ctx.status = 409;
        ctx.body = {
          error:
            "An account with this email already exists but is unverified. Please verify that account or request a verification resend.",
        };
        return;
      }
    }
  } catch (err: any) {
    if (err.code !== "auth/user-not-found") {
      console.error("Firebase lookup error during signup:", err);
      ctx.status = 500;
      ctx.body = { error: "Error checking existing account" };
      return;
    }
  }

  // Create Firebase user
  let createdFbUser;
  try {
    createdFbUser = await admin.auth().createUser({
      email,
      password,
    });
  } catch (err: any) {
    console.error("Firebase createUser error:", err);
    if (err.code === "auth/email-already-exists" || (err.message && err.message.includes("email already exists"))) {
      ctx.status = 409;
      ctx.body = { error: "Email already in use" };
      return;
    }
    ctx.status = 500;
    ctx.body = { error: "Could not create user in Firebase" };
    return;
  }

  // Try to send verification email via SendGrid using our service.
  // If SendGrid fails for a reason that we can handle, return a clear error to the client.
  let sendOk = false;
  let fallbackVerificationLink: string | null = null;

  try {
    await sendCustomVerificationEmail(email);
    sendOk = true;
  } catch (sendErr: any) {
    console.error("SendGrid send error (signup):", sendErr);

    // If the error is "unauthorized-continue-uri", tell operator/developer to add the domain to Firebase Authorized Domains.
    if (sendErr.code === "unauthorized-continue-uri" || (sendErr.message && sendErr.message.includes("Domain not authorized"))) {
      // Roll back the firebase user because we could not send verification email
      try {
        await admin.auth().deleteUser(createdFbUser.uid);
      } catch (delErr) {
        console.error("Failed to rollback Firebase user after unauthorized-continue-uri:", delErr);
      }
      ctx.status = 400;
      ctx.body = {
        error: "unauthorized_continue_url",
        message:
          'Firebase rejected the verification continue URL. Add your frontend domain (e.g. "mycyberclinics.com" or "localhost:3000") to Firebase Console → Authentication → Authorized domains. The server rolled back account creation to avoid orphaned accounts.',
      };
      return;
    }

    // If Firebase is rate limiting link generation, surface a 429-like error.
    if (sendErr.code === "too-many-attempts" || (sendErr.message && sendErr.message.includes("TOO_MANY_ATTEMPTS_TRY_LATER"))) {
      try {
        await admin.auth().deleteUser(createdFbUser.uid);
      } catch (delErr) {
        console.error("Failed to rollback Firebase user after rate limit:", delErr);
      }
      ctx.status = 429;
      ctx.body = {
        error: "too_many_attempts",
        message: "Firebase is temporarily rate-limiting verification link generation. Wait a few minutes before trying again.",
      };
      return;
    }

    // For other errors we attempt to generate a verification link as a fallback only (but be careful with TOO_MANY errors)
    try {
      fallbackVerificationLink = await admin.auth().generateEmailVerificationLink(email);
    } catch (genErr: any) {
      console.error("Error generating email verification link fallback:", genErr);
      // If fallback generation is not possible (rate limit, unauthorized continue URL, etc) rollback and return a helpful message
      try {
        await admin.auth().deleteUser(createdFbUser.uid);
      } catch (delErr) {
        console.error("Failed to rollback Firebase user after fallback failure:", delErr);
      }

      const rawCode = genErr?.errorInfo?.code || genErr?.code || "";
      if (rawCode === "auth/unauthorized-continue-uri") {
        ctx.status = 400;
        ctx.body = {
          error: "unauthorized_continue_url",
          message:
            'Firebase rejected the verification continue URL when generating a fallback link. Add your frontend domain (e.g. "mycyberclinics.com" or "localhost:3000") to Firebase Console → Authentication → Authorized domains.',
        };
        return;
      }

      if (String(genErr?.errorInfo?.message || genErr?.message || "").includes("TOO_MANY_ATTEMPTS_TRY_LATER")) {
        ctx.status = 429;
        ctx.body = {
          error: "too_many_attempts",
          message: "Firebase is temporarily rate-limiting verification link generation. Wait a few minutes before trying again.",
        };
        return;
      }

      ctx.status = 500;
      ctx.body = { error: "Could not send verification email or generate fallback link" };
      return;
    }
  }

  // Create DB user
  try {
    const dbUser = await User.create({
      uid: createdFbUser.uid,
      email,
      role: "patient",
    });

    ctx.status = 201;
    const responseBody: any = {
      success: true,
      message: "User created. Please verify your email.",
      user: {
        uid: dbUser.uid,
        email: dbUser.email,
      },
    };

    // Include fallback link in non-production for local testing or when sending failed and we generated one.
    if (process.env.NODE_ENV !== "production" && fallbackVerificationLink) {
      responseBody.verificationLink = fallbackVerificationLink;
    } else if (!sendOk && fallbackVerificationLink) {
      // production but email send failed and fallback was generated (support only)
      responseBody.warning = "Failed to send via SendGrid; fallback link included for support use.";
      responseBody.verificationLink = fallbackVerificationLink;
    }

    ctx.body = responseBody;
    return;
  } catch (err: any) {
    console.error("DB create error during signup:", err);
    try {
      await admin.auth().deleteUser(createdFbUser.uid);
    } catch (delErr) {
      console.error("Failed to rollback Firebase user after DB error:", delErr);
    }

    if (err.code === 11000) {
      ctx.status = 409;
      ctx.body = { error: "An account with this email already exists" };
      return;
    }

    ctx.status = 500;
    ctx.body = { error: "Could not create user record" };
    return;
  }
});

/**
 * POST /api/check-email-verification
 * Body: { email }
 *
 * Protected lightly by IP using Redis.
 */
router.post("/api/check-email-verification", async (ctx) => {
  const { email } = ctx.request.body as { email?: string };
  if (!email) {
    ctx.status = 400;
    ctx.body = { error: "Missing email" };
    return;
  }

  const ip = (ctx.request.ip || ctx.ip || ctx.headers["x-forwarded-for"] || "unknown").toString();
  const ipKey = `check:ip:${ip}`;

  const ipCheck = await consumeLimiter(checkIpLimiter, ipKey);
  if (!ipCheck.allowed) {
    respondRateLimited(ctx, ipCheck.retryAfterSeconds ?? 3600, "Too many verification checks from your IP. Please wait before retrying.");
    return;
  }

  try {
    const fbUser = await admin.auth().getUserByEmail(email);
    ctx.body = { emailVerified: !!fbUser.emailVerified, uid: fbUser.uid };
  } catch (err: any) {
    if (err.code === "auth/user-not-found") {
      ctx.status = 404;
      ctx.body = { error: "No account with that email" };
      return;
    }
    console.error("Error checking email verification:", err);
    ctx.status = 500;
    ctx.body = { error: "Could not check verification status" };
  }
});

/**
 * POST /api/resend-verification
 * Body: { email }
 *
 * Rate-limited by email and IP using Redis-backed limiters.
 */
router.post("/api/resend-verification", async (ctx) => {
  const { email } = ctx.request.body as { email?: string };
  if (!email) {
    ctx.status = 400;
    ctx.body = { error: "Missing email" };
    return;
  }

  const ip = (ctx.request.ip || ctx.ip || ctx.headers["x-forwarded-for"] || "unknown").toString();
  const emailKey = `resend:email:${email.toLowerCase()}`;
  const ipKey = `resend:ip:${ip}`;

  const emailCheck = await consumeLimiter(resendEmailLimiter, emailKey);
  if (!emailCheck.allowed) {
    respondRateLimited(ctx, emailCheck.retryAfterSeconds ?? 3600, "Too many verification emails requested for this address. Please wait before requesting another.");
    return;
  }

  const ipCheck = await consumeLimiter(resendIpLimiter, ipKey);
  if (!ipCheck.allowed) {
    respondRateLimited(ctx, ipCheck.retryAfterSeconds ?? 3600, "Too many verification requests from your IP. Please wait before trying again.");
    return;
  }

  try {
    const fbUser = await admin.auth().getUserByEmail(email);
    if (!fbUser) {
      ctx.status = 404;
      ctx.body = { error: "No account with that email" };
      return;
    }

    if (fbUser.emailVerified) {
      ctx.status = 400;
      ctx.body = { error: "Email already verified" };
      return;
    }

    // Prefer sending via SendGrid dynamic template. If send fails, generate fallback link and (in non-prod) return it.
    try {
      await sendCustomVerificationEmail(email, fbUser.displayName || undefined);
      ctx.body = {
        success: true,
        message: "Verification email sent.",
      };
      return;
    } catch (sendErr: any) {
      console.error("SendGrid send error (resend):", sendErr);
      if (sendErr.code === "unauthorized-continue-uri") {
        ctx.status = 400;
        ctx.body = {
          error: "unauthorized_continue_url",
          message:
            'Firebase rejected the verification continue URL. Add your frontend domain (e.g. "mycyberclinics.com" or "localhost:3000") to Firebase Console → Authentication → Authorized domains.',
        };
        return;
      }
      if (sendErr.code === "too-many-attempts") {
        ctx.status = 429;
        ctx.body = {
          error: "too_many_attempts",
          message: "Firebase is temporarily rate-limiting verification link generation. Wait a few minutes before trying again.",
        };
        return;
      }

      // Fallback link generation attempt
      try {
        const verificationLink = await admin.auth().generateEmailVerificationLink(email);
        if (process.env.NODE_ENV !== "production") {
          ctx.body = {
            success: true,
            message: "Verification link generated (fallback).",
            verificationLink,
          };
        } else {
          ctx.body = {
            success: true,
            message: "Failed to send via SendGrid. A verification link was generated for support use.",
            verificationLink,
            warning: "Failed to send via SendGrid. Contact support.",
          };
        }
        return;
      } catch (genErr: any) {
        console.error("Could not generate fallback verification link:", genErr);
        const rawCode = genErr?.errorInfo?.code || genErr?.code || "";
        if (rawCode === "auth/unauthorized-continue-uri") {
          ctx.status = 400;
          ctx.body = {
            error: "unauthorized_continue_url",
            message:
              'Firebase rejected the verification continue URL when generating a fallback link. Add your frontend domain (e.g. "mycyberclinics.com" or "localhost:3000") to Firebase Console → Authentication → Authorized domains.',
          };
          return;
        }
        if (String(genErr?.errorInfo?.message || genErr?.message || "").includes("TOO_MANY_ATTEMPTS_TRY_LATER")) {
          ctx.status = 429;
          ctx.body = {
            error: "too_many_attempts",
            message: "Firebase is temporarily rate-limiting verification link generation. Wait a few minutes before trying again.",
          };
          return;
        }

        ctx.status = 500;
        ctx.body = { error: "Could not generate verification link" };
        return;
      }
    }
  } catch (err: any) {
    if (err.code === "auth/user-not-found") {
      ctx.status = 404;
      ctx.body = { error: "No account with that email" };
      return;
    }
    console.error("Resend verification error:", err);
    ctx.status = 500;
    ctx.body = { error: "Could not process resend request" };
  }
});

export default router;