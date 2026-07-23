import { Hono, type Context } from "hono";
import { AppError } from "@mia/core";
import type { ReferenceService } from "./service";

/**
 * Public reference reads — mounted under /v1/reference by apps/api.
 * All responses come from the KV cache after first load.
 */
export function createReferenceRouter(getService: (c: Context) => ReferenceService) {
  const router = new Hono();

  router.get("/languages", async (c) => c.json({ data: await getService(c).listLanguages() }));
  router.get("/countries", async (c) => c.json({ data: await getService(c).listCountries() }));

  router.get("/states", async (c) => {
    const raw = c.req.query("countryId");
    let countryId: number | undefined;
    if (raw !== undefined) {
      countryId = Number(raw);
      if (!Number.isInteger(countryId)) throw AppError.badRequest("countryId must be an integer");
    }
    return c.json({ data: await getService(c).listStates(countryId) });
  });

  router.get("/categories", async (c) => c.json({ data: await getService(c).listCategories() }));

  return router;
}
