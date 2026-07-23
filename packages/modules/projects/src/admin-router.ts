import { Hono, type Context } from "hono";
import { z } from "zod";
import { AppError } from "@mia/core";
import {
  listAdminProjectsQuerySchema,
  reviewProjectSchema,
  updateProjectSchema,
} from "@mia/contracts";
import type { ProjectsService } from "./service";

/**
 * Admin review + editorial surface — mounted ONLY by apps/admin-api, behind
 * requireAdmin. Every write invalidates the KV cache (version bump inside the
 * service methods).
 */

export interface ProjectsAdminDeps {
  getService: (c: Context) => ProjectsService;
}

const idParam = z.coerce.number().int().positive();

function parseId(c: Context): number {
  const parsed = idParam.safeParse(c.req.param("id"));
  if (!parsed.success) throw AppError.badRequest("id must be a positive integer");
  return parsed.data;
}

async function parseBody<T>(c: Context, schema: z.ZodType<T>): Promise<T> {
  const json = await c.req.json().catch(() => {
    throw AppError.badRequest("Invalid JSON body");
  });
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw AppError.badRequest("Validation failed", parsed.error.issues);
  return parsed.data;
}

export function createProjectsAdminRouter({ getService }: ProjectsAdminDeps) {
  const router = new Hono();

  router.get("/", async (c) => {
    const parsed = listAdminProjectsQuerySchema.safeParse(c.req.query());
    if (!parsed.success) throw AppError.badRequest("Validation failed", parsed.error.issues);
    return c.json({ data: await getService(c).listAdmin(parsed.data) });
  });

  router.get("/counts", async (c) => c.json({ data: await getService(c).counts() }));

  router.patch("/:id", async (c) => {
    const input = await parseBody(c, updateProjectSchema);
    return c.json({ data: await getService(c).update(parseId(c), input) });
  });

  router.post("/:id/review", async (c) => {
    const input = await parseBody(c, reviewProjectSchema);
    return c.json({ data: await getService(c).review(parseId(c), input) });
  });

  router.post("/:id/refresh", async (c) =>
    c.json({ data: await getService(c).refresh(parseId(c)) }),
  );

  return router;
}
