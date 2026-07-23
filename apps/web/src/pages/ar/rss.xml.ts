import type { APIRoute } from "astro";
import type { PublicProject } from "@mia/contracts";
import { apiGet } from "../../lib/api";
import { renderRss } from "../../lib/rss";
import { withEdgeCache } from "../../lib/edge-cache";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const res = await apiGet<{ items: PublicProject[] }>(
    locals.runtime?.env,
    "/v1/projects/feed?limit=30",
  );
  const body = renderRss(res.data?.items ?? [], "ar");
  return withEdgeCache(
    new Response(body, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } }),
    3600,
  );
};
