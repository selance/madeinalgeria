import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { consoleOutbox } from "@mia/email";
import { createApp } from "../src/app";

const app = createApp();

const json = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const USER = { email: "ada@example.com", password: "Str0ngPassw0rd!", name: "Ada" };

describe("auth flows (Phase 2 milestone)", () => {
  // Sign up once; later tests reuse the account (single worker, shared storage per file).
  let signupToken: string;

  beforeAll(async () => {
    const res = await app.request("/v1/auth/sign-up/email", json(USER), env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { token: string; user: { email: string; role: string } };
    expect(body.user.email).toBe(USER.email);
    expect(body.user.role).toBe("user");
    signupToken = body.token;
    expect(signupToken).toBeTruthy();
  });

  it("rejects a duplicate sign-up for the same email", async () => {
    const res = await app.request("/v1/auth/sign-up/email", json(USER), env);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("signs in with the correct password", async () => {
    const res = await app.request(
      "/v1/auth/sign-in/email",
      json({ email: USER.email, password: USER.password }),
      env,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { token: string };
    expect(body.token).toBeTruthy();
  });

  it("rejects a wrong password", async () => {
    const res = await app.request(
      "/v1/auth/sign-in/email",
      json({ email: USER.email, password: "wrong-password-123" }),
      env,
    );
    expect(res.status).toBe(401);
  });

  it("resolves the session from a bearer token (mobile path)", async () => {
    const res = await app.request(
      "/v1/auth/get-session",
      { headers: { Authorization: `Bearer ${signupToken}` } },
      env,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: { email: string } } | null;
    expect(body?.user.email).toBe(USER.email);
  });

  it("returns no session without credentials", async () => {
    const res = await app.request("/v1/auth/get-session", {}, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown;
    expect(body).toBeNull();
  });

  it("accepts a password-reset request for an existing user", async () => {
    const res = await app.request(
      "/v1/auth/request-password-reset",
      json({ email: USER.email, redirectTo: "http://localhost:3000/reset" }),
      env,
    );
    expect(res.status).toBe(200);
  });

  it("emails a reset link whose token actually resets the password", async () => {
    await app.request(
      "/v1/auth/request-password-reset",
      json({ email: USER.email, redirectTo: "http://localhost:3000/reset" }),
      env,
    );

    // The dev sender keeps an outbox — grab the URL a user would click.
    const mail = [...consoleOutbox].reverse().find((m) => m.subject.includes("Reset"));
    expect(mail).toBeDefined();
    const token = /reset-password\/([A-Za-z0-9_-]+)/.exec(mail!.html)?.[1];
    expect(token).toBeTruthy();

    const reset = await app.request(
      "/v1/auth/reset-password",
      json({ newPassword: "N3wPassw0rd!!", token }),
      env,
    );
    expect(reset.status).toBe(200);

    const signIn = await app.request(
      "/v1/auth/sign-in/email",
      json({ email: USER.email, password: "N3wPassw0rd!!" }),
      env,
    );
    expect(signIn.status).toBe(200);
  });
});
