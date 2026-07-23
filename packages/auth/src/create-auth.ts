import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, bearer, openAPI } from "better-auth/plugins";
import { createDbCore, schema } from "@mia/db-core";
import {
  changeEmailNotification,
  changePasswordConfirmation,
  deleteAccountConfirmationEmail,
  EmailRateLimiter,
  resetPasswordEmail,
  verificationEmail,
  type EmailSender,
} from "@mia/email";

export interface CreateAuthOptions {
  db: D1Database;
  /** KV namespace: better-auth secondaryStorage (session check = KV read, not D1) + email rate limiter. */
  kv: KVNamespace;
  secret: string;
  /** Env-driven — v1's hardcoded http://localhost:8787 was the iOS auth bug. */
  baseURL: string;
  /** Mounted under /v1 (plan §5). */
  basePath?: string;
  trustedOrigins: string[];
  google?: { clientId: string; clientSecret: string };
  sender: EmailSender;
  environment: "dev" | "staging" | "production";
  /** Apex domain for cross-subdomain cookies in production (e.g. "madeinalgeria.dev"). Omit to keep cookies host-only. */
  cookieDomain?: string;
}

function displayName(name: string | null | undefined, email: string): string {
  return name || email.split("@")[0] || email;
}

export function createAuth(options: CreateAuthOptions) {
  const db = createDbCore(options.db);
  const rateLimiter = new EmailRateLimiter(options.kv);
  const { sender } = options;

  const ipOf = (request: Request | undefined) =>
    request?.headers.get("cf-connecting-ip") ?? null;

  const assertAllowed = async (
    userId: string | null,
    email: string,
    request: Request | undefined,
    kind: "verification" | "reset" | "change" | "delete",
  ) => {
    const check = await rateLimiter.checkMultiLayer(userId, email, ipOf(request), kind);
    if (!check.allowed) {
      throw new Error(check.reason ?? "Too many requests. Please try again later.");
    }
  };

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    secret: options.secret,
    baseURL: options.baseURL,
    basePath: options.basePath ?? "/v1/auth",
    trustedOrigins: options.trustedOrigins,
    // Session lookups hit KV first — the highest-leverage D1 optimization (plan §3).
    secondaryStorage: {
      get: (key) => options.kv.get(`auth:${key}`),
      set: async (key, value, ttl) => {
        await options.kv.put(`auth:${key}`, value, ttl ? { expirationTtl: Math.max(60, ttl) } : undefined);
      },
      delete: async (key) => {
        await options.kv.delete(`auth:${key}`);
      },
    },
    ...(options.google
      ? {
          socialProviders: {
            google: {
              clientId: options.google.clientId,
              clientSecret: options.google.clientSecret,
            },
          },
        }
      : {}),
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      requireEmailVerification: false,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }, request) => {
        await assertAllowed(user.id, user.email, request, "reset");
        const t = resetPasswordEmail({ username: displayName(user.name, user.email), resetUrl: url });
        await sender.send({ to: user.email, ...t });
      },
      onPasswordReset: async ({ user }, request) => {
        // Best-effort confirmation — the reset already succeeded, never throw.
        try {
          const check = await rateLimiter.checkMultiLayer(user.id, user.email, ipOf(request), "reset");
          if (!check.allowed) return;
          const t = changePasswordConfirmation({
            username: displayName(user.name, user.email),
            ipAddress: ipOf(request) ?? undefined,
            userAgent: request?.headers.get("user-agent") ?? undefined,
          });
          await sender.send({ to: user.email, ...t });
        } catch (error) {
          console.error("Password-change confirmation email failed:", error);
        }
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: false,
      sendVerificationEmail: async ({ user, url }, request) => {
        await assertAllowed(user.id, user.email, request, "verification");
        const t = verificationEmail({ username: displayName(user.name, user.email), verificationUrl: url });
        await sender.send({ to: user.email, ...t });
      },
    },
    user: {
      deleteUser: {
        enabled: true,
        sendDeleteAccountVerification: async ({ user, url }, request) => {
          await assertAllowed(user.id, user.email, request, "delete");
          const t = deleteAccountConfirmationEmail({
            username: displayName(user.name, user.email),
            confirmationUrl: url,
          });
          await sender.send({ to: user.email, ...t });
        },
      },
      changeEmail: {
        enabled: true,
        // better-auth ≥1.6: the approval link goes to the CURRENT address;
        // after approval, better-auth sends the standard verification email to
        // the new address itself. (Doubles as the security alert v1 sent.)
        sendChangeEmailConfirmation: async ({ user, newEmail, url }, request) => {
          await assertAllowed(user.id, user.email, request, "change");
          // Also limit the target address (anti-enumeration, as in v1).
          await assertAllowed(null, newEmail, request, "change");

          const confirm = changeEmailNotification({
            username: displayName(user.name, user.email),
            oldEmail: user.email,
            newEmail,
            confirmUrl: url,
          });
          await sender.send({ to: user.email, ...confirm });
        },
      },
    },
    ...(options.environment === "production" && options.cookieDomain
      ? {
          advanced: {
            crossSubDomainCookies: { enabled: true, domain: options.cookieDomain },
            // better-auth's prescribed fix for OAuth state_mismatch across
            // subdomains: Lax state cookies get stripped between the app
            // subdomain XHR and Google's top-level callback navigation.
            defaultCookieAttributes: { sameSite: "none" as const, secure: true },
          },
        }
      : {}),
    plugins: [
      // Bearer tokens for mobile/iOS (Keychain) — sidesteps ITP/webview cookie jars (plan §4).
      bearer(),
      admin({
        defaultRole: "user",
        adminRoles: ["admin"],
      }),
      // Auth OpenAPI reference only off production.
      ...(options.environment !== "production" ? [openAPI()] : []),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
