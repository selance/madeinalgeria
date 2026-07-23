import type { MiddlewareHandler } from "hono";
import type { Auth } from "./create-auth";

type SessionUser = {
  id: string;
  email: string;
  role?: string | null;
  banned?: boolean | null;
  emailVerified?: boolean | null;
};

export interface RequireAdminOptions {
  /**
   * Allowed admin emails (compared case-insensitively). When non-empty, a user
   * must be on this list even if their `role` column says "admin" — a hard
   * backstop so a flipped role alone can't grant access. Empty/omitted → the
   * role check stands alone (no allowlist).
   */
  getAllowlist?: (env: unknown) => string[];
  /** Reject sessions created more than this many ms ago — forces periodic admin re-login. */
  maxSessionAgeMs?: number;
  /** Require a verified email address. Defaults to true. */
  requireEmailVerified?: boolean;
}

/**
 * Session + role + ban check, hardened for admin surfaces. On top of the base
 * "must be a signed-in, non-banned admin" it can also require a verified email,
 * membership in an explicit allowlist, and a fresh session.
 *
 * In apps/admin-api this mounts before EVERYTHING except /health and the
 * safelisted auth endpoints. Failure messages are intentionally uniform
 * ("Admin access required") so probing can't distinguish which check failed.
 */
export function requireAdmin(
  getAuth: (env: unknown) => Auth,
  options: RequireAdminOptions = {},
): MiddlewareHandler {
  const { getAllowlist, maxSessionAgeMs, requireEmailVerified = true } = options;

  return async (c, next) => {
    const auth = getAuth(c.env);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
      return c.json({ error: { code: "unauthorized", message: "Unauthorized" } }, 401);
    }

    const user = session.user as SessionUser;
    if (user.banned) {
      return c.json({ error: { code: "forbidden", message: "Account is banned" } }, 403);
    }

    const denied = c.json({ error: { code: "forbidden", message: "Admin access required" } }, 403);
    if (user.role !== "admin") return denied;
    if (requireEmailVerified && !user.emailVerified) return denied;

    const allowlist = getAllowlist?.(c.env) ?? [];
    if (allowlist.length > 0 && !allowlist.includes(user.email.toLowerCase())) return denied;

    if (maxSessionAgeMs) {
      const createdAt = (session.session as { createdAt?: string | Date }).createdAt;
      const startedAt = createdAt ? new Date(createdAt).getTime() : Number.NaN;
      if (Number.isFinite(startedAt) && Date.now() - startedAt > maxSessionAgeMs) {
        return c.json(
          { error: { code: "session_expired", message: "Session expired, please sign in again" } },
          401,
        );
      }
    }

    c.set("adminUser", { id: user.id, email: user.email });
    await next();
  };
}
