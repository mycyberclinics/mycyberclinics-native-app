import Router from "koa-router";
import {
  createVerificationCode,
  verifyCode,
} from "../services/verificationService";

const router = new Router();

/**
 * Create/send a verification code for a given id and purpose.
 * Body: { id: string, purpose: string, debug?: boolean }
 *
 * Note: this endpoint returns the code in non-production environments or when debug=true.
 * This route uses the global body parser (koa-bodyparser), not koa-body().
 */
router.post("/api/verification/create", async (ctx) => {
  const body = ctx.request.body as { id?: string; purpose?: string; debug?: boolean } | undefined;
  const { id, purpose, debug } = body ?? {};

  if (!id || !purpose) {
    ctx.status = 400;
    ctx.body = { error: "Missing id or purpose" };
    return;
  }

  try {
    const { code, expirySeconds } = await createVerificationCode(id, purpose);

    // TODO: hook into SMS / email sending here.
    const response: any = { success: true, expirySeconds };

    if (process.env.NODE_ENV !== "production" || debug === true) {
      // Safe to return code for testing/dev only.
      response.code = code;
    }

    ctx.body = response;
  } catch (err: any) {
    console.error("create verification error:", err);
    ctx.status = 500;
    ctx.body = { error: "Internal error" };
  }
});

/**
 * Verify a code.
 * Body: { id: string, purpose: string, code: string }
 * Uses the global body parser (koa-bodyparser).
 */
router.post("/api/verification/verify", async (ctx) => {
  const body = ctx.request.body as { id?: string; purpose?: string; code?: string } | undefined;
  const { id, purpose, code } = body ?? {};

  if (!id || !purpose || !code) {
    ctx.status = 400;
    ctx.body = { error: "Missing id, purpose or code" };
    return;
  }

  try {
    const result = await verifyCode(id, purpose, code);

    if (result.status === "ok") {
      ctx.body = { success: true };
      return;
    }

    if (result.status === "expired") {
      ctx.status = 410;
      ctx.body = { success: false, error: "expired" };
      return;
    }

    if (result.status === "locked") {
      ctx.status = 423; // locked
      ctx.body = { success: false, error: "locked", retryAfterSeconds: result.retryAfterSeconds };
      return;
    }

    if (result.status === "failed") {
      ctx.status = 401;
      ctx.body = { success: false, error: "invalid", attempts: result.attempts };
      return;
    }

    if (result.status === "failed_locked") {
      ctx.status = 423;
      ctx.body = {
        success: false,
        error: "invalid_locked",
        attempts: result.attempts,
        retryAfterSeconds: result.retryAfterSeconds,
      };
      return;
    }

    ctx.status = 400;
    ctx.body = { success: false, error: "unknown" };
  } catch (err: any) {
    console.error("verification verify error:", err);
    ctx.status = 500;
    ctx.body = { error: "Internal error" };
  }
});

export default router;