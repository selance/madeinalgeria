import type { CategoryItem } from "@mia/contracts";
import { apiGet, type ServerEnv } from "./api";
import type { Locale } from "./i18n";

/**
 * Category lookup for the hub pages. Wraps the KV-cached reference endpoint and
 * resolves the stable per-category `slug` (used in /projects/category/[slug])
 * to its id + localized name. Tolerant of API failure — callers 404/degrade.
 */
export async function loadCategories(env: ServerEnv): Promise<CategoryItem[]> {
  const res = await apiGet<CategoryItem[]>(env, "/v1/reference/categories");
  return (res.data ?? []).filter((c) => c.isActive);
}

/** Pick the best localized category name, falling back across locales then slug. */
export function categoryName(category: CategoryItem, locale: Locale): string {
  return category.names[locale] ?? category.names["en"] ?? category.names["ar"] ?? category.slug;
}

/** Resolve a category slug to its row (active only). Undefined → unknown slug (404). */
export async function findCategoryBySlug(
  env: ServerEnv,
  slug: string,
): Promise<CategoryItem | undefined> {
  return (await loadCategories(env)).find((c) => c.slug === slug);
}
