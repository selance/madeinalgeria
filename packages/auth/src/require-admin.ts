import type { MiddlewareHandler } from "hono";
import type { Auth } from "./create-auth";

type SessionUser = {
  id: string;
  email: string;
  role?: string | null;
  banned?: boolean | null;
};

/**
 * Session + role + ban check (v1's requireAdmin, minus the extra D1 read —
 * the admin plugin puts role/banned on the session user, and sessions come
 * from KV secondaryStorage).
 *
 * In apps/admin-api this mounts before EVERYTHING except /health and the
 * auth handler — including OpenAPI docs (the v1 lesson).
 */
export function requireAdmin(getAuth: (env: unknown) => Auth): MiddlewareHandler {
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
    if (user.role !== "admin") {
      return c.json({ error: { code: "forbidden", message: "Admin access required" } }, 403);
    }

    c.set("adminUser", { id: user.id, email: user.email });
    await next();
  };
}
