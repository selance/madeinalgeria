import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { toErrorEnvelope } from "@mia/core";
import { createIdentityRouter } from "@mia/module-identity";
import { createBillingRouter } from "@mia/module-billing";
import { createNotificationsRouter } from "@mia/module-notifications";
import { createReferenceRouter } from "@mia/module-reference";
import { createProjectsRouter } from "@mia/module-projects";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { getVars, type AppEnv, type Bindings } from "./env";
import {
  getAuth,
  getBillingService,
  getIdentityService,
  getNotificationsService,
  getProjectsService,
  getReferenceService,
} from "./container";
import {
  newsletterRateLimit,
  projectSubmitDailyLimit,
  projectSubmitRateLimit,
  rateLimit,
} from "./middleware/rate-limit";
import { requireUser } from "./middleware/user";
import { createImagesRouter } from "./routes/images";

export function createApp() {
  const app = new Hono<AppEnv>();

  app.use("*", requestId());

  // Browser frontends live on separate origins (www/app subdomains, local
  // Vite/Astro dev servers). Echo CORS only for the origins better-auth
  // already trusts; credentials enabled for cookie sessions.
  app.use(
    "*",
    cors({
      origin: (origin, c) =>
        getVars(c.env as Bindings).TRUSTED_ORIGINS.includes(origin) ? origin : null,
      credentials: true,
      allowHeaders: ["Content-Type", "Authorization"],
      maxAge: 86400,
    }),
  );

  app.onError((err, c) => {
    const { status, body } = toErrorEnvelope(err, c.get("requestId"));
    if (status >= 500) console.error(err);
    return c.json(body, status as ContentfulStatusCode);
  });

  app.notFound((c) =>
    c.json({ error: { code: "not_found", message: "Route not found", requestId: c.get("requestId") } }, 404),
  );

  app.get("/health", (c) =>
    c.json({ status: "ok", service: "api", environment: getVars(c.env).ENVIRONMENT }),
  );

  // Per-IP rate limiting on the whole API surface (no-op where unbound).
  app.use("/v1/*", rateLimit);

  // better-auth handles everything under /v1/auth (basePath set in @mia/auth).
  app.on(["GET", "POST"], "/v1/auth/*", (c) => getAuth(c.env).handler(c.req.raw));

  // Public reference reads (KV-cached).
  app.route(
    "/v1/reference",
    createReferenceRouter((c) => getReferenceService(c.env as Bindings)),
  );

  // Public projects directory + anonymous submissions. The submit endpoint
  // writes D1 and fetches GitHub, so it carries a burst budget (native
  // binding, 3/min) plus a KV daily budget (per-IP and global).
  app.use("/v1/projects/submit", projectSubmitRateLimit, projectSubmitDailyLimit);
  app.route(
    "/v1/projects",
    createProjectsRouter({ getService: (c: Context) => getProjectsService(c.env as Bindings) }),
  );

  const getUser = (c: Context) => c.get("user") as NonNullable<AppEnv["Variables"]["user"]>;

  // Image uploads (Cloudflare Images) — any signed-in user.
  app.use("/v1/images/*", requireUser(getAuth));
  app.route("/v1/images", createImagesRouter());

  // The signed-in caller's own surface: profile (identity) + subscription
  // (billing), both mounted on /v1/me behind requireUser.
  app.use("/v1/me/*", requireUser(getAuth));
  app.route(
    "/v1/me",
    createIdentityRouter({
      getService: (c: Context) => getIdentityService(c.env as Bindings),
      getUser,
    }),
  );
  app.route(
    "/v1/me",
    createBillingRouter({
      getService: (c: Context) => getBillingService(c.env as Bindings),
      getUser,
    }),
  );

  // Newsletter opt-in from the public footer — the API's only anonymous write,
  // hence its own tight per-IP budget.
  app.use("/v1/newsletter/*", newsletterRateLimit);
  app.route(
    "/v1/newsletter",
    createNotificationsRouter({
      getService: (c: Context) => getNotificationsService(c.env as Bindings),
    }),
  );

  return app;
}
