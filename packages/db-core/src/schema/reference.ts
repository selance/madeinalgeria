import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/**
 * Reference data (GLOBAL tier) — tiny, read-mostly, served through the KV
 * cache in the reference module. Shapes match v1 for a clean import.
 */
export const languages = sqliteTable("languages", {
  id: integer("id").primaryKey(),
  code: text("code", { length: 5 }).notNull().unique(),
  name: text("name", { length: 50 }).notNull(),
});

export const countries = sqliteTable("countries", {
  id: integer("id").primaryKey(),
  code: text("code", { length: 2 }).notNull().unique(),
  name: text("name", { length: 100 }).notNull(),
  currencyCode: text("currency_code", { length: 3 }),
  phonePrefix: text("phone_prefix", { length: 10 }),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const countryTranslations = sqliteTable(
  "country_translations",
  {
    id: integer("id").primaryKey(),
    countryId: integer("country_id")
      .notNull()
      .references(() => countries.id),
    languageId: integer("language_id")
      .notNull()
      .references(() => languages.id),
    name: text("name", { length: 100 }).notNull(),
  },
  (t) => [index("country_translations_country_id_idx").on(t.countryId)],
);

export const states = sqliteTable(
  "states",
  {
    id: integer("id").primaryKey(),
    countryId: integer("country_id")
      .notNull()
      .references(() => countries.id),
    code: text("code", { length: 10 }),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  },
  (t) => [index("states_country_id_idx").on(t.countryId)],
);

export const stateTranslations = sqliteTable(
  "state_translations",
  {
    id: integer("id").primaryKey(),
    stateId: integer("state_id")
      .notNull()
      .references(() => states.id),
    languageId: integer("language_id")
      .notNull()
      .references(() => languages.id),
    name: text("name", { length: 100 }).notNull(),
  },
  (t) => [index("state_translations_state_id_idx").on(t.stateId)],
);

export const categories = sqliteTable(
  "categories",
  {
    id: integer("id").primaryKey(),
    // Stored, stable /dir slug (Arabic, slugify-canonical). Nullable at the DB
    // layer (added by ALTER on a live table); every write path sets it.
    slug: text("slug", { length: 120 }),
    sortOrder: integer("sort_order").notNull().default(0),
    // Retired categories stay as rows (translations keep rendering for any
    // straggler id) but drop out of public listings and /dir.
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  },
  (t) => [uniqueIndex("categories_slug_unique").on(t.slug)],
);

export const categoryTranslations = sqliteTable(
  "category_translations",
  {
    id: integer("id").primaryKey(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    languageId: integer("language_id")
      .notNull()
      .references(() => languages.id),
    name: text("name", { length: 100 }).notNull(),
  },
  (t) => [index("category_translations_category_id_idx").on(t.categoryId)],
);
