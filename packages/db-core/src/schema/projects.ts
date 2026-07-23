import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { categories } from "./reference";

export const projectStatusValues = ["pending", "approved", "rejected"] as const;
export type ProjectStatus = (typeof projectStatusValues)[number];

export const projectSourceValues = ["seed", "submission"] as const;
export type ProjectSource = (typeof projectSourceValues)[number];

export type ProjectOwnerType = "User" | "Organization";

/**
 * The open-source directory. One row per GitHub repository; owner fields are
 * denormalized (one owner per repo, no creator pages in v1). Rows arrive via
 * the discovery CLI (`tools/discover`, source=seed) or the public submit form
 * (source=submission), always as `pending`; only admin review moves them to
 * `approved`/`rejected`. GitHub metadata columns are refreshed by CLI re-runs
 * and the admin refresh action — editorial columns (status, categoryId,
 * isFeatured, descriptionAr, review fields, slug) belong to admins alone.
 */
export const projects = sqliteTable(
  "projects",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** Stable public URL slug — set once at insert, never updated. */
    slug: text("slug", { length: 140 }).notNull(),
    /** Lowercased "owner/name" — the natural key GitHub-side. */
    repoFullName: text("repo_full_name", { length: 180 }).notNull(),
    name: text("name", { length: 120 }).notNull(),
    description: text("description"),
    /** Optional admin-written Arabic blurb shown on /ar pages when present. */
    descriptionAr: text("description_ar"),
    htmlUrl: text("html_url").notNull(),
    homepage: text("homepage"),
    stars: integer("stars").notNull().default(0),
    forks: integer("forks").notNull().default(0),
    primaryLanguage: text("primary_language", { length: 60 }),
    topics: text("topics", { mode: "json" }).$type<string[]>(),
    license: text("license", { length: 60 }),
    isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
    ownerLogin: text("owner_login", { length: 80 }).notNull(),
    ownerAvatarUrl: text("owner_avatar_url"),
    ownerType: text("owner_type", { length: 20 }).notNull().default("User").$type<ProjectOwnerType>(),
    categoryId: integer("category_id").references(() => categories.id),
    status: text("status", { length: 10 }).notNull().default("pending").$type<ProjectStatus>(),
    isFeatured: integer("is_featured", { mode: "boolean" }).notNull().default(false),
    source: text("source", { length: 12 }).notNull().$type<ProjectSource>(),
    submitterEmail: text("submitter_email", { length: 254 }),
    submissionNotes: text("submission_notes", { length: 500 }),
    reviewNotes: text("review_notes", { length: 500 }),
    repoCreatedAt: integer("repo_created_at", { mode: "timestamp" }),
    repoPushedAt: integer("repo_pushed_at", { mode: "timestamp" }),
    approvedAt: integer("approved_at", { mode: "timestamp" }),
    /** Last time GitHub metadata was synced into this row. */
    syncedAt: integer("synced_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    uniqueIndex("projects_repo_full_name_unique").on(t.repoFullName),
    uniqueIndex("projects_slug_unique").on(t.slug),
    // Public list is always status='approved' + one sort/filter — each pairing
    // gets a composite index so keyless scans never happen at directory scale.
    index("projects_status_stars_idx").on(t.status, t.stars),
    index("projects_status_language_idx").on(t.status, t.primaryLanguage),
    index("projects_status_category_idx").on(t.status, t.categoryId),
  ],
);
