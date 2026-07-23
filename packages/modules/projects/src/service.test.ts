import { describe, expect, it, vi } from "vitest";
import type { GitHubClient, GitHubRepoData } from "@mia/contracts";
import type { NewProjectRow, ProjectRow, ProjectsRepo } from "./repo";
import { ProjectsService, repoFullNameFromUrl, toPublicProject, type ProjectsKV } from "./service";

/** In-memory KV double — enough for the versioned-cache idiom. */
function memoryKV(): ProjectsKV & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    async get(key) {
      return store.get(key) ?? null;
    },
    async put(key, value) {
      store.set(key, value);
    },
  };
}

function ghRepo(overrides: Partial<GitHubRepoData> = {}): GitHubRepoData {
  return {
    fullName: "someone/cool-lib",
    name: "cool-lib",
    description: "A cool library",
    htmlUrl: "https://github.com/someone/cool-lib",
    homepage: null,
    stars: 42,
    forks: 3,
    language: "TypeScript",
    topics: ["algeria"],
    license: "MIT",
    isArchived: false,
    isFork: false,
    isPrivate: false,
    ownerLogin: "someone",
    ownerAvatarUrl: "https://avatars.githubusercontent.com/u/1",
    ownerType: "User",
    createdAt: "2023-01-01T00:00:00Z",
    pushedAt: "2026-07-01T00:00:00Z",
    ...overrides,
  };
}

