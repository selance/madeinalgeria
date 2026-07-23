import type { PaginationData } from "@mia/ui/components/pagination";

/** Slice a fully-loaded list into a numbered page (client-side pagination). */
export function paginateClientSide<T>(
  all: T[],
  page: number,
  limit = 20,
): { items: T[]; pagination: PaginationData } {
  const total_pages = Math.max(1, Math.ceil(all.length / limit));
  return {
    items: all.slice((page - 1) * limit, page * limit),
    pagination: { page, limit, total_count: all.length, total_pages },
  };
}
