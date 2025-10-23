import admin from "../firebase";
import sgMail from "@sendgrid/mail";
import { redisClient } from "../utils/redisRateLimiter";
import juice from "juice";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_TEMPLATE_ID_VERIFY_EMAIL = process.env.SENDGRID_TEMPLATE_ID_VERIFY_EMAIL;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || "My Cyber Clinics";
const FRONTEND_VERIFY_URL = process.env.FRONTEND_VERIFY_URL || "https://mycyberclinics.com";
const VERIFY_LINK_CACHE_TTL = Number(process.env.VERIFY_LINK_CACHE_TTL_SECONDS) || 15 * 60;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

/** Minimal HTML escape for user-controlled values */
function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Send verification email using SendGrid dynamic template (preferred).
 * If SendGrid rejects the template_id, fallback to a plain subject+HTML send.
 *
 * NOTE: Do NOT re-encode the Firebase verification link here — it is already correctly encoded.
 * The template should use triple-brace {{{verify_url}}} for href insertion.
 */
export async function sendCustomVerificationEmail(userEmail: string, displayName?: string) {
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
    throw new Error(
      "Missing SendGrid configuration. Ensure SENDGRID_API_KEY and SENDGRID_FROM_EMAIL are set."
    );
  }

  const emailKey = `verify:link:${userEmail.toLowerCase()}`;

  // Try cached link first
  try {
    const cached = await redisClient.get(emailKey);
    if (cached) {
      return await sendEmailWithTemplateOrFallback(cached, userEmail, displayName);
    }
  } catch (redisErr: any) {
    console.warn("[sendgrid] Redis read error (non-fatal):", redisErr && (redisErr.message || redisErr));
  }

  // Generate a fresh link (may be rate-limited by Firebase)
  const actionCodeSettings = {
    url: FRONTEND_VERIFY_URL,
    handleCodeInApp: false,
  };

  let verifyLink: string;
  try {
    verifyLink = await admin.auth().generateEmailVerificationLink(userEmail, actionCodeSettings);
  } catch (err: any) {
    const code = err?.errorInfo?.code || err?.code || "";
    const rawMsg = String(err?.errorInfo?.message || err?.message || "");
    if (code === "auth/unauthorized-continue-uri" || rawMsg.toLowerCase().includes("domain not allowlisted")) {
      const e: any = new Error(
        `Firebase rejected the verification continue URL. Add the domain of "${actionCodeSettings.url}" to Firebase Console → Authentication → Authorized domains.`
      );
      e.code = "unauthorized-continue-uri";
      throw e;
    }
    if (rawMsg.includes("TOO_MANY_ATTEMPTS_TRY_LATER") || code === "auth/internal-error") {
      const e: any = new Error(
        "Firebase is rate-limiting verification link generation (TOO_MANY_ATTEMPTS_TRY_LATER). Wait a short while before retrying."
      );
      e.code = "too-many-attempts";
      throw e;
    }
    throw err;
  }

  // Cache the link (best-effort)
  try {
    await redisClient.set(emailKey, verifyLink, "EX", VERIFY_LINK_CACHE_TTL);
  } catch (redisErr: any) {
    console.warn("[sendgrid] Redis set error (non-fatal):", redisErr && (redisErr.message || redisErr));
  }

  return await sendEmailWithTemplateOrFallback(verifyLink, userEmail, displayName);
}

/**
 * Try to send using dynamic template. If SendGrid explicitly rejects the template_id,
 * retry once with a plain subject + HTML body.
 *
 * IMPORTANT: do NOT encode or escape verifyLink here; send it raw and use triple-braces
 * in the SendGrid template: href="{{{verify_url}}}"
 */
