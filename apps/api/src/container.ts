import { createAuth, type Auth } from "@mia/auth";
import type { JobQueue } from "@mia/contracts";
import { createDbCore, type DbCore } from "@mia/db-core";
import { createConsoleSender, createResendSender, type EmailSender } from "@mia/email";
import { IdentityRepo, IdentityService } from "@mia/module-identity";
import { BillingRepo, BillingService, manualProvider } from "@mia/module-billing";
import { NotificationsRepo, NotificationsService, signEmail } from "@mia/module-notifications";
import { ReferenceRepo, ReferenceService } from "@mia/module-reference";
import { createGitHubClient, ProjectsRepo, ProjectsService } from "@mia/module-projects";
import { getVars, type Bindings } from "./env";

/**
 * Composition root — wires module deps once per isolate (plan §1).
 * When a module is extracted to its own Worker, only this file changes
 * (implementation swapped for a service-binding RPC stub).
 */

let auth: Auth | undefined;
let dbCore: DbCore | undefined;
let referenceRepo: ReferenceRepo | undefined;
let referenceService: ReferenceService | undefined;
let identityService: IdentityService | undefined;
let billingRepo: BillingRepo | undefined;
let billingService: BillingService | undefined;
let notificationsRepo: NotificationsRepo | undefined;
let notificationsService: NotificationsService | undefined;
let projectsRepo: ProjectsRepo | undefined;
let projectsService: ProjectsService | undefined;

export function getDbCore(env: Bindings): DbCore {
  dbCore ??= createDbCore(env.DB_CORE);
  return dbCore;
}

export function getAuth(env: Bindings): Auth {
  if (!auth) {
    const vars = getVars(env);
    auth = createAuth({
      db: env.DB_CORE,
      kv: env.KV,
      secret: vars.AUTH_SECRET,
      baseURL: vars.AUTH_BASE_URL,
      trustedOrigins: vars.TRUSTED_ORIGINS,
      // Cross-subdomain cookies only when an apex domain is configured — applied
      // in production by createAuth (host-only cookies otherwise).
      cookieDomain: vars.COOKIE_DOMAIN,
      google:
        env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
          ? { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }
          : undefined,
      sender: env.RESEND_API_KEY
        ? createResendSender(env.RESEND_API_KEY, env.AUTH_EMAIL_FROM)
        : createConsoleSender(),
      environment: vars.ENVIRONMENT,
    });
  }
  return auth;
}

// ── Reference (KV-cached public reads) ───────────────────────────────────

export function getReferenceRepo(env: Bindings): ReferenceRepo {
  referenceRepo ??= new ReferenceRepo(getDbCore(env));
  return referenceRepo;
}

export function getReferenceService(env: Bindings): ReferenceService {
  referenceService ??= new ReferenceService(getReferenceRepo(env), env.KV);
  return referenceService;
}

// ── Projects (directory + submissions) ───────────────────────────────────

export function getProjectsRepo(env: Bindings): ProjectsRepo {
  projectsRepo ??= new ProjectsRepo(getDbCore(env));
  return projectsRepo;
}

export function getProjectsService(env: Bindings): ProjectsService {
  projectsService ??= new ProjectsService(
    getProjectsRepo(env),
    env.KV,
    createGitHubClient(env.GITHUB_TOKEN),
  );
  return projectsService;
}

// ── Identity + billing ───────────────────────────────────────────────────

export function getIdentityService(env: Bindings): IdentityService {
  identityService ??= new IdentityService(new IdentityRepo(getDbCore(env)));
  return identityService;
}

export function getBillingRepo(env: Bindings): BillingRepo {
  billingRepo ??= new BillingRepo(getDbCore(env));
  return billingRepo;
}

export function getBillingService(env: Bindings): BillingService {
  billingService ??= new BillingService(getBillingRepo(env), manualProvider);
  return billingService;
}

// ── Email + jobs ─────────────────────────────────────────────────────────

export function getSender(env: Bindings): EmailSender {
  return env.RESEND_API_KEY
    ? createResendSender(env.RESEND_API_KEY, env.AUTH_EMAIL_FROM)
    : createConsoleSender();
}

/**
 * Product notifications send from the mail.madeinalgeria.dev SUBDOMAIN sender —
 * separate reputation from root-domain auth mail (deliverability isolation).
 */
export function getNotifySender(env: Bindings): EmailSender {
  return env.RESEND_API_KEY && env.NOTIFY_EMAIL_FROM
    ? createResendSender(env.RESEND_API_KEY, env.NOTIFY_EMAIL_FROM)
    : getSender(env);
}

export function getJobQueue(env: Bindings): JobQueue {
  return {
    async enqueue(job) {
      await env.JOBS.send(job);
    },
  };
}

// ── Notifications (newsletter + campaigns) ───────────────────────────────

/** Suppression-list reads outside the notifications service. */
export function getNotificationsRepo(env: Bindings): NotificationsRepo {
  notificationsRepo ??= new NotificationsRepo(getDbCore(env));
  return notificationsRepo;
}

/** Link base + the key that signs unsubscribe links for addresses we hold no token for. */
function notificationsConfig(env: Bindings) {
  return {
    webBaseUrl: env.WEB_BASE_URL ?? "https://www.madeinalgeria.dev",
    unsubscribeSecret: getVars(env).AUTH_SECRET,
  };
}

/**
 * Signed unsubscribe link for bulk/product mail sent outside the campaign
 * pipeline — verified by the public /newsletter/unsubscribe route, so one
 * opt-out suppresses campaigns and digests alike.
 */
export async function unsubscribeUrlFor(env: Bindings, email: string): Promise<string> {
  const base = (env.WEB_BASE_URL ?? "https://www.madeinalgeria.dev").replace(/\/$/, "");
  const signature = await signEmail(email, getVars(env).AUTH_SECRET);
  return `${base}/newsletter/unsubscribe?e=${encodeURIComponent(email)}&s=${signature}`;
}

export function getNotificationsService(env: Bindings): NotificationsService {
  notificationsService ??= new NotificationsService(
    getNotificationsRepo(env),
    getJobQueue(env),
    // Bulk mail (campaigns, newsletter) sends from the mail.madeinalgeria.dev
    // identity, NEVER the auth sender: a spam complaint on a blast must not cost
    // the auth domain its reputation — password resets ride on it.
    getNotifySender(env),
    notificationsConfig(env),
  );
  return notificationsService;
}
