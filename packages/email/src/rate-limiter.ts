/**
 * Multi-layer email rate limiter — KV port of v1's D1-table version, same
 * policy: per-user and per-email 5/hour (blocks 60/120 min), per-IP 20/hour
 * (blocks 30 min). Sits in front of ALL transactional sends (plan §6f).
 *
 * KV is eventually consistent, so counts are approximate under concurrency —
 * acceptable for abuse throttling (same trade-off the plan chose to delete
 * the D1 table and its per-email writes).
 */

export type IdentifierType = "user" | "email" | "ip";
export type EmailKind = "verification" | "reset" | "change" | "delete";

export interface RateCheckResult {
  allowed: boolean;
  retryAfter?: number;
  reason?: string;
}

interface RateLimitConfig {
  maxAttempts: number;
  windowMinutes: number;
  blockDurationMinutes: number;
}

const EMAIL_LIMITS: Record<IdentifierType, RateLimitConfig> = {
  user: { maxAttempts: 5, windowMinutes: 60, blockDurationMinutes: 60 },
  email: { maxAttempts: 5, windowMinutes: 60, blockDurationMinutes: 120 },
  ip: { maxAttempts: 20, windowMinutes: 60, blockDurationMinutes: 30 },
};

/** Minimal structural KV interface so tests can use a Map-backed fake. */
export interface KVStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

interface CounterState {
  count: number;
  windowStart: number; // epoch ms
  blockedUntil?: number; // epoch ms
}

export class EmailRateLimiter {
  constructor(
    private kv: KVStore,
    private now: () => number = Date.now,
  ) {}

  private key(type: IdentifierType, identifier: string, emailKind: string): string {
    return `email-rl:${type}:${emailKind}:${identifier}`;
  }

  async checkAndIncrement(
    identifier: string,
    type: IdentifierType,
    emailKind: EmailKind,
  ): Promise<RateCheckResult> {
    const config = EMAIL_LIMITS[type];
    const now = this.now();
    const key = this.key(type, identifier, emailKind);

    try {
      const raw = await this.kv.get(key);
      const state: CounterState | null = raw ? JSON.parse(raw) : null;

      if (state?.blockedUntil && state.blockedUntil > now) {
        const retryAfter = Math.ceil((state.blockedUntil - now) / 1000);
        return {
          allowed: false,
          retryAfter,
          reason: `Rate limit exceeded. Try again in ${Math.ceil(retryAfter / 60)} minutes.`,
        };
      }

      const windowMs = config.windowMinutes * 60 * 1000;
      const inWindow = state !== null && now - state.windowStart < windowMs && !state.blockedUntil;

      if (inWindow && state.count >= config.maxAttempts) {
        const blockMs = config.blockDurationMinutes * 60 * 1000;
        await this.put(key, { ...state, blockedUntil: now + blockMs }, blockMs);
        return {
          allowed: false,
          retryAfter: config.blockDurationMinutes * 60,
          reason: `Too many requests. Blocked for ${config.blockDurationMinutes} minutes.`,
        };
      }

      const next: CounterState = inWindow
        ? { count: state.count + 1, windowStart: state.windowStart }
        : { count: 1, windowStart: now };
      await this.put(key, next, windowMs);
      return { allowed: true };
    } catch (error) {
      // Fail open (same as v1) but log for security monitoring.
      console.error("Email rate limit check failed:", error);
      return { allowed: true };
    }
  }

  private async put(key: string, state: CounterState, ttlMs: number): Promise<void> {
    // KV minimum TTL is 60s.
    const expirationTtl = Math.max(60, Math.ceil(ttlMs / 1000));
    await this.kv.put(key, JSON.stringify(state), { expirationTtl });
  }

  /** user → email → IP, most specific first; email checked even without a user (anti-enumeration). */
  async checkMultiLayer(
    userId: string | null,
    email: string,
    ipAddress: string | null,
    emailKind: EmailKind,
  ): Promise<RateCheckResult> {
    if (userId) {
      const userCheck = await this.checkAndIncrement(userId, "user", emailKind);
      if (!userCheck.allowed) return userCheck;
    }

    const emailCheck = await this.checkAndIncrement(email.toLowerCase(), "email", emailKind);
    if (!emailCheck.allowed) return emailCheck;

    if (ipAddress) {
      const ipCheck = await this.checkAndIncrement(ipAddress, "ip", emailKind);
      if (!ipCheck.allowed) return ipCheck;
    }

    return { allowed: true };
  }
}
