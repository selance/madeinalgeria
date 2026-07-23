import { AppError, slugify, slugifyUnique } from "@mia/core";
import type {
  GitHubClient,
  GitHubRepoData,
  ListAdminProjectsQuery,
  ListProjectsQuery,
  OffsetPagination,
  ProjectLanguageFacet,
  ProjectOwnerFacet,
  ProjectTopicFacet,
  PublicProject,
  ReviewProject,
  SitemapEntry,
  SubmitProject,
  UpdateProject,
} from "@mia/contracts";
import type { ProjectRow, ProjectsRepo } from "./repo";

/**
 * Directory reads + the anonymous submission flow. Hot public reads (featured
 * grid, slug details, language facets) sit behind the same versioned-KV cache
 * idiom as the reference module; parameterized list queries go straight to D1
 * where composite indexes cover them. Admin writes bump the version key.
 */

const CACHE_TTL_SECONDS = 24 * 60 * 60;
const VERSION_KEY = "projects:version";
const FEATURED_LIMIT = 6;
/** A repo pushed to within this window renders the "active" badge. */
const ACTIVE_WINDOW_MS = 365 * 24 * 60 * 60 * 1000;

export interface ProjectsKV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export function toPublicProject(row: ProjectRow, now: Date = new Date()): PublicProject {
  return {
    id: row.id,
    slug: row.slug,
    repoFullName: row.repoFullName,
    name: row.name,
    description: row.description,
    descriptionAr: row.descriptionAr,
    htmlUrl: row.htmlUrl,
    homepage: row.homepage,
    stars: row.stars,
    forks: row.forks,
    primaryLanguage: row.primaryLanguage,
    topics: row.topics ?? [],
    license: row.license,
    isArchived: row.isArchived,
    isActive:
      row.repoPushedAt !== null && now.getTime() - row.repoPushedAt.getTime() < ACTIVE_WINDOW_MS,
    ownerLogin: row.ownerLogin,
    ownerAvatarUrl: row.ownerAvatarUrl,
    ownerType: row.ownerType,
    categoryId: row.categoryId,
    isFeatured: row.isFeatured,
    repoCreatedAt: row.repoCreatedAt?.toISOString() ?? null,
    repoPushedAt: row.repoPushedAt?.toISOString() ?? null,
  };
}

function paginationFor(page: number, limit: number, totalCount: number): OffsetPagination {
  return {
    page,
    limit,
    total_count: totalCount,
    total_pages: Math.max(1, Math.ceil(totalCount / limit)),
  };
}

/** "https://github.com/Owner/Repo/" → "owner/repo". Caller validated the shape. */
export function repoFullNameFromUrl(repoUrl: string): string {
  const path = new URL(repoUrl).pathname.replace(/^\/+|\/+$/g, "");
  return path.toLowerCase();
}

export class ProjectsService {
  constructor(
    private repo: ProjectsRepo,
    private kv: ProjectsKV,
    private github: GitHubClient,
  ) {}

  // ── Public reads ──────────────────────────────────────────────────────
  async list(
    query: ListProjectsQuery,
  ): Promise<{ items: PublicProject[]; pagination: OffsetPagination }> {
    const { items, totalCount } = await this.repo.listPublic(query);
    return {
      items: items.map((row) => toPublicProject(row)),
      pagination: paginationFor(query.page, query.limit, totalCount),
    };
  }

  featured(): Promise<PublicProject[]> {
    return this.cached("featured", async () =>
      (await this.repo.listFeatured(FEATURED_LIMIT)).map((row) => toPublicProject(row)),
    );
  }

  facets(): Promise<ProjectLanguageFacet[]> {
    return this.cached("facets", () => this.repo.languageFacets());
  }

  ownerFacets(): Promise<ProjectOwnerFacet[]> {
    return this.cached("facets:owners", () => this.repo.ownerFacets());
  }

