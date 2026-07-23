import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";

/**
 * Daily submission budget (KV window layer). Requests use an invalid repo URL
 * on purpose: the guard counts BEFORE validation (probing spends budget), the
 * endpoint answers 400 while allowed and 429 once a window is exhausted, and
 * nothing ever reaches GitHub.
 */

const app = createApp();

// Tiny budgets so the test exercises both layers quickly.
const testEnv = { ...env, SUBMIT_IP_DAILY_LIMIT: "3", SUBMIT_GLOBAL_DAILY_LIMIT: "5" };

const submit = (ip?: string) =>
  app.request(
    "/v1/projects/submit",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(ip ? { "cf-connecting-ip": ip } : {}),
      },
      body: JSON.stringify({ repoUrl: "https://gitlab.com/not/github" }),
    },
    testEnv,
  );

beforeEach(async () => {
  // KV persists across tests in this file — reset the windows.
  const keys = await env.KV.list({ prefix: "submit-rl:" });
  await Promise.all(keys.keys.map((k) => env.KV.delete(k.name)));
});

describe("submit daily budget", () => {
  it("caps a single IP at its daily limit", async () => {
    for (let i = 0; i < 3; i++) {
      expect((await submit("203.0.113.1")).status).toBe(400); // counted, fails validation
    }
    const over = await submit("203.0.113.1");
    expect(over.status).toBe(429);
    const body = (await over.json()) as { error: { code: string } };
    expect(body.error.code).toBe("rate_limited");
    expect(over.headers.get("Retry-After")).toBeTruthy();

    // A different IP is unaffected by the per-IP window.
    expect((await submit("203.0.113.2")).status).toBe(400);
  });

  it("caps all IPs together at the global daily limit", async () => {
    // 3 from A + 2 from B fill the global window of 5.
    for (let i = 0; i < 3; i++) await submit("203.0.113.1");
    for (let i = 0; i < 2; i++) expect((await submit("203.0.113.2")).status).toBe(400);

    // C never submitted, but the global window is spent.
    const blocked = await submit("203.0.113.3");
    expect(blocked.status).toBe(429);
  });

  it("skips internal calls without cf-connecting-ip", async () => {
    for (let i = 0; i < 7; i++) {
      expect((await submit()).status).toBe(400); // never 429, never counted
    }
  });
});
