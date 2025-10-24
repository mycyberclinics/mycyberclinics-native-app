import Redis from "ioredis";
import { RateLimiterRedis } from "rate-limiter-flexible";

/**
 * Robust Redis-backed rate limiter with graceful fallback to localhost (127.0.0.1)
 * Fixed TypeScript import/typing issues: use InstanceType<typeof Redis> for the client instance type.
 *
 * Usage:
 * - For docker-compose runs use REDIS_URL=redis://redis:6379
 * - For local dev use REDIS_URL=redis://127.0.0.1:6379
 *
 * The client will automatically fall back to localhost once if the initial
 * connection fails due to DNS ENOTFOUND for the configured host.
 */

type RedisClient = InstanceType<typeof Redis>;

const rawRedisUrl = process.env.REDIS_URL || process.env.REDIS_URI || "redis://127.0.0.1:6379";

function createClientFromUrl(urlStr: string): RedisClient {
  const client = new Redis(urlStr, {
    retryStrategy: (times) => Math.min(2000, times * 50),
    enableReadyCheck: true,
  });

  client.on("connect", () => {
    console.info(`[redis] connecting -> ${urlStr}`);
  });
  client.on("ready", () => {
    console.info(`[redis] ready -> ${urlStr}`);
  });
  client.on("end", () => {
    console.info(`[redis] connection closed -> ${urlStr}`);
  });

  return client as RedisClient;
}

/**
 * Attempt to create a redis client for the given URL.
 * If the client emits a DNS getaddrinfo ENOTFOUND error for the host we will
 * create a fallback client pointing to 127.0.0.1 and return that client instead.
 *
 * We only attempt one fallback to avoid flipping repeatedly.
 */
function buildResilientRedisClient(urlStr: string): RedisClient {
  let triedFallback = false;
  let primaryUrl = urlStr;
  let client = createClientFromUrl(primaryUrl);

  function onErrorOnce(err: any) {
    const message = (err && (err.message || err.stack)) || String(err);
    const isDnsErr =
      (err && err.code === "ENOTFOUND") ||
      /getaddrinfo ENOTFOUND/i.test(message) ||
      /unknown address/i.test(message);

    if (isDnsErr && !triedFallback) {
      try {
        const parsed = new URL(primaryUrl);
        const originalHost = parsed.hostname;
        if (originalHost && originalHost !== "127.0.0.1" && originalHost !== "localhost") {
          console.warn(`[redis] DNS lookup failed for "${originalHost}". Attempting fallback to 127.0.0.1.`);
          triedFallback = true;

          safeDestroyClient(client);

          const fallbackHost = "127.0.0.1";
          const fallbackPort = parsed.port || "6379";
          const fallbackUrl = `${parsed.protocol}//${fallbackHost}:${fallbackPort}${parsed.pathname || ""}`;

          client = createClientFromUrl(fallbackUrl);
          client.on("error", (e: any) => {
            console.error("[redis] fallback error:", e && (e.message || e));
          });
        } else {
          console.error("[redis] DNS error but host is localhost; cannot fallback:", message);
        }
      } catch (parseErr: any) {
        console.error("[redis] error parsing REDIS_URL for fallback:", parseErr);
      }
    } else {
      console.error("[redis] connection error:", message);
    }
  }

  client.on("error", onErrorOnce);

  return client;
}

function safeDestroyClient(c: RedisClient) {
  try {
    c.removeAllListeners();
    c.quit().catch(() => {
      try {
        c.disconnect();
      } catch {}
    });
  } catch {}
}

/**
 * Create the resilient client using the configured URL.
 */
export const redisClient: RedisClient = buildResilientRedisClient(rawRedisUrl);

// Additional logging handler (typed)
redisClient.on("error", (err: any) => {
  console.error("[redis] client error:", err && (err.message || err));
});

/**
 * Helper to build a RateLimiterRedis instance
 * Use correct option names: inMemoryBlockOnConsumed, inMemoryBlockDuration
 */
