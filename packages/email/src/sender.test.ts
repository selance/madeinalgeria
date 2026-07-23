import { afterEach, describe, expect, it, vi } from "vitest";
import { createResendSender } from "./sender";

/**
 * Regression: a RESEND_API_KEY stored with a UTF-8 BOM (what you get when
 * `wrangler secret put` is piped through PowerShell) made Resend reject every
 * send with 400 "API key is invalid" — it took down all production mail, and
 * the BOM is invisible in every dashboard. The sender now sanitizes the key.
 */

const message = { to: "reader@example.com", subject: "hi", html: "<p>hi</p>" };

function captureAuthHeader() {
  let authorization: string | undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: unknown, init?: { headers?: Record<string, string> }) => {
      authorization = init?.headers?.["Authorization"];
      return new Response("{}", { status: 200 });
    }),
  );
  return () => authorization;
}

function captureBody() {
  let body: Record<string, unknown> | undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: unknown, init?: { body?: string }) => {
      body = init?.body ? JSON.parse(init.body) : undefined;
      return new Response("{}", { status: 200 });
    }),
  );
  return () => body;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("createResendSender", () => {
  it("strips a UTF-8 BOM from the API key", async () => {
    const authHeader = captureAuthHeader();
    await createResendSender("﻿re_test_key").send(message);
    expect(authHeader()).toBe("Bearer re_test_key");
  });

  it("trims surrounding whitespace and newlines from the API key", async () => {
    const authHeader = captureAuthHeader();
    await createResendSender(" re_test_key\r\n").send(message);
    expect(authHeader()).toBe("Bearer re_test_key");
  });

  it("passes a clean key through untouched", async () => {
    const authHeader = captureAuthHeader();
    await createResendSender("re_test_key").send(message);
    expect(authHeader()).toBe("Bearer re_test_key");
  });

  it("throws with the provider's response when a send fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 400 })));
    await expect(createResendSender("re_test_key").send(message)).rejects.toThrow(/400.*nope/);
  });

  // Deliverability: a "no-reply" From tells inboxes we refuse feedback and
  // erodes trust. The default identity must stay answerable, and every send
  // must carry a reply-to.
  it("defaults to an answerable From (never no-reply) with a reply-to", async () => {
    const body = captureBody();
    await createResendSender("re_test_key").send(message);
    expect(body()?.from).toBe("صُنع في الجزائر | Made in Algeria <hello@auth.madeinalgeria.dev>");
    expect(body()?.from).not.toMatch(/no-?reply/i);
    expect(body()?.reply_to).toBe("moncef@mochir.com");
  });

  it("uses the configured sender identity when one is provided", async () => {
    const body = captureBody();
    await createResendSender("re_test_key", "صُنع في الجزائر | Made in Algeria <hello@madeinalgeria.dev>").send(message);
    expect(body()?.from).toBe("صُنع في الجزائر | Made in Algeria <hello@madeinalgeria.dev>");
  });

  it("lets a per-message from override the configured identity", async () => {
    const body = captureBody();
    await createResendSender("re_test_key", "صُنع في الجزائر | Made in Algeria <hello@auth.madeinalgeria.dev>").send({
      ...message,
      from: "صُنع في الجزائر | Made in Algeria <notify@mail.madeinalgeria.dev>",
    });
    expect(body()?.from).toBe("صُنع في الجزائر | Made in Algeria <notify@mail.madeinalgeria.dev>");
  });
});
