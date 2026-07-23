import { Hono, type Context } from "hono";
import { AppError } from "@mia/core";
import {
  listProjectsQuerySchema,
  projectsFeedQuerySchema,
  submitProjectSchema,
} from "@mia/contracts";
import type { ProjectsService } from "./service";
import type { z } from "zod";

/**
 * Public directory reads + the anonymous submit endpoint — mounted under
 * /v1/projects by apps/api. The submit route carries its own tight per-IP
 * rate limit (wired in apps/api/src/app.ts, same zone as the newsletter).
 */

export interface ProjectsRouterDeps {
  getService: (c: Context) => ProjectsService;
}

async function parseBody<T>(c: Context, schema: z.ZodType<T>): Promise<T> {
  const json = await c.req.json().catch(() => {
    throw AppError.badRequest("Invalid JSON body");
  });
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw AppError.badRequest("Validation failed", parsed.error.issues);
  return parsed.data;
}

export function createProjectsRouter({ getService }: ProjectsRouterDeps) {
  const router = new Hono();

  router.get("/", async (c) => {
    const parsed = listProjectsQuerySchema.safeParse(c.req.query());
    if (!parsed.success) throw AppError.badRequest("Validation failed", parsed.error.issues);
    return c.json({ data: await getService(c).list(parsed.data) });
  });

  // Literal routes before /:slug.
  router.get("/featured", async (c) => c.json({ data: await getService(c).featured() }));
  router.get("/facets", async (c) => c.json({ data: { languages: await getService(c).facets() } }));
  router.get("/facets/owners", async (c) =>
    c.json({ data: { owners: await getService(c).ownerFacets() } }),
  );
  router.get("/facets/topics", async (c) =>
    c.json({ data: { topics: await getService(c).topicFacets() } }),
  );

  // Discovery/exposure feeds — consumed by the Astro sitemap + RSS endpoints.
  router.get("/sitemap", async (c) => c.json({ data: await getService(c).sitemap() }));
  router.get("/feed", async (c) => {
    const parsed = projectsFeedQuerySchema.safeParse(c.req.query());
    if (!parsed.success) throw AppError.badRequest("Validation failed", parsed.error.issues);
    return c.json({ data: { items: await getService(c).feed(parsed.data.limit) } });
  });

  router.post("/submit", async (c) => {
    const input = await parseBody(c, submitProjectSchema);
    return c.json({ data: await getService(c).submit(input) }, 202);
  });

  router.get("/:slug", async (c) => c.json({ data: await getService(c).detail(c.req.param("slug")) }));

  return router;
}