function row(overrides: Partial<ProjectRow> = {}): ProjectRow {
  const now = new Date();
  return {
    id: 1,
    slug: "cool-lib",
    repoFullName: "someone/cool-lib",
    name: "cool-lib",
    description: "A cool library",
    descriptionAr: null,
    htmlUrl: "https://github.com/someone/cool-lib",
    homepage: null,
    stars: 42,
    forks: 3,
    primaryLanguage: "TypeScript",
    topics: ["algeria"],
    license: "MIT",
    isArchived: false,
    ownerLogin: "someone",
    ownerAvatarUrl: null,
    ownerType: "User",
    categoryId: null,
    status: "approved",
    isFeatured: false,
    source: "seed",
    submitterEmail: null,
    submissionNotes: null,
    reviewNotes: null,
    repoCreatedAt: new Date("2023-01-01"),
    repoPushedAt: new Date("2026-07-01"),
    approvedAt: null,
    syncedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

type RepoStub = {
  [K in keyof ProjectsRepo]: ProjectsRepo[K] extends (...args: infer A) => infer R
    ? ReturnType<typeof vi.fn<(...args: A) => R>>
    : never;
};

function repoStub(overrides: Partial<RepoStub> = {}): RepoStub {
  return {
    listPublic: vi.fn(async () => ({ items: [], totalCount: 0 })),
    listFeatured: vi.fn(async () => []),
    languageFacets: vi.fn(async () => []),
    getBySlug: vi.fn(async () => undefined),
    listApprovedSlugs: vi.fn(async () => []),
    getByRepoFullName: vi.fn(async () => undefined),
    listAllSlugs: vi.fn(async () => new Set<string>()),
    insert: vi.fn(async (input: NewProjectRow) => row(input as Partial<ProjectRow>)),
    listAdmin: vi.fn(async () => ({ items: [], totalCount: 0 })),
    countsByStatus: vi.fn(async () => ({})),
    getById: vi.fn(async () => undefined),
    update: vi.fn(async () => undefined),
    ...overrides,
  };
}

function service(repo: RepoStub, github: GitHubClient, kv = memoryKV()) {
  return new ProjectsService(repo as unknown as ProjectsRepo, kv, github);
}

const githubStub = (repo: GitHubRepoData | null): GitHubClient => ({
  getRepo: async () => repo,
});

describe("repoFullNameFromUrl", () => {
  it("normalizes case and trailing slash", () => {
    expect(repoFullNameFromUrl("https://github.com/Someone/Cool-Lib/")).toBe("someone/cool-lib");
  });
});

describe("toPublicProject", () => {
  it("derives isActive from the 365-day push window", () => {
    const now = new Date("2026-07-18T00:00:00Z");
    const fresh = toPublicProject(row({ repoPushedAt: new Date("2025-08-01") }), now);
    const stale = toPublicProject(row({ repoPushedAt: new Date("2025-07-01") }), now);
    const never = toPublicProject(row({ repoPushedAt: null }), now);
    expect(fresh.isActive).toBe(true);
    expect(stale.isActive).toBe(false);
    expect(never.isActive).toBe(false);
  });
});

describe("submit", () => {
  it("inserts a pending submission with GitHub metadata", async () => {
    const repo = repoStub();
    const svc = service(repo, githubStub(ghRepo()));
    const result = await svc.submit({ repoUrl: "https://github.com/Someone/Cool-Lib" });
    expect(result).toEqual({ status: "pending" });
    expect(repo.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        repoFullName: "someone/cool-lib",
        slug: "cool-lib",
        status: "pending",
        source: "submission",
        stars: 42,
      }),
    );
  });

  it("409s when the repo is already listed or already submitted", async () => {
    const listed = repoStub({ getByRepoFullName: vi.fn(async () => row({ status: "approved" })) });
    await expect(
      service(listed, githubStub(ghRepo())).submit({ repoUrl: "https://github.com/a/b" }),
    ).rejects.toMatchObject({ status: 409, message: "This repository is already listed" });

    const pending = repoStub({ getByRepoFullName: vi.fn(async () => row({ status: "pending" })) });
    await expect(
      service(pending, githubStub(ghRepo())).submit({ repoUrl: "https://github.com/a/b" }),
    ).rejects.toMatchObject({ status: 409, message: "This repository has already been submitted" });
  });

  it("400s on missing, private, or forked repos", async () => {
    await expect(
      service(repoStub(), githubStub(null)).submit({ repoUrl: "https://github.com/a/b" }),
    ).rejects.toMatchObject({ status: 400, message: "Repository not found on GitHub" });
    await expect(
      service(repoStub(), githubStub(ghRepo({ isPrivate: true }))).submit({
        repoUrl: "https://github.com/a/b",
      }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      service(repoStub(), githubStub(ghRepo({ isFork: true }))).submit({
        repoUrl: "https://github.com/a/b",
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("falls back to owner-suffixed slug on collision", async () => {
    const repo = repoStub({ listAllSlugs: vi.fn(async () => new Set(["cool-lib"])) });
    await service(repo, githubStub(ghRepo())).submit({ repoUrl: "https://github.com/a/b" });
    expect(repo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "cool-lib-someone" }),
    );
  });
});

describe("review", () => {
  it("approve stamps approvedAt and bumps the cache version", async () => {
    const kv = memoryKV();
    const repo = repoStub({ update: vi.fn(async () => row({ status: "approved" })) });
    const svc = service(repo, githubStub(null), kv);
    await svc.review(1, { status: "approved" });
    expect(repo.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ status: "approved", approvedAt: expect.any(Date) }),
    );
    expect(kv.store.get("projects:version")).toBe("1");
  });

  it("reject does not stamp approvedAt", async () => {
    const repo = repoStub({ update: vi.fn(async () => row({ status: "rejected" })) });
    await service(repo, githubStub(null)).review(1, { status: "rejected", reviewNotes: "spam" });
    const fields = repo.update.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(fields["approvedAt"]).toBeUndefined();
    expect(fields["reviewNotes"]).toBe("spam");
  });
});

describe("cached reads", () => {
  it("serves featured from KV after first load and misses after invalidate", async () => {
    const kv = memoryKV();
    const repo = repoStub({ listFeatured: vi.fn(async () => [row({ isFeatured: true })]) });
    const svc = service(repo, githubStub(null), kv);

    await svc.featured();
    await svc.featured();
    expect(repo.listFeatured).toHaveBeenCalledTimes(1);

    await svc.invalidate();
    await svc.featured();
    expect(repo.listFeatured).toHaveBeenCalledTimes(2);
  });

  it("detail 404s on pending rows and caches the miss", async () => {
    const repo = repoStub({ getBySlug: vi.fn(async () => row({ status: "pending" })) });
    const svc = service(repo, githubStub(null));
    await expect(svc.detail("cool-lib")).rejects.toMatchObject({ status: 404 });
    await expect(svc.detail("cool-lib")).rejects.toMatchObject({ status: 404 });
    expect(repo.getBySlug).toHaveBeenCalledTimes(1);
  });
});
