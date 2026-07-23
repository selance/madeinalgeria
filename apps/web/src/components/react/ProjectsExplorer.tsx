"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { OffsetPagination, ProjectLanguageFacet, PublicProject } from "@mia/contracts";
import { buttonVariants, cn } from "@mia/ui";
import { Input } from "@mia/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mia/ui/components/select";
import ProjectCard from "./ProjectCard";
import { dirFor, ui, type Locale } from "../../lib/i18n";

/**
 * The /projects browser. The Astro page server-renders page 1 into `initial`
 * (SEO + first paint), then this island takes over: debounced search, filter
 * selects (design-system Select, dir passed per locale since the shared
 * component defaults to rtl), numbered pagination, all mirrored to the URL
 * query string so pages are shareable.
 */

const API = import.meta.env.PUBLIC_API_BASE_URL;

export interface CategoryOption {
  id: number;
  label: string;
}

interface ExplorerQuery {
  q: string;
  language: string;
  categoryId: string;
  sort: string;
  page: number;
}

interface ListPayload {
  items: PublicProject[];
  pagination: OffsetPagination;
}

interface ProjectsExplorerProps {
  locale?: Locale;
  initial: ListPayload;
  facets: ProjectLanguageFacet[];
  categories: CategoryOption[];
  initialQuery: ExplorerQuery;
}

function queryString(query: ExplorerQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.language) params.set("language", query.language);
  if (query.categoryId) params.set("categoryId", query.categoryId);
  if (query.sort && query.sort !== "stars") params.set("sort", query.sort);
  if (query.page > 1) params.set("page", String(query.page));
  const s = params.toString();
  return s ? `?${s}` : "";
}

/** Windowed page numbers: 1 … around-current … last. */
function pageWindow(page: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const around = [page - 1, page, page + 1].filter((p) => p > 1 && p < total);
  const out: (number | "…")[] = [1];
  if (around[0] !== undefined && around[0] > 2) out.push("…");
  out.push(...around);
  const last = around[around.length - 1];
  if (last !== undefined && last < total - 1) out.push("…");
  out.push(total);
  return out;
}


