import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { getAuth } from "../src/container";

/**
 * The hardened security posture of admin-api in one file. requireAdmin mounts
 * before every route except /health and the safelisted auth endpoints, and now
 * demands: a signed-in, non-banned, role='admin' user, with a verified email,
 * on the ADMIN_ALLOWLIST (test value: gate@example.com). Account creation over
 * HTTP is blocked, and every response carries security headers.
 */

const app = createApp();

const json = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const withToken = (token: string): RequestInit => ({
  headers: { Authorization: `Bearer ${token}` },
});

// Each sign-in comes from a distinct client IP so neither better-auth's own
// per-IP rate limiter (on in production mode) nor ours accumulates across cases.
let ipSeq = 0;
const signInInit = (email: string): RequestInit => {
  const ip = `10.0.0.${++ipSeq}`;
  return {
    method: "POST",
    headers: { "Content-Type": "application/json", "CF-Connecting-IP": ip, "X-Forwarded-For": ip },
    body: JSON.stringify({ email, password: PASSWORD }),
  };
};

// Any route behind requireAdmin that returns a { data } envelope.
const ADMIN_ROUTE = "/v1/notifications/templates";
const PASSWORD = "Str0ngPassw0rd!";

/** Seed a user via the server API — HTTP sign-up is blocked on the admin host. */
async function seedUser(email: string, name: string): Promise<void> {
  try {
    await getAuth(env).api.signUpEmail({ body: { email, password: PASSWORD, name } });
  } catch (error) {
    // Storage persists across cases in this pool — tolerate a re-seed.
    if (!String((error as Error).message).includes("already exists")) throw error;
  }
}

async function signIn(email: string): Promise<string> {
  const res = await app.request("/v1/auth/sign-in/email", signInInit(email), env);
  expect(res.status).toBe(200);
  return ((await res.json()) as { token: string }).token;
}

/**
 * Promote in the core DB. A fresh sign-in afterwards is required so the new
 * role/verified claims land in the session (the prior session's user is cached
 * in KV secondaryStorage).
 */
async function promote(email: string, opts: { verified: boolean }): Promise<void> {
  await env.DB_CORE.prepare("UPDATE user SET role = 'admin', email_verified = ? WHERE email = ?")
    .bind(opts.verified ? 1 : 0, email)
    .run();
}

describe("admin gate (requireAdmin, hardened)", () => {
  it("401s an anonymous request to an admin route", async () => {
    const res = await app.request(ADMIN_ROUTE, {}, env);
    expect(res.status).toBe(401);
  });

  it("blocks account creation over HTTP on the admin host (404)", async () => {
    const res = await app.request(
      "/v1/auth/sign-up/email",
      json({ email: "intruder@example.com", password: PASSWORD, name: "Intruder" }),
      env,
    );
    expect(res.status).toBe(404);
  });

  it("carries security headers on responses", async () => {
    const res = await app.request(ADMIN_ROUTE, {}, env);
    expect(res.headers.get("x-frame-options")).toBe("DENY");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("x-robots-tag")).toContain("noindex");
  });

  it("403s a signed-in non-admin, then 200s once promoted (allowlisted + verified)", async () => {
    await seedUser("gate@example.com", "Gate");
    const userToken = await signIn("gate@example.com");
    const forbidden = await app.request(ADMIN_ROUTE, withToken(userToken), env);
    expect(forbidden.status).toBe(403);

    await promote("gate@example.com", { verified: true });
    const adminToken = await signIn("gate@example.com");
    const ok = await app.request(ADMIN_ROUTE, withToken(adminToken), env);
    expect(ok.status).toBe(200);
    expect(await ok.json()).toHaveProperty("data");
  });

  it("403s an admin whose email is NOT on the allowlist", async () => {
    await seedUser("outsider@example.com", "Outsider");
    await promote("outsider@example.com", { verified: true });
    const token = await signIn("outsider@example.com");
    const res = await app.request(ADMIN_ROUTE, withToken(token), env);
    expect(res.status).toBe(403);
  });

  it("403s an allowlisted admin whose email is unverified", async () => {
    await seedUser("verify@example.com", "Verify");
    await promote("verify@example.com", { verified: false });
    const token = await signIn("verify@example.com");
    const res = await app.request(ADMIN_ROUTE, withToken(token), env);
    expect(res.status).toBe(403);
  });
});
