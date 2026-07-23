import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

/**
 * The whole security posture of admin-api in one file: requireAdmin mounts
 * before every route except /health and /v1/auth, so
 *  - an anonymous caller is 401,
 *  - a signed-in NON-admin is 403,
 *  - only role='admin' gets through (200 with a { data } envelope).
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

// Any route behind requireAdmin that returns a { data } envelope.
const ADMIN_ROUTE = "/v1/notifications/templates";

const USER = { email: "gate@example.com", password: "Str0ngPassw0rd!", name: "Gate" };

async function signUp(): Promise<string> {
  const res = await app.request("/v1/auth/sign-up/email", json(USER), env);
  expect(res.status).toBe(200);
  return ((await res.json()) as { token: string }).token;
}

async function signIn(): Promise<string> {
  const res = await app.request(
    "/v1/auth/sign-in/email",
    json({ email: USER.email, password: USER.password }),
    env,
  );
  expect(res.status).toBe(200);
  return ((await res.json()) as { token: string }).token;
}

describe("admin gate (requireAdmin)", () => {
  it("401s an anonymous request to an admin route", async () => {
    const res = await app.request(ADMIN_ROUTE, {}, env);
    expect(res.status).toBe(401);
  });

  it("403s a signed-in non-admin, then 200s once promoted to admin", async () => {
    // Signed-in normal user → forbidden.
    const userToken = await signUp();
    const forbidden = await app.request(ADMIN_ROUTE, withToken(userToken), env);
    expect(forbidden.status).toBe(403);

    // Promote in the core DB, then mint a fresh session so it carries the new
    // role (the prior session's user is cached in KV secondaryStorage).
    await env.DB_CORE.prepare("UPDATE user SET role = 'admin' WHERE email = ?").bind(USER.email).run();
    const adminToken = await signIn();

    const ok = await app.request(ADMIN_ROUTE, withToken(adminToken), env);
    expect(ok.status).toBe(200);
    const body = (await ok.json()) as { data: unknown };
    expect(body).toHaveProperty("data");
  });
});
