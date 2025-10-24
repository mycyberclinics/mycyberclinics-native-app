import crypto from "crypto";
import { redisClient } from "../utils/redisRateLimiter";

export type VerificationResult =
  | { status: "ok" }
  | { status: "expired" }
  | { status: "locked"; retryAfterSeconds: number }
  | { status: "failed"; attempts: number }
  | { status: "failed_locked"; attempts: number; retryAfterSeconds: number };

const DEFAULTS = {
  codeLength: 6,
  expirySeconds: 60 * 10, // 10 minutes
  maxAttempts: 5,
  lockoutSeconds: 60 * 60, // 1 hour
  hmacKey: process.env.VERIFICATION_HMAC_KEY || "dev_verification_key_change_me",
};

function generateNumericCode(length = DEFAULTS.codeLength) {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  const n = Math.floor(Math.random() * (max - min + 1)) + min;
  return String(n);
}

function hmacFor(code: string) {
  return crypto.createHmac("sha256", DEFAULTS.hmacKey).update(code).digest("hex");
}

/**
 * Keys used in Redis:
 * - codeKey => stores HMAC(code) (string) with EX = expiry
 * - attemptsKey => integer counter (no need to set if missing). TTL should be >= expiry
 * - lockKey => when set, indicates lock with EX = lockoutSeconds
 */
function codeKey(purpose: string, id: string) {
  return `ver:${purpose}:${id}:code`;
}
function attemptsKey(purpose: string, id: string) {
  return `ver:${purpose}:${id}:attempts`;
}
function lockKey(purpose: string, id: string) {
  return `ver:${purpose}:${id}:locked`;
}

export async function createVerificationCode(
  id: string,
  purpose: string,
  opts?: {
    length?: number;
    expirySeconds?: number;
    maxAttempts?: number;
    lockoutSeconds?: number;
  }
) {
  const length = opts?.length ?? DEFAULTS.codeLength;
  const expirySeconds = opts?.expirySeconds ?? DEFAULTS.expirySeconds;
  // maxAttempts and lockoutSeconds are for verify, we keep defaults here.
  const code = generateNumericCode(length);
  const hashed = hmacFor(code);

  const cKey = codeKey(purpose, id);
  const aKey = attemptsKey(purpose, id);

  // Store hashed code with TTL and remove any attempts / locks left from previous runs.
  // Use MULTI to set atomically.
  const multi = redisClient.multi();
  multi.set(cKey, hashed, "EX", expirySeconds);
  multi.del(aKey);
  multi.del(lockKey(purpose, id));
  await multi.exec();

  // Return code so caller can deliver (sms/email). In production we can not log/send back to client directly.
  return { code, expirySeconds };
}

/**
 * Verify code — atomic using an EVAL Lua script to:
 *  - check lock -> return locked + ttl
 *  - check existence of code -> expired
 *  - compare stored hmac to provided hmac -> if match delete keys and return ok
 *  - if mismatch increment attempts (set TTL on first incr), and if reached maxAttempts set lock key and return failed_locked
 *
 * Script returns an array: [status, value?]
 */
const VERIFY_LUA = `
-- KEYS: 1=codeKey, 2=attemptsKey, 3=lockKey
-- ARGV: 1=providedHash, 2=maxAttempts, 3=attemptsTTLSeconds, 4=lockTTLSeconds
local codeExists = redis.call("exists", KEYS[3])
if codeExists == 1 then
  local ttl = redis.call("ttl", KEYS[3])
  if ttl < 0 then ttl = -1 end
  return {"locked", tostring(ttl)}
end

local stored = redis.call("get", KEYS[1])
if not stored then
  return {"expired"}
end

if stored == ARGV[1] then
  redis.call("del", KEYS[1])
  redis.call("del", KEYS[2])
  return {"ok"}
else
  local attempts = redis.call("incr", KEYS[2])
  if attempts == 1 then
    -- ensure attempts counter doesn't live forever; keep at least attemptsTTL
    redis.call("expire", KEYS[2], tonumber(ARGV[3]))
  end
  if tonumber(attempts) >= tonumber(ARGV[2]) then
    redis.call("set", KEYS[3], "1", "EX", tonumber(ARGV[4]))
    local lockedTtl = redis.call("ttl", KEYS[3])
    return {"failed_locked", tostring(attempts), tostring(lockedTtl)}
  else
    return {"failed", tostring(attempts)}
  end
end
`;

export async function verifyCode(
  id: string,
  purpose: string,
  code: string,
  opts?: {
    maxAttempts?: number;
    attemptsTtlSeconds?: number;
    lockoutSeconds?: number;
  }
): Promise<VerificationResult> {
  const maxAttempts = opts?.maxAttempts ?? DEFAULTS.maxAttempts;
  const attemptsTtlSeconds = opts?.attemptsTtlSeconds ?? Math.max(DEFAULTS.expirySeconds, 60); // at least expiry or 60s
  const lockoutSeconds = opts?.lockoutSeconds ?? DEFAULTS.lockoutSeconds;

  const cKey = codeKey(purpose, id);
  const aKey = attemptsKey(purpose, id);
  const lKey = lockKey(purpose, id);

  const providedHash = hmacFor(code);

  // Eval the Lua script
  const res = (await redisClient.eval(
    VERIFY_LUA,
    3,
    cKey,
    aKey,
    lKey,
    providedHash,
    String(maxAttempts),
    String(attemptsTtlSeconds),
    String(lockoutSeconds)
  )) as Array<any>;

  // res is array: first element status
  const status = res[0];

  if (status === "ok") {
    return { status: "ok" };
  }
  if (status === "expired") {
    return { status: "expired" };
  }
  if (status === "locked") {
    const ttl = Number(res[1]) || lockoutSeconds;
    return { status: "locked", retryAfterSeconds: ttl };
  }
  if (status === "failed") {
    const attempts = Number(res[1]) || 0;
    return { status: "failed", attempts };
  }
  if (status === "failed_locked") {
    const attempts = Number(res[1]) || 0;
    const ttl = Number(res[2]) || lockoutSeconds;
    return { status: "failed_locked", attempts, retryAfterSeconds: ttl };
  }

  return { status: "expired" };
}

/**
 * Helper to revoke a code early (e.g., after successful external action)
 */
export async function revokeVerification(id: string, purpose: string) {
  const delKeys = [codeKey(purpose, id), attemptsKey(purpose, id), lockKey(purpose, id)];
  await redisClient.del(...delKeys);
}