async function sendEmailWithTemplateOrFallback(verifyLink: string, userEmail: string, displayName?: string) {
  const safeName = escapeHtml(displayName || "there");
  const safeVerifyLink = verifyLink;

  // If we have a template id configured, try to send with it first
  if (SENDGRID_TEMPLATE_ID_VERIFY_EMAIL) {
    const templateMsg: any = {
      to: userEmail,
      from: { email: SENDGRID_FROM_EMAIL!, name: SENDGRID_FROM_NAME },
      templateId: SENDGRID_TEMPLATE_ID_VERIFY_EMAIL,
      dynamic_template_data: {
        name: safeName,
        verify_url: safeVerifyLink,
      },
    };

    try {
      await sendWithRetries(templateMsg);
      return { sent: true, verifyLink };
    } catch (err: any) {
      const sgBody = err?.details || err?.response?.body;
      const hasTemplateIdError =
        Array.isArray(sgBody?.errors) && sgBody.errors.some((e: any) => String(e.field).toLowerCase().includes("template_id"));

      console.error("[sendgrid] template send failed:", err && (err.message || err));

      if (!hasTemplateIdError) {
        throw err;
      }

      console.warn("[sendgrid] Falling back to plain email send due to invalid template_id.");
    }
  }

  // Fallback: send plain HTML + subject (covers cases where template_id is invalid)
  // NOTE: we inline CSS here using juice to improve rendering across clients.
  const rawHtml = `
    <html>
    <head>
      <style>
        /* example CSS — replace with your template's CSS rules */
        .container { width: 100%; font-family: Arial, Helvetica, sans-serif; }
        .cta { background-color:#007bff;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px; display:inline-block; }
        .content { max-width:600px;margin:0 auto;padding:20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="content">
          <h2>Welcome, ${safeName}!</h2>
          <p>Thanks for signing up. Please verify your email address by clicking the button below:</p>
          <p><a class="cta" href="${safeVerifyLink}">Verify Email</a></p>
          <p>If you didn’t create an account, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Inline the styles for better client support
  const inlinedHtml = juice(rawHtml);

  const fallbackMsg: any = {
    to: userEmail,
    from: { email: SENDGRID_FROM_EMAIL!, name: SENDGRID_FROM_NAME },
    subject: "Verify your My Cyber Clinics email",
    html: inlinedHtml,
    text: `Welcome ${displayName || "there"}! Verify your email: ${verifyLink}`,
  };

  await sendWithRetries(fallbackMsg);
  return { sent: true, verifyLink };
}

/**
 * Sendgrid send with a few retries for transient errors.
 * Throws a detailed error for 4xx responses including SendGrid body.
 * Logs SendGrid success responses so you can see sends accepted by SendGrid.
 */
async function sendWithRetries(msg: any) {
  const maxAttempts = 3;
  let attempt = 0;
  let lastErr: any = null;

  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      const resp: any = await sgMail.send(msg);
      const respObj = Array.isArray(resp) ? resp[0] : resp;
      const status = respObj?.statusCode ?? respObj?.status ?? "unknown";
      const headers = respObj?.headers;
      const messageId = headers?.["x-message-id"] || headers?.["X-Message-Id"] || headers?.["x-request-id"] || headers?.["X-Request-Id"];
      console.info(`[sendgrid] send accepted for ${Array.isArray(msg.to) ? msg.to.map((t:any)=>t.email||t).join(",") : (msg.to?.email || msg.to)} status=${status} messageId=${messageId ?? "n/a"}`);
      return;
    } catch (err: any) {
      lastErr = err;
      const sgRespBody = err?.response?.body;
      if (sgRespBody && Array.isArray(sgRespBody.errors) && sgRespBody.errors.length > 0) {
        const sgMsgs = sgRespBody.errors.map((e: any) => {
          const field = e.field ? ` (field: ${String(e.field)})` : "";
          const msgText = e.message ? String(e.message) : JSON.stringify(e);
          return `${msgText}${field}`;
        });
        const joined = sgMsgs.join("; ");
        console.error("[sendgrid] SendGrid responded with errors:", JSON.stringify(sgRespBody, null, 2));
        const newErr: any = new Error(`SendGrid Bad Request: ${joined}`);
        newErr.code = err?.code || 400;
        newErr.details = sgRespBody;
        throw newErr;
      }
      const status =
        typeof err?.code === "number" ? err.code : (err?.response?.statusCode as number) || 0;
      if (status >= 400 && status < 500) {
        console.error("[sendgrid] SendGrid 4xx error (no structured body):", err?.response?.body || err);
        throw err;
      }
      const backoffMs = Math.min(1000 * 2 ** (attempt - 1), 5000);
      await new Promise((res) => setTimeout(res, backoffMs));
      continue;
    }
  }
  throw lastErr || new Error("SendGrid send failed after retries");
}