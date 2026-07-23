import { z } from "zod";
import type { Job } from "@mia/contracts";

/** Kept in lockstep with apps/api — same core DB/KV, different security posture. */
export interface Bindings {
  ENVIRONMENT: string;
  AUTH_BASE_URL: string;
  TRUSTED_ORIGINS: string;
  /** Apex domain for cross-subdomain cookies (production only, when set). */
  COOKIE_DOMAIN?: string;
  /** Public origin of the dashboard SPA — email CTA links point here. */
  APP_BASE_URL?: string;
  /** Public origin of the site — unsubscribe links in bulk mail point here. */
  WEB_BASE_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  // Secrets (wrangler secret put / .dev.vars):
  AUTH_SECRET: string;
  GOOGLE_CLIENT_SECRET?: string;
  RESEND_API_KEY?: string;
  /** GitHub token for the project-refresh action. Optional; mirrors apps/api. */
  GITHUB_TOKEN?: string;
  /** Auth/transactional From — never "no-reply"; mirrors apps/api. */
  AUTH_EMAIL_FROM?: string;
  /** Product-notification (subdomain) From for bulk/campaign mail. */
  NOTIFY_EMAIL_FROM?: string;
  /** Cloudflare Images token — logo uploads. */
  CLOUDFLARE_IMAGES_API_TOKEN?: string;
  // Platform bindings (JOBS is producer-only here; apps/api consumes):
  DB_CORE: D1Database;
  KV: KVNamespace;
  JOBS: Queue<Job>;
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

export function getVars(env: Bindings): Vars {
  validated ??= varsSchema.parse(env);
  return validated;
}

export interface AppEnv {
  Bindings: Bindings;
  Variables: {
    requestId: string;
    adminUser: { id: string; email: string };
  };
}
