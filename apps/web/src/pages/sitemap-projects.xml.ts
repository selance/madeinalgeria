import type { APIRoute } from "astro";
import type { SitemapEntry } from "@mia/contracts";
import { apiGet } from "../lib/api";
import { renderUrlset, xmlResponse } from "../lib/sitemap";
import { withEdgeCache } from "../lib/edge-cache";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const res = await apiGet<SitemapEntry[]>(locals.runtime?.env, "/v1/projects/sitemap");
  const items = (res.data ?? []).map((e) => ({
    path: `/projects/${encodeURIComponent(e.slug)}`,
    lastmod: e.lastmod,
  }));
  return withEdgeCache(xmlResponse(renderUrlset(items)), 3600);
};
