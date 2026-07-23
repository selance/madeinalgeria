import { Hono, type Context } from "hono";
import { z } from "zod";
import { AppError } from "@mia/core";
import { newsletterTokenSchema, subscribeNewsletterSchema } from "@mia/contracts";
import type { NotificationsService } from "./service";

/**
 * Public newsletter + unsubscribe endpoints — mounted under /v1/newsletter by
 * apps/api with NO requireUser. These are the API's only anonymous writes, so
 * they carry a per-IP rate limit at the mount and a per-address resend cooldown
 * in the service. Double opt-in means an address is worthless until its emailed
 * link is confirmed.
 */

export interface NotificationsRouterDeps {
  getService: (c: Context) => NotificationsService;
}

async function parseBody<T>(c: Context, schema: z.ZodType<T>): Promise<T> {
  const json = await c.req.json().catch(() => {
    throw AppError.badRequest("Invalid JSON body");
  });
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw AppError.badRequest("Validation failed", parsed.error.issues);
  return parsed.data;
}

const addressSignature = z.object({ e: z.email().max(254), s: z.string().min(8).max(128) });

export function createNotificationsRouter({ getService }: NotificationsRouterDeps) {
  const router = new Hono();

  router.post("/subscribe", async (c) => {
    const { email } = await parseBody(c, subscribeNewsletterSchema);
    return c.json({ data: await getService(c).subscribeNewsletter(email) }, 202);
  });

  router.post("/confirm", async (c) => {
    const { token } = await parseBody(c, newsletterTokenSchema);
    return c.json({ data: await getService(c).confirmNewsletter(token) });
  });

  /**
   * Unsubscribe. Two shapes, because bulk mail reaches two kinds of recipient:
   *  - `{ token }`  — a newsletter subscriber, using their opt-in token.
   *  - `?e=&s=`     — any address, using the HMAC signature we mailed them.
   *    Campaign recipients are pasted in by an admin and hold no token, and a
   *    signature also lets mail clients POST here with no body at all, which is
   *    exactly what RFC 8058 one-click unsubscribe does.
   */
  router.post("/unsubscribe", async (c) => {
    const query = addressSignature.safeParse(c.req.query());
    if (query.success) {
      return c.json({ data: await getService(c).unsubscribeAddress(query.data.e, query.data.s) });
    }
    const { token } = await parseBody(c, newsletterTokenSchema);
    return c.json({ data: await getService(c).unsubscribeNewsletter(token) });
  });

  return router;
}
