import { Hono, type Context } from "hono";
import type { BillingService } from "./service";

/** Public billing surface — just the caller's entitlements (mounted under /v1/me). */

export interface BillingRouterDeps {
  getService: (c: Context) => BillingService;
  getUser: (c: Context) => { id: string };
}

export function createBillingRouter({ getService, getUser }: BillingRouterDeps) {
  const router = new Hono();

  router.get("/subscription", async (c) => {
    return c.json({ data: await getService(c).getEntitlements(getUser(c).id) });
  });

  return router;
}
