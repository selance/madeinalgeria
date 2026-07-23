import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

const app = createApp();

/** RATE_LIMITER is unbound in dev/tests, so we inject a fake per request. */
function fakeLimiter(success: boolean) {
  const calls: string[] = [];
  const limiter = {
    limit: async ({ key }: { key: string }) => {
      calls.push(key);
      return { success };
    },
  } as unknown as RateLimit;
  return { limiter, calls };
}

describe("per-IP rate limiting", () => {
  it("429s over-limit requests keyed by cf-connecting-ip", async () => {
    const { limiter, calls } = fakeLimiter(false);
    const res = await app.request(
      "/v1/reference/languages",
      { headers: { "cf-connecting-ip": "203.0.113.9" } },
      { ...env, RATE_LIMITER: limiter },
    );
    expect(res.status).toBe(429);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("rate_limited");
    expect(calls).toEqual(["203.0.113.9"]);
  });

  it("skips limiting for internal calls without cf-connecting-ip (service bindings)", async () => {
    const { limiter, calls } = fakeLimiter(false);
    const res = await app.request(
      "/v1/reference/languages",
      {},
      { ...env, RATE_LIMITER: limiter },
    );
    expect(res.status).toBe(200);
    expect(calls).toEqual([]);
  });
});
