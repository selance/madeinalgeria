import type { MiddlewareHandler } from "hono";
import type { AppEnv, Bindings } from "../env";

/**
 * Per-IP rate limiting via a native Workers ratelimit binding. The binding is
 * selected per middleware so different route groups can enforce different
 * budgets (see `rateLimit` vs `newsletterRateLimit`). Bindings only exist on
 * staging/production — local dev and tests run unthrottled.
 */
function perIpRateLimit(pick: (env: Bindings) => RateLimit | undefined): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const limiter = pick(c.env);
    // Cloudflare stamps cf-connecting-ip on every internet request; absence
    // means an internal service-binding call — skip.
    const key = c.req.header("cf-connecting-ip");
    if (limiter && key) {
      const { success } = await limiter.limit({ key });
      if (!success) {
        return c.json(
          {
            error: {
              code: "rate_limited",
              message: "Too many requests. Please slow down.",
              requestId: c.get("requestId"),
            },
          },
          429,
        );
      }
    }
    await next();
  };
}

/** Whole /v1 surface (300 req/60 s). */
export const rateLimit = perIpRateLimit((env) => env.RATE_LIMITER);

/**
 * Newsletter opt-in — the only endpoint that lets an anonymous caller write to
 * D1 and trigger an email, so it gets the tightest budget of all (5/60 s).
 */
export const newsletterRateLimit = perIpRateLimit((env) => env.NEWSLETTER_RATE_LIMITER);

/**
 * Project submissions — anonymous D1 write plus an upstream GitHub API fetch
 * per call, so it gets its own tight budget (3/60 s).
 */
export const projectSubmitRateLimit = perIpRateLimit((env) => env.PROJECT_SUBMIT_RATE_LIMITER);

// ── Daily submission budget (KV-backed) ──────────────────────────────────
//
// The native binding above only caps bursts (3/min still allows ~4k/day from
// one IP). This layer bounds sustained abuse with two 24h windows in KV,
// same windowed-counter idiom as @mia/email's EmailRateLimiter:
//   • per-IP daily cap — one actor can't drip-feed the queue all day;
//   • global daily cap — a botnet can't flood the review queue even from
//     thousands of IPs (generous enough that it only trips under attack).
// KV is eventually consistent, so counts are approximate — fine for abuse
// control. KV failures fail OPEN (an outage must not kill submissions), and
// counting happens before validation so probing invalid payloads spends the
// same budget as real ones.

const SUBMIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const DEFAULT_SUBMIT_IP_DAILY_LIMIT = 10;
const DEFAULT_SUBMIT_GLOBAL_DAILY_LIMIT = 300;

interface WindowState {
  count: number;
  windowStart: number; // epoch ms
}

/** Sliding-window counter in KV. Returns retryAfter seconds when denied. */
async function kvWindowCheck(
  kv: KVNamespace,
  key: string,
  max: number,
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = Date.now();
  const raw = await kv.get(key);
  const state: WindowState | null = raw ? (JSON.parse(raw) as WindowState) : null;
  const inWindow = state !== null && now - state.windowStart < SUBMIT_WINDOW_MS;

  if (inWindow && state.count >= max) {
    return { allowed: false, retryAfter: Math.ceil((state.windowStart + SUBMIT_WINDOW_MS - now) / 1000) };
  }

  const next: WindowState = inWindow
    ? { count: state.count + 1, windowStart: state.windowStart }
    : { count: 1, windowStart: now };
  await kv.put(key, JSON.stringify(next), {
    // KV minimum TTL is 60s; window remainder + slack keeps keys self-cleaning.
    expirationTtl: Math.max(60, Math.ceil(SUBMIT_WINDOW_MS / 1000) + 3600),
  });
  return { allowed: true };
}

function limitFrom(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/** Per-IP then global daily budget for POST /v1/projects/submit. */
export const projectSubmitDailyLimit: MiddlewareHandler<AppEnv> = async (c, next) => {
  // Absent cf-connecting-ip means an internal service-binding call — skip,
  // same semantics as the native limiter above.
  const ip = c.req.header("cf-connecting-ip");
  if (ip) {
    const ipLimit = limitFrom(c.env.SUBMIT_IP_DAILY_LIMIT, DEFAULT_SUBMIT_IP_DAILY_LIMIT);
    const globalLimit = limitFrom(
      c.env.SUBMIT_GLOBAL_DAILY_LIMIT,
      DEFAULT_SUBMIT_GLOBAL_DAILY_LIMIT,
    );
    try {
      const ipCheck = await kvWindowCheck(c.env.KV, `submit-rl:ip:${ip}`, ipLimit);
      const verdict = ipCheck.allowed
        ? await kvWindowCheck(c.env.KV, "submit-rl:global", globalLimit)
        : ipCheck;
      if (!verdict.allowed) {
        if (verdict.retryAfter) c.header("Retry-After", String(verdict.retryAfter));
        return c.json(
          {
            error: {
              code: "rate_limited",
              message: "Daily submission limit reached. Please try again tomorrow.",
              requestId: c.get("requestId"),
            },
          },
          429,
        );
      }
    } catch (error) {
      // Fail open: an eventually-consistent counter outage must not block
      // legitimate submissions. Logged for security monitoring.
      console.error("Submit daily limit check failed:", error);
    }
  }
  await next();
};