function buildRedisLimiter(points: number, durationSeconds: number, keyPrefix: string) {
  return new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix,
    points,
    duration: durationSeconds,
    inMemoryBlockOnConsumed: points * 2,
    inMemoryBlockDuration: Math.min(60, durationSeconds),
  });
}

/**
 * In-memory fallback limiter (single-process). Keeps timestamps per key.
 */
class InMemoryLimiter {
  private store = new Map<string, number[]>(); // key -> timestamps (ms)
  constructor(private points: number, private windowMs: number) {}

  consume(key: string) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const arr = this.store.get(key) ?? [];
    const recent = arr.filter((t) => t > windowStart);
    if (recent.length >= this.points) {
      const oldest = recent[0];
      const retryAfterMs = this.windowMs - (now - oldest);
      const err: any = new Error("Rate limit exceeded (in-memory)");
      err.msBeforeNext = retryAfterMs;
      throw err;
    }
    recent.push(now);
    this.store.set(key, recent);
    return { remainingPoints: Math.max(0, this.points - recent.length) };
  }
}

/**
 * Configure both Redis limiters and corresponding in-memory fallbacks.
 */
export const signupIpLimiter = buildRedisLimiter(5, 60 * 60, "rl:signup:ip"); // 5 per hour per IP
export const resendEmailLimiter = buildRedisLimiter(3, 60 * 60, "rl:resend:email"); // 3 per hour per email
export const resendIpLimiter = buildRedisLimiter(10, 60 * 60, "rl:resend:ip"); // 10 per hour per IP
export const checkIpLimiter = buildRedisLimiter(60, 60 * 60, "rl:check:ip"); // 60 per hour per IP

const signupIpMemory = new InMemoryLimiter(5, 60 * 60 * 1000);
const resendEmailMemory = new InMemoryLimiter(3, 60 * 60 * 1000);
const resendIpMemory = new InMemoryLimiter(10, 60 * 60 * 1000);
const checkIpMemory = new InMemoryLimiter(60, 60 * 60 * 1000);

/**
 * Unified consume function.
 * - Prefer Redis limiter when redisClient.status === "ready"
 * - If Redis errors or is not ready, fall back to in-memory limiter.
 *
 * Return shape:
 * { allowed: boolean, remaining?: number, retryAfterSeconds?: number }
 */
export async function consumeLimiter(limiter: RateLimiterRedis, key: string) {
  const prefix = (limiter as any).keyPrefix as string | undefined;
  let fallback: InMemoryLimiter | null = null;
  if (prefix?.includes("signup:ip")) fallback = signupIpMemory;
  else if (prefix?.includes("resend:email")) fallback = resendEmailMemory;
  else if (prefix?.includes("resend:ip")) fallback = resendIpMemory;
  else if (prefix?.includes("check:ip") || prefix?.includes("check")) fallback = checkIpMemory;

  try {
    if (redisClient.status === "ready") {
      const res = await limiter.consume(key, 1);
      return {
        allowed: true,
        remaining: typeof res.remainingPoints === "number" ? res.remainingPoints : undefined,
      };
    } else {
      throw new Error("Redis not ready");
    }
  } catch (err: any) {
    if (err && typeof err.msBeforeNext === "number") {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil(err.msBeforeNext / 1000),
        remaining: 0,
      };
    }

    console.warn(
      "[rate-limiter] Redis unavailable or error, using in-memory fallback for key:",
      key,
      "err:",
      err && (err.message || err)
    );

    if (fallback) {
      try {
        const r = fallback.consume(key);
        return {
          allowed: true,
          remaining: typeof r.remainingPoints === "number" ? r.remainingPoints : undefined,
        };
      } catch (memErr: any) {
        const retryAfterMs = memErr?.msBeforeNext ?? 60 * 1000;
        return {
          allowed: false,
          retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
          remaining: 0,
        };
      }
    }

    return { allowed: true, remaining: undefined };
  }
}

export async function shutdownRedis() {
  try {
    await redisClient.quit();
  } catch (err: any) {
    try {
      redisClient.disconnect();
    } catch {}
  }
}