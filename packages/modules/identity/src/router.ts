import { Hono, type Context } from "hono";
import { z } from "zod";
import { AppError } from "@mia/core";
import { updateProfileSchema } from "@mia/contracts";
import type { IdentityService } from "./service";

/**
 * /v1/me — the caller's profile. Global routes, mounted by apps/api behind
 * requireUser.
 */

export interface IdentityRouterDeps {
  getService: (c: Context) => IdentityService;
  getUser: (c: Context) => { id: string };
}

async function parseBody<T>(c: Context, schema: z.ZodType<T>): Promise<T> {
  const json = await c.req.json().catch(() => {
    throw AppError.badRequest("Invalid JSON body");
  });
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw AppError.badRequest("Validation failed", parsed.error.issues);
  return parsed.data;
}

export function createIdentityRouter({ getService, getUser }: IdentityRouterDeps) {
  const router = new Hono();

  router.get("/profile", async (c) => {
    return c.json({ data: await getService(c).getProfile(getUser(c).id) });
  });

  router.put("/profile", async (c) => {
    const input = await parseBody(c, updateProfileSchema);
    return c.json({ data: await getService(c).updateProfile(getUser(c).id, input) });
  });

  return router;
}