  /** Topic facets, tallied from the approved rows' JSON arrays, most common first. */
  topicFacets(): Promise<ProjectTopicFacet[]> {
    return this.cached("facets:topics", async () => {
      const counts = new Map<string, number>();
      for (const topics of await this.repo.listApprovedTopics()) {
        for (const topic of topics) counts.set(topic, (counts.get(topic) ?? 0) + 1);
      }
      return [...counts.entries()]
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));
    });
  }

  /** Every approved slug + ISO lastmod, for the XML sitemap. */
  sitemap(): Promise<SitemapEntry[]> {
    return this.cached("sitemap", async () =>
      (await this.repo.listApprovedForSitemap()).map((r) => ({
        slug: r.slug,
        lastmod: (r.repoPushedAt ?? r.updatedAt).toISOString(),
      })),
    );
  }

  /** Newest approved projects, for the RSS feed and the "recently added" page. */
  feed(limit: number): Promise<PublicProject[]> {
    return this.cached(`feed:${limit}`, async () =>
      (await this.repo.listRecentApproved(limit)).map((row) => toPublicProject(row)),
    );
  }

  async detail(slug: string): Promise<PublicProject> {
    const project = await this.cached(`detail:${slug}`, async () => {
      const row = await this.repo.getBySlug(slug);
      // Cache the miss sentinel too — pending/rejected/unknown all read as 404.
      return row && row.status === "approved" ? toPublicProject(row) : null;
    });
    if (!project) throw AppError.notFound("Project not found");
    return project;
  }

  listApprovedSlugs(): Promise<string[]> {
    return this.repo.listApprovedSlugs();
  }

  // ── Anonymous submission ──────────────────────────────────────────────
  async submit(input: SubmitProject): Promise<{ status: "pending" }> {
    const fullName = repoFullNameFromUrl(input.repoUrl);

    const existing = await this.repo.getByRepoFullName(fullName);
    if (existing) {
      throw AppError.conflict(
        existing.status === "approved"
          ? "This repository is already listed"
          : "This repository has already been submitted",
      );
    }

    const repo = await this.github.getRepo(fullName);
    if (!repo) throw AppError.badRequest("Repository not found on GitHub");
    if (repo.isPrivate) throw AppError.badRequest("Repository must be public");
    if (repo.isFork) throw AppError.badRequest("Forked repositories are not eligible");

    const slug = await this.uniqueSlug(repo.name, repo.ownerLogin);
    const now = new Date();
    await this.repo.insert({
      ...githubFields(repo),
      slug,
      repoFullName: fullName,
      status: "pending",
      source: "submission",
      submitterEmail: input.email ?? null,
      submissionNotes: input.notes ?? null,
      syncedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    return { status: "pending" };
  }

  private async uniqueSlug(name: string, ownerLogin: string): Promise<string> {
    const taken = await this.repo.listAllSlugs();
    const base = slugify(name) || "project";
    if (!taken.has(base)) return base;
    const withOwner = slugify(`${name}-${ownerLogin}`);
    if (withOwner && !taken.has(withOwner)) return withOwner;
    return slugifyUnique(name);
  }

  // ── Admin ─────────────────────────────────────────────────────────────
  async listAdmin(
    query: ListAdminProjectsQuery,
  ): Promise<{ items: ProjectRow[]; pagination: OffsetPagination }> {
    const { items, totalCount } = await this.repo.listAdmin(query);
    return { items, pagination: paginationFor(query.page, query.limit, totalCount) };
  }

  async counts(): Promise<{ pending: number; approved: number; rejected: number }> {
    const counts = await this.repo.countsByStatus();
    return {
      pending: counts["pending"] ?? 0,
      approved: counts["approved"] ?? 0,
      rejected: counts["rejected"] ?? 0,
    };
  }

  async update(id: number, input: UpdateProject): Promise<ProjectRow> {
    const row = await this.repo.update(id, input);
    if (!row) throw AppError.notFound("Project not found");
    await this.invalidate();
    return row;
  }

  async review(id: number, input: ReviewProject): Promise<ProjectRow> {
    const row = await this.repo.update(id, {
      status: input.status,
      reviewNotes: input.reviewNotes ?? null,
      ...(input.status === "approved" ? { approvedAt: new Date() } : {}),
    });
    if (!row) throw AppError.notFound("Project not found");
    await this.invalidate();
    return row;
  }

  /** Re-sync GitHub metadata into the row (manual admin action). */
  async refresh(id: number): Promise<ProjectRow> {
    const existing = await this.repo.getById(id);
    if (!existing) throw AppError.notFound("Project not found");
    const repo = await this.github.getRepo(existing.repoFullName);
    if (!repo) throw AppError.notFound("Repository no longer exists on GitHub");
    const row = await this.repo.update(id, { ...githubFields(repo), syncedAt: new Date() });
    if (!row) throw AppError.notFound("Project not found");
    await this.invalidate();
    return row;
  }

  /** Called by every admin write. Public exactly so admin-router can use it. */
  async invalidate(): Promise<void> {
    const version = await this.currentVersion();
    await this.kv.put(VERSION_KEY, String(version + 1));
  }

  // ── Cache plumbing (reference-module idiom) ───────────────────────────
  private async currentVersion(): Promise<number> {
    const raw = await this.kv.get(VERSION_KEY);
    const version = raw === null ? 0 : Number(raw);
    return Number.isFinite(version) ? version : 0;
  }

  private async cached<T>(entity: string, load: () => Promise<T>): Promise<T> {
    let key: string | undefined;
    try {
      const version = await this.currentVersion();
      key = `projects:v${version}:${entity}`;
      const hit = await this.kv.get(key);
      if (hit !== null) return JSON.parse(hit) as T;
    } catch (error) {
      // Cache read problems must never take reads down — fall through to D1.
      console.error(`Projects cache read failed for ${entity}:`, error);
    }

    const fresh = await load();
    if (key !== undefined) {
      try {
        await this.kv.put(key, JSON.stringify(fresh), { expirationTtl: CACHE_TTL_SECONDS });
      } catch (error) {
        console.error(`Projects cache write failed for ${entity}:`, error);
      }
    }
    return fresh;
  }
}

/** The GitHub-owned columns — shared by submit and refresh. */
function githubFields(repo: GitHubRepoData) {
  return {
    name: repo.name,
    description: repo.description,
    htmlUrl: repo.htmlUrl,
    homepage: repo.homepage,
    stars: repo.stars,
    forks: repo.forks,
    primaryLanguage: repo.language,
    topics: repo.topics,
    license: repo.license,
    isArchived: repo.isArchived,
    ownerLogin: repo.ownerLogin,
    ownerAvatarUrl: repo.ownerAvatarUrl,
    ownerType: repo.ownerType,
    repoCreatedAt: new Date(repo.createdAt),
    repoPushedAt: repo.pushedAt ? new Date(repo.pushedAt) : null,
  };
}
