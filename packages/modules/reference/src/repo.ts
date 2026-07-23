import { asc, eq } from "drizzle-orm";
import { slugify } from "@mia/core";
import { schema, type DbCore } from "@mia/db-core";
import type {
  CategoryItem,
  Country,
  CreateCountry,
  CreateState,
  CreateTranslatedItem,
  Language,
  NamesByLang,
  State,
  TranslationInput,
} from "@mia/contracts";

/**
 * The ONLY file in this module that touches @mia/db-core. Reference tables
 * are tiny (tens–hundreds of rows), so full-table reads here are fine — the
 * KV cache in service.ts keeps them off D1 anyway.
 */

type TranslationRow = { parentId: number; langCode: string; name: string };

function groupNames(rows: TranslationRow[]): Map<number, NamesByLang> {
  const byParent = new Map<number, NamesByLang>();
  for (const row of rows) {
    const names = byParent.get(row.parentId) ?? {};
    names[row.langCode] = row.name;
    byParent.set(row.parentId, names);
  }
  return byParent;
}

export class ReferenceRepo {
  constructor(private db: DbCore) {}

  // ── Languages ─────────────────────────────────────────────────────────
  async listLanguages(): Promise<Language[]> {
    return this.db.select().from(schema.languages).all();
  }

  async createLanguage(input: { code: string; name: string }): Promise<Language> {
    const [row] = await this.db.insert(schema.languages).values(input).returning();
    if (!row) throw new Error("insert returned no row");
    return row;
  }

  async updateLanguage(id: number, input: Partial<{ code: string; name: string }>): Promise<Language | undefined> {
    const [row] = await this.db
      .update(schema.languages)
      .set(input)
      .where(eq(schema.languages.id, id))
      .returning();
    return row;
  }

  async deleteLanguage(id: number): Promise<boolean> {
    const result = await this.db.delete(schema.languages).where(eq(schema.languages.id, id)).returning();
    return result.length > 0;
  }

