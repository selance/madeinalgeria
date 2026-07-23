import type { MiddlewareHandler } from "hono";
import type { Auth } from "@mia/auth";
import type { AppEnv, Bindings } from "../env";

/** Requires a signed-in user (cookie or bearer) and puts them on context. */
export function requireUser(getAuth: (env: Bindings) => Auth): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const session = await getAuth(c.env).api.getSession({ headers: c.req.raw.headers });
    if (!session) {
      return c.json(
        { error: { code: "unauthorized", message: "Sign in required", requestId: c.get("requestId") } },
        401,
      );
    }
    const user = session.user as { id: string; name?: string | null; email?: string | null };
    c.set("user", { id: user.id, name: user.name ?? null, email: user.email ?? null });
    await next();
  };
}
