import type { APIRoute } from "astro";
import { loadCategories } from "../lib/reference";
import { renderUrlset, xmlResponse } from "../lib/sitemap";
import { withEdgeCache } from "../lib/edge-cache";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const categories = await loadCategories(locals.runtime?.env);
  const items = categories.map((c) => ({
    path: `/projects/category/${encodeURIComponent(c.slug)}`,
  }));
  return withEdgeCache(xmlResponse(renderUrlset(items)), 3600);
};
