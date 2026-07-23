import { Hono, type Context } from "hono";
import { z } from "zod";
import { AppError } from "@mia/core";
import {
  assignSubscriptionSchema,
  createPlanSchema,
  listInvoicesQuerySchema,
  listSubscriptionsQuerySchema,
  updatePlanSchema,
} from "@mia/contracts";
import type { BillingRepo } from "./repo";
import type { BillingService } from "./service";

/** Plans / subscriptions / invoices administration — apps/admin-api only. */

export interface BillingAdminDeps {
  getRepo: (c: Context) => BillingRepo;
  getService: (c: Context) => BillingService;
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

export function createBillingAdminRouter({ getRepo, getService }: BillingAdminDeps) {
  const router = new Hono();

  // ── Plans ─────────────────────────────────────────────────────────────
  router.get("/plans", async (c) => c.json({ data: await getRepo(c).listPlans() }));

  router.post("/plans", async (c) => {
    const input = await parseBody(c, createPlanSchema);
    const id = await getRepo(c).createPlan(input);
    return c.json({ data: { id } }, 201);
  });

  router.put("/plans/:id", async (c) => {
    const input = await parseBody(c, updatePlanSchema);
    if (!(await getRepo(c).updatePlan(parseId(c), input))) throw AppError.notFound("Plan not found");
    return c.json({ data: { updated: true } });
  });

  // ── Subscriptions ─────────────────────────────────────────────────────
  router.get("/subscriptions", async (c) => {
    const parsed = listSubscriptionsQuerySchema.safeParse(c.req.query());
    if (!parsed.success) throw AppError.badRequest("Invalid query", parsed.error.issues);
    const { userId, cursor, limit } = parsed.data;
    return c.json({ data: await getRepo(c).listSubscriptions(userId, cursor, limit) });
  });

  router.post("/subscriptions", async (c) => {
    const input = await parseBody(c, assignSubscriptionSchema);
    return c.json({ data: await getService(c).assignSubscription(input) }, 201);
  });

  router.post("/subscriptions/:id/cancel", async (c) => {
    if (!(await getRepo(c).cancel(parseId(c)))) throw AppError.notFound("Active subscription not found");
    return c.json({ data: { canceled: true } });
  });

  // ── Invoices ──────────────────────────────────────────────────────────
  router.get("/invoices", async (c) => {
    const parsed = listInvoicesQuerySchema.safeParse(c.req.query());
    if (!parsed.success) throw AppError.badRequest("Invalid query", parsed.error.issues);
    return c.json({ data: await getRepo(c).listInvoices(parsed.data) });
  });

  // ManualProvider's "webhook": idempotent pending→paid transition (§6d).
  router.post("/invoices/:id/mark-paid", async (c) => {
    return c.json({ data: await getService(c).markInvoicePaid(parseId(c)) });
  });

  return router;
}
