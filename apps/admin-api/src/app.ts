import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { toErrorEnvelope } from "@mia/core";
import { requireAdmin } from "@mia/auth";
import { createBillingAdminRouter } from "@mia/module-billing";
import { createIdentityAdminRouter } from "@mia/module-identity";
import { createNotificationsAdminRouter } from "@mia/module-notifications";
import { createReferenceAdminRouter, createReferenceRouter } from "@mia/module-reference";
import { createProjectsAdminRouter } from "@mia/module-projects";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { getVars, type AppEnv, type Bindings } from "./env";
import {
  getAuth,
  getBillingRepo,
  getBillingService,
  getNotificationsService,
  getProjectsService,
  getReferenceRepo,
  getReferenceService,
} from "./container";

export function createApp() {
  const app = new Hono<AppEnv>();

  app.use("*", requestId());

  // Must register before requireAdmin so preflight OPTIONS (which carry no
  // credentials by design) are answered instead of 401'd.
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

  // The ONLY pre-auth routes: health check + the auth handler itself
  // (admins must be able to sign in).
  app.get("/health", (c) =>
    c.json({ status: "ok", service: "admin-api", environment: getVars(c.env).ENVIRONMENT }),
  );

  app.on(["GET", "POST"], "/v1/auth/*", (c) => getAuth(c.env).handler(c.req.raw));

  // Everything below — including any future docs route — requires admin (the v1 lesson).
  app.use("*", requireAdmin((env) => getAuth(env as Bindings)));

  // Reference reads + admin writes (same routers the public API mounts — the
  // admin panel talks to ONE host). requireAdmin already gates everything here.
  app.route(
    "/v1/reference",
    createReferenceRouter((c) => getReferenceService(c.env as Bindings)),
  );
  app.route(
    "/v1/reference",
    createReferenceAdminRouter({
      getRepo: (c: Context) => getReferenceRepo(c.env as Bindings),
      getService: (c: Context) => getReferenceService(c.env as Bindings),
    }),
  );

  // Projects: review queue + editorial writes (list/counts/review/edit/refresh
  // — the admin router is self-sufficient, no public read router needed here).
  app.route(
    "/v1/projects",
    createProjectsAdminRouter({
      getService: (c: Context) => getProjectsService(c.env as Bindings),
    }),
  );

  // User administration — wraps better-auth's admin plugin (session revocation
  // and role semantics stay the library's problem).
  app.route(
    "/v1/users",
    createIdentityAdminRouter({ getAuth: (c: Context) => getAuth(c.env as Bindings) }),
  );

  // Billing: plans / subscriptions / invoices (ManualProvider only).
  app.route(
    "/v1/billing",
    createBillingAdminRouter({
      getRepo: (c: Context) => getBillingRepo(c.env as Bindings),
      getService: (c: Context) => getBillingService(c.env as Bindings),
    }),
  );

  // Notifications: email templates + campaigns (queue fan-out).
  app.route(
    "/v1/notifications",
    createNotificationsAdminRouter({
      getService: (c: Context) => getNotificationsService(c.env as Bindings),
    }),
  );

  return app;
}
