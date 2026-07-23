import { Hono, type Context } from "hono";
import { z } from "zod";
import { AppError } from "@mia/core";
import { banUserSchema, listUsersQuerySchema, setRoleSchema } from "@mia/contracts";
import type { Auth } from "@mia/auth";

/**
 * User administration — wraps the better-auth admin plugin (list/ban/role) so
 * session revocation and role semantics stay the library's problem. Mounted
 * ONLY by apps/admin-api behind requireAdmin; the caller's headers are
 * forwarded so better-auth authorizes the acting admin itself.
 */

export interface IdentityAdminDeps {
  getAuth: (c: Context) => Auth;
}

async function parseBody<T>(c: Context, schema: z.ZodType<T>): Promise<T> {
  const json = await c.req.json().catch(() => {
    throw AppError.badRequest("Invalid JSON body");
  });
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw AppError.badRequest("Validation failed", parsed.error.issues);
  return parsed.data;
}

function userId(c: Context): string {
  const id = c.req.param("id");
  if (!id) throw AppError.badRequest("Missing user id");
  return id;
}

export function createIdentityAdminRouter({ getAuth }: IdentityAdminDeps) {
  const router = new Hono();

  router.get("/", async (c) => {
    const parsed = listUsersQuerySchema.safeParse(c.req.query());
    if (!parsed.success) throw AppError.badRequest("Invalid query", parsed.error.issues);
    const { search, role, limit, offset } = parsed.data;

    const result = await getAuth(c).api.listUsers({
      query: {
        limit,
        offset,
        ...(search ? { searchValue: search, searchField: "email" as const } : {}),
        ...(role ? { filterField: "role", filterOperator: "eq" as const, filterValue: role } : {}),
      },
      headers: c.req.raw.headers,
    });
    return c.json({ data: result });
  });

  router.post("/:id/ban", async (c) => {
    const input = await parseBody(c, banUserSchema);
    await getAuth(c).api.banUser({
      body: {
        userId: userId(c),
        banReason: input.reason,
        banExpiresIn: input.expiresInDays ? input.expiresInDays * 24 * 60 * 60 : undefined,
      },
      headers: c.req.raw.headers,
    });
    return c.json({ data: { banned: true } });
  });

  router.post("/:id/unban", async (c) => {
    await getAuth(c).api.unbanUser({
      body: { userId: userId(c) },
      headers: c.req.raw.headers,
    });
    return c.json({ data: { banned: false } });
  });

  router.post("/:id/role", async (c) => {
    const input = await parseBody(c, setRoleSchema);
    await getAuth(c).api.setRole({
      body: { userId: userId(c), role: input.role },
      headers: c.req.raw.headers,
    });
    return c.json({ data: { role: input.role } });
  });

  return router;
}
