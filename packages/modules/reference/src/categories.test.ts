import { Hono, type Context } from "hono";
import { describe, expect, it } from "vitest";
import { toErrorEnvelope } from "@mia/core";
import { slugify } from "@mia/core";
import { schema, type DbCore } from "@mia/db-core";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { ReferenceRepo } from "./repo";
import { createReferenceAdminRouter } from "./admin-router";
import type { ReferenceService } from "./service";

/**
 * A hand-rolled in-memory stand-in for the drizzle D1 handle, implementing
 * exactly the query chains ReferenceRepo's category methods use. Conditions
 * (`where(eq(...))`) are opaque drizzle SQL objects, so the fake ignores them
 * and operates on the whole (single-row) table — tests set up state to suit.
 */
interface CatRow {
  id: number;
  slug: string | null;
  sortOrder: number;
  isActive: boolean;
}
interface NewCat {
  slug: string;
  sortOrder: number;
  isActive: boolean;
}
interface TransRow {
  parentId: number;
  langCode: string;
  name: string;
}
interface LangRow {
  id: number;
  code: string;
  name: string;
}

function makeFakeDb(seed?: { categories?: CatRow[]; translations?: TransRow[]; languages?: LangRow[] }) {
  const state = {
    categories: seed?.categories ?? [],
    translations: seed?.translations ?? [],
    // createCategory resolves the Arabic language by code; default fixtures give
    // it an "ar" row (id 2) so slug-from-Arabic tests keep working.
    languages: seed?.languages ?? [
      { id: 2, code: "ar", name: "العربية" },
      { id: 3, code: "fr", name: "Français" },
    ],
    ops: {
      insertedCats: [] as NewCat[],
      insertedTranslations: [] as Record<string, unknown>[],
      updateSets: [] as Record<string, unknown>[],
      deletedTranslations: 0,
      deletedCategories: 0,
    },
  };

  const db = {
    select(proj?: Record<string, unknown>) {
      return {
        from(table: unknown) {
          const isCat = table === schema.categories;
          const isLang = table === schema.languages;
          const builder = {
            orderBy: () => builder,
            innerJoin: () => builder,
            where: () => builder,
            all: async () => {
              if (isLang) return state.languages;
              if (isCat && proj && "slug" in proj) return state.categories.map((c) => ({ slug: c.slug }));
              if (!isCat) return state.translations;
              return state.categories;
            },
            get: async () => (isCat ? (state.categories[0] ?? undefined) : (state.translations[0] ?? undefined)),
          };
          return builder;
        },
      };
    },
    insert(table: unknown) {
      return {
        values(vals: Record<string, unknown> | Record<string, unknown>[]) {
          if (table === schema.categories) {
            const row = (Array.isArray(vals) ? vals[0] : vals) as unknown as NewCat;
            state.ops.insertedCats.push(row);
            const inserted: CatRow = { id: 101, ...row };
            state.categories.push(inserted);
            return { returning: async () => [{ id: inserted.id }] };
          }
          const arr = Array.isArray(vals) ? vals : [vals];
          state.ops.insertedTranslations.push(...arr);
          return Promise.resolve(undefined);
        },
      };
    },
    update() {
      return {
        set(fields: Record<string, unknown>) {
          return {
            where: () => {
              state.ops.updateSets.push(fields);
              return Promise.resolve(undefined);
            },
          };
        },
      };
    },
    delete(table: unknown) {
      return {
        where: () => {
          if (table === schema.categoryTranslations) {
            state.ops.deletedTranslations++;
            return Promise.resolve(undefined);
          }
          const removed = state.categories.slice();
          state.categories = [];
          state.ops.deletedCategories += removed.length;
          return { returning: async () => removed };
        },
      };
    },
  };

  return { db: db as unknown as DbCore, state };
}

describe("ReferenceRepo.listCategories", () => {
  it("returns slug/sortOrder/isActive shape and coalesces a null slug to ''", async () => {
    const { db } = makeFakeDb({
      categories: [
        { id: 101, slug: "one", sortOrder: 0, isActive: true },
        { id: 102, slug: null, sortOrder: 5, isActive: false },
      ],
      translations: [
        { parentId: 101, langCode: "ar", name: "الأولى" },
        { parentId: 102, langCode: "ar", name: "الثانية" },
      ],
    });
    const repo = new ReferenceRepo(db);
    const items = await repo.listCategories();

    expect(items).toEqual([
      { id: 101, slug: "one", sortOrder: 0, isActive: true, names: { ar: "الأولى" } },
      { id: 102, slug: "", sortOrder: 5, isActive: false, names: { ar: "الثانية" } },
    ]);
  });
});

