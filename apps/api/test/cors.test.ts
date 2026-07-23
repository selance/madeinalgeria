import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

const app = createApp();

// Dev vars (wrangler.jsonc) list http://localhost:3000 as a trusted origin.
const TRUSTED = "http://localhost:3000";
const UNTRUSTED = "https://evil.example.com";

describe("CORS for cross-origin frontends", () => {
  it("echoes a trusted origin with credentials on data routes", async () => {
    const res = await app.request(
      "/v1/reference/languages",
      { headers: { Origin: TRUSTED } },
      env,
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe(TRUSTED);
    expect(res.headers.get("access-control-allow-credentials")).toBe("true");
  });

  it("answers preflight requests before any auth or route handling", async () => {
    const res = await app.request(
      "/v1/me/profile",
      {
        method: "OPTIONS",
        headers: {
          Origin: TRUSTED,
          "Access-Control-Request-Method": "PUT",
          "Access-Control-Request-Headers": "content-type,authorization",
        },
      },
      env,
    );
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe(TRUSTED);
    expect(res.headers.get("access-control-allow-headers")?.toLowerCase()).toContain(
      "authorization",
    );
  });

  it("does not allow untrusted origins", async () => {
    const res = await app.request(
      "/v1/reference/languages",
      { headers: { Origin: UNTRUSTED } },
      env,
    );
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });
});
