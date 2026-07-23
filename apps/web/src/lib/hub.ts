import type { OffsetPagination, PublicProject } from "@mia/contracts";
import { apiGet, type ServerEnv } from "./api";
import { loadCategories, categoryName, findCategoryBySlug } from "./reference";
import { developerProfileJsonLd } from "./jsonld";
import { ui, type Locale } from "./i18n";

/**
 * Shared loaders for the programmatic hub pages (category / language / topic /
 * curated / developer). Each hub resolves its filter then reuses these to fetch
 * an approved-projects page and a category-name map for the cards.
 */

export interface HubList {
  projects: PublicProject[];
  pagination: OffsetPagination;
}

const EMPTY_PAGINATION: OffsetPagination = { page: 1, limit: 24, total_count: 0, total_pages: 1 };

/** Current 1-based page from the URL (?page=). */
export function pageParam(url: URL): number {
  return Math.max(1, Number(url.searchParams.get("page")) || 1);
}

/** Fetch one page of approved projects for the given query params. */
export async function loadProjectList(
  env: ServerEnv,
  params: Record<string, string>,
): Promise<HubList> {
  const search = new URLSearchParams(params);
  const res = await apiGet<{ items: PublicProject[]; pagination: OffsetPagination }>(
    env,
    `/v1/projects?${search}`,
  );
  return {
    projects: res.data?.items ?? [],
    pagination: res.data?.pagination ?? EMPTY_PAGINATION,
  };
}

/** id → localized category name, for the ProjectCard chips. */
export async function categoryNameMap(
  env: ServerEnv,
  locale: Locale,
): Promise<Record<number, string>> {
  const categories = await loadCategories(env);
  return Object.fromEntries(categories.map((c) => [c.id, categoryName(c, locale)]));
}

/** The full prop set a resolved hub hands to HubListPage. */
export interface HubView {
  locale: Locale;
  title: string;
  description: string;
  heading: string;
  intro?: string;
  path: string;
  crumbs: { name: string; path: string }[];
  projects: PublicProject[];
  pagination: OffsetPagination;
  categoryNames: Record<number, string>;
  ownerHeader?: { login: string; avatarUrl: string | null; githubUrl: string };
  structuredData?: Record<string, unknown>;
}

function homeCrumb(locale: Locale) {
  return { name: ui[locale].breadcrumb.home, path: "/" };
}
function projectsCrumb(locale: Locale) {
  return { name: ui[locale].breadcrumb.projects, path: "/projects" };
}

/** Category hub — null when the slug is unknown (→ 404). */
export async function loadCategoryHub(
  env: ServerEnv,
  locale: Locale,
  slug: string,
  page: number,
): Promise<HubView | null> {
  const category = await findCategoryBySlug(env, slug);
  if (!category) return null;
  const t = ui[locale];
  const name = categoryName(category, locale);
  const path = `/projects/category/${encodeURIComponent(category.slug)}`;
  const [{ projects, pagination }, categoryNames] = await Promise.all([
    loadProjectList(env, { categoryId: String(category.id), sort: "stars", page: String(page) }),
    categoryNameMap(env, locale),
  ]);
  return {
    locale,
    title: t.hubs.categoryTitle(name),
    description: t.hubs.categoryDescription(name),
    heading: t.hubs.categoryTitle(name),
    path,
    crumbs: [homeCrumb(locale), projectsCrumb(locale), { name, path }],
    projects,
    pagination,
    categoryNames,
  };
}

/** Language hub — null when no approved project uses that language (→ 404). */
export async function loadLanguageHub(
  env: ServerEnv,
  locale: Locale,
  lang: string,
  page: number,
): Promise<HubView | null> {
  if (!lang) return null;
  const t = ui[locale];
  const { projects, pagination } = await loadProjectList(env, {
    language: lang,
    sort: "stars",
    page: String(page),
  });
  if (pagination.total_count === 0) return null;
  const categoryNames = await categoryNameMap(env, locale);
  const path = `/projects/language/${encodeURIComponent(lang)}`;
  return {
    locale,
    title: t.hubs.languageTitle(lang),
    description: t.hubs.languageDescription(lang),
    heading: t.hubs.languageTitle(lang),
    path,
    crumbs: [homeCrumb(locale), projectsCrumb(locale), { name: lang, path }],
    projects,
    pagination,
    categoryNames,
  };
}

/** Topic hub — null when no approved project carries that topic (→ 404). */
export async function loadTopicHub(
  env: ServerEnv,
  locale: Locale,
  topic: string,
  page: number,
): Promise<HubView | null> {
  if (!topic) return null;
  const t = ui[locale];
  const { projects, pagination } = await loadProjectList(env, {
    topic,
    sort: "stars",
    page: String(page),
  });
  if (pagination.total_count === 0) return null;
  const categoryNames = await categoryNameMap(env, locale);
  const path = `/projects/topic/${encodeURIComponent(topic)}`;
  return {
    locale,
    title: t.hubs.topicTitle(topic),
    description: t.hubs.topicDescription(topic),
    heading: t.hubs.topicTitle(topic),
    path,
    crumbs: [homeCrumb(locale), projectsCrumb(locale), { name: topic, path }],
    projects,
    pagination,
    categoryNames,
  };
}

/** Curated list — most-starred ("top") or recently-added ("new"). Never null. */
export async function loadCuratedList(
  env: ServerEnv,
  locale: Locale,
  mode: "top" | "new",
  page: number,
): Promise<HubView> {
  const t = ui[locale];
  const heading = mode === "new" ? t.hubs.newTitle : t.hubs.topTitle;
  const description = mode === "new" ? t.hubs.newDescription : t.hubs.topDescription;
  const path = mode === "new" ? "/projects/new" : "/projects/top";
  const sep = locale === "ar" ? "، " : ", ";
  const [{ projects, pagination }, categoryNames] = await Promise.all([
    loadProjectList(env, { sort: mode === "new" ? "new" : "stars", page: String(page) }),
    categoryNameMap(env, locale),
  ]);
  return {
    locale,
    title: `${heading}${sep}${t.siteName}`,
    description,
    heading,
    path,
    crumbs: [homeCrumb(locale), projectsCrumb(locale), { name: heading, path }],
    projects,
    pagination,
    categoryNames,
  };
}

/** Developer hub — null when the owner has no approved projects (→ 404). */
export async function loadDeveloperHub(
  env: ServerEnv,
  locale: Locale,
  login: string,
  page: number,
): Promise<HubView | null> {
  if (!login) return null;
  const t = ui[locale];
  const { projects, pagination } = await loadProjectList(env, {
    owner: login,
    sort: "stars",
    page: String(page),
    limit: "24",
  });
  if (pagination.total_count === 0) return null;
  const categoryNames = await categoryNameMap(env, locale);
  const path = `/developers/${encodeURIComponent(login)}`;
  const owner = projects[0];
  const ownerType = owner?.ownerType ?? "User";
  const avatarUrl = owner?.ownerAvatarUrl ?? null;
  return {
    locale,
    title: t.hubs.developerTitle(login),
    description: t.hubs.developerDescription(login),
    heading: t.hubs.developerHeading(login),
    path,
    crumbs: [
      homeCrumb(locale),
      { name: t.breadcrumb.developers, path: "/developers" },
      { name: login, path },
    ],
    projects,
    pagination,
    categoryNames,
    ownerHeader: { login, avatarUrl, githubUrl: `https://github.com/${login}` },
    structuredData: developerProfileJsonLd({ login, avatarUrl, ownerType, path, locale, projects }),
  };
}