  // ── Countries ─────────────────────────────────────────────────────────
  async listCountries(): Promise<Country[]> {
    const rows = await this.db.select().from(schema.countries).all();
    const translations = await this.db
      .select({
        parentId: schema.countryTranslations.countryId,
        langCode: schema.languages.code,
        name: schema.countryTranslations.name,
      })
      .from(schema.countryTranslations)
      .innerJoin(schema.languages, eq(schema.countryTranslations.languageId, schema.languages.id))
      .all();
    const names = groupNames(translations);
    return rows.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      currencyCode: c.currencyCode,
      phonePrefix: c.phonePrefix,
      isActive: c.isActive,
      names: names.get(c.id) ?? {},
    }));
  }

  async createCountry(input: CreateCountry): Promise<number> {
    const now = new Date();
    const [row] = await this.db
      .insert(schema.countries)
      .values({
        code: input.code,
        name: input.name,
        currencyCode: input.currencyCode,
        phonePrefix: input.phonePrefix,
        isActive: input.isActive,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: schema.countries.id });
    if (!row) throw new Error("insert returned no row");
    if (input.translations.length > 0) {
      await this.db
        .insert(schema.countryTranslations)
        .values(input.translations.map((t) => ({ countryId: row.id, ...t })));
    }
    return row.id;
  }

  async updateCountry(
    id: number,
    input: Partial<Omit<CreateCountry, "translations">> & { translations?: TranslationInput[] },
  ): Promise<boolean> {
    const { translations, ...fields } = input;
    const [row] = await this.db
      .update(schema.countries)
      .set({ ...fields, updatedAt: new Date() })
      .where(eq(schema.countries.id, id))
      .returning({ id: schema.countries.id });
    if (!row) return false;
    if (translations) {
      await this.db.delete(schema.countryTranslations).where(eq(schema.countryTranslations.countryId, id));
      if (translations.length > 0) {
        await this.db
          .insert(schema.countryTranslations)
          .values(translations.map((t) => ({ countryId: id, ...t })));
      }
    }
    return true;
  }

  async deleteCountry(id: number): Promise<boolean> {
    await this.db.delete(schema.countryTranslations).where(eq(schema.countryTranslations.countryId, id));
    const result = await this.db.delete(schema.countries).where(eq(schema.countries.id, id)).returning();
    return result.length > 0;
  }

  // ── States ────────────────────────────────────────────────────────────
  async listStates(): Promise<State[]> {
    const rows = await this.db.select().from(schema.states).all();
    const translations = await this.db
      .select({
        parentId: schema.stateTranslations.stateId,
        langCode: schema.languages.code,
        name: schema.stateTranslations.name,
      })
      .from(schema.stateTranslations)
      .innerJoin(schema.languages, eq(schema.stateTranslations.languageId, schema.languages.id))
      .all();
    const names = groupNames(translations);
    return rows.map((s) => ({
      id: s.id,
      countryId: s.countryId,
      code: s.code,
      isActive: s.isActive,
      names: names.get(s.id) ?? {},
    }));
  }

  async createState(input: CreateState): Promise<number> {
    const [row] = await this.db
      .insert(schema.states)
      .values({ countryId: input.countryId, code: input.code, isActive: input.isActive })
      .returning({ id: schema.states.id });
    if (!row) throw new Error("insert returned no row");
    if (input.translations.length > 0) {
      await this.db
        .insert(schema.stateTranslations)
        .values(input.translations.map((t) => ({ stateId: row.id, ...t })));
    }
    return row.id;
  }

  async updateState(
    id: number,
    input: Partial<Omit<CreateState, "translations">> & { translations?: TranslationInput[] },
  ): Promise<boolean> {
    const { translations, ...fields } = input;
    const [row] = await this.db
      .update(schema.states)
      .set(fields)
      .where(eq(schema.states.id, id))
      .returning({ id: schema.states.id });
    if (!row) return false;
    if (translations) {
      await this.db.delete(schema.stateTranslations).where(eq(schema.stateTranslations.stateId, id));
      if (translations.length > 0) {
        await this.db
          .insert(schema.stateTranslations)
          .values(translations.map((t) => ({ stateId: id, ...t })));
      }
    }
    return true;
  }

  async deleteState(id: number): Promise<boolean> {
    await this.db.delete(schema.stateTranslations).where(eq(schema.stateTranslations.stateId, id));
    const result = await this.db.delete(schema.states).where(eq(schema.states.id, id)).returning();
    return result.length > 0;
  }

  // ── Categories ────────────────────────────────────────────────────────
  /** ALL categories (incl. inactive) ordered by sortOrder then id. `slug` is
   * nullable at the DB layer (added by ALTER); coalesce to "" so consumers
   * never see null. */
  async listCategories(): Promise<CategoryItem[]> {
    const parents = await this.db
      .select()
      .from(schema.categories)
      .orderBy(asc(schema.categories.sortOrder), asc(schema.categories.id))
      .all();
    const translations = await this.db
      .select({
        parentId: schema.categoryTranslations.categoryId,
        langCode: schema.languages.code,
        name: schema.categoryTranslations.name,
      })
      .from(schema.categoryTranslations)
      .innerJoin(schema.languages, eq(schema.categoryTranslations.languageId, schema.languages.id))
      .all();
    const names = groupNames(translations);
    return parents.map((p) => ({
      id: p.id,
      slug: p.slug ?? "",
      sortOrder: p.sortOrder,
      isActive: p.isActive,
      names: names.get(p.id) ?? {},
    }));
  }

  /** Auto-slugs from the Arabic translation (language resolved by `code === "ar"`,
   * not a hardcoded id), else the first one, appending `-2`, `-3`, … on collision
   * with an existing slug. New rows start active with sortOrder 0. */
  async createCategory(input: CreateTranslatedItem): Promise<number> {
    // Resolve the Arabic language id from the languages table so the slug source
    // doesn't depend on a fixed row id.
    const languages = await this.listLanguages();
    const arabicId = languages.find((l) => l.code === "ar")?.id;
    const source =
      (arabicId !== undefined
        ? input.translations.find((t) => t.languageId === arabicId)?.name
        : undefined) ??
      input.translations[0]?.name ??
      "";
    const slug = await this.uniqueCategorySlug(slugify(source) || "category");
    const [row] = await this.db
      .insert(schema.categories)
      .values({ slug, sortOrder: 0, isActive: true })
      .returning({ id: schema.categories.id });
    if (!row) throw new Error("insert returned no row");
    await this.db
      .insert(schema.categoryTranslations)
      .values(input.translations.map((t) => ({ categoryId: row.id, ...t })));
    return row.id;
  }

  private async uniqueCategorySlug(base: string): Promise<string> {
    const rows = await this.db.select({ slug: schema.categories.slug }).from(schema.categories).all();
    const taken = new Set(rows.map((r) => r.slug).filter((s): s is string => s !== null));
    if (!taken.has(base)) return base;
    for (let n = 2; ; n++) {
      const candidate = `${base}-${n}`;
      if (!taken.has(candidate)) return candidate;
    }
  }

  /** Renames translations (delete + reinsert) and optionally updates
   * sortOrder/isActive. NEVER touches the slug — it stays stable for life. */
  async updateCategory(
    id: number,
    input: { translations: TranslationInput[]; sortOrder?: number; isActive?: boolean },
  ): Promise<boolean> {
    const existing = await this.db
      .select({ id: schema.categories.id })
      .from(schema.categories)
      .where(eq(schema.categories.id, id))
      .get();
    if (!existing) return false;
    const fields: Partial<{ sortOrder: number; isActive: boolean }> = {};
    if (input.sortOrder !== undefined) fields.sortOrder = input.sortOrder;
    if (input.isActive !== undefined) fields.isActive = input.isActive;
    if (Object.keys(fields).length > 0) {
      await this.db.update(schema.categories).set(fields).where(eq(schema.categories.id, id));
    }
    await this.db.delete(schema.categoryTranslations).where(eq(schema.categoryTranslations.categoryId, id));
    if (input.translations.length > 0) {
      await this.db
        .insert(schema.categoryTranslations)
        .values(input.translations.map((t) => ({ categoryId: id, ...t })));
    }
    return true;
  }

  /** For the delete guard: isActive of the row, or undefined if it doesn't exist. */
  async getCategoryActive(id: number): Promise<boolean | undefined> {
    const row = await this.db
      .select({ isActive: schema.categories.isActive })
      .from(schema.categories)
      .where(eq(schema.categories.id, id))
      .get();
    return row?.isActive;
  }

  async deleteCategory(id: number): Promise<boolean> {
    await this.db.delete(schema.categoryTranslations).where(eq(schema.categoryTranslations.categoryId, id));
    const result = await this.db.delete(schema.categories).where(eq(schema.categories.id, id)).returning();
    return result.length > 0;
  }
}
