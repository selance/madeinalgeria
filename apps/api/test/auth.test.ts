import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { getAuth } from "../src/container";

/**
 * Public accounts are CLOSED on the API: sign-up, sign-in, and social auth are
 * 404'd at the HTTP layer. Only session read + sign-out remain (for any session
 * created server-side, e.g. by an admin). The server API is not affected by the
 * HTTP allowlist, so tests seed sessions through it directly.
 */

const app = createApp();

const json = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const USER = { email: "ada@example.com", password: "Str0ngPassw0rd!", name: "Ada" };

describe("public auth is closed on the API", () => {
  it("404s sign-up over HTTP", async () => {
    const res = await app.request("/v1/auth/sign-up/email", json(USER), env);
    expect(res.status).toBe(404);
  });

  it("404s sign-in over HTTP", async () => {
    const res = await app.request(
      "/v1/auth/sign-in/email",
      json({ email: USER.email, password: USER.password }),
      env,
    );
    expect(res.status).toBe(404);
  });

  it("404s social sign-in over HTTP", async () => {
    const res = await app.request("/v1/auth/sign-in/social", json({ provider: "google" }), env);
    expect(res.status).toBe(404);
  });

  it("still resolves a session from a bearer token (get-session stays open)", async () => {
    const { token } = (await getAuth(env).api.signUpEmail({ body: USER })) as { token: string };
    const res = await app.request(
      "/v1/auth/get-session",
      { headers: { Authorization: `Bearer ${token}` } },
      env,
    );
    expect(res.status).toBe(200);
    expect(((await res.json()) as { user: { email: string } }).user.email).toBe(USER.email);
  });

  it("returns no session without credentials", async () => {
    const res = await app.request("/v1/auth/get-session", {}, env);
    expect(res.status).toBe(200);
    expect(await res.json()).toBeNull();
  });
});
