import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { toErrorEnvelope } from "@mia/core";
import { requireAdmin } from "@mia/auth";
import { createBillingAdminRouter } from "@mia/module-billing";
import { createIdentityAdminRouter } from "@mia/module-identity";
import { createNotificationsAdminRouter } from "@mia/module-notifications";
import { createReferenceAdminRouter, createReferenceRouter } from "@mia/module-reference";
import { createProjectsAdminRouter } from "@mia/module-projects";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { getVars, type AppEnv, type Bindings } from "./env";
import { loginRateLimit, rateLimit } from "./middleware/rate-limit";
import {
  getAuth,
  getBillingRepo,
  getBillingService,
  getNotificationsService,
  getProjectsService,
  getReferenceRepo,
  getReferenceService,
} from "./container";

/** Admins must periodically re-authenticate — reject sessions older than this. */
const MAX_ADMIN_SESSION_AGE_MS = 12 * 60 * 60 * 1000; // 12h

/**
 * The ONLY auth endpoints reachable over HTTP on the admin host. Everything
 * else better-auth would expose (sign-up, social sign-in, admin-plugin user
 * management, list-sessions, delete-user, …) is 404'd — default-deny shrinks
 * the surface an attacker can touch to just login, logout, session read, and
 * self-service password/email recovery.
 */
const ALLOWED_AUTH_PATHS = new Set([
  "sign-in/email",
  "sign-out",
  "get-session",
  "forget-password",
  "reset-password",
  "verify-email",
]);

export function createApp() {
  const app = new Hono<AppEnv>();

  app.use("*", requestId());

  // Transport/response hardening. CORP/COOP/COEP are disabled: the dashboard
  // SPA fetches this API cross-subdomain (admin. → admin-api.), and the default
  // same-origin isolation headers would block those credentialed XHRs. CORS +
  // TRUSTED_ORIGINS remain the origin gate. CSP for the JSON API is inert, so
  // it's carried by the SPA's _headers instead.
  app.use(
    "*",
    secureHeaders({
      strictTransportSecurity: "max-age=63072000; includeSubDomains; preload",
      xFrameOptions: "DENY",
      xContentTypeOptions: "nosniff",
      referrerPolicy: "no-referrer",
      crossOriginResourcePolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use("*", async (c, next) => {
    await next();
    c.header("X-Robots-Tag", "noindex, nofollow");
  });

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

  // The ONLY pre-auth routes: health check + the safelisted auth endpoints
  // (admins must be able to sign in). /health stays unthrottled.
  app.get("/health", (c) =>
    c.json({ status: "ok", service: "admin-api", environment: getVars(c.env).ENVIRONMENT }),
  );

  // Coarse burst cap on everything under /v1; a tight cap on the login endpoint.
  app.use("/v1/*", rateLimit);
  app.use("/v1/auth/sign-in/email", loginRateLimit);

  app.on(["GET", "POST"], "/v1/auth/*", async (c) => {
    const sub = c.req.path.replace(/^\/v1\/auth\//, "");
    if (!ALLOWED_AUTH_PATHS.has(sub)) {
      return c.json(
        { error: { code: "not_found", message: "Route not found", requestId: c.get("requestId") } },
        404,
      );
    }
    return getAuth(c.env).handler(c.req.raw);
  });

  // Everything below — including any future docs route — requires a verified,
  // allowlisted admin on a fresh session (the v1 lesson, hardened).
  app.use(
    "*",
    requireAdmin((env) => getAuth(env as Bindings), {
      getAllowlist: (env) => getVars(env as Bindings).ADMIN_ALLOWLIST,
      maxSessionAgeMs: MAX_ADMIN_SESSION_AGE_MS,
    }),
  );

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
