import { z } from "zod";
import type { Job } from "@mia/contracts";

/**
 * Worker bindings for the public API. Single core DB (auth/identity/billing/
 * reference/notifications) — no per-market catalog binding in the template.
 */
export interface Bindings {
  ENVIRONMENT: string;
  AUTH_BASE_URL: string;
  TRUSTED_ORIGINS: string;
  /** Apex domain for cross-subdomain cookies (production only, when set). */
  COOKIE_DOMAIN?: string;
  GOOGLE_CLIENT_ID?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  /** Public origin of the site — unsubscribe links in bulk mail point here. */
  WEB_BASE_URL?: string;
  /** Public origin of the dashboard SPA — email CTA links point here. */
  APP_BASE_URL?: string;
  /**
   * Product-notification sender. A SUBDOMAIN address (mail.madeinalgeria.dev) so
   * notification reputation never taints root-domain auth mail. The subdomain
   * must be verified in Resend (SPF/DKIM) before sends succeed.
   */
  NOTIFY_EMAIL_FROM?: string;
  /**
   * Auth/transactional sender identity — hello@auth.madeinalgeria.dev, a
   * dedicated subdomain verified in Resend (SPF/DKIM), separate from the
   * bulk-mail subdomain. Never a "no-reply" address (inbox providers score
   * unanswerable Froms against you).
   */
  AUTH_EMAIL_FROM?: string;
  // Secrets (wrangler secret put / .dev.vars):
  AUTH_SECRET: string;
  GOOGLE_CLIENT_SECRET?: string;
  RESEND_API_KEY?: string;
  /**
   * GitHub API token for submission-metadata fetches. Optional — the client
   * degrades to unauthenticated calls (shared 60 req/h per egress IP), so set
   * it on deployed envs.
   */
  GITHUB_TOKEN?: string;
  /** CF Images token — enables POST /v1/images/upload (503 until set). */
  CLOUDFLARE_IMAGES_API_TOKEN?: string;
  // Platform bindings:
  DB_CORE: D1Database;
  KV: KVNamespace;
  JOBS: Queue<Job>;
  /** Native rate-limit binding — staging/production only. */
  RATE_LIMITER?: RateLimit;
  /** Newsletter opt-in: the API's only anonymous write, so it gets a tight budget. */
  NEWSLETTER_RATE_LIMITER?: RateLimit;
  /** Project submissions: anonymous write + an upstream GitHub fetch per call. */
  PROJECT_SUBMIT_RATE_LIMITER?: RateLimit;
  /** Daily submission budgets (KV-window layer) — integers as strings; code defaults 10 / 300. */
  SUBMIT_IP_DAILY_LIMIT?: string;
  SUBMIT_GLOBAL_DAILY_LIMIT?: string;
}

const varsSchema = z.object({
  ENVIRONMENT: z.enum(["dev", "staging", "production"]),
  AUTH_BASE_URL: z.url(),
  TRUSTED_ORIGINS: z
    .string()
    .transform((s) => s.split(",").map((o) => o.trim()).filter(Boolean)),
  COOKIE_DOMAIN: z.string().optional(),
  AUTH_SECRET: z.string().min(32),
});

export type Vars = z.infer<typeof varsSchema>;

let validated: Vars | undefined;

/** Validates vars/secrets once per isolate; throws loudly on misconfiguration. */
export function getVars(env: Bindings): Vars {
  validated ??= varsSchema.parse(env);
  return validated;
}

export interface AppEnv {
  Bindings: Bindings;
  Variables: {
    requestId: string;
    user?: { id: string; name: string | null; email: string | null };
  };
}
