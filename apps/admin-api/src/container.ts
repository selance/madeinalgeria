import { createAuth, type Auth } from "@mia/auth";
import type { JobQueue } from "@mia/contracts";
import { createDbCore, type DbCore } from "@mia/db-core";
import { createConsoleSender, createResendSender } from "@mia/email";
import { BillingRepo, BillingService, manualProvider } from "@mia/module-billing";
import { NotificationsRepo, NotificationsService } from "@mia/module-notifications";
import { ReferenceRepo, ReferenceService } from "@mia/module-reference";
import { createGitHubClient, ProjectsRepo, ProjectsService } from "@mia/module-projects";
import { getVars, type Bindings } from "./env";

/** Composition root — same modules as apps/api, admin surface only. */

let auth: Auth | undefined;
let dbCore: DbCore | undefined;
let referenceRepo: ReferenceRepo | undefined;
let referenceService: ReferenceService | undefined;
let projectsRepo: ProjectsRepo | undefined;
let projectsService: ProjectsService | undefined;
let billingRepo: BillingRepo | undefined;
let billingService: BillingService | undefined;
let notificationsService: NotificationsService | undefined;

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

// ── Reference ────────────────────────────────────────────────────────────

export function getReferenceRepo(env: Bindings): ReferenceRepo {
  referenceRepo ??= new ReferenceRepo(getDbCore(env));
  return referenceRepo;
}

export function getReferenceService(env: Bindings): ReferenceService {
  referenceService ??= new ReferenceService(getReferenceRepo(env), env.KV);
  return referenceService;
}

// ── Projects (review queue + editorial writes) ───────────────────────────

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

// ── Billing ──────────────────────────────────────────────────────────────

export function getBillingRepo(env: Bindings): BillingRepo {
  billingRepo ??= new BillingRepo(getDbCore(env));
  return billingRepo;
}

export function getBillingService(env: Bindings): BillingService {
  billingService ??= new BillingService(getBillingRepo(env), manualProvider);
  return billingService;
}

// ── Jobs (producer only — apps/api runs the consumer) ────────────────────

export function getJobQueue(env: Bindings): JobQueue {
  return {
    async enqueue(job) {
      await env.JOBS.send(job);
    },
  };
}

// ── Notifications (templates + campaigns) ────────────────────────────────

export function getNotificationsService(env: Bindings): NotificationsService {
  if (!notificationsService) {
    // Admin only creates/queues campaigns; the actual send runs in apps/api's
    // consumer (from the notify identity), so this sender is just a fallback.
    const sender = env.RESEND_API_KEY
      ? createResendSender(env.RESEND_API_KEY, env.NOTIFY_EMAIL_FROM ?? env.AUTH_EMAIL_FROM)
      : createConsoleSender();
    notificationsService = new NotificationsService(
      new NotificationsRepo(getDbCore(env)),
      getJobQueue(env),
      sender,
      {
        webBaseUrl: env.WEB_BASE_URL ?? "https://www.madeinalgeria.dev",
        unsubscribeSecret: getVars(env).AUTH_SECRET,
      },
    );
  }
  return notificationsService;
}
