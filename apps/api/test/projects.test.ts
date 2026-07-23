import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";

/**
 * Projects directory: the public read surface only ever exposes approved rows,
 * and the anonymous submit endpoint rejects bad input before any GitHub call.
 * Branches that depend on GitHub responses (happy path, 404, fork/private) are
 * unit-tested in @mia/module-projects with a stubbed client — this pool has no
 * outbound-fetch mock, and tests must never hit the live GitHub API.
 */

const app = createApp();

const post = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

/** Insert a project row directly (defaults: approved seed row, 10 stars). */
async function seedProject(input: {
  slug: string;
  repoFullName: string;
  name?: string;
  status?: string;
  stars?: number;
  language?: string | null;
  featured?: boolean;
  pushedDaysAgo?: number;
}) {
  const now = Math.floor(Date.now() / 1000);
  const pushedAt = now - (input.pushedDaysAgo ?? 30) * 24 * 60 * 60;
  await env.DB_CORE.prepare(
    `INSERT INTO projects
     (slug, repo_full_name, name, html_url, stars, primary_language, owner_login,
      status, is_featured, source, repo_pushed_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'seed', ?, ?, ?)`,
  )
    .bind(
      input.slug,
      input.repoFullName,
      input.name ?? input.slug,
      `https://github.com/${input.repoFullName}`,
      input.stars ?? 10,
      input.language ?? "TypeScript",
      input.repoFullName.split("/")[0],
      input.status ?? "approved",
      input.featured ? 1 : 0,
      pushedAt,
      now,
      now,
    )
    .run();
}

beforeEach(async () => {
  // D1/KV state persists across tests in this file — start each test from an
  // empty directory and orphan any KV-cached reads via a fresh version.
  await env.DB_CORE.prepare("DELETE FROM projects").run();
  await env.KV.put("projects:version", String(Date.now()));
});

describe("public directory (/v1/projects)", () => {
  it("lists only approved projects, sorted by stars, with pagination totals", async () => {
    await seedProject({ slug: "small", repoFullName: "a/small", stars: 5 });
    await seedProject({ slug: "big", repoFullName: "a/big", stars: 500 });
    await seedProject({ slug: "hidden", repoFullName: "a/hidden", status: "pending" });
    await seedProject({ slug: "nope", repoFullName: "a/nope", status: "rejected" });

    const res = await app.request("/v1/projects", {}, env);
    expect(res.status).toBe(200);
    const { data } = (await res.json()) as {
      data: { items: { slug: string; isActive: boolean }[]; pagination: Record<string, number> };
    };
    expect(data.items.map((i) => i.slug)).toEqual(["big", "small"]);
    expect(data.items[0]?.isActive).toBe(true);
    expect(data.pagination).toEqual({ page: 1, limit: 24, total_count: 2, total_pages: 1 });
  });

  it("flags projects without a recent push as inactive", async () => {
    await seedProject({ slug: "dormant", repoFullName: "a/dormant", pushedDaysAgo: 400 });
    const res = await app.request("/v1/projects", {}, env);
    const { data } = (await res.json()) as { data: { items: { isActive: boolean }[] } };
    expect(data.items[0]?.isActive).toBe(false);
  });

  it("filters by language and search text", async () => {
    await seedProject({ slug: "ts-lib", repoFullName: "a/ts-lib", language: "TypeScript" });
    await seedProject({ slug: "go-tool", repoFullName: "b/go-tool", language: "Go" });

    const byLang = await app.request("/v1/projects?language=Go", {}, env);
    const langData = (await byLang.json()) as { data: { items: { slug: string }[] } };
    expect(langData.data.items.map((i) => i.slug)).toEqual(["go-tool"]);

    const byText = await app.request("/v1/projects?q=ts-lib", {}, env);
    const textData = (await byText.json()) as { data: { items: { slug: string }[] } };
    expect(textData.data.items.map((i) => i.slug)).toEqual(["ts-lib"]);
  });

  it("paginates with page/limit and stable ordering", async () => {
    for (let i = 1; i <= 5; i++) {
      await seedProject({ slug: `p${i}`, repoFullName: `a/p${i}`, stars: i * 10 });
    }
    const res = await app.request("/v1/projects?limit=2&page=2", {}, env);
    const { data } = (await res.json()) as {
      data: { items: { slug: string }[]; pagination: Record<string, number> };
    };
    expect(data.items.map((i) => i.slug)).toEqual(["p3", "p2"]);
    expect(data.pagination).toEqual({ page: 2, limit: 2, total_count: 5, total_pages: 3 });
  });

  it("rejects malformed query params with the validation envelope", async () => {
    const res = await app.request("/v1/projects?sort=wat", {}, env);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe("bad_request");
    expect(body.error.message).toBe("Validation failed");
  });

  it("serves approved detail by slug and 404s pending rows", async () => {
    await seedProject({ slug: "shown", repoFullName: "a/shown" });
    await seedProject({ slug: "not-yet", repoFullName: "a/not-yet", status: "pending" });

    const ok = await app.request("/v1/projects/shown", {}, env);
    expect(ok.status).toBe(200);
    const { data } = (await ok.json()) as { data: { repoFullName: string } };
    expect(data.repoFullName).toBe("a/shown");

    expect((await app.request("/v1/projects/not-yet", {}, env)).status).toBe(404);
    expect((await app.request("/v1/projects/missing", {}, env)).status).toBe(404);
  });

  it("returns featured projects and language facets", async () => {
    await seedProject({ slug: "star", repoFullName: "a/star", featured: true, language: "Python" });
    await seedProject({ slug: "plain", repoFullName: "a/plain", language: "Python" });

    const featured = await app.request("/v1/projects/featured", {}, env);
    const featuredData = (await featured.json()) as { data: { slug: string }[] };
    expect(featuredData.data.map((i) => i.slug)).toEqual(["star"]);

    const facets = await app.request("/v1/projects/facets", {}, env);
    const facetsData = (await facets.json()) as {
      data: { languages: { name: string; count: number }[] };
    };
    expect(facetsData.data.languages).toEqual([{ name: "Python", count: 2 }]);
  });
});

describe("submissions (POST /v1/projects/submit)", () => {
  it("409s a repo that already exists in the directory (before any GitHub call)", async () => {
    await seedProject({ slug: "taken", repoFullName: "dz/taken" });
    const res = await app.request(
      "/v1/projects/submit",
      post({ repoUrl: "https://github.com/DZ/Taken" }),
      env,
    );
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("conflict");
  });

  it("rejects non-GitHub URLs with the validation envelope", async () => {
    const res = await app.request(
      "/v1/projects/submit",
      post({ repoUrl: "https://gitlab.com/a/b" }),
      env,
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { message: string } };
    expect(body.error.message).toBe("Validation failed");
  });

  it("rejects a missing body", async () => {
    const res = await app.request("/v1/projects/submit", post({}), env);
    expect(res.status).toBe(400);
  });
});
