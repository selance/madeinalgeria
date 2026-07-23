import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { getAuth } from "../src/container";
import type { Entitlements, Profile } from "@mia/contracts";

const app = createApp();

const json = (method: string, body: unknown, token?: string): RequestInit => ({
  method,
  headers: {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  body: JSON.stringify(body),
});

const withToken = (token: string): RequestInit => ({
  headers: { Authorization: `Bearer ${token}` },
});

describe("/v1/me (identity + billing)", () => {
  let token: string;

  beforeAll(async () => {
    // HTTP sign-up is closed; seed the session through the server API instead.
    const result = (await getAuth(env).api.signUpEmail({
      body: { email: "me@example.com", password: "Str0ngPassw0rd!", name: "Me" },
    })) as { token: string };
    token = result.token;
  });

  it("requires auth on everything under /v1/me", async () => {
    expect((await app.request("/v1/me/profile", {}, env)).status).toBe(401);
    expect((await app.request("/v1/me/subscription", {}, env)).status).toBe(401);
  });

  it("returns an empty profile, then upserts on PUT", async () => {
    const empty = await app.request("/v1/me/profile", withToken(token), env);
    expect(((await empty.json()) as { data: Profile }).data.firstName).toBeNull();

    const updated = await app.request(
      "/v1/me/profile",
      json("PUT", { firstName: "Moncef" }, token),
      env,
    );
    expect(updated.status).toBe(200);
    const { data } = (await updated.json()) as { data: Profile };
    expect(data.firstName).toBe("Moncef");
  });

  it("rejects an invalid avatar url", async () => {
    const res = await app.request("/v1/me/profile", json("PUT", { avatarUrl: "not-a-url" }, token), env);
    expect(res.status).toBe(400);
  });

  it("defaults everyone to the free plan (billing shape)", async () => {
    const res = await app.request("/v1/me/subscription", withToken(token), env);
    expect(res.status).toBe(200);
    const { data } = (await res.json()) as { data: Entitlements };
    expect(data).toEqual({
      planId: null,
      planName: "free",
      features: [],
      status: "free",
      currentPeriodEnd: null,
    });
  });
});
