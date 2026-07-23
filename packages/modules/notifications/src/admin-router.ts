import { Hono, type Context } from "hono";
import { z } from "zod";
import { AppError } from "@mia/core";
import {
  createCampaignSchema,
  createTemplateSchema,
  listCampaignsQuerySchema,
  listSubscribersQuerySchema,
  updateTemplateSchema,
} from "@mia/contracts";
import type { NotificationsService } from "./service";

/** Templates + campaigns administration — apps/admin-api only. */

export interface NotificationsAdminDeps {
  getService: (c: Context) => NotificationsService;
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

export function createNotificationsAdminRouter({ getService }: NotificationsAdminDeps) {
  const router = new Hono();

  // ── Templates ─────────────────────────────────────────────────────────
  router.get("/templates", async (c) => c.json({ data: await getService(c).listTemplates() }));

  router.post("/templates", async (c) => {
    const input = await parseBody(c, createTemplateSchema);
    return c.json({ data: await getService(c).createTemplate(input) }, 201);
  });

  router.put("/templates/:id", async (c) => {
    await getService(c).updateTemplate(parseId(c), await parseBody(c, updateTemplateSchema));
    return c.json({ data: { updated: true } });
  });

  router.delete("/templates/:id", async (c) => {
    await getService(c).deleteTemplate(parseId(c));
    return c.json({ data: { deleted: true } });
  });

  // ── Campaigns ─────────────────────────────────────────────────────────
  router.get("/campaigns", async (c) => {
    const parsed = listCampaignsQuerySchema.safeParse(c.req.query());
    if (!parsed.success) throw AppError.badRequest("Invalid query", parsed.error.issues);
    const { status, cursor, limit } = parsed.data;
    return c.json({ data: await getService(c).listCampaigns(status, cursor, limit) });
  });

  router.post("/campaigns", async (c) => {
    const input = await parseBody(c, createCampaignSchema);
    return c.json({ data: await getService(c).createCampaign(input) }, 201);
  });

  // Kick off the queue fan-out.
  router.post("/campaigns/:id/send", async (c) => {
    await getService(c).send(parseId(c));
    return c.json({ data: { status: "sending" } }, 202);
  });

  router.get("/campaigns/:id/progress", async (c) => {
    return c.json({ data: await getService(c).progress(parseId(c)) });
  });

  // ── Newsletter ────────────────────────────────────────────────────────
  router.get("/newsletter/subscribers", async (c) => {
    const parsed = listSubscribersQuerySchema.safeParse(c.req.query());
    if (!parsed.success) throw AppError.badRequest("Invalid query", parsed.error.issues);
    return c.json({ data: await getService(c).listSubscribers(parsed.data) });
  });

  return router;
}