export default function ProjectsExplorer({
  locale = "en",
  initial,
  facets,
  categories,
  initialQuery,
}: ProjectsExplorerProps) {
  const t = ui[locale];
  const dir = dirFor(locale);
  const sortLabels: Record<string, string> = {
    stars: t.projects.sortStars,
    recent: t.projects.sortRecent,
    name: t.projects.sortName,
  };
  const [query, setQuery] = useState<ExplorerQuery>(initialQuery);
  const [search, setSearch] = useState(initialQuery.q);
  const [data, setData] = useState<ListPayload>(initial);
  const [loading, setLoading] = useState(false);
  const firstRender = useRef(true);

  // Debounce free-text search into the applied query (resets to page 1).
  useEffect(() => {
    const handle = setTimeout(() => {
      setQuery((prev) => (prev.q === search ? prev : { ...prev, q: search, page: 1 }));
    }, 300);
    return () => clearTimeout(handle);
  }, [search]);

  // Fetch on every applied-query change (skip the server-rendered first state)
  // and mirror the query into the URL so results stay shareable.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (query.q) params.set("q", query.q);
    if (query.language) params.set("language", query.language);
    if (query.categoryId) params.set("categoryId", query.categoryId);
    params.set("sort", query.sort || "stars");
    params.set("page", String(query.page));

    setLoading(true);
    fetch(`${API}/v1/projects?${params}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`list failed (${res.status})`);
        return res.json() as Promise<{ data: ListPayload }>;
      })
      .then((body) => setData(body.data))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error(error);
        }
      })
      .finally(() => setLoading(false));

    history.replaceState(null, "", location.pathname + queryString(query));
    return () => controller.abort();
  }, [query]);

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [String(c.id), c.label])),
    [categories],
  );

  const { items, pagination } = data;
  const setPage = (page: number) => {
    setQuery((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pageBtn = (active: boolean) =>
    cn(
      buttonVariants({ variant: active ? "primary-solid" : "dark-ghost", size: "sm" }),
      "min-w-9 px-2",
    );

  return (
    <div className="flex flex-col gap-6">
      {/* controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.projects.searchPlaceholder}
          aria-label={t.projects.searchPlaceholder}
          className="h-10 w-full sm:max-w-xs"
        />
        <Select
          value={query.language}
          onValueChange={(value: string | null) =>
            setQuery((prev) => ({ ...prev, language: value ?? "", page: 1 }))
          }
        >
          <SelectTrigger dir={dir} aria-label={t.projects.language} className="h-10 min-w-40">
            <SelectValue>{query.language || t.projects.allLanguages}</SelectValue>
          </SelectTrigger>
          <SelectContent dir={dir}>
            <SelectItem value="">{t.projects.allLanguages}</SelectItem>
            {facets.map((f) => (
              <SelectItem key={f.name} value={f.name}>
                {f.name} ({f.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {categories.length > 0 && (
          <Select
            value={query.categoryId}
            onValueChange={(value: string | null) =>
              setQuery((prev) => ({ ...prev, categoryId: value ?? "", page: 1 }))
            }
          >
            <SelectTrigger dir={dir} aria-label={t.projects.category} className="h-10 min-w-40">
              <SelectValue>
                {categoryById.get(query.categoryId) ?? t.projects.allCategories}
              </SelectValue>
            </SelectTrigger>
            <SelectContent dir={dir}>
              <SelectItem value="">{t.projects.allCategories}</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select
          value={query.sort}
          onValueChange={(value: string | null) =>
            setQuery((prev) => ({ ...prev, sort: value ?? "stars", page: 1 }))
          }
        >
          <SelectTrigger dir={dir} aria-label={t.projects.sort} className="h-10 min-w-40">
            <SelectValue>{sortLabels[query.sort] ?? t.projects.sortStars}</SelectValue>
          </SelectTrigger>
          <SelectContent dir={dir}>
            <SelectItem value="stars">{t.projects.sortStars}</SelectItem>
            <SelectItem value="recent">{t.projects.sortRecent}</SelectItem>
            <SelectItem value="name">{t.projects.sortName}</SelectItem>
          </SelectContent>
        </Select>
        <span className="ms-auto text-sm text-neutral-500" aria-live="polite">
          {t.projects.resultCount(pagination.total_count)}
        </span>
      </div>

      {/* results */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
          {Array.from({ length: 6 }, (_, i) => (
            // Mirrors the ProjectCard anatomy so nothing jumps when data lands.
            <div key={i} className="rounded-card animate-pulse border !border-neutral-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-neutral-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-1/2 rounded bg-neutral-200" />
                  <div className="h-2.5 w-2/3 rounded bg-neutral-200" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-3 w-full rounded bg-neutral-200" />
                <div className="h-3 w-3/4 rounded bg-neutral-200" />
              </div>
              <div className="mt-4 h-3 w-1/3 rounded bg-neutral-200" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-card border !border-neutral-200 bg-white p-10 text-center text-neutral-500">
          {t.projects.empty}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              locale={locale}
              categoryName={
                project.categoryId !== null
                  ? categoryById.get(String(project.categoryId))
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {/* numbered pagination */}
      {pagination.total_pages > 1 && (
        <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="pagination">
          <button
            type="button"
            onClick={() => setPage(pagination.page - 1)}
            disabled={pagination.page <= 1 || loading}
            className={cn(pageBtn(false), "disabled:opacity-40")}
          >
            {t.projects.pagePrev}
          </button>
          {pageWindow(pagination.page, pagination.total_pages).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className="px-1 text-neutral-400">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                disabled={loading}
                aria-current={p === pagination.page ? "page" : undefined}
                className={pageBtn(p === pagination.page)}
              >
                {p}
              </button>
            ),
          )}
          <button
            type="button"
            onClick={() => setPage(pagination.page + 1)}
            disabled={pagination.page >= pagination.total_pages || loading}
            className={cn(pageBtn(false), "disabled:opacity-40")}
          >
            {t.projects.pageNext}
          </button>
        </nav>
      )}
    </div>
  );
}
