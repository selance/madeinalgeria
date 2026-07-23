import { describe, expect, it } from "vitest";
import { EmailRateLimiter, type KVStore } from "./rate-limiter";

function fakeKv(): KVStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    async get(key) {
      return data.get(key) ?? null;
    },
    async put(key, value) {
      data.set(key, value);
    },
  };
}

describe("EmailRateLimiter", () => {
  it("allows up to 5 sends per user per hour, then blocks", async () => {
    const limiter = new EmailRateLimiter(fakeKv(), () => 1_000_000);
    for (let i = 0; i < 5; i++) {
      expect((await limiter.checkAndIncrement("u1", "user", "reset")).allowed).toBe(true);
    }
    const sixth = await limiter.checkAndIncrement("u1", "user", "reset");
    expect(sixth.allowed).toBe(false);
    expect(sixth.retryAfter).toBe(3600); // 60-min block
  });

  it("stays blocked until blockedUntil passes, then resets", async () => {
    let now = 0;
    const limiter = new EmailRateLimiter(fakeKv(), () => now);
    for (let i = 0; i < 6; i++) await limiter.checkAndIncrement("u1", "user", "reset");

    now = 30 * 60 * 1000; // 30 min into a 60-min block
    expect((await limiter.checkAndIncrement("u1", "user", "reset")).allowed).toBe(false);

    now = 61 * 60 * 1000; // block expired
    expect((await limiter.checkAndIncrement("u1", "user", "reset")).allowed).toBe(true);
  });

  it("resets the window after windowMinutes", async () => {
    let now = 0;
    const limiter = new EmailRateLimiter(fakeKv(), () => now);
    for (let i = 0; i < 5; i++) await limiter.checkAndIncrement("u1", "user", "reset");

    now = 61 * 60 * 1000; // past the 60-min window — no block was set
    expect((await limiter.checkAndIncrement("u1", "user", "reset")).allowed).toBe(true);
  });

  it("keys counters by email kind and identifier independently", async () => {
    const limiter = new EmailRateLimiter(fakeKv(), () => 0);
    for (let i = 0; i < 6; i++) await limiter.checkAndIncrement("u1", "user", "reset");
    expect((await limiter.checkAndIncrement("u1", "user", "verification")).allowed).toBe(true);
    expect((await limiter.checkAndIncrement("u2", "user", "reset")).allowed).toBe(true);
  });

  it("multi-layer: blocks on email even without a user id", async () => {
    const kv = fakeKv();
    const limiter = new EmailRateLimiter(kv, () => 0);
    for (let i = 0; i < 6; i++) {
      await limiter.checkAndIncrement("a@b.com", "email", "change");
    }
    const check = await limiter.checkMultiLayer(null, "A@B.com", "1.2.3.4", "change");
    expect(check.allowed).toBe(false);
  });

  it("fails open if KV throws", async () => {
    const broken: KVStore = {
      get: async () => {
        throw new Error("kv down");
      },
      put: async () => {},
    };
    const limiter = new EmailRateLimiter(broken);
    expect((await limiter.checkAndIncrement("u1", "user", "reset")).allowed).toBe(true);
  });
});
