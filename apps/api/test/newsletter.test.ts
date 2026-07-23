import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

/**
 * The newsletter opt-in is the API's only anonymous write, so these cover the
 * things that make that safe: it accepts no session, validates the address, and
 * stores nothing usable until the emailed link is confirmed.
 */

const app = createApp();

const post = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function row(email: string) {
  return env.DB_CORE.prepare("SELECT * FROM newsletter_subscribers WHERE email = ?")
    .bind(email)
    .first<{ email: string; status: string; token_hash: string; confirmed_at: number | null }>();
}

/** Seed a confirmable row directly — the raw token normally only exists in the email. */
async function seed(email: string, token: string, expiresAt: number) {
  const now = Math.floor(Date.now() / 1000);
  await env.DB_CORE.prepare(
    `INSERT INTO newsletter_subscribers
     (email, status, token_hash, token_expires_at, source, created_at, updated_at)
     VALUES (?, 'pending', ?, ?, 'web_footer', ?, ?)`,
  )
    .bind(email, await sha256Hex(token), expiresAt, now, now)
    .run();
}

describe("newsletter (/v1/newsletter)", () => {
  it("accepts an anonymous opt-in and stores it as pending", async () => {
    const res = await app.request("/v1/newsletter/subscribe", post({ email: "Reader@Example.com" }), env);

    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({ data: { status: "pending" } });

    // Normalized, and not subscribed until the emailed link is confirmed.
    const stored = await row("reader@example.com");
    expect(stored?.status).toBe("pending");
    expect(stored?.confirmed_at).toBeNull();
  });

  it("is idempotent for a repeat opt-in", async () => {
    await app.request("/v1/newsletter/subscribe", post({ email: "twice@example.com" }), env);
    const res = await app.request("/v1/newsletter/subscribe", post({ email: "twice@example.com" }), env);

    expect(res.status).toBe(202);
    const { results } = await env.DB_CORE.prepare(
      "SELECT id FROM newsletter_subscribers WHERE email = 'twice@example.com'",
    ).all();
    expect(results).toHaveLength(1);
  });

  it("rejects a malformed address", async () => {
    const res = await app.request("/v1/newsletter/subscribe", post({ email: "not-an-email" }), env);
    expect(res.status).toBe(400);
  });

  it("rejects a missing body", async () => {
    const res = await app.request("/v1/newsletter/subscribe", post({}), env);
    expect(res.status).toBe(400);
  });

  it("confirms a valid token and marks the address subscribed", async () => {
    const token = "a".repeat(64);
    await seed("confirm@example.com", token, Math.floor(Date.now() / 1000) + 3600);

    const res = await app.request("/v1/newsletter/confirm", post({ token }), env);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { status: "subscribed" } });
    const stored = await row("confirm@example.com");
    expect(stored?.status).toBe("subscribed");
    expect(stored?.confirmed_at).not.toBeNull();
  });

  it("refuses an expired confirmation token", async () => {
    const token = "b".repeat(64);
    await seed("expired@example.com", token, Math.floor(Date.now() / 1000) - 60);

    const res = await app.request("/v1/newsletter/confirm", post({ token }), env);

    expect(res.status).toBe(400);
    expect((await row("expired@example.com"))?.status).toBe("pending");
  });

  it("refuses an unknown token", async () => {
    const res = await app.request("/v1/newsletter/confirm", post({ token: "c".repeat(64) }), env);
    expect(res.status).toBe(400);
  });

  it("unsubscribes with the same token even after it expired", async () => {
    const token = "d".repeat(64);
    await seed("bye@example.com", token, Math.floor(Date.now() / 1000) - 60);

    const res = await app.request("/v1/newsletter/unsubscribe", post({ token }), env);

    expect(res.status).toBe(200);
    expect((await row("bye@example.com"))?.status).toBe("unsubscribed");
  });
});
