import { and, asc, count, desc, eq, like, or, type SQL } from "drizzle-orm";
import { schema, type DbCore } from "@mia/db-core";
import type { ListAdminProjectsQuery, ListProjectsQuery, ProjectLanguageFacet } from "@mia/contracts";

/**
 * The ONLY file in this module that touches @mia/db-core. Lists are offset +
 * total count (numbered pagination on both the public site and admin); the
 * dataset is a directory of hundreds of rows, so counts are cheap and every
 * (status, filter) pairing is covered by a composite index.
 */

export type ProjectRow = typeof schema.projects.$inferSelect;
export type NewProjectRow = typeof schema.projects.$inferInsert;

const p = () => schema.projects;

function publicSearch(q: string): SQL | undefined {
  const needle = `%${q.toLowerCase()}%`;
  return or(
    like(schema.projects.repoFullName, needle),
    like(schema.projects.name, needle),
    like(schema.projects.description, needle),
  );
}

function orderFor(sort: ListProjectsQuery["sort"]): SQL[] {
  switch (sort) {
    case "recent":
      return [desc(schema.projects.repoPushedAt), desc(schema.projects.id)];
    case "name":
      return [asc(schema.projects.name), asc(schema.projects.id)];
    case "stars":
      return [desc(schema.projects.stars), desc(schema.projects.id)];
  }
}

export class ProjectsRepo {
  constructor(private db: DbCore) {}

  // ── Public reads (approved only) ──────────────────────────────────────
  async listPublic(query: ListProjectsQuery): Promise<{ items: ProjectRow[]; totalCount: number }> {
    const conditions: SQL[] = [eq(p().status, "approved")];
    if (query.q) {
      const search = publicSearch(query.q);
      if (search) conditions.push(search);
    }
    if (query.language) conditions.push(eq(p().primaryLanguage, query.language));
    if (query.categoryId !== undefined) conditions.push(eq(p().categoryId, query.categoryId));
    const where = and(...conditions);

    const [items, [total]] = await Promise.all([
      this.db
        .select()
        .from(p())
        .where(where)
        .orderBy(...orderFor(query.sort))
        .limit(query.limit)
        .offset((query.page - 1) * query.limit)
        .all(),
      this.db.select({ n: count() }).from(p()).where(where).all(),
    ]);
    return { items, totalCount: total?.n ?? 0 };
  }

  async listFeatured(limit: number): Promise<ProjectRow[]> {
    return this.db
      .select()
      .from(p())
      .where(and(eq(p().status, "approved"), eq(p().isFeatured, true)))
      .orderBy(desc(p().stars), desc(p().id))
      .limit(limit)
      .all();
  }

  /** Distinct primary languages of approved projects, most common first. */
  async languageFacets(): Promise<ProjectLanguageFacet[]> {
    const rows = await this.db
      .select({ name: p().primaryLanguage, count: count() })
      .from(p())
      .where(eq(p().status, "approved"))
      .groupBy(p().primaryLanguage)
      .orderBy(desc(count()))
      .all();
    return rows.filter((r): r is { name: string; count: number } => r.name !== null);
  }

  async getBySlug(slug: string): Promise<ProjectRow | undefined> {
    return this.db.select().from(p()).where(eq(p().slug, slug)).get();
  }

  async listApprovedSlugs(): Promise<string[]> {
    const rows = await this.db
      .select({ slug: p().slug })
      .from(p())
      .where(eq(p().status, "approved"))
      .all();
    return rows.map((r) => r.slug);
  }

  // ── Submission path ───────────────────────────────────────────────────
  async getByRepoFullName(repoFullName: string): Promise<ProjectRow | undefined> {
    return this.db.select().from(p()).where(eq(p().repoFullName, repoFullName)).get();
  }

  /** All slugs (any status) — the collision set for new-slug generation. */
  async listAllSlugs(): Promise<Set<string>> {
    const rows = await this.db.select({ slug: p().slug }).from(p()).all();
    return new Set(rows.map((r) => r.slug));
  }

  async insert(input: NewProjectRow): Promise<ProjectRow> {
    const [row] = await this.db.insert(p()).values(input).returning();
    if (!row) throw new Error("insert returned no row");
    return row;
  }

  // ── Admin ─────────────────────────────────────────────────────────────
  async listAdmin(
    query: ListAdminProjectsQuery,
  ): Promise<{ items: ProjectRow[]; totalCount: number }> {
    const conditions: SQL[] = [];
    if (query.status) conditions.push(eq(p().status, query.status));
    if (query.q) {
      const needle = `%${query.q.toLowerCase()}%`;
      const search = or(
        like(p().repoFullName, needle),
        like(p().name, needle),
        like(p().ownerLogin, needle),
      );
      if (search) conditions.push(search);
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, [total]] = await Promise.all([
      this.db
        .select()
        .from(p())
        .where(where)
        .orderBy(desc(p().createdAt), desc(p().id))
        .limit(query.limit)
        .offset((query.page - 1) * query.limit)
        .all(),
      this.db.select({ n: count() }).from(p()).where(where).all(),
    ]);
    return { items, totalCount: total?.n ?? 0 };
  }

  async countsByStatus(): Promise<Record<string, number>> {
    const rows = await this.db
      .select({ status: p().status, n: count() })
      .from(p())
      .groupBy(p().status)
      .all();
    return Object.fromEntries(rows.map((r) => [r.status, r.n]));
  }

  async getById(id: number): Promise<ProjectRow | undefined> {
    return this.db.select().from(p()).where(eq(p().id, id)).get();
  }

  async update(id: number, fields: Partial<NewProjectRow>): Promise<ProjectRow | undefined> {
    const [row] = await this.db
      .update(p())
      .set({ ...fields, updatedAt: new Date() })
      .where(eq(p().id, id))
      .returning();
    return row;
  }
}
