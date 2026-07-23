import type { MiddlewareHandler } from "hono";
import type { AppEnv, Bindings } from "../env";

/**
 * Per-IP rate limiting via native Workers ratelimit bindings, mirroring
 * apps/api's middleware. Bindings only exist on staging/production — local dev
 * and tests run unthrottled (the middleware no-ops when the binding is absent).
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

/** Coarse burst cap across the whole admin surface. */
export const rateLimit = perIpRateLimit((env) => env.RATE_LIMITER);

/**
 * Sign-in only — the credential-guessing surface, so it gets the tightest
 * budget. Applied specifically to POST /v1/auth/sign-in/email.
 */
export const loginRateLimit = perIpRateLimit((env) => env.ADMIN_LOGIN_RATE_LIMITER);