describe("ReferenceRepo.createCategory", () => {
  it("slugs from the Arabic (code 'ar') translation, active with sortOrder 0", async () => {
    const { db, state } = makeFakeDb();
    const repo = new ReferenceRepo(db);
    await repo.createCategory({
      translations: [
        { languageId: 3, name: "Commerce" },
        { languageId: 2, name: "تجارة" },
      ],
    });

    const inserted = state.ops.insertedCats[0]!;
    expect(inserted.slug).toBe(slugify("تجارة"));
    expect(inserted.sortOrder).toBe(0);
    expect(inserted.isActive).toBe(true);
  });

  it("appends -2, -3 … on slug collision with existing categories", async () => {
    const base = slugify("تجارة");
    const { db, state } = makeFakeDb({
      categories: [
        { id: 1, slug: base, sortOrder: 0, isActive: true },
        { id: 2, slug: `${base}-2`, sortOrder: 0, isActive: true },
      ],
    });
    const repo = new ReferenceRepo(db);
    await repo.createCategory({ translations: [{ languageId: 2, name: "تجارة" }] });

    expect(state.ops.insertedCats[0]!.slug).toBe(`${base}-3`);
  });
});

describe("ReferenceRepo.updateCategory", () => {
  it("updates sortOrder/isActive and reinserts translations but NEVER the slug", async () => {
    const { db, state } = makeFakeDb({
      categories: [{ id: 101, slug: "stable", sortOrder: 0, isActive: true }],
    });
    const repo = new ReferenceRepo(db);
    const ok = await repo.updateCategory(101, {
      translations: [{ languageId: 2, name: "اسم جديد" }],
      sortOrder: 7,
      isActive: false,
    });

    expect(ok).toBe(true);
    expect(state.ops.updateSets).toEqual([{ sortOrder: 7, isActive: false }]);
    // No update payload ever carries a slug key.
    expect(state.ops.updateSets.every((s) => !("slug" in s))).toBe(true);
    expect(state.ops.deletedTranslations).toBe(1);
    expect(state.ops.insertedTranslations).toEqual([{ categoryId: 101, languageId: 2, name: "اسم جديد" }]);
  });

  it("returns false when the category does not exist", async () => {
    const { db } = makeFakeDb({ categories: [] });
    const repo = new ReferenceRepo(db);
    expect(await repo.updateCategory(999, { translations: [{ languageId: 2, name: "x" }] })).toBe(false);
  });
});

// ── Router: deactivate-first delete guard ─────────────────────────────────

function makeApp(repo: Partial<ReferenceRepo>) {
  const app = new Hono();
  app.route(
    "/",
    createReferenceAdminRouter({
      getRepo: (_c: Context) => repo as ReferenceRepo,
      getService: (_c: Context) => ({ invalidate: async () => {} }) as ReferenceService,
    }),
  );
  app.onError((err, c) => {
    const { status, body } = toErrorEnvelope(err);
    return c.json(body, status as ContentfulStatusCode);
  });
  return app;
}

describe("admin router DELETE /categories/:id guard", () => {
  it("refuses (409) an active category and never deletes", async () => {
    let deleted = false;
    const app = makeApp({
      getCategoryActive: async () => true,
      deleteCategory: async () => {
        deleted = true;
        return true;
      },
    });
    const res = await app.request("/categories/5", { method: "DELETE" });
    expect(res.status).toBe(409);
    expect(deleted).toBe(false);
  });

  it("deletes an inactive category", async () => {
    const app = makeApp({
      getCategoryActive: async () => false,
      deleteCategory: async () => true,
    });
    const res = await app.request("/categories/5", { method: "DELETE" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: unknown };
    expect(body.data).toEqual({ deleted: true });
  });

  it("404s a missing category", async () => {
    const app = makeApp({ getCategoryActive: async () => undefined });
    const res = await app.request("/categories/5", { method: "DELETE" });
    expect(res.status).toBe(404);
  });
});
